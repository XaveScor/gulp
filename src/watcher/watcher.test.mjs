import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';

const { default: through } = await import('through2');

const { watch } = await import('./index.cjs');

// Default delay on debounce
const timeout = 200;

const globPattern = '**/*.js';

describe('glob-watcher', () => {
  let tmpDir;
  let outDir;
  let outFile1;
  let outFile2;
  let outGlob;
  let singleAdd;
  let ignoreGlob;

  function changeFile() {
    fs.writeFileSync(outFile1, 'hello changed');
  }

  function addFile() {
    fs.writeFileSync(outFile2, 'hello added');
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(os.tmpdir());
    outDir = path.join(tmpDir, 'fixtures');
    fs.mkdirSync(outDir);
    outFile1 = path.join(outDir, 'changed.js');
    outFile2 = path.join(outDir, 'added.js');
    outGlob = path.normalize(path.join(outDir, globPattern));
    singleAdd = path.normalize(outFile1);
    ignoreGlob = '!' + singleAdd;
    fs.writeFileSync(outFile1, 'hello world');
  });

  afterEach(() => {
    fs.rmdirSync(tmpDir, { recursive: true });
  });

  test('only requires a glob and returns watcher', async () => {
    const watcher = watch({
      glob: outGlob,
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);

    return new Promise((resolve) => {
      watcher.once('change', (filepath) => {
        expect(filepath).toEqual(outFile1);
        resolve();
      });
    }).finally(() => {
      watcher.close();
    });
  });

  test('picks up added files', () => {
    const watcher = watch({
      glob: outGlob,
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', addFile);

    return new Promise((resolve) => {
      watcher.once('add', (filepath) => {
        expect(filepath).toEqual(outFile2);
        resolve();
      });
    }).finally(() => {
      watcher.close();
    });
  });

  test('works with OS-specific cwd', async () => {
    const watcher = watch({
      glob: globPattern,
      options: { cwd: tmpDir },
    });

    return new Promise((resolve) => {
      watcher.once('change', (filepath) => {
        // Uses path.join here because the resulting path is OS-specific
        expect(filepath).toEqual(path.join('fixtures', 'changed.js'));
        resolve();
      });

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', changeFile);
    }).finally(() => {
      watcher.close();
    });
  });

  test('accepts a callback & calls when file is changed', () => {
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        callback(cb) {
          cb();
          resolve();
        },
      });
      finalizers.push(() => watcher.close());

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', changeFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('accepts a callback & calls when file is added', () => {
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        callback(cb) {
          cb();
          resolve();
        },
      });
      finalizers.push(() => watcher.close());

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', addFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('waits for completion is signaled before running again', () => {
    let runs = 0;
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        callback(cb) {
          runs++;
          if (runs === 1) {
            setTimeout(() => {
              expect(runs).toEqual(1);
              cb();
            }, timeout * 3);
          }
          if (runs === 2) {
            cb();
            resolve();
          }
        },
      });
      finalizers.push(() => watcher.close());

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', () => {
        changeFile();
        // Fire after double the delay
        setTimeout(changeFile, timeout * 2);
      });
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  // It can signal completion with anything async-done supports
  // Just wanted to have a smoke test for streams
  test('can signal completion with a stream', () => {
    let runs = 0;
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        callback(cb) {
          runs++;
          if (runs === 1) {
            const stream = through();
            setTimeout(() => {
              expect(runs).toEqual(1);
              stream.end();
            }, timeout * 3);
            return stream;
          }
          if (runs === 2) {
            cb();
            resolve();
          }
        },
      });
      finalizers.push(() => watcher.close());

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', () => {
        changeFile();
        // Fire after double the delay
        setTimeout(changeFile, timeout * 2);
      });
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('emits an error if one occurs in the callback and handler attached', () => {
    const expectedError = new Error('boom');
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        callback(cb) {
          cb(expectedError);
        },
      });
      finalizers.push(() => watcher.close());

      watcher.on('error', (err) => {
        expect(err).toEqual(expectedError);
        resolve();
      });

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', changeFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('does not emit an error (and crash) when no handlers attached', () => {
    const expectedError = new Error('boom');
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        callback(cb) {
          cb(expectedError);
          setTimeout(resolve, timeout * 3);
        },
      });
      finalizers.push(() => watcher.close());

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', changeFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('allows the user to disable queueing', () => {
    let runs = 0;
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        options: { queue: false },
        callback(cb) {
          runs++;
          setTimeout(() => {
            // Expect 1 because run 2 is never queued
            expect(runs).toEqual(1);
            cb();
            resolve();
          }, timeout * 3);
        },
      });
      finalizers.push(() => watcher.close());

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', () => {
        changeFile();
        // This will never trigger a call because queueing is disabled
        setTimeout(changeFile, timeout * 2);
      });
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('allows the user to adjust delay', () => {
    let runs = 0;
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        options: { delay: timeout / 2 },
        callback(cb) {
          runs++;
          if (runs === 1) {
            setTimeout(function () {
              expect(runs).toEqual(1);
              cb();
            }, timeout * 3);
          }
          if (runs === 2) {
            expect(runs).toEqual(2);
            cb();
            resolve();
          }
        },
      });
      finalizers.push(() => watcher.close());

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', () => {
        changeFile();
        // This will queue because delay is halved
        setTimeout(changeFile, timeout);
      });
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('passes options to chokidar', () => {
    // Callback is called while chokidar is discovering file paths
    // if ignoreInitial is explicitly set to false and passed to chokidar
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        options: { ignoreInitial: false },
        callback(cb) {
          cb();
          resolve();
        },
      });
      finalizers.push(() => watcher.close());
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('does not override default values with null values', () => {
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: outGlob,
        options: { ignoreInitial: null },
        callback(cb) {
          cb();
          resolve();
        },
      });
      finalizers.push(() => watcher.close());

      // We default `ignoreInitial` to true and it isn't overwritten by null
      // So wait for `on('ready')`
      watcher.on('ready', changeFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('watches exactly the given event', () => {
    const finalizers = [];
    return new Promise((resolve) => {
      const spy = vi
        .fn()
        .mockImplementationOnce(() => {
          changeFile();
          setTimeout(resolve, 500);
        })
        .mockImplementationOnce(() => {
          throw new Error('`Add` handler called for `change` event');
        });

      const watcher = watch({
        glob: outGlob,
        options: { events: 'change' },
        callback: spy,
      });
      finalizers.push(() => watcher.close());

      watcher.on('ready', addFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('accepts multiple events to watch', () => {
    const finalizers = [];

    return new Promise((resolve) => {
      const spy = vi.fn().mockImplementation(() => {
        throw new Error('`Add`/`Unlink` handler called for `change` event');
      });

      const watcher = watch({
        glob: outGlob,
        options: { events: ['add', 'unlink'] },
        callback: spy,
      });
      finalizers.push(() => watcher.close());

      watcher.on('ready', () => {
        changeFile();
        setTimeout(resolve, 500);
      });
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('can ignore a glob after it has been added', () => {
    const finalizers = [];

    return new Promise((resolve, reject) => {
      const watcher = watch({
        glob: [outGlob, ignoreGlob],
      });
      finalizers.push(() => watcher.close());

      watcher.once('change', reject);

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', changeFile);

      setTimeout(resolve, 1500);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('can re-add a glob after it has been negated', () => {
    const finalizers = [];

    return new Promise((resolve) => {
      const watcher = watch({
        glob: [outGlob, ignoreGlob, singleAdd],
      });
      finalizers.push(() => watcher.close());

      watcher.once('change', (filepath) => {
        expect(filepath).toEqual(singleAdd);
        resolve();
      });

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', changeFile);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  test('does not mutate the globs array', () => {
    const globs = [outGlob, ignoreGlob, singleAdd];

    const watcher = watch({
      glob: globs,
    });
    watcher.close();

    expect(globs[0]).toEqual(outGlob);
    expect(globs[1]).toEqual(ignoreGlob);
    expect(globs[2]).toEqual(singleAdd);
  });

  test('passes ignores through to chokidar', () => {
    const ignored = [singleAdd];
    const finalizers = [];

    return new Promise((resolve, reject) => {
      const watcher = watch({
        glob: outGlob,
        options: { ignored },
      });
      finalizers.push(() => watcher.close());

      watcher.once('change', reject);

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', changeFile);

      // Just test the non-mutation in this test
      expect(ignored.length).toEqual(1);

      setTimeout(resolve, 1500);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });

  // https://github.com/gulpjs/glob-watcher/issues/46
  test('ignoring globs also works with `cwd` option', () => {
    const finalizers = [];

    return new Promise((resolve, reject) => {
      const watcher = watch({
        glob: ['fixtures/**', '!fixtures/*.js'],
        options: { cwd: 'test' },
      });
      finalizers.push(() => watcher.close());

      watcher.once('change', reject);

      // We default `ignoreInitial` to true, so always wait for `on('ready')`
      watcher.on('ready', changeFile);

      setTimeout(resolve, 1500);
    }).finally(() => {
      finalizers.forEach((f) => f());
    });
  });
});
