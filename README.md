# Async

[![Build Status](https://travis-ci.com/dxos/async.svg?branch=master)](https://travis-ci.com/dxos/async)
[![Coverage Status](https://coveralls.io/repos/github/dxos/async/badge.svg?branch=master)](https://coveralls.io/github/dxos/async?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/dxos/async.svg)](https://greenkeeper.io/)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

## Install

```
$ npm install @dxos/async
```

## Usage

```javascript
import async from '@dxos/async';

const test = async () => {
  const [getValue, setValue] = trigger();
  
  setTimeout(() => {
    setValue(100);
  }, 1000);

  const value = await getValue();
  expect(value).toBe(100);
};
```

## Contributing

PRs accepted.

## License

GPL-3.0 © DxOS
