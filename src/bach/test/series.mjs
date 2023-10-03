const { default: expect } = await import('expect');

const { default: bach } = await import('../index.js');

function fn1() {
  return 1;
}

function fn2(done) {
  setTimeout(function () {
    done(null, 2);
  }, 500);
}

async function fn3() {
  return 3;
}

function fnError(done) {
  done(null, new Error('An Error Occurred'));
}

describe('bach: series', function () {
  it('should can take the sync functions', function (done) {
    bach.series(fn1)(function (error, results) {
      expect(error).toEqual(null);
      expect(results).toEqual([1]);
      done();
    });
  });
  it('should can take the async callback functions', function (done) {
    bach.series(fn2)(function (error, results) {
      expect(error).toEqual(null);
      expect(results).toEqual([2]);
      done();
    });
  });
  it('should can take the async promised functions', function (done) {
    bach.series(fn3)(function (error, results) {
      expect(error).toEqual(null);
      expect(results).toEqual([3]);
      done();
    });
  });
  it('should execute functions in series, passing results', function (done) {
    bach.series(
      fn1,
      fn3,
    )(function (error, results) {
      expect(error).toEqual(null);
      expect(results).toEqual([1, 3]);
      done();
    });
  });

  it('should execute functions in series, passing error', function (done) {
    bach.series(fnError)(function (error) {
      expect(error).toBeAn(Error);
      done();
    });
  });

  it('should save the array size of results', function (done) {
    bach.series(
      fn1,
      fn3,
      fnError,
      fn2,
      fnError,
    )(function (error, results) {
      expect(results).toEqual([1, 3, undefined, undefined, undefined]);
      done();
    });
  });

  it('should take extension points and call them for each function', function (done) {
    const arr = [];
    const fns = [fn1, fn3];
    bach.series(fn1, fn3, {
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
