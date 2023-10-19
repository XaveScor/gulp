import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';
import { parallel } from '../parallel.mjs';

const { default: expect } = await import('expect');

function fn1() {
  return 1;
}

function fn2() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(2);
    }, 0);
  });
}

function fn3(done) {
  return 3;
}

function fnError(done) {
  throw new Error('An Error Occurred');
}

describe('bach: parallel', function () {
  beforeEach(() => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
  });

  it('should execute functions in parallel, passing results', async () => {
    const { error, result } = await parallel([fn1, fn2, fn3]);

    expect(error).toEqual(null);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should execute functions in parallel, passing error', async () => {
    const { error, result } = await parallel([fn1, fn3, fnError]);

    expect(error).toBeAn(Error);
    expect(result).toEqual([1, 3, undefined]);
  });

  it('should take extension points and call them for each function', async () => {
    const arr = [];
    const fns = [fn1, fn2, fn3];
    const { error } = await parallel([fn1, fn2, fn3], {
      create: function (fn, idx) {
        expect(fns).toInclude(fn);
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
