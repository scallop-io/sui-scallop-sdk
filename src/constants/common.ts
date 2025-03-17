export const API_BASE_URL = 'https://sui.apis.scallop.io' as const;
export const SDK_API_BASE_URL = 'https://sdk.api.scallop.io' as const;

export const IS_VE_SCA_TEST: boolean = false;
export const USE_TEST_ADDRESS: boolean = false;

export const SCA_COIN_TYPE = IS_VE_SCA_TEST
  ? (`0x6cd813061a3adf3602b76545f076205f0c8e7ec1d3b1eab9a1da7992c18c0524::sca::SCA` as const)
  : ('0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA' as const);

export const OLD_BORROW_INCENTIVE_PROTOCOL_ID =
  '0xc63072e7f5f4983a2efaf5bdba1480d5e7d74d57948e1c7cc436f8e22cbeb410' as const;
