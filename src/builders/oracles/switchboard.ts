import { ScallopBuilder } from 'src/models';
import {
  // SUI_CLOCK_OBJECT_ID,
  // SUI_TYPE_ARG,
  type SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import {
  Aggregator,
  AggregatorData,
  ObjectParsingHelper,
  // AggregatorData,
  // FeedEvalResponse,
  // ObjectParsingHelper,
  // Queue,
  SwitchboardClient,
} from '@switchboard-xyz/sui-sdk';
import { queryMultipleObjects } from 'src/queries';
import { MoveValue, SuiParsedData } from '@mysten/sui/client';
import { toHex } from '@mysten/bcs';
// import { CrossbarClient, IOracleJob, OracleJob } from '@switchboard-xyz/common';
// import axios from 'axios';

const getFieldsFromObject = (
  response: SuiParsedData
): {
  [key: string]: MoveValue;
} => {
  // Check if 'data' and 'content' exist and are of the expected type
  if (response.dataType === 'moveObject') {
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

// const encodeJobs = (jobArray: OracleJob[]) => {
//   return jobArray.map((job) => serializeOracleJob(job).toString('base64'));
// };

// const normalizeOracleJob = (
//   data: string | IOracleJob | Record<string, any>
// ): OracleJob => {
//   const parseJobObject = (jobData: Record<string, any>) => {
//     if (!jobData) {
//       throw new Error(`No job data provided: ${jobData}`);
//     } else if (!('tasks' in jobData)) {
//       throw new Error('"tasks" property is required');
//     } else if (!(Array.isArray(jobData.tasks) && jobData.tasks.length > 0)) {
//       throw new Error('"tasks" property must be a non-empty array');
//     }
//     return OracleJob.fromObject(jobData);
//   };
//   const parseJobString = (jobString: string) => {
//     // Strip comments using regex from https://regex101.com/r/B8WkuX/1
//     const cleanJson = jobString.replace(
//       /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/g,
//       ''
//     );
//     return parseJobObject(JSON.parse(cleanJson));
//   };
//   return typeof data === 'string' ? parseJobString(data) : parseJobObject(data);
// };

// const serializeOracleJob = (
//   data: string | IOracleJob | Record<string, any>
// ): Buffer => {
//   const job = normalizeOracleJob(data);
//   return Buffer.from(OracleJob.encodeDelimited(job).finish());
// };

// const fetchSignatures = async (
//   feedConfig: AggregatorData
// ): Promise<{
//   responses: FeedEvalResponse[];
//   failures: string[];
// }> => {
//   const crossbarClient = new CrossbarClient('https://crossbar.switchboard.xyz');

//   const jobs: OracleJob[] = await crossbarClient
//     .fetch(feedConfig.feedHash)
//     .then((res) => res.jobs.map((job) => OracleJob.fromObject(job)));

//   const encodedJobs = encodeJobs(jobs);
//   const maxVariance = Math.floor(feedConfig.maxVariance / 1e9) * 1e9;
//   const minResponses = feedConfig.minResponses;
//   const numSignatures = feedConfig.minSampleSize;
//   const recentHash = toBase58(new Uint8Array(32));
//   const useTimestamp = true;

//   const GATEWAY_URL = 'https://api.mainnet-beta.solana.com';
//   const TIMEOUT = 10000;
//   const url = `${GATEWAY_URL}/gateway/api/v1/fetch_signatures`;
//   const headers = { 'Content-Type': 'application/json' };

//   const body = JSON.stringify({
//     api_version: '1.0.0',
//     jobs_b64_encoded: encodedJobs,
//     recent_chainhash: recentHash,
//     signature_scheme: 'Secp256k1',
//     hash_scheme: 'Sha256',
//     num_oracles: numSignatures,
//     max_variance: maxVariance,
//     min_responses: minResponses,
//     use_timestamp: useTimestamp,
//   });

//   return await axios
//     .post(url, body, {
//       headers,
//       timeout: TIMEOUT,
//     })
//     .then((r) => r.data);
// };

export const updateSwitchboardAggregators = async (
  builder: ScallopBuilder,
  assetCoinNames: string[],
  txBlock: SuiKitTxBlock
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

  for (const idx in assetCoinNames) {
    // const { switchboardAddress, oracleQueueId } =
    //   await switchboardClient.fetchState();

    // const feedConfig = feedConfigs[idx];

    // const suiQueue = await new Queue(
    //   switchboardClient,
    //   oracleQueueId
    // ).loadData();

    // const { responses, failures } = await fetchSignatures(feedConfig);
    // const validOracles = new Set(
    //   suiQueue.existingOracles.map((o) => o.oracleKey)
    // );

    // const validResponses = responses.filter((r) => {
    //   return validOracles.has(toBase58(fromHex(r.oracle_pubkey)));
    // });

    // // if we have no valid responses (or not enough), fail out
    // if (
    //   !validResponses.length ||
    //   validResponses.length < feedConfig.minSampleSize
    // ) {
    //   // maybe retry by recursing into the same function / add a retry count
    //   throw new Error('Not enough valid oracle responses.');
    // }

    // // split the gas coin into the right amount for each response
    // const coins = txBlock.splitCoins(
    //   txBlock.gas,
    //   validResponses.map(() => suiQueue.fee)
    // );

    // // map the responses into the tx
    // validResponses.forEach((response, i) => {
    //   const oracle = suiQueue.existingOracles.find(
    //     (o) => o.oracleKey === toBase58(fromHex(response.oracle_pubkey))
    //   )!;

    //   const signature = Array.from(fromBase64(response.signature));
    //   signature.push(response.recovery_id);

    //   txBlock.moveCall(
    //     `${switchboardAddress}::aggregator_submit_result_action::run`,
    //     [
    //       txBlock.object(onDemandAggObjects[idx].objectId),
    //       txBlock.object(suiQueue.id),
    //       txBlock.pure.u128(response.success_value),
    //       txBlock.pure.bool(response.success_value.startsWith('-')),
    //       txBlock.pure.u64(response.timestamp!),
    //       txBlock.object(oracle.oracleId),
    //       txBlock.pure.vector('u8', signature),
    //       txBlock.sharedObjectRef({
    //         objectId: SUI_CLOCK_OBJECT_ID,
    //         initialSharedVersion: '1',
    //         mutable: false,
    //       }),
    //       coins[i],
    //     ],
    //     [SUI_TYPE_ARG]
    //   );
    // });

    // return { responses, failures };

    const switchboardAgg = new Aggregator(
      switchboardClient,
      onDemandAggObjects[idx].objectId
    );

    const { responses, failures } = await switchboardAgg.fetchUpdateTx(
      txBlock.txBlock,
      {
        feedConfigs: feedConfigs[idx],
      }
    );

    return { responses, failures };
  }
};
