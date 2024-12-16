/**
 * Generic wrapper for methods with indexer fallback.
 *
 * @param method - The method to call with fallback behavior.
 * @param context - The context (`this`) of the class instance.
 * @param args - The arguments to pass to the method.
 * @returns The result of the method call.
 */
export async function callMethodWithIndexerFallback(
  method: Function,
  context: any,
  ...args: any[]
) {
  const lastArgs = args[args.length - 1]; // Assume last argument is always `indexer`

  if (typeof lastArgs === 'object' && lastArgs.indexer) {
    try {
      return await method.apply(context, args);
    } catch (e: any) {
      console.warn(`Indexer requests failed: ${e}. Retrying without indexer..`);
      return await method.apply(context, [
        ...args.slice(0, -1),
        {
          ...lastArgs,
          indexer: false,
        },
      ]);
    }
  }
  return await method.apply(context, args);
}

/**
 * This function creates a wrapper for methods that have an indexer parameter.
 * It ensures fallback behavior if indexer fails.
 *
 * @param method - The method to wrap.
 * @returns A function that applies indexer fallback.
 */
export function withIndexerFallback(method: Function) {
  return (...args: any[]) => {
    // @ts-ignore
    return callMethodWithIndexerFallback(method, this, ...args); // Preserve `this` with arrow function
  };
}
