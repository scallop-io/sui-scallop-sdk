import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopTxBuilder } from './txBuilder';
import { ScallopAddressBuilder } from './addressBuilder';
import { ScallopClient } from './scallopClient';
import { ScallopAdmin } from './scallopAdmin';
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

  public constructor(params: ScallopParams) {
    const { suiConfig } = params;
    this.suiKit = new SuiKit(suiConfig);
  }

  /**
   * Create an instance to operate the transaction block, making it more convenient to organize transaction combinations.
   */
  public createTxBuilder() {
    return new ScallopTxBuilder();
  }

  /**
   * Create an instance to collect the addresses, making it more eazy to get object addresses from lending contract.
   */
  public createAddressBuilder() {
    return new ScallopAddressBuilder();
  }

  /**
   * Create an instance that provides contract interaction operations for general users.
   */
  public async createScallopClient() {
    const _addressBuilder = new ScallopAddressBuilder();

    return new ScallopClient(this.suiKit);
  }

  /**
   * Create an instance that provides contract interaction operations needed for managing the lending market.
   */
  public async createScallopAdmin() {
    const _addressBuilder = new ScallopAddressBuilder();

    return new ScallopAdmin(this.suiKit);
  }
}
