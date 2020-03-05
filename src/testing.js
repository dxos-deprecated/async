//
// Copyright 2020 DxOS
//

/**
 * Wrapper for async jest tests.
 * @param {Function} test - Async test
 * @param errType
 * @return {Promise<void>}
 */
export const expectToThrow = async (test, errType = Error) => {
  let thrown;
  try {
    await test();
  } catch (err) {
    thrown = err;
  }

  expect(thrown).toBeInstanceOf(errType);
};
