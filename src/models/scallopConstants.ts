import { PoolAddress, Whitelist } from 'src/types';
import ScallopAddress, { ScallopAddressParams } from './scallopAddress';
import { NetworkType, parseStructTag } from '@scallop-io/sui-kit';
import { queryKeys } from 'src/constants';

const isEmptyObject = (obj: object) => {
  return Object.keys(obj).length === 0;
};

type CoinName = string;
type CoinType = string;
type SCoinType = string;
type OldMarketCoinType = string;

/**
 *  @description `scallop_sui`, `scallop_usdt`, etc (parsed directly from coin type, ex: `0x...::scallop_sui::SCALLOP_SUI`)
 */
type SCoinRawName = string;

/**
 * @description `ssui`, `susdc`, etc..
 */
type SCoinName = string;

export type ScallopConstantsParams = {
  poolAddressesApiUrl?: string;
  whitelistApiUrl?: string;
  forcePoolAddressInterface?: Record<string, PoolAddress>;
  forceWhitelistInterface?: Whitelist | Record<string, any>;
  defaultValues?: {
    poolAddresses?: Record<string, PoolAddress>;
    whitelist?: Whitelist | Record<string, any>;
  };
} & ScallopAddressParams;

const DEFAULT_WHITELIST = {
  lending: new Set(),
  borrowing: new Set(),
  collateral: new Set(),
  packages: new Set(),
  scoin: new Set(),
  spool: new Set(),
  borrowIncentiveRewards: new Set(),
  rewardsAsPoint: new Set(),
  suiBridge: new Set(),
  wormhole: new Set(),
  oracles: new Set(),
  pythEndpoints: new Set(),
  deprecated: new Set(),
  emerging: new Set(),
} as Whitelist;

const parseWhitelistParams = (params: Record<string, any> | Whitelist) => {
  return Object.entries(params)
    .filter(
      ([_, value]) => !!value && (Array.isArray(value) || value instanceof Set)
    )
    .reduce((acc, [key, value]) => {
      acc[key as keyof typeof DEFAULT_WHITELIST] =
        value instanceof Set ? value : new Set(value);
      return acc;
    }, {} as Whitelist);
};

class ScallopConstants extends ScallopAddress {
  private _poolAddresses: Record<string, PoolAddress | undefined> = {};
  private _whitelist: Whitelist = DEFAULT_WHITELIST;

  /**
   * @description coin names to coin decimal map
   */
  public coinDecimals: Record<CoinName, number | undefined> = {};
  public coinNameToOldMarketCoinTypeMap: Record<
    CoinName,
    OldMarketCoinType | undefined
  > = {};
  public scoinRawNameToSCoinNameMap: Record<
    SCoinRawName,
    SCoinName | undefined
  > = {};
  public scoinTypeToSCoinNameMap: Record<SCoinType, SCoinName | undefined> = {};
  public wormholeCoinTypeToCoinNameMap: Record<CoinType, CoinName | undefined> =
    {};
  public voloCoinTypeToCoinNameMap: Record<CoinType, CoinName | undefined> = {};
  public suiBridgeCoinTypeToCoinNameMap: Record<
    CoinType,
    CoinName | undefined
  > = {};

  /**
   * @description coin names to coin types map
   */
  public coinTypes: Record<CoinName, CoinType | undefined> = {};

  /**
   * @description scoin names to scoin types map
   */
  public sCoinTypes: Record<SCoinName, SCoinType | undefined> = {};
  public coinTypeToCoinNameMap: Record<CoinType, CoinName | undefined> = {};

  /**
   * @description Supported borrow incentive reward coin names
   */
  public supportedBorrowIncentiveRewards: Set<CoinName> = new Set();

  constructor(public readonly params: ScallopConstantsParams = {}) {
    super(params);
  }

  get protocolObjectId() {
    return (
      (this.get('core.object') as string | undefined) ??
      ('0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf' as const)
    );
  }

  get isInitialized() {
    const REQUIRED_WHITELIST_KEYS = [
      'lending',
      'collateral',
      'borrowing',
      'packages',
      'scoin',
      'spool',
      'oracles',
      'pythEndpoints',
      'emerging',
    ] as const;
    return (
      this.isAddressInitialized() && // address is initialized
      !isEmptyObject(this.poolAddresses) && // poolAddresses is initialized
      REQUIRED_WHITELIST_KEYS.every((t) => this.whitelist[t].size > 0) // whitelist is initialized
    );
  }

  get whitelist() {
    return new Proxy(this._whitelist, {
      get: (target, key: keyof Whitelist) => {
        return target[key] ?? DEFAULT_WHITELIST[key];
      },
    });
  }

  get poolAddresses() {
    return new Proxy(this._poolAddresses, {
      get: (target, key: string) => {
        return target[key] ?? undefined;
      },
    });
  }

  get defaultValues() {
    return this.params.defaultValues;
  }

  private isAddressInitialized({
    networkType = 'mainnet',
  }: {
    networkType?: NetworkType;
  } = {}) {
    const addresses = this.getAddresses(networkType);
    return !!addresses && !isEmptyObject(addresses);
  }

  parseToOldMarketCoin(coinType: string) {
    return `${this.protocolObjectId}::reserve::MarketCoin<${coinType}>`;
  }

  async init({
    networkType = 'mainnet',
    force = false,
    addressId,
    constantsParams = this.params,
  }: {
    networkType?: NetworkType;
    force?: boolean;
    addressId?: string;
    constantsParams?: Partial<ScallopConstantsParams>;
  } = {}) {
    // check if scallop address is initialized
    const addresses = this.getAddresses(networkType);
    if (!addresses || Object.keys(addresses).length === 0 || force) {
      await this.read(addressId); // ScallopAddress read()
    }

    // Initialization function
    if (constantsParams.forcePoolAddressInterface) {
      this._poolAddresses = constantsParams.forcePoolAddressInterface;
    }

    if (constantsParams.forceWhitelistInterface) {
      this._whitelist = parseWhitelistParams(
        constantsParams.forceWhitelistInterface
      );
    }

    if (this.isInitialized && !force) {
      this.initConstants();
      return;
    }

    const [whitelistResponse, poolAddressesResponse] = await Promise.all([
      this.readWhiteList(),
      this.readPoolAddresses(),
    ]);

    if (!this.params.forceWhitelistInterface) {
      this._whitelist = Object.keys(this._whitelist).reduce(
        (acc, key: unknown) => {
          const whiteListKey = key as keyof Whitelist;
          const whiteListValue = whitelistResponse[whiteListKey];
          acc[whiteListKey] =
            whiteListValue instanceof Set
              ? whiteListValue
              : Array.isArray(whiteListValue)
                ? new Set(whiteListValue)
                : new Set();
          return acc;
        },
        {} as Whitelist
      );
    }

    if (!this.params.forcePoolAddressInterface) {
      this._poolAddresses = Object.fromEntries(
        Object.entries(poolAddressesResponse)
          .filter(([key]) =>
            Object.values(this._whitelist).some((set) => set.has(key))
          )
          .map(([key, value]) => {
            const parsedValue = Object.fromEntries(
              Object.entries(value).map(([k, v]) => [
                k,
                typeof v === 'boolean' ? (v ?? false) : v || undefined,
              ])
            );
            return [key, parsedValue as PoolAddress];
          })
      );
    }
    this.initConstants();
  }

  private initConstants() {
    this.coinDecimals = Object.fromEntries([
      ...Object.entries(this.poolAddresses)
        .filter(([_, value]) => !!value)
        .map(([key, value]) => [key, value!.decimals]),
      ...Object.entries(this.poolAddresses)
        .filter(([_, value]) => !!value?.sCoinName)
        .map(([_, value]) => [value!.sCoinName, value!.decimals]),
    ]);

    this.coinTypes = Object.fromEntries([
      ...Object.entries(this.poolAddresses)
        .filter(([_, value]) => !!value)
        .map(([key, value]) => [key, value?.coinType]),
      ...Object.entries(this.poolAddresses)
        .filter(([_, value]) => !!value && value.sCoinName && value.sCoinType)
        .map(([_, value]) => [value!.sCoinName, value!.sCoinType]),
    ]);

    this.coinTypeToCoinNameMap = Object.fromEntries(
      Object.entries(this.coinTypes).map(([key, val]) => [val, key])
    );

    this.wormholeCoinTypeToCoinNameMap = Object.fromEntries(
      Object.entries(this.poolAddresses)
        .filter(([key, value]) => !!value && this.whitelist.wormhole.has(key))
        .map(([_, value]) => [value!.coinType, value!.coinName])
    );

    this.coinNameToOldMarketCoinTypeMap = Object.fromEntries(
      Object.entries(this.poolAddresses)
        .filter(([_, value]) => !!value)
        .map(([_, value]) => [
          value!.coinName,
          this.parseToOldMarketCoin(value!.coinType),
        ])
    );

    this.scoinRawNameToSCoinNameMap = Object.fromEntries(
      Object.entries(this.poolAddresses)
        .filter(([_, value]) => !!value && value.sCoinType && value.sCoinName)
        .map(([_, value]) => {
          const scoinRawName = parseStructTag(value!.sCoinType!).name;
          return [scoinRawName, value!.sCoinName!];
        })
    );

    this.scoinTypeToSCoinNameMap = Object.fromEntries(
      Object.entries(this.poolAddresses)
        .filter(([_, value]) => !!value && value.sCoinType && value.sCoinName)
        .map(([_, value]) => [value!.sCoinType!, value!.sCoinName!])
    );

    const vSuiCoinType = this.poolAddresses['vsui']?.coinType;
    if (vSuiCoinType)
      this.voloCoinTypeToCoinNameMap = {
        [vSuiCoinType]: 'vsui',
      };

    this.suiBridgeCoinTypeToCoinNameMap = Object.fromEntries(
      Object.entries(this.poolAddresses)
        .filter(
          ([_, value]) =>
            !!value && this.whitelist.suiBridge.has(value.coinName)
        )
        .map(([_, value]) => [value!.coinType, value!.coinName])
    );

    this.sCoinTypes = Object.fromEntries(
      Object.entries(this.poolAddresses)
        .filter(([_, value]) => !!value && value.sCoinName && value.sCoinType)
        .map(([_, value]) => [value!.sCoinName, value!.sCoinType!])
    );

    this.supportedBorrowIncentiveRewards = new Set([
      ...Object.values(this.poolAddresses)
        .filter((t) => !!t)
        .map((t) => (t.sCoinName ? [t.coinName, t.sCoinName] : [t.coinName]))
        .flat(),
    ]);
  }

  async readWhiteList() {
    const response = await (async () => {
      try {
        return this.readApi<Record<keyof Whitelist, string[]>>({
          url:
            this.params.whitelistApiUrl ??
            `https://sui.apis.scallop.io/pool/whitelist`,
          queryKey: queryKeys.api.getWhiteList(),
        });
      } catch (e) {
        console.error(e);
        return this.defaultValues?.whitelist ?? DEFAULT_WHITELIST;
      }
    })();

    return Object.fromEntries(
      Object.entries(response)
        .filter(([_, value]) => Array.isArray(value) || value instanceof Set)
        .map(([key, value]) => [
          key,
          value instanceof Set ? value : new Set(value),
        ])
    ) as Whitelist;
  }

  async readPoolAddresses() {
    try {
      return await this.readApi<Record<string, PoolAddress>>({
        url:
          this.params.poolAddressesApiUrl ??
          `https://sui.apis.scallop.io/pool/addresses`,
        queryKey: queryKeys.api.getPoolAddresses(),
      });
    } catch (e) {
      console.error(e);
      return this.defaultValues?.poolAddresses ?? {};
    }
  }
}

export default ScallopConstants;
