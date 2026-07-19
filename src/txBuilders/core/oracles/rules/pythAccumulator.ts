// /**
//  * Minimal parser/slicer for Pyth "accumulator update" payloads (magic `PNAU`,
//  * WormholeMerkle variant). Layout:
//  *
//  *   'PNAU' | major(1) | minor(1) | trailingHdrLen(1) | trailing(trailingHdrLen)
//  *   updateType(1)                                  // 0 = WormholeMerkle
//  *   vaaLen(u16 BE) | vaa(vaaLen)                   // carries ONE merkle root
//  *   numUpdates(1)
//  *     repeated: msgLen(u16 BE) | message(msgLen) | proofDepth(1) | proof(depth*20)
//  *
//  * Each feed's message carries its own merkle proof against the single root in
//  * the VAA, so a subset can be carved out losslessly: keep the header + VAA, keep
//  * only the wanted feeds' (message + proof), and rewrite `numUpdates`. The result
//  * verifies on-chain against the same root. No re-hashing or re-signing needed.
//  */

// const PNAU_MAGIC = Buffer.from('PNAU');
// const HASH_SIZE = 20; // keccak-160 node/proof hash width

// /** Feed id as stored in a price message: 32 bytes, lowercase hex, no `0x`. */
// export const normalizeFeedId = (feedId: string): string =>
//   feedId.replace(/^0x/, '').toLowerCase();

// /** The 32-byte feed id lives at message[1..33] (message[0] is the message type). */
// export const feedIdOf = (message: Buffer): string =>
//   message.subarray(1, 33).toString('hex');

// export type ParsedPythUpdate = {
//   message: Buffer;
//   proofDepth: number;
//   proof: Buffer;
// };

// export type ParsedPythAccumulator = {
//   /** Bytes from magic through the updateType byte (inclusive) — copied verbatim. */
//   header: Buffer;
//   /** The Wormhole VAA carrying the merkle root; shared by every feed. */
//   vaa: Buffer;
//   updates: ParsedPythUpdate[];
// };

// export const parsePythAccumulatorUpdate = (
//   buf: Buffer
// ): ParsedPythAccumulator => {
//   if (!buf.subarray(0, 4).equals(PNAU_MAGIC)) {
//     throw new Error('not a Pyth accumulator update (missing PNAU magic)');
//   }
//   let offset = 4;
//   offset += 2; // major, minor
//   const trailingHdrLen = buf[offset++];
//   offset += trailingHdrLen;
//   const updateType = buf[offset++];
//   if (updateType !== 0) {
//     throw new Error(`unsupported Pyth accumulator update type: ${updateType}`);
//   }
//   const header = buf.subarray(0, offset); // magic..updateType inclusive

//   const vaaLen = buf.readUInt16BE(offset);
//   offset += 2;
//   const vaa = buf.subarray(offset, offset + vaaLen);
//   offset += vaaLen;

//   const numUpdates = buf[offset++];
//   const updates: ParsedPythUpdate[] = [];
//   for (let i = 0; i < numUpdates; i++) {
//     const msgLen = buf.readUInt16BE(offset);
//     offset += 2;
//     const message = buf.subarray(offset, offset + msgLen);
//     offset += msgLen;
//     const proofDepth = buf[offset++];
//     const proof = buf.subarray(offset, offset + proofDepth * HASH_SIZE);
//     offset += proofDepth * HASH_SIZE;
//     updates.push({ message, proofDepth, proof });
//   }
//   return { header, vaa, updates };
// };

// /**
//  * Carve a full accumulator update down to just `feedIds`, preserving the shared
//  * VAA/merkle root. Feed ids may be given with or without a `0x` prefix and in
//  * any case. Feeds not present in the update are silently skipped; passing an
//  * empty/no-match set yields a valid update with `numUpdates = 0`.
//  */
// export const slicePythAccumulatorUpdate = (
//   fullUpdate: Buffer,
//   feedIds: string[]
// ): Buffer => {
//   const wanted = new Set(feedIds.map(normalizeFeedId));
//   const { header, vaa, updates } = parsePythAccumulatorUpdate(fullUpdate);
//   const picked = updates.filter((u) => wanted.has(feedIdOf(u.message)));

//   const vaaLen = Buffer.alloc(2);
//   vaaLen.writeUInt16BE(vaa.length);
//   const parts: Buffer[] = [header, vaaLen, vaa, Buffer.from([picked.length])];
//   for (const { message, proofDepth, proof } of picked) {
//     const msgLen = Buffer.alloc(2);
//     msgLen.writeUInt16BE(message.length);
//     parts.push(msgLen, message, Buffer.from([proofDepth]), proof);
//   }
//   return Buffer.concat(parts);
// };
