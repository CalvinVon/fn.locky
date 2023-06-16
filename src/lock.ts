import isEqual from 'lodash.isequal';
import type { Lockable, Lockified } from './types';

/**
 * @example
 * - Async Lock Usage
 *    ```ts
 *    // create
 *    const lock = Lock.createAsyncLock();
 * 
 *    // lock
 *    lock.lock();
 * 
 *    // judge status
 *    if (lock.locked) {
 *      // wait util unlock
 *      await lock.pending;
 *    }
 * 
 *    // unlock
 *    lock.unlock();
 *    ```
 */
export default abstract class Lock {
  static createAsyncLock() {
    return new AsyncLock();
  }

  static lockify = lockify;

  abstract get locked(): boolean;
  abstract lock(): void;
  abstract unlock(params?: any, isError?: boolean): void;
}


/**
 * @example
 * - Async Lock Usage
 *    ```ts
 *    // create
 *    const lock = Lock.createAsyncLock();
 * 
 *    // lock
 *    lock.lock();
 * 
 *    // judge status
 *    if (lock.locked) {
 *      // wait util unlock
 *      await lock.pending;
 *    }
 * 
 *    // unlock
 *    lock.unlock();
 *    ```
 */
export class AsyncLock<T> extends Lock {
  pending?: Promise<T>;
  private _resolve?: (params?: any) => void;
  private _reject?: (params?: any) => void;

  /**
   * locking state
   */
  get locked() {
    return !!this.pending;
  }

  _constructLock() {
    this.pending = new Promise((resolve, reject) => {
      const unlock = (fn: any) => (params: any) => {
        this.pending = undefined;
        fn(params);
      };
      this._resolve = unlock(resolve);
      this._reject = unlock(reject);
    });

    // for not to trigger UncaughtException
    this.pending.catch(() => null);
  }

  /**
   * lock
   */
  lock() {
    if (!this.locked) {
      this._constructLock();
    }
  }

  /**
   * unlock
   * 
   * if there's error thrown, set `isError` to `true`
   */
  unlock(params?: T, isError?: boolean) {
    if (this.locked) {
      if (isError) {
        this._reject!(params);
      } else {
        this._resolve!(params);
      }
    }
  }
}

/**
 * Automatically lockify function
 * 
 * Convert a lockable function to a lockable function
 * 
 * @param useParams manually specify the lockable has parameters
 * 
 * *NOTE*:
 * lockify not support `lockable` functions that use `arguments` object inside
 * or something like `rest parameter`. Cause we cannot tell whether the function
 * has parmaters list or not. In this case, you should pass another parameter 
 * `useParams` manually
 */
export function lockify<T, P extends any[] = []>(lockable: Lockable<T, P>, useParams?: boolean): Lockified<T, P> {
  const hasParams = !!lockable.length || useParams;

  let lockNoParams: AsyncLock<T> | undefined;
  let locksMap: Map<AsyncLock<T>, P> | undefined;

  // init locks manager
  if (hasParams) {
    locksMap = new Map<AsyncLock<T>, P>();
  }
  else {
    lockNoParams = new AsyncLock<T>();
  }

  const onUnlock = (theLock: AsyncLock<T>) => {
    if (hasParams) {
      locksMap!.delete(theLock);
    }
  };

  const lockified = async (...args: P) => {

    let theLock: AsyncLock<T> | undefined;
    if (hasParams) {
      // if the origin function has params,
      // take the first parameter to compare
      // from exist lock list

      // why?
      // reduce the comparing times

      for (let [lock, lockArgs] of locksMap!.entries()) {
        // if the first parameter is equal
        // do compare the rests
        if (isEqual(lockArgs[0], args[0])) {
          let isEqualFlag = true;

          for (let i = 1; i < args.length; i++) {
            if (!isEqual(lockArgs[i], args[i])) {
              isEqualFlag = false;
              break;
            }
          }
          if (isEqualFlag) {
            theLock = lock;
            break;
          }
        }
      }

      if (!theLock) {
        theLock = new AsyncLock<T>();
        locksMap!.set(theLock, args);
      }
    }
    else {
      theLock = lockNoParams!;
    }

    if (theLock.locked) {
      return theLock.pending!;
    } else {
      theLock.lock();
    }

    const lock = theLock!;

    try {
      const result = await lockable.call(lockable, ...args);
      lock.unlock(result);
      onUnlock(lock);
      return result;
    } catch (error: any) {
      lock.unlock(error, true);
      onUnlock(lock);
      throw error;
    }
  };

  return lockified;
}



