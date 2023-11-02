import fsP from 'node:fs/promises';
import fs from 'node:fs';
import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import os from 'node:os';

const { default: gulp } = await import('../index.js');

describe('gulp.dest()', function () {
  let tmpPath;
  beforeEach(async () => {
    tmpPath = await fsP.mkdtemp(os.tmpdir());
  });
  afterEach(async () => {
    await fsP.rm(tmpPath, { recursive: true, force: true });
  });

  test('should return a stream', () => {
    const stream = gulp.dest('./fixtures');
    expect(stream).toBeTruthy();
    expect(stream.on).toBeTruthy();
  });

  test('should return a output stream that writes files', async () => {
    const examplePath = `${tmpPath}/copy/example.txt`;
    const inStream = gulp.src('./fixtures/**/*.txt', { cwd: __dirname });
    const outStream = gulp.dest(tmpPath);
    inStream.pipe(outStream);

    return new Promise((resolve, reject) => {
      outStream.on('error', reject);
      outStream.on('data', (file) => {
        // Data should be re-emitted right
        expect(file).toBeTruthy();
        expect(file.path).toEqual(examplePath);
        expect(file.contents.toString()).toEqual('this is a test');
      });
      outStream.on('end', async () => {
        const contents = await fs.readFileSync(examplePath);
        expect(contents.toString()).toEqual('this is a test');
        resolve();
      });
    });
  });

  test('should return a output stream that does not write non-read files', async () => {
    const examplePath = `${tmpPath}/copy/example.txt`;
    const inStream = gulp.src('./fixtures/**/*.txt', { read: false, cwd: __dirname });
    const outStream = gulp.dest(tmpPath);
    inStream.pipe(outStream);

    return new Promise((resolve, reject) => {
      outStream.on('error', reject);
      outStream.on('data', (file) => {
        // Data should be re-emitted right
        expect(file).toBeTruthy();
        expect(file.contents).toBeFalsy();
        expect(file.path).toEqual(examplePath);
      });
      outStream.on('end', () => {
        try {
          fs.readFileSync(examplePath);
        } catch (err) {
          expect(err).toBeTruthy();
        }
        resolve();
      });
    });
  });

  test('should return a output stream that writes streaming files', async () => {
    const examplePath = `${tmpPath}/copy/example.txt`;
    const inStream = gulp.src('./fixtures/**/*.txt', { buffer: false, cwd: __dirname });
    const outStream = inStream.pipe(gulp.dest(tmpPath));

    return new Promise((resolve, reject) => {
      outStream.on('error', reject);
      outStream.on('data', (file) => {
        // Data should be re-emitted right
        expect(file).toBeTruthy();
        expect(file.contents).toBeTruthy();
        expect(file.path).toEqual(examplePath);
      });
      outStream.on('end', () => {
        const contents = fs.readFileSync(examplePath);

        expect(contents.toString()).toEqual('this is a test');
        resolve();
      });
    });
  });

  test('should return a output stream that writes streaming files into new directories', async () => {
    await testWriteDir({ cwd: __dirname });
  });

  test('should return a output stream that writes streaming files into new directories (buffer: false)', async () => {
    await testWriteDir({ buffer: false, cwd: __dirname });
  });

  test('should return a output stream that writes streaming files into new directories (read: false)', async () => {
    await testWriteDir({ read: false, cwd: __dirname });
  });

  test('should return a output stream that writes streaming files into new directories (read: false, buffer: false)', async () => {
    await testWriteDir({ buffer: false, read: false, cwd: __dirname });
  });

  function testWriteDir(srcOptions) {
    const stuffPath = `${tmpPath}/stuff`;
    const inStream = gulp.src('./fixtures/stuff', srcOptions);
    const outStream = inStream.pipe(gulp.dest(tmpPath));

    return new Promise((resolve, reject) => {
      outStream.on('error', reject);
      outStream.on('data', (file) => {
        // Data should be re-emitted right
        expect(file).toBeTruthy();
        expect(file.path).toEqual(stuffPath);
      });
      outStream.on('end', () => {
        const exists = fs.existsSync(stuffPath);

        expect(exists).toBeTruthy();
        resolve();
      });
    });
  }
});
