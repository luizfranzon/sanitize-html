// Our own diagnostics. A console-shaped `logger` option takes them instead of
// the console; missing methods fall back to it.
const severities = [ 'debug', 'info', 'warn', 'error' ];

export function loggerFor(options) {
  const source = (options && options.logger) || console;
  const logger = {};
  for (const severity of severities) {
    logger[severity] = typeof source[severity] === 'function'
      ? (...args) => source[severity](...args)
      : (...args) => console[severity](...args);
  }
  return logger;
}
