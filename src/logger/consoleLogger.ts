/* eslint-disable no-console */
import type { Logger } from './Logger.js';

export const consoleLogger: Logger = {
  debug: (message, context) =>
    context ? console.debug(message, context) : console.debug(message),
  info: (message, context) =>
    context ? console.info(message, context) : console.info(message),
  warn: (message, context) =>
    context ? console.warn(message, context) : console.warn(message),
  error: (message, context) =>
    context ? console.error(message, context) : console.error(message),
};
