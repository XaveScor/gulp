import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';
import { series } from '../series.mjs';

const { default: expect } = await import('expect');

function fnSync() {}

function fn1() {
  return 1;
}

function fn2() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, 0);
  });
}

async function fn3() {
  return 3;
}

async function fnError() {
  throw new Error('An Error Occurred');
}

describe('bach: series', function () {
  beforeEach(() => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
  });
  it('should can take the sync functions without return value', async () => {
    const { error, result } = await series([fnSync]);

    expect(error).toEqual(null);
    expect(result).toEqual([undefined]);
  });
  it('should can take the sync functions', async () => {
    const { error, result } = await series([fn1]);

    expect(error).toEqual(null);
    expect(result).toEqual([1]);
  });
  it('should can take the async callback functions', async () => {
    const { error, result } = await series([fn2]);

    expect(error).toEqual(null);
    expect(result).toEqual([2]);
  });
  it('should can take the async promised functions', async () => {
    const { error, result } = await series([fn3]);

    expect(error).toEqual(null);
    expect(result).toEqual([3]);
  });
  it('should execute functions in series, passing results', async () => {
    const { error, result } = await series([fn1, fn3]);

    expect(error).toEqual(null);
    expect(result).toEqual([1, 3]);
  });

  it('should execute functions in series, passing error', async () => {
    const { error } = await series([fnError]);
    expect(error).toBeAn(Error);
  });

  it('should save the array size of results', async () => {
    const { result } = await series([fn1, fn3, fnError, fn2, fnError]);

    expect(result).toEqual([1, 3, undefined, undefined, undefined]);
  });

  it('should take extension points and call them for each function', async () => {
    const arr = [];
    const fns = [fn1, fn3];
    const { error } = await series([fn1, fn3], {
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
