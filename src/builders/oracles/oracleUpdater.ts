import {
  SUI_CLOCK_OBJECT_ID,
  SuiTxBlock,
  TransactionArgument,
} from '@scallop-io/sui-kit';
import { SupportOracleType, xOracleRuleType } from 'src/types';
import { PythConfig, SupraConfig, SwitchboardConfig } from './oracleConfig';

export interface IOracleUpdater {
  oracleKey: SupportOracleType; // e.g. 'pyth', 'supra', 'switchboard'
  update(
    rule: xOracleRuleType,
    request: TransactionArgument,
    coinType: string
  ): void;
}

abstract class BaseOracleUpdater<T> implements IOracleUpdater {
  abstract readonly oracleKey: SupportOracleType;

  constructor(
    protected readonly tx: SuiTxBlock,
    protected readonly packageArgs: T
    // note: no extra IDs here
  ) {}

  protected get clockObject() {
    return {
      objectId: SUI_CLOCK_OBJECT_ID,
      mutable: false,
      initialSharedVersion: '1',
    };
  }

  abstract update(
    rule: xOracleRuleType,
    request: TransactionArgument,
    coinType: string
  ): void;
}

export class PythOracleUpdater extends BaseOracleUpdater<PythConfig> {
  readonly oracleKey = 'pyth';

  constructor(
    tx: SuiTxBlock,
    protected readonly packageArgs: PythConfig
  ) {
    super(tx, packageArgs);
  }

  update(
    rule: xOracleRuleType,
    request: TransactionArgument,
    coinType: string
  ) {
    const { pythPackageId, pythRegistryId, pythStateId, pythFeedObjectId } =
      this.packageArgs;
    this.tx.moveCall(
      `${pythPackageId}::rule::set_price_as_${rule}`,
      [
        request,
        pythStateId,
        pythFeedObjectId,
        pythRegistryId,
        this.tx.sharedObjectRef(this.clockObject),
      ],
      [coinType]
    );
  }
}

export class SupraOracleUpdater extends BaseOracleUpdater<SupraConfig> {
  readonly oracleKey = 'supra';
  constructor(
    tx: SuiTxBlock,
    protected readonly packageArgs: SupraConfig
  ) {
    super(tx, packageArgs);
  }

  update(
    rule: xOracleRuleType,
    request: TransactionArgument,
    coinType: string
  ) {
    const { supraPackageId, supraHolderId, supraRegistryId } = this.packageArgs;
    this.tx.moveCall(
      `${supraPackageId}::rule::set_price_as_${rule}`,
      [
        request,
        supraHolderId,
        supraRegistryId,
        this.tx.sharedObjectRef(this.clockObject),
      ],
      [coinType]
    );
  }
}

export class SwitchboardOracleUpdater extends BaseOracleUpdater<SwitchboardConfig> {
  readonly oracleKey = 'switchboard';
  constructor(
    tx: SuiTxBlock,
    protected readonly packageArgs: SwitchboardConfig
  ) {
    super(tx, packageArgs);
  }

  update(
    rule: xOracleRuleType,
    request: TransactionArgument,
    coinType: string
  ) {
    const {
      switchboardPackageId,
      switchboardAggregatorId,
      switchboardRegistryId,
    } = this.packageArgs;
    this.tx.moveCall(
      `${switchboardPackageId}::rule::set_price_as_${rule}`,
      [
        request,
        switchboardAggregatorId,
        switchboardRegistryId,
        this.tx.sharedObjectRef(this.clockObject),
      ],
      [coinType]
    );
  }
}
