import { TransactionArgument } from '@scallop-io/sui-kit';
import { ScallopUtils } from 'src/models';
import {
  AddressStringPath,
  BasePackage,
  OracleLst,
  OracleLstConfig,
  SupportedOracleSuiLst,
  SupportOracleLst,
  SupportOracleType,
} from 'src/types';
import { UnsupportedOracleError } from './error';

export type XOraclePackages = {
  xOraclePackageId: string;
  xOracleId: TransactionArgument | string;
};

type LstPackages<
  T extends SupportOracleLst,
  U extends SupportedOracleSuiLst = SupportedOracleSuiLst,
> = {
  [K in U]: OracleLst<T, U>[K] & BasePackage;
};

type MaybeWithLstPackage<T, U> = T extends SupportOracleLst
  ? U & { lst: LstPackages<T> }
  : U;

type PythStaticPackages = {
  pythPackageId: string;
  pythRegistryId: TransactionArgument | string;
  pythStateId: TransactionArgument | string;
};

type PythDynamicPackages = MaybeWithLstPackage<
  'pyth',
  {
    pythFeedObjectId: TransactionArgument | string;
  }
>;

export type PythPackages = PythStaticPackages & PythDynamicPackages;

type SwitchboardStaticPackages = {
  switchboardPackageId: string;
  switchboardRegistryId: TransactionArgument | string;
};

type SwitchboardDynamicPackages = MaybeWithLstPackage<
  'switchboard',
  {
    switchboardAggregatorId: TransactionArgument | string;
  }
>;

export type SwitchboardPackages = SwitchboardStaticPackages &
  SwitchboardDynamicPackages;

export type SupraPackages = {
  supraPackageId: string;
  supraHolderId: TransactionArgument | string;
  supraRegistryId: TransactionArgument | string;
};

export type OraclePackages<T extends SupportOracleType> = T extends 'pyth'
  ? PythPackages
  : T extends 'switchboard'
    ? SwitchboardPackages
    : T extends 'supra'
      ? SupraPackages
      : never;

type getLstPackagesReturnType<T> = T extends SupportOracleLst
  ? LstPackages<T, SupportedOracleSuiLst>
  : never;

export interface IOraclePackageRegistry<
  T extends SupportOracleType = SupportOracleType,
> {
  utils: ScallopUtils;
  oracleName: T;
  packageId: string;
  getLstPackages(coinName: SupportedOracleSuiLst): getLstPackagesReturnType<T>;
  getPackages(coinName: string): OraclePackages<T>;
}

interface IHasStaticPackages {
  getStaticPackages: Record<string, TransactionArgument | string>;
}

export class XOraclePackageRegistry
  implements
    Omit<
      IOraclePackageRegistry,
      'oracleName' | 'packageId' | 'getPackages' | 'getLstPackages'
    >
{
  constructor(readonly utils: ScallopUtils) {}

  getAddressPath(path: AddressStringPath) {
    return this.utils.address.get(path);
  }

  get getXOraclePackages() {
    return {
      xOraclePackageId: this.getAddressPath('core.packages.xOracle.id'),
      xOracleId: this.getAddressPath('core.oracles.xOracle'),
    };
  }
}

abstract class BasePackageRegistry implements IOraclePackageRegistry {
  abstract readonly oracleName: SupportOracleType;

  constructor(
    protected readonly xOraclePackageRegistry: XOraclePackageRegistry
  ) {}

  abstract getPackages(
    coinName: string
  ): OraclePackages<typeof this.oracleName>;

  abstract getLstPackages(
    coinName: SupportedOracleSuiLst
  ): getLstPackagesReturnType<typeof this.oracleName>;

  get utils() {
    return this.xOraclePackageRegistry.utils;
  }

  get packageId() {
    return this.xOraclePackageRegistry.getAddressPath(
      `core.packages.${this.oracleName}.id`
    );
  }
}

class PythPackageRegistry
  extends BasePackageRegistry
  implements IHasStaticPackages
{
  readonly oracleName = 'pyth';

  constructor(
    protected readonly xOraclePackageRegistry: XOraclePackageRegistry
  ) {
    super(xOraclePackageRegistry);
  }

  get getStaticPackages() {
    return {
      pythPackageId: this.packageId,
      pythRegistryId: this.xOraclePackageRegistry.getAddressPath(
        'core.oracles.pyth.registry'
      ),
      pythStateId: this.xOraclePackageRegistry.getAddressPath(
        'core.oracles.pyth.state'
      ),
    };
  }

  private getLstOracleConfigPackages(coinName: SupportedOracleSuiLst) {
    const oracleLstConfig = this.xOraclePackageRegistry.getAddressPath(
      `core.oracles.pyth.lst.${coinName}`
    ) as OracleLstConfig<typeof coinName>[typeof coinName];
    return oracleLstConfig;
  }

  getLstPackages(coinName: SupportedOracleSuiLst) {
    const lstPackages = this.xOraclePackageRegistry.getAddressPath(
      `core.packages.pyth.lst.${coinName}`
    ) as BasePackage;

    // get the oracle config for the coin
    const oracleLstConfig = this.getLstOracleConfigPackages(coinName);
    return {
      [coinName]: {
        ...lstPackages,
        ...oracleLstConfig,
      },
    };
  }

  getPackages(coinName: string): OraclePackages<'pyth'> {
    const lstPackages = this.getLstPackages(coinName as SupportedOracleSuiLst);

    return {
      ...this.getStaticPackages,
      pythFeedObjectId: this.xOraclePackageRegistry.getAddressPath(
        `core.coins.${coinName}.oracle.pyth.feedObject`
      ),
      lst: lstPackages,
    };
  }
}

class SupraPackageRegistry extends BasePackageRegistry {
  readonly oracleName = 'supra';

  constructor(
    protected readonly xOraclePackageRegistry: XOraclePackageRegistry
  ) {
    super(xOraclePackageRegistry);
  }

  getLstPackages(
    _: SupportedOracleSuiLst
  ): getLstPackagesReturnType<typeof this.oracleName> {
    throw new Error('Method not implemented.');
  }

  getPackages(_: string) {
    return {
      supraPackageId: this.packageId,
      supraRegistryId: this.xOraclePackageRegistry.getAddressPath(
        'core.oracles.supra.registry'
      ),
      supraHolderId: this.xOraclePackageRegistry.getAddressPath(
        'core.oracles.supra.holder'
      ),
    } as OraclePackages<typeof this.oracleName>;
  }
}

class SwitchboardPackageRegistry
  extends BasePackageRegistry
  implements IHasStaticPackages
{
  readonly oracleName = 'switchboard';

  constructor(
    protected readonly xOraclePackageRegistry: XOraclePackageRegistry
  ) {
    super(xOraclePackageRegistry);
  }

  getLstPackages(
    _: SupportedOracleSuiLst
  ): getLstPackagesReturnType<typeof this.oracleName> {
    throw new Error('Method not implemented.');
  }

  get getStaticPackages() {
    return {
      switchboardPackageId: this.packageId,
      switchboardRegistryId: this.xOraclePackageRegistry.getAddressPath(
        'core.oracles.switchboard.registry'
      ),
    };
  }

  getPackages(coinName: string) {
    return {
      ...this.getStaticPackages,
      switchboardAggregatorId: this.xOraclePackageRegistry.getAddressPath(
        `core.coins.${coinName}.oracle.switchboard`
      ),
    } as OraclePackages<typeof this.oracleName>;
  }
}

export class OraclePackageRegistry {
  private readonly registryMap = new Map<
    SupportOracleType,
    IOraclePackageRegistry
  >();

  constructor(readonly xOraclePackageRegistry: XOraclePackageRegistry) {}

  /**
   * Register a new updater (pyth, supra, switchboard)
   */
  register(
    cb: (
      xOraclePackageRegistry: XOraclePackageRegistry
    ) => IOraclePackageRegistry
  ): void {
    const registry = cb(this.xOraclePackageRegistry);
    if (this.registryMap.has(registry.oracleName)) {
      throw new Error(
        `Updater already registered for oracleKey: ${registry.oracleName}`
      );
    }
    this.registryMap.set(registry.oracleName, registry);
  }

  /**
   * Retrieve the handler by key; throws if missing
   */
  get(oracleName: SupportOracleType): IOraclePackageRegistry {
    const handler = this.registryMap.get(oracleName);
    if (!handler) {
      throw new Error(
        `No XOraclePriceUpdater registered for oracle: ${oracleName}`
      );
    }
    return handler;
  }

  /**
   * Optional: Check if a handler exists for the given key
   */
  has(oracleName: SupportOracleType): boolean {
    return this.registryMap.has(oracleName);
  }
}

export const createPackageRegistry = (
  oracleName: SupportOracleType,
  xOraclePackageRegistry: XOraclePackageRegistry
): IOraclePackageRegistry => {
  switch (oracleName) {
    case 'pyth':
      return new PythPackageRegistry(xOraclePackageRegistry);
    case 'supra':
      return new SupraPackageRegistry(xOraclePackageRegistry);
    case 'switchboard':
      return new SwitchboardPackageRegistry(xOraclePackageRegistry);
    default:
      throw new UnsupportedOracleError(oracleName);
  }
};
