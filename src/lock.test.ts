import { Lock } from './lock';
import { sleep } from './async';

describe('Lock', () => {
  test('single execution', async () => {
    const events = [];
    const lock = new Lock();

    await lock.executeSynchronized(async () => {
      events.push('lock');
    });
    events.push('after');

    expect(events).toEqual([
      'lock',
      'after'
    ]);
  });

  test('return value', async () => {
    const lock = new Lock();

    const value = await lock.executeSynchronized(async () => 'foo');

    expect(value).toEqual('foo');
  });

  test('two concurrent synchronizations', async () => {
    const events = [];
    const lock = new Lock();

    const p1 = lock.executeSynchronized(async () => {
      events.push('lock1');
      await sleep(10);
      events.push('lock2');
    }).then(() => { events.push('p1 resolve'); });
    const p2 = lock.executeSynchronized(async () => {
      events.push('lock3');
    }).then(() => { events.push('p2 resolve'); });

    await p1;
    await p2;
    events.push('after');

    expect(events).toEqual([
      'lock1',
      'lock2',
      'p1 resolve',
      'lock3',
      'p2 resolve',
      'after'
    ]);
  });

  test('deadlock', async () => {
    const lock = new Lock();

    const promise = lock.executeSynchronized(async () => {
      await lock.executeSynchronized(async () => { /* noop */ });
    });

    let resolved = false;
    promise.then(() => { resolved = true; });

    await sleep(10);

    expect(resolved).toEqual(false);
  });

  test('errors do not break the lock', async () => {
    const lock = new Lock();

    let p1Status, p2Status;

    const p1 = lock.executeSynchronized(async () => {
      throw new Error();
    }).then(
      () => { p1Status = 'resolved'; },
      () => { p1Status = 'rejected'; }
    );

    const p2 = lock.executeSynchronized(async () => { /* noop */ })
      .then(
        () => { p2Status = 'resolved'; },
        () => { p2Status = 'rejected'; }
      );

    await p1;
    await p2;

    expect(p1Status).toEqual('rejected');
    expect(p2Status).toEqual('resolved');
  });
});
