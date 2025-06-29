import {
  SUI_CLOCK_OBJECT_ID,
  SuiTxBlock,
  TransactionArgument,
} from '@scallop-io/sui-kit';
import { IOraclePackageRegistry } from './oraclePackageRegistry';
import {
  SupportedOracleSuiLst,
  SupportOracleType,
  xOracleRuleType,
} from 'src/types/constant';
import { UnsupportedLstOracleError } from './error';

export interface IXOracleUpdateStrategy<
  T extends SupportOracleType,
  U extends string = string,
> {
  oracleType: T;
  updatePrice(
    tx: SuiTxBlock,
    request: TransactionArgument,
    coinName: U,
    rule: xOracleRuleType
  ): void;
}

abstract class BaseUpdateStrategy<
  T extends SupportOracleType,
  U extends string = string,
> implements IXOracleUpdateStrategy<T, U>
{
  constructor(protected readonly registry: IOraclePackageRegistry<T>) {}
  abstract readonly oracleType: T;

  protected get clockObject() {
    return {
      objectId: SUI_CLOCK_OBJECT_ID,
      mutable: false,
      initialSharedVersion: '1',
    };
  }

  protected get utils() {
    return this.registry.utils;
  }

  abstract updatePrice(
    tx: SuiTxBlock,
    request: TransactionArgument,
    coinName: string,
    rule: xOracleRuleType
  ): void;
}

export class PythDefaultUpdateStrategy extends BaseUpdateStrategy<'pyth'> {
  readonly oracleType = 'pyth';
  constructor(protected readonly registry: IOraclePackageRegistry<'pyth'>) {
    super(registry);
  }

  updatePrice(
    tx: SuiTxBlock,
    request: TransactionArgument,
    coinName: string,
    rule: xOracleRuleType
  ): void {
    const { pythFeedObjectId, pythRegistryId, pythStateId, pythPackageId } =
      this.registry.getPackages(coinName);
    tx.moveCall(
      `${pythPackageId}::rule::set_price_as_${rule}`,
      [
        request,
        pythStateId,
        pythFeedObjectId,
        pythRegistryId,
        tx.sharedObjectRef({
          objectId: SUI_CLOCK_OBJECT_ID,
          mutable: false,
          initialSharedVersion: '1',
        }),
      ],
      [this.utils.parseCoinType(coinName)]
    );
  }
}
export class PythSuiLstUpdateStrategy extends BaseUpdateStrategy<
  'pyth',
  SupportedOracleSuiLst
> {
  readonly oracleType = 'pyth';
  constructor(protected readonly registry: IOraclePackageRegistry<'pyth'>) {
    super(registry);
  }

  updatePrice(
    tx: SuiTxBlock,
    request: TransactionArgument,
    coinName: SupportedOracleSuiLst,
    rule: xOracleRuleType
  ): void {
    const { lst, pythFeedObjectId, pythStateId } =
      this.registry.getPackages(coinName);
    if (!lst[coinName]) {
      throw new UnsupportedLstOracleError(coinName, this.oracleType);
    }
    const { id, configId, stakedSuiVaultId, safeId } = lst[coinName];
    tx.moveCall(`${id}::rule::set_price_as_${rule}`, [
      request,
      pythStateId,
      pythFeedObjectId,
      configId,
      stakedSuiVaultId,
      safeId,
      tx.sharedObjectRef(this.clockObject),
    ]);
  }
}

export class SupraDefaultUpdateStrategy extends BaseUpdateStrategy<'supra'> {
  readonly oracleType = 'supra';
  constructor(protected readonly registry: IOraclePackageRegistry<'supra'>) {
    super(registry);
  }

  updatePrice(
    tx: SuiTxBlock,
    request: TransactionArgument,
    coinName: string,
    rule: xOracleRuleType
  ): void {
    const { supraPackageId, supraHolderId, supraRegistryId } =
      this.registry.getPackages(coinName);

    tx.moveCall(
      `${supraPackageId}::rule::set_price_as_${rule}`,
      [
        request,
        supraHolderId,
        supraRegistryId,
        tx.sharedObjectRef(this.clockObject),
      ],
      [this.utils.parseCoinType(coinName)]
    );
  }
}

export class SwitchboardDefaultUpdateStrategy extends BaseUpdateStrategy<'switchboard'> {
  readonly oracleType = 'switchboard';
  constructor(
    protected readonly registry: IOraclePackageRegistry<'switchboard'>
  ) {
    super(registry);
  }

  updatePrice(
    tx: SuiTxBlock,
    request: TransactionArgument,
    coinName: string,
    rule: xOracleRuleType
  ): void {
    const {
      switchboardPackageId,
      switchboardAggregatorId,
      switchboardRegistryId,
    } = this.registry.getPackages(coinName);

    tx.moveCall(
      `${switchboardPackageId}::rule::set_price_as_${rule}`,
      [
        request,
        switchboardAggregatorId,
        switchboardRegistryId,
        tx.sharedObjectRef(this.clockObject),
      ],
      [this.utils.parseCoinType(coinName)]
    );
  }
}
