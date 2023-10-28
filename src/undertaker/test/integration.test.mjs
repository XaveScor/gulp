import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';
import vinyl from 'vinyl-fs';
import jshint from 'gulp-jshint';
import through from 'through2';
import jobo from '../../../index.js';

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
  beforeEach(async () => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
  });

  beforeEach(cleanup);
  afterEach(cleanup);

  test('should handle vinyl streams', async () => {
    const task = jobo.declareTask({
      name: 'handle-vinyl-streams',
      fn: () => {
        return vinyl.src('./fixtures/test.js', { cwd: __dirname }).pipe(vinyl.dest('./fixtures/out', { cwd: __dirname }));
      },
    });

    await promisify(jobo.parallel(task))();
  });

  test('should exhaust vinyl streams', async () => {
    const task = jobo.declareTask({
      name: 'exhaust-vinyl-streams',
      fn: () => {
        return vinyl.src('./fixtures/test.js', { cwd: __dirname }).pipe(vinyl.dest('./fixtures/out', { cwd: __dirname }));
      },
    });

    await promisify(jobo.parallel(task))();
  });

  test('should lints all piped files', async () => {
    const task = jobo.declareTask({
      name: 'lints-all-piped-files',
      fn: () => {
        return vinyl.src('./fixtures/test.js', { cwd: __dirname }).pipe(jshint());
      },
    });

    await promisify(jobo.parallel(task))();
  });

  test('should handle a child process return', async () => {
    const task = jobo.declareTask({
      name: 'handle-a-child-process-return',
      fn: () => {
        if (isWindows) {
          return spawn('cmd', ['/c', 'dir']).on('error', noop);
        }

        return spawn('ls', ['-lh', __dirname]);
      },
    });

    await promisify(jobo.parallel(task))();
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
      const buildTask = jobo.declareTask({
        name: 'lastRun-build',
        fn: () => {
          return vinyl.src('./fixtures/tmp/*.js', { cwd: __dirname }).pipe(vinyl.dest('./fixtures/out', { cwd: __dirname }));
        },
      });

      function userEdit(cb) {
        fs.appendFile(path.join(__dirname, './fixtures/tmp/testMore.js'), ' ', cb);
      }

      function countEditedFiles() {
        return vinyl.src('./fixtures/tmp/*.js', { cwd: __dirname, since: jobo.lastRun(buildTask) }).pipe(
          through.obj(function (file, enc, cb) {
            fn();
            cb();
          }),
        );
      }

      await promisify(jobo.series(setup, delay, buildTask, delay, userEdit, countEditedFiles))();

      expect(fn).toHaveBeenCalledOnce();
    },
    { timeout: 5000 },
  );
});
