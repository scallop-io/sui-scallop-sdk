import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from './models';
import * as dotenv from 'dotenv';
dotenv.config();

const NETWORK: NetworkType = 'mainnet';
const scallopSDK = new Scallop({
  secretKey: process.env.SECRET_KEY,
  networkType: NETWORK,
});

const main = async () => {
  const query = await scallopSDK.createScallopQuery();

  // const res = await query.getBorrowIncentivePools();
  const res = await query.getObligationAccount(
    '0x63eb9f03b0abe476b04bb7a963d61de0595be1e3499960b570f398c5ad7e5f2c'
  );
  console.dir(res, { depth: null });
};

main();
