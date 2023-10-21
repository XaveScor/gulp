import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';
import { parallel } from '../parallel.mjs';
import { describe, test, expect, beforeEach } from 'vitest';

function fn1(done) {
  done(null, 1);
}

function fn2(done) {
  setTimeout(function () {
    done(null, 2);
  }, 500);
}

function fn3(done) {
  done(null, 3);
}

function fnError(done) {
  done(new Error('An Error Occurred'));
}

describe('bach: parallel', function () {
  beforeEach(() => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
  });
  test('should execute functions in parallel, passing results', async () => {
    const [error, results] = await parallel([fn1, fn2, fn3]);

    expect(error).toEqual(null);
    expect(results).toEqual([1, 2, 3]);
  });

  test('should execute functions in parallel, passing error', async () => {
    const [error, results] = await parallel([fn1, fn3, fnError]);

    expect(error).toBeInstanceOf(Error);
    expect(results).toEqual([1, 3, undefined]);
  });

  test('should take extension points and call them for each function', async () => {
    const arr = [];
    const fns = [fn1, fn2, fn3];
    const [error] = await parallel([fn1, fn2, fn3], {
      create: function (fn, idx) {
        expect(fns.includes(fn)).toBeTruthy();
        arr[idx] = fn;
        return arr;
      },
      before: function (storage) {
        expect(storage).toEqual(arr);
      },
      after: function (result, storage) {
        expect(storage).toEqual(arr);
      },
    });

    expect(error).toEqual(null);
    expect(arr).toEqual(fns);
  });
});
