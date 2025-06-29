import { SuiTxBlock, TransactionArgument } from '@scallop-io/sui-kit';
import { SupportOracleType, xOracleRuleType } from 'src/types/constant';
import { SUPPORT_SUI_LST } from 'src/constants/xoracle';
import { IOraclePackageRegistry } from './oraclePackageRegistry';
import {
  IXOracleUpdateStrategy,
  PythDefaultUpdateStrategy,
  PythSuiLstUpdateStrategy,
  SupraDefaultUpdateStrategy,
  SwitchboardDefaultUpdateStrategy,
} from './xOracleUpdateStrategy';
import { UnsupportedLstOracleError } from './error';

export interface IXOracleUpdater<
  T extends SupportOracleType = SupportOracleType,
> {
  oracleName: T; // e.g. 'pyth', 'supra', 'switchboard'
  updateXOracle(
    coinName: string,
    rule: xOracleRuleType,
    request: TransactionArgument
  ): void;
}

abstract class BaseXOracleUpdater<
  T extends SupportOracleType = SupportOracleType,
> implements IXOracleUpdater
{
  protected strategies: Map<string, IXOracleUpdateStrategy<T>>;
  abstract readonly oracleName: T;

  constructor(
    protected readonly tx: SuiTxBlock,
    protected readonly registry: IOraclePackageRegistry<T>,
    listStrategies: Record<string, IXOracleUpdateStrategy<T>>
  ) {
    this.strategies = new Map(Object.entries(listStrategies));
  }

  abstract updateXOracle(
    coinName: string,
    rule: xOracleRuleType,
    request: TransactionArgument
  ): void;
}

class PythXOracleUpdater extends BaseXOracleUpdater<'pyth'> {
  readonly oracleName = 'pyth';
  protected readonly SUPPORT_SUI_LST_SET: Set<string> = new Set(
    SUPPORT_SUI_LST
  );

  constructor(tx: SuiTxBlock, registry: IOraclePackageRegistry<'pyth'>) {
    super(tx, registry, {
      default: new PythDefaultUpdateStrategy(registry),
      sui_lst: new PythSuiLstUpdateStrategy(registry),
    });
  }

  private resolveStrategy(
    coinName: string
  ): IXOracleUpdateStrategy<typeof this.oracleName> {
    // decide which key to look up in this.strategies
    let key: string;

    if (this.SUPPORT_SUI_LST_SET.has(coinName)) {
      key = 'sui_lst';
    }
    // else if (this.WALRUS_LST_SET.has(coinName)) {
    //   key = 'walrus_lst';
    // }
    else {
      key = 'default';
    }

    const strat = this.strategies.get(key);
    if (!strat) {
      // guard if you forgot to register default or list strategies
      throw new UnsupportedLstOracleError(coinName, this.oracleName);
    }

    return strat as IXOracleUpdateStrategy<typeof this.oracleName>;
  }

  updateXOracle(
    coinName: string,
    rule: xOracleRuleType,
    request: TransactionArgument
  ): void {
    const strategy = this.resolveStrategy(coinName);
    strategy.updatePrice(this.tx, request, coinName, rule);
  }
}

class SupraXOracleUpdater extends BaseXOracleUpdater<'supra'> {
  readonly oracleName = 'supra';

  constructor(tx: SuiTxBlock, registry: IOraclePackageRegistry<'supra'>) {
    super(tx, registry, {
      default: new SupraDefaultUpdateStrategy(registry), // Placeholder, implement Supra strategy
    });
  }

  updateXOracle(
    coinName: string,
    rule: xOracleRuleType,
    request: TransactionArgument
  ): void {
    const stragtegy = this.strategies.get('default');
    stragtegy?.updatePrice(this.tx, request, coinName, rule);
  }
}

class SwitchboardXOracleUpdater extends BaseXOracleUpdater<'switchboard'> {
  readonly oracleName = 'switchboard';
  constructor(tx: SuiTxBlock, registry: IOraclePackageRegistry<'switchboard'>) {
    super(tx, registry, {
      // Placeholder, implement Switchboard strategy
      default: new SwitchboardDefaultUpdateStrategy(registry),
    });
  }

  updateXOracle(
    coinName: string,
    rule: xOracleRuleType,
    request: TransactionArgument
  ): void {
    const stragtegy = this.strategies.get('default');
    stragtegy?.updatePrice(this.tx, request, coinName, rule);
  }
}

export const createXOracleUpdater = (
  tx: SuiTxBlock,
  registry: IOraclePackageRegistry
) => {
  const oracleType = registry.oracleName;
  switch (oracleType) {
    case 'pyth': {
      return new PythXOracleUpdater(
        tx,
        registry as IOraclePackageRegistry<'pyth'>
      );
    }
    case 'supra': {
      return new SupraXOracleUpdater(
        tx,
        registry as IOraclePackageRegistry<'supra'>
      );
    }
    case 'switchboard': {
      return new SwitchboardXOracleUpdater(
        tx,
        registry as IOraclePackageRegistry<'switchboard'>
      );
    }
    default:
      throw new Error(`Unsupported oracle type: ${oracleType}`);
  }
};
