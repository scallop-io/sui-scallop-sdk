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
      console.warn(
        `Indexer requests failed: ${e.message}. Retrying without indexer..`
      );
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

import { SuiTxBlock } from '@scallop-io/sui-kit';
import { MAX_LOCK_DURATION } from 'src/constants/vesca';
// import { ScallopConstants } from 'src/models/scallopConstants';

/**
 * Find the closest unlock round timestamp (12AM) to the given unlock at timestamp in seconds.
 *
 * @param unlockAtInSecondTimestamp - Unlock at in seconds timestamp to find the closest round.
 * @returns Closest round (12AM) in seconds timestamp.
 */
export const findClosestUnlockRound = (unlockAtInSecondTimestamp: number) => {
  const unlockDate = new Date(unlockAtInSecondTimestamp * 1000);
  const closestTwelveAM = new Date(unlockAtInSecondTimestamp * 1000);

  closestTwelveAM.setUTCHours(0, 0, 0, 0); // Set the time to the next 12 AM UTC

  // If the current time is past 12 AM, set the date to the next day
  if (unlockDate.getUTCHours() >= 0) {
    closestTwelveAM.setUTCDate(closestTwelveAM.getUTCDate() + 1);
  }

  const now = new Date().getTime();
  // check if unlock period > 4 years
  if (closestTwelveAM.getTime() - now > MAX_LOCK_DURATION * 1000) {
    closestTwelveAM.setUTCDate(closestTwelveAM.getUTCDate() - 1);
  }
  return Math.floor(closestTwelveAM.getTime() / 1000);
};

export const parseUrl = (url: string) => {
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
};

/**
 * Check and get the sender from the transaction block.
 *
 * @param txBlock - TxBlock created by SuiKit.
 * @return Sender of transaction.
 */
export const requireSender = (txBlock: SuiTxBlock) => {
  const sender = txBlock.blockData.sender;
  if (!sender) {
    throw new Error('Sender is required');
  }
  return sender;
};
