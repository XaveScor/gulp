function createDualAsyncFn(fn) {
  return (...args) => {
    const res = Promise.resolve(fn(...args));

    const ret = (done) => {
      res.then((res) => done(null, res));
      res.catch((err) => done(err));
    };

    Object.defineProperty(ret, 'length', { value: 0 });

    ret.then = res.then.bind(res);
    ret.catch = res.catch.bind(res);

    return ret;
  };
}

module.exports = {
  createDualAsyncFn,
};
