import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';

const { default: expect } = await import('expect');

const { default: bach } = await import('../index.js');

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
  it('should execute functions in parallel, passing results', function (done) {
    bach.parallel([fn1, fn2, fn3])(function (error, results) {
      expect(error).toEqual(null);
      expect(results).toEqual([1, 2, 3]);
      done();
    });
  });

  it('should execute functions in parallel, passing error', function (done) {
    bach.parallel([fn1, fn3, fnError])(function (error, results) {
      expect(error).toBeAn(Error);
      expect(results).toEqual([1, 3, undefined]);
      done();
    });
  });

  it('should take extension points and call them for each function', function (done) {
    const arr = [];
    const fns = [fn1, fn2, fn3];
    bach.parallel([fn1, fn2, fn3], {
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
    })(function (error) {
      expect(error).toEqual(null);
      expect(arr).toEqual(fns);
    });
    done();
  });
});
