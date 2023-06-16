import isEqual from 'lodash.isequal';
import type { Lockable, Lockified } from './types';
import { AsyncLock } from './lock';

/**
 * Convert a lockable function to a lockified function, locking and unlocking automatically ✨✨.
 *
 * @param lockable A lockable function should return a `Promise`.
 * @param useParams Manually specify whether the `lockable` function has certain parameters list.
 *
 * **NOTE**:
 * - We assume that the lockable function should be a pure function(fn(x) always
 * return y, what means the function has no side effects), so the other waiting
 * calls would return the same result immediately when unlocking instead of re-calling
 * the original `lockable` function.
 *
 * - lockify not support `lockable` functions that use `arguments` object inside
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
        if (lockArgs.length === args.length && isEqual(lockArgs[0], args[0])) {
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
