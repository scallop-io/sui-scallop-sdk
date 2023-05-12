import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { ScallopAddress } from '../src';
import type { AddressesInterface } from '../src';

dotenv.config();

const NETWORK: NetworkType = 'testnet';

describe('Test Scallop Address', () => {
  const addressBuilder = new ScallopAddress({
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

  it('Should get new addresses after update', async () => {
    const addressesId = addressBuilder.getId();
    let oldAddresses: AddressesInterface | undefined = undefined;
    if (addressesId === undefined) {
      oldAddresses = await addressBuilder.create();
    } else {
      oldAddresses = addressBuilder.getAddresses();
    }
    // TODO: update to laterst addresses format
    const testAddresse: AddressesInterface = JSON.parse(`
        {
            "core": {
                "id": "0xb54385dbc62036a585fa07b12c567e852ae9f7adfc035607716682b3676e9e39",
                "market": "0x141c541b4bee3ee945b5e741baf5aa78f7b1d9314dd00216581d9f9b98a7df2a",
                "adminCap": "0xb8156e2e1323d735e0ab1d723e2947650638186ded78f88badc5263ab0d249bd",
                "coinDecimalsRegistry": "0x59d53c9cededc076db29e760f79aae3caffa586db6a3c78f13d9abbaf4c71155",
                "coins": {
                    "eth": {
                        "id": "0x0e4adb8afe2949d5079d5265c017501b554d2db370ba5f48928e9a5b523697f1",
                        "treasury": "0xe74f3b3916a3fe8c1fddf9e0c09728dfa74ac6246190daf18bd6add3d430667a",
                        "metaData": "0x0f9bda4f6c305aa17e56408732a45c5caf0d4b25b0b3b00aa3d68a2ce1015b20",
                        "oracle": {
                            "pyth": "",
                            "switchboard": "0x031dd2fd65b4eeedf5db83c68c5c59dd79fcd161f0c48f9904201d5e9fa731e3"
                        }
                    },
                    "btc": {
                        "id": "0x975af92c514ce9fdb526a21dcc43321571af8cb6d0dc3f3d504cebe7d61e766a",
                        "treasury": "0xed7951b4a2c81d80eefd4ea06ff2635c004babfbc8e771ee2ec00b44d36c52bc",
                        "metaData": "0x402af02da9cf14ac9ef44d7e4dfdf167cd52f2fa1c18b03b585877fcf761826c",
                        "oracle": {
                            "pyth": "",
                            "switchboard": "0x3033d0ae6c933c567d98f67b796b2060a70a37d8b5f00881d25471a1ca66c7ca"
                        }
                    },
                    "usdt": {
                        "id": "0xdf7473ff6b9073a46565a42364cedf9c18df07b9af55627b375d9a4fcc4ae3bb",
                        "treasury": "0xae98a507816b6cc80d61c3cd839da7b0b1bd4abbd4be9cb233d7e987df997a0f",
                        "metaData": "0x43318720dda2a8c865431f4c6a4049e69f1929d27810179b4f987241fd26df47",
                        "oracle": {
                            "pyth": "",
                            "switchboard": "0x373f47bc9d12fa32e66536dd8448f492571b2bb63dc9f1473708fd2a37485f81"
                        }
                    },
                    "usdc": {
                        "id": "0x441b7770f5e48263b73611b788257773cfbb80afa0ca71c9444cda9290f281b9",
                        "treasury": "0xe556ee2074b761dd637e3ea649e62f340d5887a1970e64676a932a0890b5059e",
                        "metaData": "0xbd88ede23f0c70044485e4f4d319d5bb33f068d9a6320071f94afb16760d24a0",
                        "oracle": {
                            "pyth": "",
                            "switchboard": "0xb950ed66a848afef733a5539e84969a58113210f657747015ccacaff196fce8e"
                        }
                    },
                    "sui": {
                        "id": "",
                        "treasury": "",
                        "metaData": "",
                        "oracle": {
                            "pyth": "",
                            "switchboard": "0xcb5d798fa6408f7f53562801fd0f224784fe26475b3cbdc091b9092e00c2f9c6"
                        }
                    }
                },
                "oracle": {
                    "switchboard": {
                        "registry": "0x1f298764ae13e9228f556baaa7c2c2b7f224a3a52d41819db2dba73cf9b9a5b6",
                        "registryCap": "0x65253cd96605cca9fbf05a77407897600a42fd0313fe2e8b9adc442c47516a91",
                        "bundle": "0x30701b882c3c079f719927aef6fe7a3911af6c688f9cdd0c9c60c924f2b9abef"
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
