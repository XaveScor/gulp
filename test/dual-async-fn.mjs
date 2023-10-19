const { createDualAsyncFn } = await import('../src/dual-async-fn.cjs');

const { default: expect } = await import('expect');

async function thenFn(a, b) {
  return [a, b];
}
async function catchFn(a, b) {
  throw [b, a];
}

describe.only('dual-async-fn', () => {
  it('should be callable', (done) => {
    const fn = createDualAsyncFn(thenFn);

    fn(
      1,
      2,
    )((err, res) => {
      expect(res).toEqual([1, 2]);
      done();
    });
  });

  it('should be callable with catch', (done) => {
    const fn = createDualAsyncFn(catchFn);

    fn(
      1,
      2,
    )((err) => {
      expect(err).toEqual([2, 1]);
      done();
    });
  });

  it('should have length 0', () => {
    const fn = createDualAsyncFn(thenFn);

    expect(fn.length).toEqual(0);
  });

  it('should be thenable', async () => {
    const fn = createDualAsyncFn(thenFn);

    const res = await fn(1, 2);

    expect(res).toEqual([1, 2]);
  });

  it('should be catchable', async () => {
    const fn = createDualAsyncFn(catchFn);

    try {
      await fn(1, 2);
    } catch (err) {
      expect(err).toEqual([2, 1]);
    }
  });
});
