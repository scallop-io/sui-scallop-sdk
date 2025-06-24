import {
  SUI_CLOCK_OBJECT_ID,
  SuiTxBlock,
  TransactionArgument,
} from '@scallop-io/sui-kit';
import { XOraclePackageRegistry } from './oraclePackageRegistry';

interface IPriceUpdateRequester {
  buildRequest(coinName: string): TransactionArgument;
  confirmRequest(coinName: string, request: TransactionArgument): void;
}

export class PriceUpdateRequester implements IPriceUpdateRequester {
  constructor(
    private readonly txBlock: SuiTxBlock,
    private readonly xOraclePackageRegistry: XOraclePackageRegistry
  ) {}

  get utils() {
    return this.xOraclePackageRegistry.utils;
  }

  buildRequest(coinName: string): TransactionArgument {
    const { xOraclePackageId, xOracleId } =
      this.xOraclePackageRegistry.getXOraclePackages;
    const target = `${xOraclePackageId}::x_oracle::price_update_request`;
    const typeArgs = [this.utils.parseCoinType(coinName)];
    return this.txBlock.moveCall(target, [xOracleId], typeArgs);
  }

  confirmRequest(coinName: string, request: TransactionArgument): void {
    const { xOraclePackageId, xOracleId } =
      this.xOraclePackageRegistry.getXOraclePackages;
    const target = `${xOraclePackageId}::x_oracle::confirm_price_update_request`;
    const typeArgs = [this.utils.parseCoinType(coinName)];
    this.txBlock.moveCall(
      target,
      [
        xOracleId,
        request,
        this.txBlock.sharedObjectRef({
          objectId: SUI_CLOCK_OBJECT_ID,
          mutable: false,
          initialSharedVersion: '1',
        }),
      ],
      typeArgs
    );
  }
}
