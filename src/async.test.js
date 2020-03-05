//
// Copyright 2020 DxOS
//

// dxos-testing-browser

import EventEmitter from 'events';

import { addListener, sleep, trigger, promiseTimeout } from './async';

test('addListener', done => {
  const emitter = new EventEmitter();
  const callback = addListener(emitter, 'test', () => {
    callback.remove();

    expect(emitter.listenerCount('test')).toBe(0);

    done();
  });

  emitter.emit('test');
});

test('sleep', async () => {
  const now = Date.now();

  await sleep(100);
  expect(Date.now()).toBeGreaterThanOrEqual(now + 100);
});

test('trigger', async () => {
  const [provider, resolve] = trigger();

  const t = setTimeout(() => resolve('test'), 10);

  const value = await provider();
  expect(value).toBe('test');

  clearTimeout(t);
});

test('trigger with timeout', async () => {
  const [provider, resolve] = trigger(100);

  const t = setTimeout(() => resolve('test'), 1000);
  let thrown;

  try {
    await provider();
  } catch (err) {
    thrown = err;
  }

  expect(thrown).toBeInstanceOf(Error);
  clearTimeout(t);
});

test('promiseTimeout', async () => {
  const testPromise = new Promise(resolve => {
    setTimeout(() => resolve('test'), 100);
  });

  const value = await promiseTimeout(testPromise, 200);
  expect(value).toBe('test');
});

test('promiseTimeout - timed out', async (done) => {
  const testPromise = new Promise(resolve => {
    setTimeout(() => resolve('test'), 200);
  });

  try {
    await promiseTimeout(testPromise, 100);
    done.fail('Timeout not triggered.');
  } catch (error) {
    expect(error.message).toMatch(/Timed out/);
    done();
  }
});
