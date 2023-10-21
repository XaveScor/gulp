import { customPromisify } from '../src/custom-promisify.mjs';
import { Readable } from 'node:stream';

const { default: expect } = await import('expect');

describe('custom-promisify', () => {
  it('should work with promises', async () => {
    const fn = Promise.resolve(1);
    const result = await customPromisify(fn);
    expect(result).toBe(1);
  });

  it('should work with async functions', async () => {
    const fn = async () => 1;
    const result = await customPromisify(fn);
    expect(result).toBe(1);
  });

  it('should work with sync functions with return value', async () => {
    const fn = () => 1;
    const result = await customPromisify(fn);
    expect(result).toBe(1);
  });

  it('should work with node streams', async () => {
    const fn = () => {
      const s = new Readable();
      s.push('beep');
      s.push(null);

      return s;
    };
    const result = await customPromisify(fn);
    expect(result).toBe(undefined);
  });
});
