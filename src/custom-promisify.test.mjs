import { describe, test } from 'vitest';

const { customPromisify } = await import('./custom-promisify.cjs');
const { default: through } = await import('through2');

describe('custom-promisify', () => {
  test('should work with through2 streams', async () => {
    const fn = customPromisify(() => {
      const s = through();
      setTimeout(() => {
        s.end();
      }, 10);
      return s;
    });

    await fn();
  });

  test('should work with through2 streams with defined callback', async () => {
    const fn = customPromisify((cb) => {
      const s = through();
      setTimeout(() => {
        s.end();
      }, 10);
      return s;
    });

    await fn();
  });
});
