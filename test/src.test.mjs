import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test, vi } from 'vitest';

const { default: gulp } = await import('../index.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('gulp.src()', function () {
  test('should return a stream', () => {
    const stream = gulp.src('./fixtures/*.coffee', { cwd: __dirname });
    expect(stream).toBeTruthy();
    expect(stream.on).toBeTruthy();
  });
  test('should return a input stream from a flat glob', async () => {
    const stream = gulp.src('./fixtures/*.coffee', { cwd: __dirname });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', (file) => {
        expect(file).toBeTruthy();
        expect(file.path).toEqual(path.join(__dirname, './fixtures/test.coffee'));
        expect(file.contents.toString()).toEqual('this is a test');
      });
      stream.on('end', resolve);
    });
  });

  test('should return a input stream for multiple globs', async () => {
    const globArray = ['./fixtures/stuff/run.dmc', './fixtures/stuff/test.dmc'];
    const stream = gulp.src(globArray, { cwd: __dirname });

    const files = [];
    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', (file) => {
        expect(file).toBeTruthy();
        expect(file.path).toBeTruthy();
        files.push(file);
      });
      stream.on('end', () => {
        expect(files.length).toEqual(2);
        expect(files[0].path).toEqual(path.join(__dirname, globArray[0]));
        expect(files[1].path).toEqual(path.join(__dirname, globArray[1]));
        resolve();
      });
    });
  });

  test('should return a input stream for multiple globs, with negation', async () => {
    const expectedPath = path.join(__dirname, './fixtures/stuff/run.dmc');
    const globArray = ['./fixtures/stuff/*.dmc', '!fixtures/stuff/test.dmc'];
    const stream = gulp.src(globArray, { cwd: __dirname });

    const files = [];
    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', (file) => {
        expect(file).toBeTruthy();
        expect(file.path).toBeTruthy();
        files.push(file);
      });
      stream.on('end', function () {
        expect(files.length).toEqual(1);
        expect(files[0].path).toEqual(expectedPath);
        resolve();
      });
    });
  });

  test('should return a input stream with no contents when read is false', async () => {
    const stream = gulp.src('./fixtures/*.coffee', { read: false, cwd: __dirname });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', (file) => {
        expect(file).toBeTruthy();
        expect(file.contents).toBeFalsy();
        expect(file.path).toEqual(path.join(__dirname, './fixtures/test.coffee'));
      });
      stream.on('end', resolve);
    });
  });
  test('should return a input stream with contents as stream when buffer is false', async () => {
    const stream = gulp.src('./fixtures/*.coffee', { buffer: false, cwd: __dirname });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', (file) => {
        expect(file).toBeTruthy();
        expect(file.path).toBeTruthy();
        expect(file.contents).toBeTruthy();
        let buf = '';
        file.contents.on('data', function (d) {
          buf += d;
        });
        file.contents.on('end', function () {
          expect(buf.toString()).toEqual('this is a test');
          resolve();
        });
        expect(file.path).toEqual(path.join(__dirname, './fixtures/test.coffee'));
      });
    });
  });
  test('should return a input stream from a deep glob', async () => {
    const stream = gulp.src('./fixtures/**/*.jade', { cwd: __dirname });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', (file) => {
        expect(file).toBeTruthy();
        expect(file.path).toEqual(path.join(__dirname, './fixtures/test/run.jade'));
        expect(file.contents.toString()).toEqual('test template');
      });
      stream.on('end', resolve);
    });
  });
  test('should return a input stream from a deeper glob', async () => {
    const stream = gulp.src('./fixtures/**/*.dmc', { cwd: __dirname });
    const fn = vi.fn();

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', fn);
      stream.on('end', () => {
        expect(fn).toBeCalledTimes(2);
        resolve();
      });
    });
  });

  test('should return a file stream from a flat path', async () => {
    const fn = vi.fn();
    const stream = gulp.src(path.join(__dirname, './fixtures/test.coffee'));

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', (file) => {
        fn();
        expect(file).toBeTruthy();
        expect(file.path).toEqual(path.join(__dirname, './fixtures/test.coffee'));
        expect(file.contents.toString()).toEqual('this is a test');
      });
      stream.on('end', function () {
        expect(fn).toBeCalledTimes(1);
        resolve();
      });
    });
  });
});
