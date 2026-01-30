/**
 * Preload script to avoid "Illegal constructor" when running Payload CLI
 * (payload generate:importmap) with undici. Undici's index.js does
 * `new CacheStorage()` at load time, which throws in Node. This patches
 * require('undici') to return a minimal mock so the CLI can load without
 * actually using fetch.
 */
const Module = require('module');
const originalRequire = Module.prototype.require;

const undiciMock = {
  fetch: typeof globalThis.fetch === 'function' ? globalThis.fetch : undefined,
  Agent: class Agent {},
  // Minimal exports so code that destructures undici doesn't break
  request: () => {},
  FormData: typeof FormData !== 'undefined' ? FormData : class FormData {},
  Headers: typeof Headers !== 'undefined' ? Headers : class Headers {},
  Response: typeof Response !== 'undefined' ? Response : class Response {},
  Request: typeof Request !== 'undefined' ? Request : class Request {},
};

Module.prototype.require = function (id) {
  if (id === 'undici') {
    return undiciMock;
  }
  return originalRequire.apply(this, arguments);
};
