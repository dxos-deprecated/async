//
// Copyright 2020 DxOS
//

// dxos-testing-browser

import { sleep, useValue, promiseTimeout, timeout } from './async';
import { expectToThrow } from './testing';

test('sleep', async () => {
  const now = Date.now();

  await sleep(100);
  expect(Date.now()).toBeGreaterThanOrEqual(now + 100);
});

test('useValue', async () => {
  const [value, setValue] = useValue();

  const t = setTimeout(() => setValue('test'), 10);

  const result = await value();
  expect(result).toBe('test');

  clearTimeout(t);
});

test('promiseTimeout', async () => {
  {
    const promise = timeout(() => 'test', 100);
    const value = await promiseTimeout(promise, 200);
    expect(value).toBe('test');
  }

  {
    const promise = timeout(() => 'test', 200);
    await expectToThrow(() => promiseTimeout(promise, 100));
  }
});
