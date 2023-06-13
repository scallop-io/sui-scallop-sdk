import dotenv from 'dotenv';
import { Scallop } from '../src/models';
dotenv.config();

const secretKey = process.env.SECRET_KEY || '';

const scallop = new Scallop({
  networkType: 'testnet',
  secretKey,
});

async function main() {
  await scallop.readAddress();

  const txBlock = scallop.createTxBlock();
  txBlock.setSender(scallop.suiKit.currentAddress());

  const marketCoin = await txBlock.borrow_C(10 ** 9, 'usdt');
  txBlock.transferObjects([marketCoin], scallop.suiKit.currentAddress());

  // console.log(txBlock.blockData);

  return scallop.signAndSendTxBlock(txBlock);
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit(0));
