import { SupportPoolCoins } from 'src/types';

export const POOL_ADDRESSES: Record<
  SupportPoolCoins,
  {
    lendingPoolAddress: string;
    collateralPoolAddress: string;
  }
> = {
  usdc: {
    lendingPoolAddress:
      '0xd3be98bf540f7603eeb550c0c0a19dbfc78822f25158b5fa84ebd9609def415f',
    collateralPoolAddress:
      '0x8f0d529ba179c5b3d508213003eab813aaae31f78226099639b9a69d1aec17af',
  },
  sbeth: {
    lendingPoolAddress:
      '0x5f08c4f71d56dd3342c452cc70ffc47f2f4180146d821941b0b9c04761bb42e7',
    collateralPoolAddress:
      '0xce0549a1cbe952e734f56646988e6b02bbae14667889a60e24d0d03540a6119f',
  },
  weth: {
    lendingPoolAddress:
      '0xc8fcdff48efc265740ae0b74aae3faccae9ec00034039a113f3339798035108c',
    collateralPoolAddress:
      '0xad7ced91ed6e7f2b81805561eee27fa6f3e72fdae561077334c7248583db4dbf',
  },
  wbtc: {
    lendingPoolAddress:
      '0x65cc08a5aca0a0b8d72e1993ded8d145f06dd102fd0d8f285b92934faed564ab',
    collateralPoolAddress:
      '0x1aa4e5cf743cd797b4eb8bf1e614f80ae2cf556ced426cddaaf190ffcd0e59c3',
  },
  wusdc: {
    lendingPoolAddress:
      '0x9c9077abf7a29eebce41e33addbcd6f5246a5221dd733e56ea0f00ae1b25c9e8',
    collateralPoolAddress:
      '0x75aacfb7dcbf92ee0111fc1bf975b12569e4ba632e81ed7ae5ac090d40cd3acb',
  },
  wusdt: {
    lendingPoolAddress:
      '0xfbc056f126dd35adc1f8fe985e2cedc8010e687e8e851e1c5b99fdf63cd1c879',
    collateralPoolAddress:
      '0x2260cb5b24929dd20a1742f37a61ff3ce4fde5cdb023e2d3ce2e0ce2d90719e3',
  },
  sui: {
    lendingPoolAddress:
      '0x9c9077abf7a29eebce41e33addbcd6f5246a5221dd733e56ea0f00ae1b25c9e8',
    collateralPoolAddress:
      '0x75aacfb7dcbf92ee0111fc1bf975b12569e4ba632e81ed7ae5ac090d40cd3acb',
  },
  wapt: {
    lendingPoolAddress:
      '0xca8c14a24e0c32b198eaf479a3317461e3cc339097ce88eaf296a15df8dcfdf5',
    collateralPoolAddress:
      '0xde33f9ac5bb0ed34598da4e64b4983832716ced65f172fbf267bcfe859c4ad9c',
  },
  wsol: {
    lendingPoolAddress:
      '0x985682c42984cdfb03f9ff7d8923344c2fe096b1ae4b82ea17721af19d22a21f',
    collateralPoolAddress:
      '0xdc1cc2c371a043ae8e3c3fe2d013c35f1346960b7dbb4c072982c5b794ed144f',
  },
  cetus: {
    lendingPoolAddress:
      '0xc09858f60e74a1b671635bec4e8a2c84a0ff313eb87f525fba3258e88c6b6282',
    collateralPoolAddress:
      '0xe363967e29b7b9c1245d6d46d63e719de8f90b37e3358c545b55d945ea0b676a',
  },
  afsui: {
    lendingPoolAddress:
      '0x9b942a24ce390b7f5016d34a0217057bf9487b92aa6d7cc9894271dbbe62471a',
    collateralPoolAddress:
      '0xe5e56f5c0e3072760b21f9d49a5cc793f37d736c412a9065c16e1265c74e6341',
  },
  hasui: {
    lendingPoolAddress:
      '0x7ebc607f6bdeb659fb6506cb91c5cc1d47bb365cfd5d2e637ea765346ec84ed4',
    collateralPoolAddress:
      '0xad9ed40d6486e4c26cec7370dffce8dc4821eb79178250b5938a34ccafd61e6d',
  },
  vsui: {
    lendingPoolAddress:
      '0xda9257c0731d8822e8a438ebced13415850d705b779c79958dcf2aeb21fcb43d',
    collateralPoolAddress:
      '0x4435e8b8ec2a04094d863aa52deb6ab6f8f47ed8778f4d9f1b27afc4a6e85f1e',
  },
  sca: {
    lendingPoolAddress:
      '0x6fc7d4211fc7018b6c75e7b908b88f2e0536443239804a3d32af547637bd28d7',
    collateralPoolAddress:
      '0xff677a5d9e9dc8f08f0a8681ebfc7481d1c7d57bc441f2881974adcdd7b13c31',
  },
  fud: {},
  deep: {},
};
