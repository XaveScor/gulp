import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';

const { default: expect } = await import('expect');

const { Gulp } = await import('../../gulp.cjs');
const { default: simple } = await import('./fixtures/taskTree/simple.js');
const { default: singleLevel } = await import('./fixtures/taskTree/singleLevel.js');
const { default: doubleLevel } = await import('./fixtures/taskTree/doubleLevel.js');
const { default: tripleLevel } = await import('./fixtures/taskTree/tripleLevel.js');
const { default: aliasSimple } = await import('./fixtures/taskTree/aliasSimple.js');
const { default: aliasNested } = await import('./fixtures/taskTree/aliasNested.js');

function noop(done) {
  done();
}

describe('tree', function () {
  var taker;

  beforeEach(function (done) {
    disableDeprecationWarnings();
    resetDeprecationFlags();
    taker = new Gulp();
    done();
  });

  it('should return a simple tree by default', function (done) {
    taker.task('test1', function (cb) {
      cb();
    });
    taker.task('test2', function (cb) {
      cb();
    });
    taker.task('test3', function (cb) {
      cb();
    });
    taker.task('error', function (cb) {
      cb();
    });

    var ser = taker.series('test1', 'test2');
    var anon = function (cb) {
      cb();
    };
    anon.displayName = '<display name>';

    taker.task('ser', taker.series('test1', 'test2'));
    taker.task('par', taker.parallel('test1', 'test2', 'test3'));
    taker.task('serpar', taker.series('ser', 'par'));
    taker.task('serpar2', taker.series(ser, anon));
    taker.task(anon);

    var tree = taker.tree();

    expect(tree).toEqual(simple);
    done();
  });

  it('should form a 1 level tree', function (done) {
    taker.task('fn1', function (cb) {
      cb();
    });
    taker.task('fn2', function (cb) {
      cb();
    });

    var tree = taker.tree({ deep: true });

    expect(tree).toEqual(singleLevel);
    done();
  });

  it('should form a 2 level nested tree', function (done) {
    taker.task('fn1', function (cb) {
      cb();
    });
    taker.task('fn2', function (cb) {
      cb();
    });
    taker.task('fn3', taker.series('fn1', 'fn2'));

    var tree = taker.tree({ deep: true });

    expect(tree).toEqual(doubleLevel);
    done();
  });

  it('should form a 3 level nested tree', function (done) {
    taker.task(
      'fn1',
      taker.parallel(function (cb) {
        cb();
      }, noop),
    );
    taker.task(
      'fn2',
      taker.parallel(function (cb) {
        cb();
      }, noop),
    );
    taker.task('fn3', taker.series('fn1', 'fn2'));

    var tree = taker.tree({ deep: true });

    expect(tree).toEqual(tripleLevel);
    done();
  });

  it('should use the proper labels for aliased tasks (simple)', function (done) {
    var anon = function (cb) {
      cb();
    };
    taker.task(noop);
    taker.task('fn1', noop);
    taker.task('fn2', taker.task('noop'));
    taker.task('fn3', anon);
    taker.task('fn4', taker.task('fn3'));

    var tree = taker.tree({ deep: true });

    expect(tree).toEqual(aliasSimple);
    done();
  });

  it('should use the proper labels for aliased tasks (nested)', function (done) {
    taker.task(noop);
    taker.task('fn1', noop);
    taker.task('fn2', taker.task('noop'));
    taker.task('fn3', function (cb) {
      cb();
    });
    taker.task(
      'ser',
      taker.series(
        noop,
        function (cb) {
          cb();
        },
        'fn1',
        'fn2',
        'fn3',
      ),
    );
    taker.task(
      'par',
      taker.parallel(
        noop,
        function (cb) {
          cb();
        },
        'fn1',
        'fn2',
        'fn3',
      ),
    );

    var tree = taker.tree({ deep: true });

    expect(tree).toEqual(aliasNested);
    done();
  });
});
