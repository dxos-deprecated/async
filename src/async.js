//
// Copyright 2020 DxOS
//

export const noop = (...args) => args;

/**
 * Timesout after delay.
 * @param timeout
 * @returns {Promise<unknown>}
 */
export const sleep = timeout => new Promise((resolve) => {
  const finish = Date.now() + timeout;

  // setTimeout does not guarantee execution at >= the scheduled time and may execute slightly early.
  const sleeper = () => {
    const delta = finish - Date.now();
    if (delta > 0) {
      setTimeout(sleeper, delta);
    } else {
      resolve();
    }
  };

  sleeper();
});

/**
 * Async timeout
 * @param f
 * @param [timeout]
 * @returns {Promise<unknown>}
 */
export const timeout = (f, timeout = 0) => new Promise((resolve, reject) => {
  const handle = setTimeout(async () => {
    try {
      const value = await f();
      resolve(value);
    } catch (err) {
      reject(err);
    } finally {
      clearTimeout(handle);
    }
  }, timeout);
});

/**
 * Returns a function which triggers the callback after being called n times.
 * @param {number} n
 * @param {function} callback
 * @returns {function}
 */
export const latch = (n, callback) => () => {
  if (--n === 0) {
    callback(n);
  }
};

/**
 * Returns a tuple containing a Promise that will be resolved when the resolver function is called.
 *
 * @param {number|undefined} timeout
 * @return {[Promise, function]}}
 */
export const useValue = (timeout = undefined) => {
  let callback;
  const promise = new Promise((resolve, reject) => {
    const handle = timeout
      ? setTimeout(() => reject(new Error(`Timed out after ${timeout}ms`)), timeout) : null;

    callback = (...args) => {
      if (handle) {
        clearTimeout(handle);
      }
      resolve(...args);
    };
  });

  return [
    () => promise,
    (value) => callback(value)
  ];
};

// TODO(burdon): Remove.
export const trigger = useValue;

/**
 * @param {Promise} promise
 * @param {Number} timeout
 * @returns {Promise<unknown>}
 */
export const promiseTimeout = (promise, timeout) => {
  let cancelTimeout;

  const timeoutPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out in ${timeout} ms.`));
    }, timeout);

    cancelTimeout = () => {
      clearTimeout(timer);
      resolve();
    };
  });

  return new Promise((resolve, reject) => {
    Promise.race([
      promise,
      timeoutPromise
    ]).then((...result) => {
      cancelTimeout();
      resolve(...result);
    }, (err) => {
      cancelTimeout();
      reject(err);
    });
  });
};

/**
 * Wraps the invoked args handler and sets a result attribute with the value
 * returned from the function.
 *
 * @param func {Function<{argv}>}
 */
// TODO(burdon): Remove and move back to data-cli.
export const asyncHandler = func => {
  return argv => {
    try {
      argv._result = func(argv);
    } catch (err) {
      argv._result = Promise.reject(err);
    }
  };
};
