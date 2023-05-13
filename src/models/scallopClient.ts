import { normalizeSuiAddress } from '@mysten/sui.js';
import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './addressBuilder';
import { ScallopTxBuilder } from './txBuilder';
import type {
  SupportCoinType,
  MarketInterface,
  ObligationInterface,
} from 'src/types';

/**
 * ### Scallop Client
 *
 * it provides contract interaction operations for general users.
 *
 * #### Usage
 *
 * ```typescript
 * const clent  = new Scallop(<parameters>);
 * client.<depoist>();
 * ```
 */
export class ScallopClient {
  private _suiKit: SuiKit;
  private _address: ScallopAddress;
  private _txBuilder: ScallopTxBuilder;
  private _walletAddress: string;

  public constructor(
    suiKit: SuiKit,
    address: ScallopAddress,
    txBuilder: ScallopTxBuilder,
    walletAddress?: string
  ) {
    const normalizedWalletAddress = normalizeSuiAddress(
      walletAddress || suiKit.currentAddress()
    );
    this._suiKit = suiKit;
    this._address = address;
    this._txBuilder = txBuilder;
    this._walletAddress = normalizedWalletAddress;
  }

  /**
   * Query market data.
   *
   * @return Market data
   */
  public async queryMarket() {
    const queryTxn = this._txBuilder.queryMarket(
      this._address.get('core.packages.query.id'),
      this._address.get('core.market')
    );
    const queryResult = await this._suiKit.inspectTxn(queryTxn);
    const queryData: MarketInterface = queryResult.events[0].parsedJson;
    return queryData;
  }

  /**
   * Query obligations data.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data
   */
  async getObligations(ownerAddress?: string) {
    const owner = ownerAddress || this._walletAddress;
    const keyObjectRefs =
      await this._suiKit.rpcProvider.provider.getOwnedObjects({
        owner,
        filter: {
          StructType: `${this._address.get(
            'core.packages.protocol.id'
          )}::obligation::ObligationKey`,
        },
      });
    const keyIds = keyObjectRefs.data
      .map((ref: any) => ref?.data?.objectId)
      .filter((id: any) => id !== undefined) as string[];
    const keyObjects = await this._suiKit.getObjects(keyIds);
    const obligations: { id: string; keyId: string }[] = [];
    for (const keyObject of keyObjects) {
      const keyId = keyObject.objectId;
      const fields = keyObject.objectFields as any;
      const obligationId = fields['ownership']['fields']['of'];
      obligations.push({ id: obligationId, keyId });
    }
    return obligations;
  }

  /**
   * Query obligation data.
   *
   * @param obligationId - The obligation id from protocol package.
   * @return Obligation data
   */
  public async queryObligation(obligationId: string) {
    const queryTxn = this._txBuilder.queryObligation(
      this._address.get('core.packages.query.id'),
      obligationId
    );
    const queryResult = await this._suiKit.inspectTxn(queryTxn);
    const queryData: ObligationInterface = queryResult.events[0].parsedJson;
    return queryData;
  }

  /**
   * Open obligation.
   *
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block
   */
  public async openObligation(sign: boolean = true) {
    this._txBuilder.openObligationEntry(
      this._address.get('core.packages.protocol.id')
    );
    if (sign) {
      return this._suiKit.signAndSendTxn(this._txBuilder.suiTxBlock);
    } else {
      return this._txBuilder.txBlock;
    }
  }

  public async openObligationAndDepositCollateral() {}
  public async depositCollateral() {}

  public async withdrawCollateral() {}

  public async depositl() {}
  public async withdraw() {}
  public async borrow() {}
  public async repay() {}

  /**
   * Mint and get test coin.
   *
   * @remarks
   *  Only be used on the test network.
   *
   * @param coinName - Types of coins supported on the test network.
   * @param amount - The amount of coins minted and received.
   * @param receiveAddress - The wallet address that receives the coins.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block
   */
  public async mintTestCoin(
    coinName: Exclude<SupportCoinType, 'sui'>,
    amount: number,
    receiveAddress: string = this._walletAddress,
    sign: boolean = true
  ) {
    const recipient = receiveAddress || this._walletAddress;
    this._txBuilder.mintTestCoinEntry(
      this._address.get('core.packages.testCoin.id'),
      this._address.get(`core.coins.${coinName}.treasury`),
      coinName,
      amount,
      recipient
    );
    if (sign) {
      return this._suiKit.signAndSendTxn(this._txBuilder.suiTxBlock);
    } else {
      return this._txBuilder.txBlock;
    }
  }
}
