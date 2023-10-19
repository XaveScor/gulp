const { default: jobo } = await import('../index.js');

const { default: expect } = await import('expect');

function wait(res) {
  return new Promise((resolve) => setTimeout(() => resolve(res), 10));
}

describe.only('[DEPRECATED] should be callable', () => {
  it('series', (done) => {
    jobo.series(
      async () => await wait(1),
      async () => await wait(2),
    )((err, res) => {
      expect(res).toEqual([1, 2]);
      done();
    });
  });

  it('parallel', (done) => {
    jobo.parallel(
      async () => await wait(1),
      async () => await wait(2),
    )((err, res) => {
      expect(res).toEqual([1, 2]);
      done();
    });
  });
});
