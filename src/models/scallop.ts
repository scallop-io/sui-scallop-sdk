import { ScallopTxBuilder } from './txBuilder';
import { ScallopAddress } from './scallopAddress';
import { ScallopClient } from './scallopClient';
import { ADDRESSES_ID } from '../constants';
import type { NetworkType } from '@scallop-io/sui-kit';
import type { ScallopParams } from 'src/types';

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
  public params: ScallopParams;
  public address: ScallopAddress;

  public constructor(params: ScallopParams) {
    this.params = params;
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
   *
   * @param id - The API id of the addresses.
   * @param auth - The authentication API key.
   * @param network - Specifies which network's addresses you want to set.
   * @return Scallop Address
   */
  public createAddress(id: string, auth: string, network: NetworkType) {
    return new ScallopAddress({ id, auth, network });
  }

  /**
   * Create an instance that provides contract interaction operations for general users.
   *
   * @param walletAddress - When user cannot provide a secret key or mnemonic, the scallop client cannot directly derive the address of the transaction the user wants to sign. This argument specifies the wallet address for signing the transaction.
   * @return Scallop Client
   */
  public async createScallopClient(walletAddress?: string) {
    await this.address.read();
    return new ScallopClient(this.params, this.address, walletAddress);
  }
}
