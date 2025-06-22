import { TransactionArgument } from '@scallop-io/sui-kit';
import { ScallopAddress } from 'src/models';
import { xOracleRules } from 'src/types';

export type XOracleConfig = {
  rules: xOracleRules;
  xOraclePackageId: string;
  xOracleId: TransactionArgument | string;
};

export type PythConfig = {
  pythPackageId: string;
  pythRegistryId: TransactionArgument | string;
  pythStateId: TransactionArgument | string;
  pythFeedObjectId: TransactionArgument | string;
};

export type SwitchboardConfig = {
  switchboardPackageId: string;
  switchboardRegistryId: TransactionArgument | string;
  switchboardAggregatorId: TransactionArgument | string;
};

export type SupraConfig = {
  supraPackageId: string;
  supraRegistryId: TransactionArgument | string;
  supraHolderId: TransactionArgument | string;
};

type Config = XOracleConfig & PythConfig & SwitchboardConfig & SupraConfig;

export class OracleConfig {
  public readonly config: Config;

  constructor(
    public readonly address: ScallopAddress,
    public readonly coinName: string,
    public readonly coinType: string,
    rules: xOracleRules
  ) {
    this.config = {
      ...this.getXOracleConfig(rules),
      ...this.getPythConfig(coinName),
      ...this.getSwitchboardConfig(coinName),
      ...this.getSupraConfig(),
    };
  }

  getXOracleConfig(rules: xOracleRules): XOracleConfig {
    return {
      rules,
      xOraclePackageId: this.address.get('core.packages.xOracle.id'),
      xOracleId: this.address.get('core.oracles.xOracle'),
    };
  }

  getPythConfig(coinName: string): PythConfig {
    return {
      pythPackageId: this.address.get('core.packages.pyth.id'),
      pythRegistryId: this.address.get('core.oracles.pyth.registry'),
      pythStateId: this.address.get('core.oracles.pyth.state'),
      pythFeedObjectId: this.address.get(
        `core.coins.${coinName}.oracle.pyth.feedObject`
      ),
    };
  }

  getSwitchboardConfig(coinName: string): SwitchboardConfig {
    return {
      switchboardPackageId: this.address.get('core.packages.switchbord.id'),
      switchboardRegistryId: this.address.get(
        'core.oracles.switchboard.registry'
      ),
      switchboardAggregatorId: this.address.get(
        `core.coins.${coinName}.oracle.switchboard`
      ),
    };
  }

  getSupraConfig(): SupraConfig {
    return {
      supraPackageId: this.address.get('core.packages.supra.id'),
      supraRegistryId: this.address.get('core.oracles.supra.registry'),
      supraHolderId: this.address.get('core.oracles.supra.holder'),
    };
  }
}
