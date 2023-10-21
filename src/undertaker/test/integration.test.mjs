import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
import { disableDeprecationWarnings, resetDeprecationFlags, setDeprecationFlags } from '../../deprecation.mjs';

const { default: vinyl } = await import('vinyl-fs');
const { default: jshint } = await import('gulp-jshint');
const { default: through } = await import('through2');

const { Gulp } = await import('../../gulp.cjs');

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

  beforeEach(async () => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
    taker = new Gulp();
  });

  beforeEach(cleanup);
  afterEach(cleanup);

  test('should handle vinyl streams', async () => {
    taker.task('test', function () {
      return vinyl.src('./fixtures/test.js', { cwd: __dirname }).pipe(vinyl.dest('./fixtures/out', { cwd: __dirname }));
    });

    await promisify(taker.parallel('test'))();
  });

  test('should exhaust vinyl streams', async () => {
    taker.task('test', function () {
      return vinyl.src('./fixtures/test.js', { cwd: __dirname });
    });

    await promisify(taker.parallel('test'))();
  });

  test('should lints all piped files', async () => {
    taker.task('test', function () {
      return vinyl.src('./fixtures/test.js', { cwd: __dirname }).pipe(jshint());
    });

    await promisify(taker.parallel('test'))();
  });

  test('should handle a child process return', async () => {
    taker.task('test', function () {
      if (isWindows) {
        return spawn('cmd', ['/c', 'dir']).on('error', noop);
      }

      return spawn('ls', ['-lh', __dirname]);
    });

    await promisify(taker.parallel('test'))();
  });

  test('should run dependencies once', async () => {
    setDeprecationFlags({
      taskRunsOnce: true,
    });
    const fn = vi.fn();

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

    await promisify(taker.parallel('build'))();
    expect(fn).toHaveBeenCalledOnce();
  });

  test(
    'can use lastRun with vinyl.src `since` option',
    async () => {
      const fn = vi.fn();

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
            fn();
            cb();
          }),
        );
      }

      await promisify(taker.series(setup, delay, 'build', delay, userEdit, countEditedFiles))();

      expect(fn).toHaveBeenCalledOnce();
    },
    { timeout: 5000 },
  );
});
