import { ScallopBuilder } from 'src/models';
import { type SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import {
  Aggregator,
  AggregatorData,
  ObjectParsingHelper,
  // suiQueueCache,
  // QueueData,
  SwitchboardClient,
} from '@switchboard-xyz/sui-sdk';
import { queryMultipleObjects } from 'src/queries';
import { SuiParsedData } from '@mysten/sui/client';
import { toHex } from '@mysten/bcs';

const getFieldsFromObject = (
  response: SuiParsedData | null | undefined
): any => {
  // Check if 'data' and 'content' exist and are of the expected type
  if (response && response.dataType === 'moveObject') {
    // Safely return 'fields' from 'content'
    return response.fields as any;
  }

  throw new Error('Invalid response data');
};

const parseFeedConfigs = (responses: SuiParsedData[]): AggregatorData[] => {
  return responses.map(getFieldsFromObject).map((aggregatorData) => {
    const currentResult = (aggregatorData.current_result as any).fields;
    const updateState = (aggregatorData.update_state as any).fields;

    // build the data object
    const data: AggregatorData = {
      id: ObjectParsingHelper.asId(aggregatorData.id),
      authority: ObjectParsingHelper.asString(aggregatorData.authority),
      createdAtMs: ObjectParsingHelper.asNumber(aggregatorData.created_at_ms),
      currentResult: {
        maxResult: ObjectParsingHelper.asBN(currentResult.max_result),
        maxTimestamp: ObjectParsingHelper.asNumber(
          currentResult.max_timestamp_ms
        ),
        mean: ObjectParsingHelper.asBN(currentResult.mean),
        minResult: ObjectParsingHelper.asBN(currentResult.min_result),
        minTimestamp: ObjectParsingHelper.asNumber(
          currentResult.min_timestamp_ms
        ),
        range: ObjectParsingHelper.asBN(currentResult.range),
        result: ObjectParsingHelper.asBN(currentResult.result),
        stdev: ObjectParsingHelper.asBN(currentResult.stdev),
      },
      feedHash: toHex(
        ObjectParsingHelper.asUint8Array(aggregatorData.feed_hash)
      ),
      maxStalenessSeconds: ObjectParsingHelper.asNumber(
        aggregatorData.max_staleness_seconds
      ),
      maxVariance: ObjectParsingHelper.asNumber(aggregatorData.max_variance),
      minResponses: ObjectParsingHelper.asNumber(aggregatorData.min_responses),
      minSampleSize: ObjectParsingHelper.asNumber(
        aggregatorData.min_sample_size
      ),
      name: ObjectParsingHelper.asString(aggregatorData.name),
      queue: ObjectParsingHelper.asString(aggregatorData.queue),
      updateState: {
        currIdx: ObjectParsingHelper.asNumber(updateState.curr_idx),
        results: updateState.results.map((r: any) => {
          const oracleId = r.fields.oracle;
          const value = ObjectParsingHelper.asBN(r.fields.result.fields);
          const timestamp = parseInt(r.fields.timestamp_ms);
          return {
            oracle: oracleId,
            value,
            timestamp,
          };
        }),
      },
    };

    return data;
  });
};

// const parseQueueAddresses = async (
//   cache: ScallopCache,
//   queueAddresses: string[]
// ): Promise<void> => {
//   const queueParsedDatas = (
//     await queryMultipleObjects(cache, queueAddresses)
//   ).map((q) => getFieldsFromObject(q.content));

//   // Get the existing_oracles table ids
//   const existingOracleTableIds = queueParsedDatas.map((q: any) => {
//     return q.existing_oracles.fields.id.id;
//   });

//   for (let i = 0; i < existingOracleTableIds.length; i++) {
//     const parentId = existingOracleTableIds[i];
//     const queueAddress = queueAddresses[i];
//     const queueResponse = queueParsedDatas[i];
//     const queueCachedData = await suiQueueCache.get(queueAddress);
//     if (queueCachedData) {
//       return queueCachedData;
//     }

//     let cursor = null;
//     let nextPage = true;

//     const existingOraclesIds = [];
//     while (nextPage) {
//       const resp = await cache.queryGetDynamicFields({
//         parentId,
//         limit: 25,
//         cursor,
//       });

//       if (!resp) break;
//       const { nextCursor, data, hasNextPage } = resp;
//       nextPage = hasNextPage;
//       cursor = nextCursor;

//       existingOraclesIds.push(...data.map((t) => t.objectId));
//     }

//     const existingOracles = await queryMultipleObjects(
//       cache,
//       existingOraclesIds
//     ).then((res) => {
//       return res.map((t) => {
//         const fields: any = getFieldsFromObject(t.content);
//         return {
//           oracleId: ObjectParsingHelper.asString(fields.value.fields.oracle_id),
//           oracleKey: toBase58(
//             ObjectParsingHelper.asUint8Array(fields.value.fields.oracle_key)
//           ),
//         };
//       });
//     });

//     const queueData = {
//       authority: ObjectParsingHelper.asString(queueResponse.authority),
//       existingOracles,
//       // get fee number (though encoded as string)
//       fee: ObjectParsingHelper.asNumber(queueResponse.fee),

//       // fee recipient address
//       feeRecipient: ObjectParsingHelper.asString(queueResponse.fee_recipient),

//       // accepted fee coin types
//       feeTypes: ObjectParsingHelper.asArray(queueResponse.fee_types).map(
//         (ft: any) => ft.fields.name
//       ),

//       // guardian queue id
//       guardianQueueId: ObjectParsingHelper.asString(
//         queueResponse.guardian_queue_id
//       ),

//       // queue id
//       id: ObjectParsingHelper.asId(queueResponse.id),

//       // last queue override ms
//       lastQueueOverrideMs: ObjectParsingHelper.asNumber(
//         queueResponse.last_queue_override_ms
//       ),

//       // minimum attestations
//       minAttestations: ObjectParsingHelper.asNumber(
//         queueResponse.min_attestations
//       ),

//       // queue name
//       name: ObjectParsingHelper.asString(queueResponse.name),
//       oracleValidityLengthMs: ObjectParsingHelper.asNumber(
//         queueResponse.oracle_validity_length_ms
//       ),

//       // get source queue key
//       queueKey: toBase58(
//         ObjectParsingHelper.asUint8Array(queueResponse.queue_key) as Uint8Array
//       ),
//     } as QueueData;

//     suiQueueCache.set(queueAddress, queueData);
//   }
// };

export const updateSwitchboardAggregators = async (
  builder: ScallopBuilder,
  assetCoinNames: string[],
  txBlock: SuiKitTxBlock,
  solanaRPCUrl: string = 'https://crossbar.switchboard.xyz/rpc/mainnet'
) => {
  const switchboardClient = new SwitchboardClient(builder.suiKit.client());
  const onDemandAggObjects = await queryMultipleObjects(
    builder.cache,
    await builder.query.getSwitchboardOnDemandAggregatorObjectIds(
      assetCoinNames
    )
  );

  const feedConfigs = parseFeedConfigs(
    onDemandAggObjects.map((t) => t.content) as SuiParsedData[]
  );

  // Get queue addresses
  // const queueAddresses = feedConfigs.map((fc) => fc.queue);

  // await parseQueueAddresses(builder.cache, queueAddresses);

  for (let idx = 0; idx < assetCoinNames.length; idx++) {
    // console.log({ coinName: assetCoinNames[idx] });
    const switchboardAgg = new Aggregator(
      switchboardClient,
      onDemandAggObjects[idx].objectId
    );

    const { responses, failures } = await switchboardAgg.fetchUpdateTx(
      txBlock.txBlock,
      {
        feedConfigs: feedConfigs[idx],
        solanaRPCUrl,
      }
    );

    console.log({ responses, failures });
    if (failures.length > 0) {
      throw new Error(
        `Failed to update aggregator for ${assetCoinNames[idx]}: ${failures.join(',')}`
      );
    }
  }
  return;
};
