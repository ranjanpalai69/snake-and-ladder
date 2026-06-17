// Runs before any other module. Sets up globals that Next.js 16 expects.
const { AsyncLocalStorage, AsyncResource } = require('async_hooks');
if (!globalThis.AsyncLocalStorage) globalThis.AsyncLocalStorage = AsyncLocalStorage;
if (!globalThis.AsyncResource) globalThis.AsyncResource = AsyncResource;
