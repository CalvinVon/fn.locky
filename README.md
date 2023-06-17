# fn.locky

Lock utils for asynchronous function to **avoid concurrent calls**.

[![npm](https://img.shields.io/npm/v/fn.locky)](https://www.npmjs.com/package/fn.locky)
![npm](https://img.shields.io/npm/dt/fn.locky)
![Codecov](https://img.shields.io/codecov/c/github/CalvinVon/fn.locky)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/fn.locky)
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/CalvinVon/fn.locky/node.js.yml)

- ✨ Written in **TypeScript**
- ✨ Lock/unlock **automatically**
- ✨ **100%** **Tests** coverage
- ✨ Support **Tree-Shaking**
- ✨ **732 B + 5.4 KB** gzip *([subpath import](#subpath-import))*

## Install

```bash
npm i fn.locky -S
```

## Usage

This package contains two useful tools:

- **AsyncLock**: A semantic encapsulation based on `Promise`, controls the function execution flow manually.
- **lockify**: A higher-order function, for adding lock protection to the functions, fully automatic locking and unlocking

### Basic usage

use `AsyncLock` in functions

```ts
import { Lock, AsyncLock } from "fn.locky";
// create
const lock = Lock.createAsyncLock();
// or
const lock = new AsyncLock();

// lock
lock.lock();

// inside the function
// judge status to wait or continue
if (lock.locked) {
  // waiting util unlock
  await lock.pending;
}
console.log('done');

// outside the function
// unlock
lock.unlock(); // log 'done'
```

### Advanced usage ✨✨

**`lockify`**

Convert a `lockable` function to a `lockified` function, manage locking and unlocking **automatically**.

> Yep, we do distinguish between different function parameters, see these test cases for details

```ts
import { lockify } from "fn.locky";

let count = 0;
const asyncFn = (param1, param2) =>
  new Promise((resolve) => {
    // mock request
    setTimeout(() => {
      // do something with param1 and param2
      resolve({ success: true, count: count++ }); // auto unlock the (inner) lock
    }, 1000);
  });

const lockified = lockify(asyncFn);

// concurrent calls
const result_1 = lockified();
const result_2 = lockified();
const result_3 = lockified();

// after first call resolves:
// count: 1
// result_1, result_2, result_3: { success: true, count: 1 }
```

> **NOTICE**:
>
> - We assume that the lockable function should be a pure function( fn(x) always
return y, what means the function has no side effects ), so the other waiting
calls would return the same result immediately when unlocking instead of re-calling
the original `lockable` function.
> - lockify not support `lockable` functions that use `arguments` object inside
or something like `rest parameter`. Cause we cannot tell whether the function
has parmaters list or not. In this case, you should pass another parameter
`useParams` manually

### subpath-import

You can only import `Lock` class, it only costs **732 B** !

> **Additions**: You may set `moduleResolution` field to `node16`/`nodenext` in your `tsconfig.json`, see [here](https://www.typescriptlang.org/tsconfig#moduleResolution).

```ts
import { Lock, AsyncLock } from "fn.locky/lock";
import { lockify } from "fn.locky/lockify";
```