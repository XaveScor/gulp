import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';
import jobo from '../../../index.js';

describe('series', function () {
  test('should throw on non-valid tasks combined with valid tasks', () => {
    const task = jobo.declareTask({
      name: 'validTaskNonArray',
      fn: async () => {},
    });

    expect(() => {
      jobo.series(task, {});
    }).toThrow(/Task never defined:/);
  });

  test('should throw on tasks array with both valid and non-valid tasks', () => {
    const task = jobo.declareTask({
      name: 'validTaskArray',
      fn: async () => {},
    });

    expect(() => {
      jobo.series([task, {}]);
    }).toThrow(/Task never defined:/);
  });

  test('should throw on non-valid task', () => {
    expect(() => {
      jobo.series({});
    }).toThrow(/Task never defined:/);
  });

  test('should throw when no tasks specified', () => {
    expect(() => {
      jobo.series();
    }).toThrow(/One or more tasks should be combined using series or parallel/);
  });

  test('should throw on empty array of registered tasks', () => {
    expect(() => {
      jobo.series([]);
    }).toThrow(/One or more tasks should be combined using series or parallel/);
  });

  test('should take only one array of registered tasks', async () => {
    const task1 = jobo.declareTask({
      name: 'arrayTask1',
      fn: () => 1,
    });
    const task2 = jobo.declareTask({
      name: 'arrayTask2',
      fn: () => new Promise((resolve) => setTimeout(() => resolve(2), 0)),
    });
    const task3 = jobo.declareTask({
      name: 'arrayTask3',
      fn: () => 3,
    });

    const results = await promisify(jobo.series([task1, task2, task3]))();

    expect(results).toEqual([1, 2, 3]);
  });

  test('should take nested series', async () => {
    const task1 = jobo.declareTask({
      name: 'nestedTask1',
      fn: () => 1,
    });
    const task2 = jobo.declareTask({
      name: 'nestedTask2',
      fn: () => 2,
    });
    const task3 = jobo.declareTask({
      name: 'nestedTask3',
      fn: () => 3,
    });

    const series1 = jobo.series(task1, task2, task3);
    const results = await promisify(jobo.series(task1, series1, task3))();

    expect(results).toEqual([1, [1, 2, 3], 3]);
  });

  test('should stop processing on error', async () => {
    const task1 = jobo.declareTask({
      name: 'errorTask1',
      fn: () => 1,
    });
    const errorTask = jobo.declareTask({
      name: 'errorTask2',
      fn: () => {
        throw new Error();
      },
    });
    const task3 = jobo.declareTask({
      name: 'errorTask3',
      fn: () => 3,
    });

    jobo.on('error', function () {
      // To keep the test from catching the emitted errors
    });

    return new Promise((resolve) => {
      jobo.series(
        task1,
        errorTask,
        task3,
      )(function (err, results) {
        expect(err).toBeInstanceOf(Error);
        expect(results).toEqual([1, undefined, undefined]);
        resolve();
      });
    });
  });

  test('should throw on unregistered task', () => {
    expect(() => {
      jobo.series('unregistered');
    }).toThrow('Task never defined: unregistered');
  });

  test('should process all functions if settle flag is true', async () => {
    jobo.on('error', function () {
      // To keep the test from catching the emitted errors
    });
    jobo._settle = true;

    const task1 = jobo.declareTask({
      name: 'settleTask1',
      fn: () => 1,
    });
    const errorTask = jobo.declareTask({
      name: 'settleErrorTask',
      fn: () => {
        throw new Error();
      },
    });
    const task3 = jobo.declareTask({
      name: 'settleTask3',
      fn: () => 3,
    });

    return new Promise((resolve) => {
      jobo.series(
        jobo.series(task1, errorTask),
        task3,
      )(function (err, results) {
        expect(err[0][0]).toBeInstanceOf(Error);
        expect(results).toEqual([3]);
        resolve();
      });
    });
  });
});
