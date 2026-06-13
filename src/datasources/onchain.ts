import type { SuiClientTypes } from '@mysten/sui/client';

const _METHODS = [
  'getObjects',
  'listOwnedObjects',
  'listCoins',
  'listDynamicFields',
  'getDynamicField',
  'getBalance',
  'listBalances',
  'getCoinMetadata',
  'getTransaction',
  'getReferenceGasPrice',
  'getCurrentSystemState',
  'getProtocolConfig',
  'getChainIdentifier',
  'defaultNameServiceName',
  'getMoveFunction',
  'simulateTransaction',
] as const satisfies readonly (keyof SuiClientTypes.TransportMethods)[];

type OnChainDataSourceClient = Pick<
  SuiClientTypes.TransportMethods,
  (typeof _METHODS)[number]
>;

type OnChainDataSourceParams = {
  client: OnChainDataSourceClient;
  url: string;
};

export class OnChainDataSource {
  public readonly client: OnChainDataSourceClient;
  public readonly url: string;

  constructor({ client, url }: OnChainDataSourceParams) {
    this.client = client;
    this.url = url;
  }

  async getObject<Include extends SuiClientTypes.ObjectInclude = {}>(
    options: SuiClientTypes.GetObjectOptions<Include>
  ): Promise<SuiClientTypes.GetObjectResponse<Include>> {
    const { objectId } = options;
    const {
      objects: [result],
    } = await this.client.getObjects({
      objectIds: [objectId],
      signal: options.signal,
      include: options.include,
    });
    if (result instanceof Error) {
      throw result;
    }
    return { object: result };
  }
}
