import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';
import { settleSeries } from '../settleSeries.mjs';

const { default: expect } = await import('expect');

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

describe('settleSeries', function () {
  beforeEach(() => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
  });
  it('should execute functions in series, passing settled results', async () => {
    const [errors, results] = await settleSeries([fn1, fn2, fn3]);

    expect(errors).toEqual(null);
    expect(results).toEqual([1, 2, 3]);
  });

  it('should execute functions in series, passing settled errors and results', async () => {
    function slowFn(done) {
      setTimeout(function () {
        done(null, 2);
      }, 500);
    }
    const [errors, results] = await settleSeries([fn1, slowFn, fn3, fnError]);

    expect(errors).toBeAn(Array);
    expect(errors[0]).toBeAn(Error);
    expect(results).toEqual([1, 2, 3]);
  });

  it('should take extension points and call them for each function', async () => {
    const arr = [];
    const fns = [fn1, fn2, fn3];
    const [error] = await settleSeries([fn1, fn2, fn3], {
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
