//
// Copyright 2020 DxOS
//

import assert from 'assert';

const noop = () => true;

export const sleep = t => new Promise((resolve) => {
  const finish = Date.now() + t;
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
 *
 * @function Provider
 * @function Resolver
 *
 * @return {[{Provider}, {Resolver}]}}
 */
export const trigger = (timeout = undefined) => {
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
    async () => promise,
    (value) => callback(value)
  ];
};

/**
 * Adds the listener and returns a function to remove it.
 * Promotes removing listeners when cleaning up objects (to prevent leaks).
 * @param {EventEmitter} object
 * @param {string} event
 * @param {Function} callback
 */
export const addListener = (object, event, callback) => {
  object.on(event, callback);

  return {
    callback,
    remove: () => object.removeListener(event, callback) // TODO(burdon): "off"
  };
};

/**
 * Wraps the invoked args handler and sets a result attribute with the value
 * returned from the function.
 *
 * @param func {Function<{ argv }>}
 */
export const asyncHandler = func => {
  return argv => {
    try {
      argv._result = func(argv);
    } catch (err) {
      argv._result = Promise.reject(err);
    }
  };
};

export const promiseTimeout = (promise, ms) => {
  let stopTimer;

  const timeout = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out in ${ms} ms.`));
    }, ms);
    stopTimer = () => {
      clearTimeout(timer);
      resolve();
    };
  });

  return new Promise((resolve, reject) => {
    Promise.race([
      promise,
      timeout
    ]).then((...res) => {
      stopTimer();
      resolve(...res);
    }, (err) => {
      stopTimer();
      reject(err);
    });
  });
};

/**
 * Returns a Promise which will resolve when `eventName` is triggered on `eventEmitter`.
 * If `checkFn` is specified, it must return truthy for the Promise to resolve.
 * Example:
 *   const waitFor123 = waitForEvent(recordProcessor, 'finished', record => record.id === '123');
 *   # Start processing all the records.
 *   recordProcessor.startProcessing();
 *   # Wait for record '123' to be processed.
 *   const record123 = await waitFor123;
 * @param eventEmitter
 * @param eventName
 * @param [checkFn]
 * @param [timeout]
 * @returns {Promise<*>}
 */
export const waitForEvent = (eventEmitter, eventName, checkFn = noop, timeout = 0) => {
  assert(eventEmitter);
  assert(eventEmitter.on);
  assert(eventName);
  assert(checkFn);

  const [provider, resolver] = trigger();
  const waiter = (...args) => {
    if (checkFn(...args)) {
      eventEmitter.off(eventName, waiter);
      resolver(...args);
    }
  };

  eventEmitter.on(eventName, waiter);

  return timeout ? promiseTimeout(provider(), timeout) : provider();
};
