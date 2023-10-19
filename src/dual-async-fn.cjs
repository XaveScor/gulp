function createDualAsyncFn(fn) {
  return (...args) => {
    const res = Promise.resolve(fn(...args));

    const ret = (done) => {
      res.then(([error, res]) => done(error, res));
    };

    Object.defineProperty(ret, 'length', { value: 0 });

    ret.then = res.then.bind(res);

    return ret;
  };
}

module.exports = {
  createDualAsyncFn,
};
