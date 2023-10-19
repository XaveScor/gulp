const { createDualAsyncFn } = await import('../src/dual-async-fn.cjs');

const { default: expect } = await import('expect');

async function thenFn(a, b) {
  return [a, b];
}

describe('dual-async-fn', () => {
  it('should be callable', (done) => {
    const fn = createDualAsyncFn(thenFn);

    fn(
      1,
      2,
    )((err, res) => {
      expect(err).toEqual(1);
      expect(res).toEqual(2);
      done();
    });
  });

  // We need to have a length of 0 so that we should use this function as a PROMISE task
  it('should have length 0', () => {
    const fn = createDualAsyncFn(thenFn);

    expect(fn.length).toEqual(0);
  });

  it('should be thenable', async () => {
    const fn = createDualAsyncFn(thenFn);

    const res = await fn(1, 2);

    expect(res).toEqual([1, 2]);
  });
});
