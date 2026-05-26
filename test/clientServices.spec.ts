import { describe, expect, it, vi } from 'vitest';
import {
  BorrowService,
  CollateralService,
  LendingService,
  ReferralService,
  SpoolService,
  VeScaService,
} from 'src/services/index.js';
import { noopLogger } from 'src/logger/index.js';
import type ScallopClient from 'src/models/scallopClient.js';

const createTxBlock = () => {
  const txBlock = {
    txBlock: { kind: 'tx' },
    setSender: vi.fn(),
    transferObjects: vi.fn(),
    mergeCoins: vi.fn(),
    supplyQuick: vi.fn(async () => 'sCoin'),
    withdrawQuick: vi.fn(async () => 'coin'),
    borrowFlashLoan: vi.fn(() => ['loanCoin', 'loan']),
    repayFlashLoan: vi.fn(),
    depositCollateralQuick: vi.fn(),
    openObligation: vi.fn(() => ['obligation', 'obligationKey', 'hotPotato']),
    openObligationEntry: vi.fn(),
    returnObligation: vi.fn(),
    takeCollateralQuick: vi.fn(async () => 'collateralCoin'),
    borrowQuick: vi.fn(async () => 'borrowedCoin'),
    repayQuick: vi.fn(async () => undefined),
    unstakeObligationQuick: vi.fn(async () => undefined),
    stakeObligationWithVeScaQuick: vi.fn(async () => undefined),
    claimBorrowIncentiveQuick: vi.fn(async () => 'rewardCoin'),
    createStakeAccount: vi.fn(() => 'newStakeAccount'),
    stakeQuick: vi.fn(async () => undefined),
    unstakeQuick: vi.fn(async () => 'unstakedMarketCoin'),
    claimQuick: vi.fn(async () => ['rewardA']),
    withdraw: vi.fn(() => 'withdrawnCoin'),
    lockScaQuick: vi.fn(async () => undefined),
    extendLockPeriodQuick: vi.fn(async () => undefined),
    extendLockAmountQuick: vi.fn(async () => undefined),
    redeemScaQuick: vi.fn(async () => 'scaCoin'),
    bindToReferral: vi.fn(),
    burnReferralTicket: vi.fn(),
    claimReferralRevenueQuick: vi.fn(async () => undefined),
  };
  return txBlock;
};

const createClient = (txBlock = createTxBlock()) => {
  const client = {
    walletAddress: '0xsender',
    builder: {
      createTxBlock: vi.fn(() => txBlock),
    },
    query: {
      getObligations: vi.fn(async () => []),
      getObligationAccount: vi.fn(async () => undefined),
      getStakeAccounts: vi.fn(async () => []),
      getVeScas: vi.fn(async () => []),
    },
    constants: {
      whitelist: {
        lending: new Set<string>(['sui']),
      },
    },
    utils: {
      logger: noopLogger,
      parseMarketCoinName: (n: string) => `s${n}`,
      parseCoinName: (n: string) => n.replace(/^s/, ''),
      parseCoinType: (n: string) => `0x1::${n}::${n.toUpperCase()}`,
      parseSCoinType: (n: string) => `0x1::s${n}::S${n.toUpperCase()}`,
      mergeSimilarCoins: vi.fn(async () => undefined),
    },
    scallopSuiKit: {
      signAndSendTxn: vi.fn(async () => ({ effects: { status: 'success' } })),
    },
  };
  return { client: client as unknown as ScallopClient, txBlock };
};

describe('client services', () => {
  it('LendingService builds supply transactions', async () => {
    const { client, txBlock } = createClient();
    const service = new LendingService(client);

    const result = await service.supply('sui', 1, false);

    expect(result).toBe(txBlock.txBlock);
    expect(txBlock.setSender).toHaveBeenCalledWith('0xsender');
    expect(txBlock.supplyQuick).toHaveBeenCalledWith(1, 'sui');
    expect(txBlock.transferObjects).toHaveBeenCalledWith(['sCoin'], '0xsender');
  });

  it('LendingService builds flash-loan transactions', async () => {
    const { client, txBlock } = createClient();
    const service = new LendingService(client);

    await service.flashLoan('sui', 10, (_tx, coin) => `${coin}Return`, false);

    expect(txBlock.borrowFlashLoan).toHaveBeenCalledWith(10, 'sui');
    expect(txBlock.repayFlashLoan).toHaveBeenCalledWith(
      'loanCoinReturn',
      'loan',
      'sui'
    );
  });

  it('CollateralService opens an obligation when needed', async () => {
    const { client, txBlock } = createClient();
    const service = new CollateralService(client);

    await service.depositCollateral('sui', 1, false);

    expect(txBlock.openObligation).toHaveBeenCalled();
    expect(txBlock.depositCollateralQuick).toHaveBeenCalledWith(
      1,
      'sui',
      'obligation',
      undefined
    );
    expect(txBlock.returnObligation).toHaveBeenCalledWith(
      'obligation',
      'hotPotato'
    );
    expect(txBlock.transferObjects).toHaveBeenCalledWith(
      ['obligationKey'],
      '0xsender'
    );
  });

  it('CollateralService builds withdraw collateral transactions', async () => {
    const { client, txBlock } = createClient();
    const service = new CollateralService(client);

    await service.withdrawCollateral('sui', 1, false, 'obligation', 'key');

    expect(txBlock.takeCollateralQuick).toHaveBeenCalledWith(
      1,
      'sui',
      'obligation',
      'key',
      { isSponsoredTx: undefined }
    );
    expect(txBlock.transferObjects).toHaveBeenCalledWith(
      ['collateralCoin'],
      '0xsender'
    );
  });

  it('BorrowService.openObligation runs openObligationEntry', async () => {
    const { client, txBlock } = createClient();
    const service = new BorrowService(client);
    await service.openObligation(false);
    expect(txBlock.openObligationEntry).toHaveBeenCalled();
  });

  it('BorrowService.borrow does not auto stake/unstake when sign=false', async () => {
    const { client, txBlock } = createClient();
    const service = new BorrowService(client);
    await service.borrow('sui', 10, false, 'obligation', 'key');
    expect(txBlock.borrowQuick).toHaveBeenCalledWith(
      10,
      'sui',
      'obligation',
      'key',
      { isSponsoredTx: undefined }
    );
    expect(txBlock.unstakeObligationQuick).not.toHaveBeenCalled();
    expect(txBlock.stakeObligationWithVeScaQuick).not.toHaveBeenCalled();
    expect(txBlock.transferObjects).toHaveBeenCalledWith(
      ['borrowedCoin'],
      '0xsender'
    );
  });

  it('BorrowService.repay calls repayQuick', async () => {
    const { client, txBlock } = createClient();
    const service = new BorrowService(client);
    await service.repay('sui', 5, false, 'obligation', 'key');
    expect(txBlock.repayQuick).toHaveBeenCalledWith(
      5,
      'sui',
      'obligation',
      undefined
    );
  });

  it('SpoolService.createStakeAccount transfers new account', async () => {
    const { client, txBlock } = createClient();
    const service = new SpoolService(client);
    await service.createStakeAccount('ssui', false);
    expect(txBlock.createStakeAccount).toHaveBeenCalledWith('ssui');
    expect(txBlock.transferObjects).toHaveBeenCalledWith(
      ['newStakeAccount'],
      '0xsender'
    );
  });

  it('SpoolService.claim transfers reward coins', async () => {
    const { client, txBlock } = createClient();
    const service = new SpoolService(client);
    await service.claim('ssui', false);
    expect(txBlock.claimQuick).toHaveBeenCalledWith('ssui', undefined);
    expect(txBlock.transferObjects).toHaveBeenCalledWith(
      ['rewardA'],
      '0xsender'
    );
  });

  it('VeScaService.lockSca forwards params and signs when requested', async () => {
    const { client, txBlock } = createClient();
    const service = new VeScaService(client);
    await service.lockSca({ amountOrCoin: 10, lockPeriodInDays: 7 }, false);
    expect(txBlock.lockScaQuick).toHaveBeenCalledWith({
      amountOrCoin: 10,
      lockPeriodInDays: 7,
    });
  });

  it('VeScaService.claimAllUnlockedSca throws when wallet has no veSCA', async () => {
    const { client } = createClient();
    const service = new VeScaService(client);
    await expect(service.claimAllUnlockedSca(false)).rejects.toThrow(
      'No veSCA found in the wallet'
    );
  });

  it('ReferralService.bindToReferral calls tx-block bindToReferral', async () => {
    const { client, txBlock } = createClient();
    const service = new ReferralService(client);
    await service.bindToReferral('0xveScaKey', false);
    expect(txBlock.bindToReferral).toHaveBeenCalledWith('0xveScaKey');
  });

  it('ReferralService.claimReferralRevenue defaults to lending whitelist coin names', async () => {
    const { client, txBlock } = createClient();
    const service = new ReferralService(client);
    await service.claimReferralRevenue('0xveScaKey', undefined, false);
    expect(txBlock.claimReferralRevenueQuick).toHaveBeenCalledWith(
      '0xveScaKey',
      ['sui']
    );
  });

  it('ReferralService.burnReferralTicket forwards ticket + pool name', async () => {
    const { client, txBlock } = createClient();
    const service = new ReferralService(client);
    await service.burnReferralTicket('ticket', 'sui', false);
    expect(txBlock.burnReferralTicket).toHaveBeenCalledWith('ticket', 'sui');
  });
});
