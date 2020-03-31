//
// Copyright 2020 DxOS
//

// dxos-testing-browser

import EventEmitter from 'events';

import { addListener, sleep, trigger, promiseTimeout, waitForEvent } from './async';

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

test('waitForEvent', async () => {
  const emitter = new EventEmitter();
  const waitFor123 = waitForEvent(emitter, 'done', record => record.id === '123');
  setTimeout(() => {
    emitter.emit('done', { id: '111' });
    emitter.emit('done', { id: '211' });
    emitter.emit('done', { id: '123' });
    emitter.emit('done', { id: '311' });
  }, 10);
  const record = await waitFor123;
  expect(record.id).toEqual('123');
});

test('waitForEvent - timed out', async (done) => {
  const emitter = new EventEmitter();
  const waitFor123 = waitForEvent(emitter, 'done', record => record.id === '123', 50);
  setTimeout(() => {
    emitter.emit('done', { id: '123' });
  }, 75);
  try {
    await waitFor123;
    done.fail('Timeout not triggered.');
  } catch (error) {
    expect(error.message).toMatch(/Timed out/);
    done();
  }
});
