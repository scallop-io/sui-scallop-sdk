import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { ScallopAddress } from '../src';
import type { AddressesInterface } from '../src';

dotenv.config();

const TEST_ADDRESSES_ID = '6462a088a7ace142bb6d7e9b';
const NETWORK: NetworkType = 'testnet';

describe('Test Scallop Address', () => {
  const addressBuilder = new ScallopAddress({
    id: TEST_ADDRESSES_ID,
    auth: process.env.API_KEY,
    network: NETWORK,
  });

  it('Should get new addresses after create', async () => {
    const oldId = addressBuilder.getId();
    if (oldId === undefined) {
      const addresses = await addressBuilder.create();
      console.info('addresses:', addresses);
      expect(!!addresses).toBe(true);
    }
    const addressesId = addressBuilder.getId();
    expect(oldId).not.toEqual(addressesId);
    await addressBuilder.delete();
  });

  it.skip('Should get new addresses after update', async () => {
    const addressesId = addressBuilder.getId();
    let oldAddresses: AddressesInterface | undefined = undefined;
    if (addressesId === undefined) {
      oldAddresses = await addressBuilder.create();
    } else {
      oldAddresses = addressBuilder.getAddresses();
    }
    const testAddresse: AddressesInterface = JSON.parse(`
      {
        "core": {
            "market": "0xb8982283c6164535183408afc0baa5162a8120d7d593b5fac4e31977b4d9d95b",
            "adminCap": "0x4c8e82f449a399aeab829ab8cd96315f5da5c55c3f46370a27278329248a72f7",
            "coinDecimalsRegistry": "0xd8b258de0e170be7f78ce57607e995241ab83549415dd5083f395c8971db3d52",
            "coins": {
                "btc": {
                    "id": "0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd",
                    "metaData": "0x8cdf03c532bcfd9cf18c78f9451f42e824821dcd3821944e829e815083c88b07",
                    "treasury": "0xc7f8a285b22440707a3f15032e5ed2c820809481e03236dc7d103de4c8a5b5ba",
                    "oracle": {
                        "supra": "",
                        "switchboard": "0x0c6d92e9c2184957b17bc1c29cf400ee64826a0ec0636a365341d7b8357e8a78",
                        "pyth": {
                            "feed": "f9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b",
                            "feedObject": "0x878b118488aeb5763b5f191675c3739a844ce132cb98150a465d9407d7971e7c"
                        }
                    }
                },
                "eth": {
                    "id": "0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd",
                    "metaData": "0x913329557602d09364d2aea832377ffc94f7f4d40885c66db630c9c7875b97ce",
                    "treasury": "0x860cad87d30808b5aedfa541fdccdb02229dcb455923b4cf2f31227c0ca4b2a4",
                    "oracle": {
                        "supra": "",
                        "switchboard": "0xbc42f735df32d48bc7cba194230d9fa9686a8a3d86f69d96788d6a102dcc2ffe",
                        "pyth": {
                            "feed": "ca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6",
                            "feedObject": "0x8deeebad0a8fb86d97e6ad396cc84639da5a52ae4bbc91c78eb7abbf3e641ed6"
                        }
                    }
                },
                "usdc": {
                    "id": "0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd",
                    "metaData": "0xbeadb2703f2bf464a58ef3cdb363c2ba71ab53ccdce433d052894b78989c40ed",
                    "treasury": "0x06cebd4202dd077813e1fb11dd4f08b7c045b3ef61f89b2ed29085fdf0743b5f",
                    "oracle": {
                        "supra": "",
                        "switchboard": "0xe34bcf55598f7c92b7fe41131c5bded0071f0863cb826d1f8880f1a442401326",
                        "pyth": {
                            "feed": "41f3625971ca2ed2263e78573fe5ce23e13d2558ed3f2e47ab0f84fb9e7ae722",
                            "feedObject": "0xa3d3e81bd7e890ac189b3f581b511f89333b94f445c914c983057e1ac09ff296"
                        }
                    }
                },
                "usdt": {
                    "id": "0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd",
                    "metaData": "0xd8636c1ba598422cac38894c26f9cfe1521ac4be04ae27d72e8ba3a6e4d764f5",
                    "treasury": "0xfcfbec0818911487f86f950fa324e325c789dd2fa3cea38481fb2d884fa2032c",
                    "oracle": {
                        "supra": "",
                        "switchboard": "0xef8b7044faa3cc5350623995e73a1e6e6a11dd38327410d5b988c823fdb22e60",
                        "pyth": {
                            "feed": "1fc18861232290221461220bd4e2acd1dcdfbc89c84092c93c18bdc7756c1588",
                            "feedObject": "0x83f74b8a33b540cbf1edd24e219eac1215d1668a711ca2be3aa5d703763f91db"
                        }
                    }
                },
                "sui": {
                    "id": "",
                    "metaData": "",
                    "treasury": "",
                    "oracle": {
                        "supra": "",
                        "switchboard": "0xf62fa4e71dc90ae4d92c4a1ce146c6bd4229349810b468328ab6ffabf6f64e13",
                        "pyth": {
                            "feed": "50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266",
                            "feedObject": "0xe38dbe2ff3322f1500fff45d0046101f371eebce47c067c5e9233248c4878c28"
                        }
                    }
                }
            },
            "oracles": {
                "xOracle": "0xa16829dc76adbd526c9066e909e324edc3f5d3151cba7c74c86ea77532ff921b",
                "xOracleCap": "0x45941160c121644d5482d38404e4964c341e1afbe9c0379e76433def7a73fa43",
                "switchboard": {
                    "registry": "0x92ab1100382144473cd1efae456eab1f4c9e3e04f83dcfb327c58f11bc61998f",
                    "registryCap": "0xfa72ea81a9a0a986e77caee899af4326f7c0dc96bbb5b2b9bf9d1a2a5345a07a"
                },
                "pyth": {
                    "state": "0xd8afde3a48b4ff7212bd6829a150f43f59043221200d63504d981f62bff2e27a",
                    "wormhole": "0xcc029e2810f17f9f43f52262f40026a71fbdca40ed3803ad2884994361910b7e",
                    "wormholeState": "0xebba4cc4d614f7a7cdbe883acc76d1cc767922bc96778e7b68be0d15fce27c02"
                }
            },
            "packages": {
                "coinDecimalsRegistry": {
                    "id": "0xeafc3d2e82e24a2ef270e6265ba72d7dd6036a743c03fa0e6c2f901fd5e145c0",
                    "upgradeCap": "0x89b94ca221ab4734708e74e496bc4737fe92b4aa1b48949ff3fc683a291aa33d"
                },
                "math": {
                    "id": "0xa0b56ddd51e0d816c0fc985b86f7377b00761910895805448dc6b3aeec677adf",
                    "upgradeCap": "0xebbf16ad136f720de214bb0421c7a5c2e7d09b79018914ba4609d73bef7a86c0"
                },
                "whitelist": {
                    "id": "0x9bad3512db164661beb0ba21f7786f0f17cdcd777c2a0d58e16032e05981d25c",
                    "upgradeCap": "0x3bae741561fdc8826e31145f61c41009f48c2d82c58f42237d89014ea6b1c525"
                },
                "x": {
                    "id": "0x6a216b7f73cb3a7bd448d278a704de8a2b1dac474da91719cb015fbb7824b029",
                    "upgradeCap": "0x2eb858a0cf795e014e433f63569264ed49396a405c0ddd141ff1db21a4fa16f1"
                },
                "protocol": {
                    "id": "0x8941cb2209639cf158059855e5b395d5b05da4385ac21668c8422e9268b9e39b",
                    "upgradeCap": "0x9ddcf80d6a40d83e96a3a3ad9a902268101b547872abeb8eab4fc9021cc0f2bd"
                },
                "query": {
                    "id": "0x9e70ff97501eb23fb6fd7f2dd6fb983b22c031e4ddd3bc84585d9d3cebb7c6ce",
                    "upgradeCap": "0xa89d155ab24ab2b3db0a9c4e7a8f928a8a74aa6a2c78a003f637d73d1dff77af"
                },
                "pyth": {
                    "id": "0x975e063f398f720af4f33ec06a927f14ea76ca24f7f8dd544aa62ab9d5d15f44",
                    "upgradeCap": ""
                },
                "switchboard": {
                    "id": "0xc5e3d08d0c65ba6fe12e822a3186b30ea22dd0efd19f95b21eeba00f60cfcff6",
                    "upgradeCap": "0x91b755d94170f48e61ee814ab106ea4ab759c35af0f738facdd1b5e153b319d9"
                },
                "xOracle": {
                    "id": "0x9a5a259f0690182cc3d99fce6df69c1256f529b79ac6e7f19a29d4de8b4d85a4",
                    "upgradeCap": "0x4b27a0edc6b080eccada3f8d790f89feb32f5d1b5e9bc33ffa2794a03aac47d5"
                },
                "testCoin": {
                    "id": "0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd",
                    "upgradeCap": "0xe2ee88272b72a1cb57673b5879d947b0a8ca41b4c6f862e950ff294c43a27699"
                }
            }
        }
      }
    `);
    const addresses = await addressBuilder.update(
      undefined,
      undefined,
      testAddresse
    );
    console.info('addresses:', addresses);
    expect(!!addresses).toBe(true);
    expect(addresses).not.toEqual(oldAddresses);
  });

  it('Should read and get addresses success', async () => {
    const addressesId = addressBuilder.getId();
    if (addressesId === undefined) await addressBuilder.create();

    await addressBuilder.read();
    const addresses = addressBuilder.getAddresses();
    const allAddresses = addressBuilder.getAllAddresses();
    console.info('addresses:', addresses);
    console.info('allAddresses:', allAddresses);
    expect(addresses).toEqual(allAddresses[NETWORK]);
  });

  it('Should get success', async () => {
    const addressesId = addressBuilder.getId();
    if (addressesId === undefined) await addressBuilder.create();

    const addresses = addressBuilder.getAddresses();
    const usdcCoinId = addressBuilder.get('core.coins.usdc.id');
    console.info('usdcCoinId', usdcCoinId);
    expect(usdcCoinId).toEqual(addresses?.core.coins.usdc?.id);
  });

  it('Should set success', async () => {
    const addressesId = addressBuilder.getId();
    if (addressesId === undefined) await addressBuilder.create();
    const oldUsdcCoinId = addressBuilder.get('core.coins.usdc.id');
    const newAddresses = addressBuilder.set('core.coins.usdc.id', '0x00');
    console.info('usdcCoinId', newAddresses?.core.coins.usdc?.id);
    expect(oldUsdcCoinId).not.toEqual(newAddresses?.core.coins.usdc?.id);
    await addressBuilder.delete();
  });
});
