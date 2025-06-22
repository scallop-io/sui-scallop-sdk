import {
  SUI_CLOCK_OBJECT_ID,
  SuiTxBlock,
  TransactionArgument,
} from '@scallop-io/sui-kit';
import { SupportOracleType, xOracleRuleType } from 'src/types';
import { OracleConfig } from './oracleConfig';
import {
  IOracleUpdater,
  PythOracleUpdater,
  SupraOracleUpdater,
  SwitchboardOracleUpdater,
} from './oracleUpdater';

type PriceUpdaterArgs = {
  txBlock: SuiTxBlock;
  suiLst?: string[];
};

export class PriceUpdater {
  private suiLst: Set<string>;
  private txBlock: SuiTxBlock;
  private oracleHandlers: Record<SupportOracleType, IOracleUpdater>;

  constructor(
    private config: OracleConfig,
    { txBlock, suiLst }: PriceUpdaterArgs
  ) {
    this.suiLst = new Set(suiLst ?? []);
    this.txBlock = txBlock;

    this.oracleHandlers = {
      pyth: new PythOracleUpdater(this.txBlock, this.configValue),
      supra: new SupraOracleUpdater(this.txBlock, this.configValue),
      switchboard: new SwitchboardOracleUpdater(this.txBlock, this.configValue),
    };
  }

  private get coinType() {
    return this.config.coinType;
  }

  private get coinName() {
    return this.config.coinName;
  }

  private get isSuiLst() {
    return this.suiLst.has(this.config.coinName);
  }

  private get configValue() {
    return this.config.config;
  }

  private get clockObject() {
    return {
      objectId: SUI_CLOCK_OBJECT_ID,
      mutable: false,
      initialSharedVersion: '1',
    };
  }

  updatePrice() {
    const request = this.buildRequest();

    // check if lst
    if (this.isSuiLst) {
      this.updateSuiLSTPrice(request);
    } else {
      this.updatePriceDefault(request);
    }

    this.confirmRequest(request);
  }

  private updateSuiLSTPrice(_: TransactionArgument) {
    // @TODO: Implement
    // switch (this.coinName) {
    //   case 'afsui':
    //     break;
    //   default:
    //     throw new Error(`Unknown sui lst ${this.coinName}`);
    // }
  }

  private updatePriceDefault(request: TransactionArgument) {
    // Update based on rules
    const rules = this.configValue.rules;
    Object.entries(rules).forEach(([ruleType, oracleTypes]) => {
      oracleTypes.forEach((oracleType) => {
        const handler = this.oracleHandlers[oracleType];
        if (!handler) throw new Error(`Unsupported oracle type: ${oracleType}`);
        handler.update(ruleType as xOracleRuleType, request, this.coinType);
      });
    });
  }

  /**
   * Construct a transaction block for request price update.
   *
   * @return TxBlock created by SuiKit.
   */
  private buildRequest(): TransactionArgument {
    const target = `${this.configValue.xOraclePackageId}::x_oracle::price_update_request`;
    const typeArgs = [this.coinType];
    return this.txBlock.moveCall(
      target,
      [this.configValue.xOracleId],
      typeArgs
    );
  }

  /**
   * Construct a transaction block for confirm price update request.
   *
   * @param request - The result of the price request.
   */
  private confirmRequest(request: TransactionArgument) {
    const target = `${this.configValue.xOraclePackageId}::x_oracle::confirm_price_update_request`;
    const typeArgs = [this.coinType];
    this.txBlock.moveCall(
      target,
      [
        this.configValue.xOracleId,
        request,
        this.txBlock.sharedObjectRef(this.clockObject),
      ],
      typeArgs
    );
  }
}
