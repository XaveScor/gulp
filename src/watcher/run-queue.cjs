class SingletonRunQueue {
  _promise = Promise.resolve();
  _running = false;
  add(fn, errorCb) {
    if (this._running) {
      return;
    }
    this._promise = this._promise
      .then(() => (this._running = true))
      .then(() => fn())
      .catch(errorCb)
      .finally(() => (this._running = false));
  }
}

class RunQueue {
  _promise = Promise.resolve();

  add(fn, errorCb) {
    this._promise = this._promise.then(() => fn()).catch(errorCb);
  }
}

function createRunQueue(queue) {
  return queue ? new RunQueue() : new SingletonRunQueue();
}

module.exports = {
  createRunQueue,
};
