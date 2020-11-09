//
// Copyright 2020 DXOS.org
//

/**
 * A locking meachnism to ensure that a given section of the code is executed by only a single "thread" at a time.
 *
 * Functions are chained in a structure similar to a linked list. `_lastPromise` always contains the function
 * that will finish executing last. Initially it is set to `Promise.resolve()` - promise that resolves immediately.
 * Enqueing is done by attaching provided function to the `_lastPromise` via a `.then()` call and updating
 * the `_lastPromise` variable. It is important that enquing is done atomically: there are no `await`s in
 * `executeSynchronized` and it's not async while still returning a promise.
 *
 * Java docs reference on synchronized sections:
 * https://docs.oracle.com/javase/tutorial/essential/concurrency/locksync.html
 */
export class Lock {
  private _lastPromise = Promise.resolve();

  /**
   * Waits for all previous executions to complete and then executes a given function.
   *
   * Only a single function can be executed at a time.
   *
   * Function are executed in the same order as `executeSynchronized` is called.
   *
   * WARNING: Calling `executeSynchronized` inside of `executeSynchronized` on the same lock instance is a deadlock.
   */
  executeSynchronized<T> (fun: () => Promise<T>): Promise<T> {
    const promise = this._lastPromise.then(() => fun());
    this._lastPromise = promise.then(() => { /* noop */ }, () => { /* noop */ });
    return promise;
  }
}

// TODO(burdon): Document.
const classLockSymbol = Symbol('class-lock');

/**
 * Same as `synchronized` in Java.
 *
 * Uses a lock global to the current class instance.
 * This way every synchronized method on the same instance will share a single lock.
 */
export function synchronized (
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<(...args: any) => any>
) {
  const method = descriptor.value!;
  descriptor.value = function (this: any, ...args: any) {
    const lock: Lock = this[classLockSymbol] ?? (this[classLockSymbol] = new Lock());
    return lock.executeSynchronized(() => method.apply(this, args));
  };
}
