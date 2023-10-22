import { describe, test, beforeEach, expect } from 'vitest';

import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';
import { settleParallel } from '../settleParallel.mjs';

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

describe('bach: settleParallel', function () {
  beforeEach(() => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
  });
  test('should execute functions in parallel, passing settled results', async () => {
    const [errors, results] = await settleParallel([fn1, fn2, fn3]);

    expect(errors).toEqual(null);
    expect(results).toEqual([1, 2, 3]);
  });

  test('should execute functions in parallel, passing settled errors and results', async () => {
    function slowFn(done) {
      setTimeout(function () {
        done(null, 2);
      }, 500);
    }
    const [errors, results] = await settleParallel([fn1, slowFn, fn3, fnError]);

    expect(Array.isArray(errors)).toBeTruthy();
    expect(errors[0]).toBeInstanceOf(Error);
    expect(results).toEqual([1, 2, 3]);
  });

  test('should take extension points and call them for each function', async () => {
    const arr = [];
    const fns = [fn1, fn2, fn3];
    const [error] = await settleParallel([fn1, fn2, fn3], {
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