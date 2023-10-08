import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const { default: expect } = await import('expect');
const { default: vinyl } = await import('vinyl-fs');
const { default: jshint } = await import('gulp-jshint');
const { default: through } = await import('through2');
const { default: sinon } = await import('sinon');

const { default: Undertaker } = await import('../index.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isWindows = os.platform() === 'win32';

function cleanup() {
  const dirs = ['./fixtures/out/', './fixtures/tmp/'];
  for (const dir of dirs) {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  }
}

function noop() {}

describe('undertaker: integrations', function () {
  let taker;

  beforeEach(function (done) {
    taker = new Undertaker();
    done();
  });

  beforeEach(cleanup);
  afterEach(cleanup);

  it('should handle vinyl streams', function (done) {
    taker.task('test', function () {
      return vinyl.src('./fixtures/test.js', { cwd: __dirname }).pipe(vinyl.dest('./fixtures/out', { cwd: __dirname }));
    });

    taker.parallel('test')(done);
  });

  it('should exhaust vinyl streams', function (done) {
    taker.task('test', function () {
      return vinyl.src('./fixtures/test.js', { cwd: __dirname });
    });

    taker.parallel('test')(done);
  });

  it('should lints all piped files', function (done) {
    taker.task('test', function () {
      return vinyl.src('./fixtures/test.js', { cwd: __dirname }).pipe(jshint());
    });

    taker.parallel('test')(done);
  });

  it('should handle a child process return', function (done) {
    taker.task('test', function () {
      if (isWindows) {
        return spawn('cmd', ['/c', 'dir']).on('error', noop);
      }

      return spawn('ls', ['-lh', __dirname]);
    });

    taker.parallel('test')(done);
  });

  // Skipped until we didn't have a flag for this
  it.skip('should run dependencies once', function (done) {
    const fn = sinon.fake();

    taker.task('clean', async () => fn());

    taker.task(
      'build-this',
      taker.series('clean', function (cb) {
        cb();
      }),
    );
    taker.task(
      'build-that',
      taker.series('clean', function (cb) {
        cb();
      }),
    );
    taker.task('build', taker.series('clean', taker.parallel(['build-this', 'build-that'])));

    taker.parallel('build')(function (err) {
      expect(fn.callCount).toEqual(1);
      done(err);
    });
  });

  it('can use lastRun with vinyl.src `since` option', function (done) {
    this.timeout(5000);

    let count = 0;

    function setup() {
      return vinyl.src('./fixtures/test*.js', { cwd: __dirname }).pipe(vinyl.dest('./fixtures/tmp', { cwd: __dirname }));
    }

    function delay(cb) {
      setTimeout(cb, 2000);
    }

    // Some built
    taker.task('build', function () {
      return vinyl.src('./fixtures/tmp/*.js', { cwd: __dirname }).pipe(vinyl.dest('./fixtures/out', { cwd: __dirname }));
    });

    function userEdit(cb) {
      fs.appendFile(path.join(__dirname, './fixtures/tmp/testMore.js'), ' ', cb);
    }

    function countEditedFiles() {
      return vinyl.src('./fixtures/tmp/*.js', { cwd: __dirname, since: taker.lastRun('build') }).pipe(
        through.obj(function (file, enc, cb) {
          count++;
          cb();
        }),
      );
    }

    taker.series(
      setup,
      delay,
      'build',
      delay,
      userEdit,
      countEditedFiles,
    )(function (err) {
      expect(count).toEqual(1);
      done(err);
    });
  });
});
