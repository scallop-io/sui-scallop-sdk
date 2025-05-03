import { MAX_LOCK_DURATION } from 'src/constants';
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

export const partitionArray = <T>(array: T[], chunkSize: number) => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};
