import fsP from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { disableDeprecationWarnings, resetDeprecationFlags } from '../src/deprecation.mjs';
import os from 'node:os';

const { default: gulp } = await import('../index.js');

const tempFileContent = 'A test generated this file and it is safe to delete';

async function createTempFile(path) {
  await fsP.writeFile(path, tempFileContent);
}

function updateTempFile(path) {
  setTimeout(function () {
    fs.appendFileSync(path, ' changed');
  }, 125);
}

describe('gulp.watch()', function () {
  let outPath;
  beforeEach(async () => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
    outPath = await fsP.mkdtemp(os.tmpdir());
  });
  afterEach(async () => {
    await fsP.rm(outPath, { recursive: true, force: true });
  });

  test('should call the function when file changes: no options', async () => {
    const tempFile = path.join(outPath, 'watch-func.txt');

    await createTempFile(tempFile);

    const finalizers = [];
    try {
      await new Promise((resolve) => {
        const watcher = gulp.watch('watch-func.txt', { cwd: outPath }, (cb) => {
          cb();
          resolve();
        });
        finalizers.push(async () => await watcher.close());

        updateTempFile(tempFile);
      });
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });

  test('should execute the gulp.parallel tasks', async () => {
    const tempFile = path.join(outPath, 'watch-func.txt');

    await createTempFile(tempFile);

    const finalizers = [];
    try {
      await new Promise((resolve) => {
        gulp.task('test', function (cb) {
          cb();
          resolve();
        });

        const watcher = gulp.watch('watch-func.txt', { cwd: outPath }, gulp.parallel('test'));
        finalizers.push(async () => await watcher.close());

        updateTempFile(tempFile);
      });
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });

  test('should work with destructuring', async () => {
    const tempFile = path.join(outPath, 'watch-func.txt');
    await createTempFile(tempFile);

    const finalizers = [];
    try {
      await new Promise((resolve) => {
        gulp.task('test', function (cb) {
          cb();
          resolve();
        });

        const watcher = gulp.watch('watch-func.txt', { cwd: outPath }, gulp.parallel('test'));
        finalizers.push(async () => await watcher.close());

        updateTempFile(tempFile);
      });
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });

  test('should not call the function when no file changes: no options', async () => {
    const tempFile = path.join(outPath, 'watch-func.txt');

    await createTempFile(tempFile);

    const watcher = gulp.watch('watch-func.txt', { cwd: outPath }, () => {
      // TODO: proper fail here
      expect('Watcher erroneously called');
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await watcher.close();
  });

  test('should call the function when file changes: w/ options', async () => {
    const tempFile = path.join(outPath, 'watch-func-options.txt');
    await createTempFile(tempFile);

    const finalizers = [];
    try {
      await new Promise((resolve) => {
        const watcher = gulp.watch('watch-func-options.txt', { cwd: outPath }, (cb) => {
          cb();
          resolve();
        });
        finalizers.push(async () => await watcher.close());

        updateTempFile(tempFile);
      });
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });

  test('should not drop options when no callback specified', async () => {
    const tempFile = path.join(outPath, 'watch-func-nodrop-options.txt');
    // By passing a cwd option, ensure options are not lost to gaze
    const relFile = '../watch-func-nodrop-options.txt';
    const cwd = path.join(outPath, '/subdir');
    await createTempFile(tempFile);

    const finalizers = [];
    const watcher = gulp.watch(relFile, { cwd, persistent: true });
    finalizers.push(async () => await watcher.close());

    try {
      await new Promise((resolve) => {
        watcher.on('change', (filepath) => {
          expect(filepath).toBeTruthy();
          expect(path.resolve(cwd, filepath)).toEqual(path.resolve(tempFile));
          expect(fs.readFileSync(tempFile, 'utf8')).toEqual(tempFileContent + ' changed');
          resolve();
        });
        updateTempFile(tempFile);
      });
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });

  test('should work without options or callback', async () => {
    const finalizers = [];
    try {
      // TODO: check we return watcher?
      const w = gulp.watch('x');
      finalizers.push(async () => await w.close());
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });

  test('should run many tasks: w/ options', async () => {
    const tempFile = path.join(outPath, 'watch-task-options.txt');
    let a = 0;

    await createTempFile(tempFile);

    const finalizers = [];
    try {
      await new Promise((resolve) => {
        gulp.task('task1', (cb) => {
          a++;
          cb();
        });
        gulp.task('task2', (cb) => {
          a += 10;
          expect(a).toEqual(11);
          cb();
          resolve();
        });

        const watcher = gulp.watch('watch-task-options.txt', { cwd: outPath }, gulp.series('task1', 'task2'));
        finalizers.push(async () => await watcher.close());

        updateTempFile(tempFile);
      });
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });

  test('should run many tasks: no options', async () => {
    const tempFile = path.join(outPath, 'watch-many-tasks-no-options.txt');
    let a = 0;

    await createTempFile(tempFile);

    const finalizers = [];
    gulp.task('task1', (cb) => {
      a++;
      cb();
    });
    try {
      await new Promise((resolve) => {
        gulp.task('task2', (cb) => {
          a += 10;
          expect(a).toEqual(11);
          cb();
          resolve();
        });

        const watcher = gulp.watch(`${outPath}/watch-many-tasks-no-options.txt`, gulp.series('task1', 'task2'));
        finalizers.push(async () => await watcher.close());

        updateTempFile(tempFile);
      });
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });

  test('should throw an error: passed parameter (string) is not a function', async () => {
    const filename = 'empty.txt';
    const tempFile = path.join(outPath, filename);

    await createTempFile(tempFile);
    const finalizers = [];
    try {
      const w = gulp.watch(filename, { cwd: outPath }, 'task1');
      finalizers.push(async () => await w.close());
    } catch (err) {
      expect(err.message).toEqual('watching ' + filename + ': watch task has to be a function (optionally generated by using gulp.parallel or gulp.series)');
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });

  test('should throw an error: passed parameter (array) is not a function', async () => {
    const filename = 'empty.txt';
    const tempFile = path.join(outPath, filename);

    await createTempFile(tempFile);
    const finalizers = [];
    try {
      const w = gulp.watch(filename, { cwd: outPath }, ['task1']);
      finalizers.push(async () => await w.close());
    } catch (err) {
      expect(err.message).toEqual('watching ' + filename + ': watch task has to be a function (optionally generated by using gulp.parallel or gulp.series)');
    } finally {
      await Promise.all(finalizers.map((f) => f()));
    }
  });
});
