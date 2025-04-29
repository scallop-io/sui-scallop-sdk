// import { ObjectOwner, SuiObjectData } from '@mysten/sui/client';

// const parseOwnerAddress = (owner: ObjectOwner | null | undefined): string => {
//   const notSupportedOwner =
//     !owner ||
//     typeof owner === 'string' ||
//     (typeof owner === 'object' &&
//       ('Shared' in owner || 'ConsensusV2' in owner));
//   if (notSupportedOwner)
//     throw new Error('Owner not supported (ConsensusV2 or Shared or Immutable)');

//   if ('AddressOwner' in owner) {
//     return owner.AddressOwner;
//   } else {
//     return owner.ObjectOwner;
//   }
// };

// export const getObjectOwner = async (
//   cache: ScallopCache,
//   object: string | SuiObjectData
// ) => {
//   if (typeof object === 'object') {
//     return parseOwnerAddress(object.owner);
//   }

//   const objResponse = await cache.queryGetObject(object, {
//     showOwner: true,
//   });

//   return parseOwnerAddress(objResponse.data?.owner);
// };
