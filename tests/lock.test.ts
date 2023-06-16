import { it } from "@jest/globals";
import { describe } from "@jest/globals";
import { Lock } from "../src";
import { expect } from "@jest/globals";
import { AsyncLock } from "../src/lock";
import { jest } from "@jest/globals";
import { beforeEach } from "@jest/globals";

describe('lock basic', () => {

  it('create asyncLock from import', () => {
    expect.assertions(9);
    expect(Lock).toBeTruthy();
    expect(AsyncLock).toBeTruthy();
    const lock = Lock.createAsyncLock();
    expect(lock).toBeInstanceOf(AsyncLock);

    expect(lock.locked).toBeFalsy();
    expect(lock.pending).toBeUndefined();
    lock.lock();
    expect(lock.locked).toBeTruthy();
    expect(lock.pending).toBeInstanceOf(Promise);
    lock.unlock();
    expect(lock.locked).toBeFalsy();
    expect(lock.pending).toBeUndefined();
  });

  it('create lock from Lock class', () => {
    expect.assertions(4);
    expect(Lock).toHaveProperty('createAsyncLock');
    const lock = Lock.createAsyncLock();
    expect(lock).toBeInstanceOf(Lock);
    expect(lock).toBeInstanceOf(AsyncLock);
    expect(lock).toEqual(new AsyncLock());
  });

  it('after unlock resume execute', () => {
    expect.assertions(2);
    const mock = jest.fn();

    const lock = new AsyncLock();
    lock.lock();

    const fn = async () => {
      if (lock.locked) {
        await lock.pending;
      }

      return mock();
    };
    fn();
    expect(mock).not.toBeCalled();
    lock.pending?.then(() => {
      expect(mock).toBeCalled();
    });
    lock.unlock();
  });
});


describe('multiple calls', () => {

  let count = 0;
  let mock: () => any;
  const lock = new AsyncLock();

  const fn = async () => {
    if (lock.locked) {
      return await lock.pending;
    }
    else {
      lock.lock();
    }

    return mock();
  };

  const expectResult = { success: true, count: 1 };

  beforeEach(() => {
    count = 0;
  });

  it('other calls receive equal value', async () => {
    expect.assertions(6);
    mock = jest.fn(() => {
      count++;
      return { success: true, count };
    })

    const result = fn();
    const result2 = fn();
    const result3 = fn();

    expect(mock).toBeCalledTimes(1);
    await expect(result).resolves.toEqual(expectResult)
    lock.unlock(result);

    await expect(result2).resolves.toEqual(expectResult);
    await expect(result3).resolves.toEqual(expectResult);
    expect(count).toBe(1);
    expect(mock).toBeCalledTimes(1);
  });

  it('other calls throw equal error', async () => {
    expect.assertions(6);
    mock = jest.fn(() => {
      count++;
      throw { success: true, count };
    })

    const result = fn();
    const result2 = fn();
    const result3 = fn();

    expect(mock).toBeCalledTimes(1);
    await expect(result).rejects.toEqual(expectResult)
    lock.unlock(result);

    await expect(result2).rejects.toEqual(expectResult);
    await expect(result3).rejects.toEqual(expectResult);
    expect(count).toBe(1);
    expect(mock).toBeCalledTimes(1);
  });
});