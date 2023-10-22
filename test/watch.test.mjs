import fsP from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { disableDeprecationWarnings, resetDeprecationFlags } from '../src/deprecation.mjs';
import os from 'node:os';

const { default: gulp } = await import('../index.js');

const tempFileContent = 'A test generated this file and it is safe to delete';

function createTempFile(path) {
  fs.writeFileSync(path, tempFileContent);
}

function updateTempFile(path) {
  setTimeout(function () {
    fs.appendFileSync(path, ' changed');
  }, 125);
}

describe.skip('gulp.watch()', function () {
  let outPath;
  beforeEach(async () => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
    outPath = await fsP.mkdtemp(os.tmpdir());
  });
  afterEach(async () => {
    await fsP.rm(outPath, { recursive: true, force: true });
  });

  test.skip('should call the function when file changes: no options', async () => {
    const tempFile = path.join(outPath, 'watch-func.txt');

    createTempFile(tempFile);

    const finalizers = [];
    return new Promise((resolve) => {
      const watcher = gulp.watch('watch-func.txt', { cwd: outPath }, (cb) => {
        cb();
        resolve();
      });
      finalizers.push(() => watcher.close());

      updateTempFile(tempFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('should execute the gulp.parallel tasks', async () => {
    const tempFile = path.join(outPath, 'watch-func.txt');

    createTempFile(tempFile);

    const finalizers = [];
    return new Promise((resolve) => {
      gulp.task('test', function (cb) {
        cb();
        resolve();
      });

      const watcher = gulp.watch('watch-func.txt', { cwd: outPath }, gulp.parallel('test'));
      finalizers.push(() => watcher.close());

      updateTempFile(tempFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test.skip('should work with destructuring', async () => {
    const tempFile = path.join(outPath, 'watch-func.txt');
    createTempFile(tempFile);

    const finalizers = [];
    return new Promise((resolve) => {
      gulp.task('test', function (cb) {
        cb();
        resolve();
      });

      const watcher = gulp.watch('watch-func.txt', { cwd: outPath }, gulp.parallel('test'));
      finalizers.push(() => watcher.close());

      updateTempFile(tempFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('should not call the function when no file changes: no options', async () => {
    var tempFile = path.join(outpath, 'watch-func.txt');

    createTempFile(tempFile);

    var watcher = gulp.watch('watch-func.txt', { cwd: outpath }, function () {
      // TODO: proper fail here
      expect('Watcher erroneously called');
    });

    setTimeout(function () {
      watcher.close();
      done();
    }, 10);
  });

  test('should call the function when file changes: w/ options', async () => {
    var tempFile = path.join(outpath, 'watch-func-options.txt');

    createTempFile(tempFile);

    var watcher = gulp.watch('watch-func-options.txt', { cwd: outpath }, function (cb) {
      watcher.close();
      cb();
      done();
    });

    updateTempFile(tempFile);
  });

  test('should not drop options when no callback specified', async () => {
    var tempFile = path.join(outpath, 'watch-func-nodrop-options.txt');
    // By passing a cwd option, ensure options are not lost to gaze
    var relFile = '../watch-func-nodrop-options.txt';
    var cwd = path.join(outpath, '/subdir');

    createTempFile(tempFile);

    var watcher = gulp.watch(relFile, { cwd: cwd }).on('change', function (filepath) {
      expect(filepath).toExist();
      expect(path.resolve(cwd, filepath)).toEqual(path.resolve(tempFile));
      watcher.close();
      done();
    });

    updateTempFile(tempFile);
  });

  test('should work without options or callback', async () => {
    // TODO: check we return watcher?
    gulp.watch('x');
    done();
  });

  test('should run many tasks: w/ options', async () => {
    var tempFile = path.join(outpath, 'watch-task-options.txt');
    var a = 0;

    createTempFile(tempFile);

    gulp.task('task1', function (cb) {
      a++;
      cb();
    });
    gulp.task('task2', function (cb) {
      a += 10;
      expect(a).toEqual(11);
      watcher.close();
      cb();
      done();
    });

    var watcher = gulp.watch('watch-task-options.txt', { cwd: outpath }, gulp.series('task1', 'task2'));

    updateTempFile(tempFile);
  });

  test('should run many tasks: no options', async () => {
    var tempFile = path.join(outpath, 'watch-many-tasks-no-options.txt');
    var a = 0;

    createTempFile(tempFile);

    gulp.task('task1', function (cb) {
      a++;
      cb();
    });
    gulp.task('task2', function (cb) {
      a += 10;
      expect(a).toEqual(11);
      watcher.close();
      cb();
      done();
    });

    var watcher = gulp.watch('./test/out-fixtures/watch-many-tasks-no-options.txt', gulp.series('task1', 'task2'));

    updateTempFile(tempFile);
  });

  test('should throw an error: passed parameter (string) is not a function', async () => {
    var filename = 'empty.txt';
    var tempFile = path.join(outpath, filename);

    createTempFile(tempFile);
    try {
      gulp.watch(filename, { cwd: outpath }, 'task1');
    } catch (err) {
      expect(err.message).toEqual('watching ' + filename + ': watch task has to be a function (optionally generated by using gulp.parallel or gulp.series)');
      done();
    }
  });

  test('should throw an error: passed parameter (array) is not a function', async () => {
    var filename = 'empty.txt';
    var tempFile = path.join(outpath, filename);

    createTempFile(tempFile);
    try {
      gulp.watch(filename, { cwd: outpath }, ['task1']);
    } catch (err) {
      expect(err.message).toEqual('watching ' + filename + ': watch task has to be a function (optionally generated by using gulp.parallel or gulp.series)');
      done();
    }
  });
});
