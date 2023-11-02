import { promisify } from 'node:util';
import { describe, test, expect, afterEach, vi } from 'vitest';
import jobo from '../../../index.js';

describe('lastRun', () => {
  let defaultResolution = process.env.UNDERTAKER_TIME_RESOLUTION;

  afterEach(() => {
    process.env.UNDERTAKER_TIME_RESOLUTION = defaultResolution;
  });

  test('should only record time when task has completed', async () => {
    const ts = vi.fn();
    const recordTimeTask = jobo.declareTask({
      name: 'recordTimeTaskComplete',
      fn: async () => {
        ts(jobo.lastRun(recordTimeTask));
      },
    });
    await promisify(jobo.parallel(recordTimeTask))();

    expect(ts).toBeCalledWith(undefined);
  });

  test('should record tasks time execution', async () => {
    const executedTask = jobo.declareTask({
      name: 'recordTaskExecuted',
      fn: async () => {},
    });
    const notExecutedTask = jobo.declareTask({
      name: 'recordTaskNotExecuted',
      fn: async () => {},
    });

    await promisify(jobo.parallel(executedTask))();

    expect(jobo.lastRun(executedTask)).toBeTruthy();
    expect(jobo.lastRun(executedTask)).toBeLessThanOrEqual(Date.now());
    expect(jobo.lastRun(notExecutedTask)).toBeFalsy();
    expect(jobo.lastRun(function () {})).toBeFalsy();
    expect(jobo.lastRun.bind(jobo, 'notexists')).toThrow(Error);
  });

  test('should record all tasks time execution', async () => {
    const taskExecuted = jobo.declareTask({
      name: 'recordAllTasksExecuted',
      fn: async () => {},
    });
    const taskNotExecuted = jobo.declareTask({
      name: 'recordAllTasksNotExecuted',
      fn: async () => {},
    });
    await promisify(jobo.parallel(taskExecuted, taskNotExecuted))();

    expect(jobo.lastRun(taskExecuted)).toBeTruthy();
    expect(jobo.lastRun(taskExecuted)).toBeLessThanOrEqual(Date.now());
    expect(jobo.lastRun(taskNotExecuted)).toBeTruthy();
    expect(jobo.lastRun(taskNotExecuted)).toBeLessThanOrEqual(Date.now());
  });

  test('should record same tasks time execution for a string task and its original', async () => {
    const task = jobo.declareTask({
      name: 'recordSameTasksExecuted',
      fn: async () => {},
    });

    await promisify(jobo.series(task))();

    expect(jobo.lastRun(task)).toEqual(jobo.lastRun(task));
  });

  test('should give time with 1s resolution', async () => {
    const task = jobo.declareTask({
      name: 'recordTimeResolution',
      fn: async () => {},
    });

    const resolution = 1000; // 1s
    const since = Date.now();
    const expected = since - (since % resolution);

    await promisify(jobo.series(task))();

    expect(jobo.lastRun(task, resolution)).toEqual(expected);
  });

  test('should not record task start time on error', async () => {
    const task = jobo.declareTask({
      name: 'recordTaskStartTimeOnError',
      fn: async () => {
        throw new Error();
      },
    });

    try {
      await promisify(jobo.series(task))();
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }

    expect(jobo.lastRun(task)).toBeFalsy();
  });
});
