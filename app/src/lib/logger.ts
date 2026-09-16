const isDev = process.env.NODE_ENV !== 'production';

/**
 * Thin console wrapper: log/warn are silenced in production (client and
 * server), error always goes through so production issues stay visible.
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
