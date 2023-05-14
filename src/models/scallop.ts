import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopTxBuilder } from './txBuilder';
import { ScallopAddress } from './scallopAddress';
import { ScallopClient } from './scallopClient';
import { ADDRESSES_ID } from '../constants';
import type { ScallopParams } from 'src/types/model';

/**
 * ### Scallop
 *
 * The main instance that controls interaction with the Scallop contract.
 *
 * #### Usage
 *
 * ```typescript
 * const sdk = new Scallop(<parameters>);
 * ```
 */
export class Scallop {
  public suiKit: SuiKit;
  public address: ScallopAddress;

  public constructor(params: ScallopParams) {
    this.suiKit = new SuiKit(params);
    this.address = new ScallopAddress({
      id: ADDRESSES_ID,
      network: params?.networkType,
    });
  }

  /**
   * Create an instance to operate the transaction block, making it more convenient to organize transaction combinations.
   * @return Scallop Transaction Builder
   */
  public createTxBuilder() {
    return new ScallopTxBuilder();
  }

  /**
   * Create an instance to collect the addresses, making it more eazy to get object addresses from lending contract.
   * @return Scallop Address
   */
  public createAddress() {
    return new ScallopAddress();
  }

  /**
   * Create an instance that provides contract interaction operations for general users.
   *
   * @param walletAddress - When user cannot provide a secret key or mnemonic, the scallop client cannot directly derive the address of the transaction the user wants to sign. This argument specifies the wallet address for signing the transaction.
   * @return Scallop Client
   */
  public async createScallopClient(walletAddress?: string) {
    await this.address.read();
    return new ScallopClient(this.suiKit, this.address, walletAddress);
  }
}
