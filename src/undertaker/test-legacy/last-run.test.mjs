import { promisify } from 'node:util';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

const { Gulp } = await import('../../gulp.cjs');

describe('lastRun', function () {
  let taker, test1, test2, error, alias;
  let defaultResolution = process.env.UNDERTAKER_TIME_RESOLUTION;

  beforeEach(async () => {
    process.env.UNDERTAKER_TIME_RESOLUTION = '0';
    taker = new Gulp();

    test1 = function (cb) {
      cb();
    };
    taker.task('test1', test1);

    test2 = function (cb) {
      cb();
    };
    test2.displayName = 'test2';
    taker.task(test2);

    error = function (cb) {
      cb(new Error());
    };
    taker.task('error', error);

    alias = test1;
    taker.task('alias', alias);
  });

  afterEach(async () => {
    process.env.UNDERTAKER_TIME_RESOLUTION = defaultResolution;
  });

  test('should only record time when task has completed', async () => {
    const ts = vi.fn();
    const test = function (cb) {
      ts(taker.lastRun('test'));
      cb();
    };
    taker.task('test', test);
    await promisify(taker.parallel('test'))();

    expect(ts).toBeCalledWith(undefined);
  });

  test('should record tasks time execution', async () => {
    await promisify(taker.parallel('test1'))();

    expect(taker.lastRun('test1')).toBeTruthy();
    expect(taker.lastRun('test1')).toBeLessThanOrEqual(Date.now());
    expect(taker.lastRun(test2)).toBeFalsy();
    expect(taker.lastRun(function () {})).toBeFalsy();
    expect(taker.lastRun.bind(taker, 'notexists')).toThrow(Error);
  });

  test('should record all tasks time execution', async () => {
    await promisify(taker.parallel('test1', test2))();

    expect(taker.lastRun('test1')).toBeTruthy();
    expect(taker.lastRun('test1')).toBeLessThanOrEqual(Date.now());
    expect(taker.lastRun(test2)).toBeTruthy();
    expect(taker.lastRun(test2)).toBeLessThanOrEqual(Date.now());
  });

  test('should record same tasks time execution for a string task and its original', async () => {
    await promisify(taker.series(test2))();

    expect(taker.lastRun(test2)).toEqual(taker.lastRun('test2'));
  });

  test('should record tasks time execution for an aliased task', async () => {
    await promisify(taker.series('alias'));

    expect(taker.lastRun('alias')).toEqual(taker.lastRun('test1'));
  });

  test('should give time with 1s resolution', async () => {
    const resolution = 1000; // 1s
    const since = Date.now();
    const expected = since - (since % resolution);

    await promisify(taker.series('test1'))();

    expect(taker.lastRun('test1', resolution)).toEqual(expected);
  });

  test('should not record task start time on error', async () => {
    taker.on('error', function () {
      // To keep the test from catching the emitted errors
    });
    try {
      await promisify(taker.series('error'))();
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }

    expect(taker.lastRun('error')).toBeFalsy();
  });
});
