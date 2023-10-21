const { default: expect } = await import('expect');

const { TaskResult } = await import('../src/task-result.cjs');
const { gulpPromisify } = await import('../src/gulp-promisify.cjs');

describe.only('gulp-promisify', () => {
  it('should work with sync functions', async () => {
    const fn = () => 1;

    const promisifiedFn = gulpPromisify(fn);
    const res = await promisifiedFn();

    expect(res).toEqual(1);
  });

  it('should work with callback functions', async () => {
    const fn = (done) => {
      done(2, 1);
    };

    const promisifiedFn = gulpPromisify(fn);
    const res = await promisifiedFn();

    expect(res instanceof TaskResult).toEqual(true);
    expect(res.result).toEqual(1);
    expect(res.error).toEqual(2);
  });
});
