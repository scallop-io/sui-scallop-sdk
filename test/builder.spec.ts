import { describe, it, expect, beforeAll } from 'vitest';
import {
  MAX_LOCK_ROUNDS,
  Obligation,
  SCA_COIN_TYPE,
  Scallop,
  ScallopBuilder,
  UNLOCK_ROUND_DURATION,
  Vesca,
} from '../src';
import { SuiTxBlock, Transaction } from '@scallop-io/sui-kit';
import { scallopSDK } from './scallopSdk';
import { updateOracles } from 'src/builders/oracles';

const ENABLE_LOG = false;
const COIN_NAME = 'sui';
const COIN_AMOUNT = 1e5;
const veScaReferral =
  '0xad50994e23ae4268fc081f477d0bdc3f1b92c7049c9038dedec5bac725273d18' as const;
const OTHER_VESCA_KEY =
  '0xb840d39a2ee0056cf022e286d4dc6b0e543bdcb0fcae2c828af02b39d11532bc' as const;
const expiredVeScaKey =
  '0x0515056c4a6ee46007b1e53356c51ca99bf772629a656d4ff24554417713bfcd' as const;

let scallopBuilder: ScallopBuilder;
let sender: string;
let obligations: Obligation[] = [];
let veScas: Vesca[] = [];
let hasVeSca = veScas.length > 0;
let isVeScaExpired =
  hasVeSca && veScas[0].unlockAt * 1000 <= new Date().getTime();

let hasSCoinInWallet = false;
let bindedObligationId: string | null;
let obligationWithBoost: Obligation | undefined;

const createNewVeScaTx = async (
  tx = scallopBuilder.createTxBlock(),
  initialLockPeriodInDays: number = 1
) => {
  tx.setSender(sender);

  const lockAmount = 10 * 10 ** 9;
  const lockPeriodInDays = initialLockPeriodInDays;
  const newUnlockAt = scallopBuilder.utils.getUnlockAt(lockPeriodInDays);
  const coins = await scallopBuilder.utils.selectCoins(
    lockAmount,
    SCA_COIN_TYPE,
    sender
  );
  const [takeCoin, leftCoin] = tx.takeAmountFromCoins(coins, lockAmount);
  const scaCoin = takeCoin;
  tx.transferObjects([leftCoin], sender);

  const veScaKey = tx.lockSca(scaCoin, newUnlockAt);
  return { tx, veScaKey };
};

const createNotExpiredVeScaTx = async () => {
  const tx = scallopBuilder.createTxBlock();
  tx.setSender(sender);

  const lockPeriodInDays = 7; // lock for 1 day
  const lockAmount = 10 * 10 ** 9;
  await tx.renewExpiredVeScaQuick(
    lockAmount,
    lockPeriodInDays,
    expiredVeScaKey
  );
  return tx;
};

const createExpiredEmptyVeScaTx = () => {
  const tx = scallopBuilder.createTxBlock();
  tx.setSender(sender);

  tx.redeemSca(expiredVeScaKey);
  return tx;
};

const createRandomWalletAccountBuilder = async () => {
  const scallopSDK = new Scallop({
    addressId: '67c44a103fe1b8c454eb9699',
    secretKey: '',
    networkType: 'mainnet',
  });
  const scallopBuilder = await scallopSDK.createScallopBuilder();
  return scallopBuilder;
};

const createVeScasForMergeSplit = async () => {
  const initialLockPeriodInDays: number = 1;

  const tx = scallopBuilder.createTxBlock();
  tx.setSender(sender);

  const lockAmount = 10 * 10 ** 9; // make sure to have 20 SCA in the wallet
  const lockPeriodInDays = initialLockPeriodInDays;
  const newUnlockAt = scallopBuilder.utils.getUnlockAt(lockPeriodInDays);
  const coins = await scallopBuilder.utils.selectCoins(
    lockAmount * 2,
    SCA_COIN_TYPE,
    sender
  );

  const merged = coins[0];
  if (coins.length > 1) {
    tx.mergeCoins(merged, coins.slice(1));
  }
  const [scaCoin1] = tx.splitCoins(merged, [lockAmount]);
  const [scaCoin2] = tx.splitCoins(merged, [lockAmount]);

  const veScaKey1 = tx.lockSca(scaCoin1, newUnlockAt);
  const veScaKey2 = tx.lockSca(scaCoin2, newUnlockAt);
  return { tx, veScaKey1, veScaKey2 };
};

beforeAll(async () => {
  scallopBuilder = await scallopSDK.createScallopBuilder();
  sender = scallopBuilder.walletAddress;
  obligations = await scallopBuilder.query.getObligations();
  veScas = await scallopBuilder.query.getVeScas({ walletAddress: sender });
  hasVeSca = veScas.length > 0;
  isVeScaExpired =
    hasVeSca && veScas[0].unlockAt * 1000 <= new Date().getTime();

  try {
    const sCoinName = scallopBuilder.utils.parseSCoinName(COIN_NAME);
    if (!sCoinName) throw new Error(`No sCoin for ${COIN_NAME}`);
    const sCoins = await scallopBuilder.suiKit.selectCoinsWithAmount(
      COIN_AMOUNT,
      sCoinName,
      sender
    );
    hasSCoinInWallet = sCoins.length > 0;
  } catch (_e) {
    // no sCoin, just ignore
  }

  if (hasVeSca) {
    bindedObligationId = await scallopBuilder.query.getBindedObligationId(
      veScas[0].keyId
    );
    obligationWithBoost = obligations.find(
      ({ id }) => id === bindedObligationId
    );
  }
  console.info('Sender:', sender);
});

describe('Test Scallop Core Builder', () => {
  const SUPPLY_COIN_NAME = 'sui';
  const COLLATERAL_COIN_NAME = 'sui';
  const BORROW_COIN_NAME = 'sui';

  it('"openObligationEntry" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.openObligationEntry();
    const openObligationResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'OpenObligationResult:',
        openObligationResult.effects.status.error
      );
    }
    expect(openObligationResult.effects?.status.status).toEqual('success');
  });

  it('"addCollateralQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "addCollateralQuick".
    tx.setSender(sender);
    await tx.addCollateralQuick(10 ** 7, COLLATERAL_COIN_NAME);
    const addCollateralQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'AddCollateralQuickResult:',
        addCollateralQuickResult.effects.status.error
      );
    }
    expect(addCollateralQuickResult.effects?.status.status).toEqual('success');
  });

  it('"takeCollateralQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "takeCollateralQuick".
    tx.setSender(sender);
    const coin = await tx.takeCollateralQuick(10 ** 7, COLLATERAL_COIN_NAME);
    tx.transferObjects([coin], sender);
    const takeCollateralQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'TakeCollateralQuickResult:',
        takeCollateralQuickResult.effects.status.error
      );
    }
    expect(takeCollateralQuickResult.effects?.status.status).toEqual('success');
  });

  it('"depositQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "depositQuick".
    tx.setSender(sender);
    const marketCoin = await tx.depositQuick(10 ** 7, SUPPLY_COIN_NAME);
    tx.transferObjects([marketCoin], sender);
    const depositQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'DepositQuickResult:',
        depositQuickResult.effects.status.error
      );
    }
    expect(depositQuickResult.effects?.status.status).toEqual('success');
  });

  it('"withdrawQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "withdrawQuick".
    tx.setSender(sender);
    const coin = await tx.withdrawQuick(10 ** 7, SUPPLY_COIN_NAME);
    tx.transferObjects([coin], sender);
    const withdrawQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'WithdrawQuickResult:',
        withdrawQuickResult.effects.status.error
      );
    }
    expect(withdrawQuickResult.effects?.status.status).toEqual('success');
  });

  it('"borrowQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "borrowQuick".
    tx.setSender(sender);
    const borrowedCoin = await tx.borrowQuick(4 * 10 ** 7, BORROW_COIN_NAME);
    // Transfer borrowed coin to sender.
    tx.transferObjects([borrowedCoin], sender);
    const borrowQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'BorrowQuickResult:',
        borrowQuickResult.effects.status.error
      );
    }
    expect(borrowQuickResult.effects?.status.status).toEqual('success');
  });

  it('"repayQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "repayQuick".
    tx.setSender(sender);
    await tx.repayQuick(4 * 10 ** 7, BORROW_COIN_NAME);
    const repayQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('RepayQuickResult:', repayQuickResult.effects.status.error);
    }
    expect(repayQuickResult.effects?.status.status).toEqual('success');
  });

  it('"borrowFlashLoan" & "repayFlashLoan" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const SUPPLY_COIN_NAME = 'wusdc';
    const FLASHLOAN_AMOUNT = 10 ** 5;
    const [coin, loan] = await tx.borrowFlashLoan(
      FLASHLOAN_AMOUNT,
      SUPPLY_COIN_NAME
    );

    const FLASHLOAN_FEE = Math.ceil(0.07 * FLASHLOAN_AMOUNT);
    const { takeCoin, leftCoin } = await scallopBuilder.selectCoin(
      tx,
      SUPPLY_COIN_NAME,
      FLASHLOAN_FEE
    );

    tx.mergeCoins(coin, [takeCoin]);
    tx.transferObjects([leftCoin], sender);
    tx.repayFlashLoan(coin, loan, SUPPLY_COIN_NAME);
    const borrowFlashLoanResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'BorrowFlashLoanResult:',
        borrowFlashLoanResult.effects.status.error
      );
    }
    expect(borrowFlashLoanResult.effects?.status.status).toEqual('success');
  });

  it('"ScallopTxBlock" should be an instance of "Transaction"', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);
    expect(tx.txBlock).toBeInstanceOf(Transaction);
    /**
     * For example, you can do the following:
     * 1. split SUI from gas.
     * 2. depoit SUI to Scallop.
     * 3. transfer SUI Market Coin to sender.
     */
    const suiTxBlock = tx.txBlock;
    const [coin] = suiTxBlock.splitCoins(suiTxBlock.gas, [10 ** 6]);
    const marketCoin = await tx.deposit(coin, SUPPLY_COIN_NAME);
    suiTxBlock.transferObjects([marketCoin], suiTxBlock.pure.address(sender));
    const txBlockResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('TxBlockResult:', txBlockResult.effects.status.error);
    }
    expect(txBlockResult.effects?.status.status).toEqual('success');
  });

  it('"updateAssetPricesQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "updateAssetPricesQuick".
    tx.setSender(sender);
    await tx.updateAssetPricesQuick([SUPPLY_COIN_NAME]);
    const updateAssetPricesResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'UpdateAssetPricesResult:',
        updateAssetPricesResult.effects.status.error
      );
    }
    expect(updateAssetPricesResult.effects?.status.status).toEqual('success');
  });
});

describe('Test Scallop Spool Builder', () => {
  it('"createStakeAccount" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    const stakeAccount = tx.createStakeAccount('ssui');
    tx.transferObjects([stakeAccount], sender);
    const createStakeAccountResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'CreateStakeAccountResult:',
        createStakeAccountResult.effects.status.error
      );
    }
    expect(createStakeAccountResult.effects?.status.status).toEqual('success');
  });

  it('"stakeQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "stakeQuick".
    tx.setSender(sender);
    await tx.stakeQuick(10 ** 6, 'ssui');
    const stakeQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('StakeQuickResult:', stakeQuickResult.effects.status.error);
    }
    expect(stakeQuickResult.effects?.status.status).toEqual('success');
  });

  it('"unstakeQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "unstakeQuick".
    tx.setSender(sender);
    const marketCoin = await tx.unstakeQuick(10 ** 6, 'ssui');
    expect(marketCoin).not.toBeUndefined();
    tx.transferObjects([marketCoin], sender);
    const unstakeQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'UnstakeQuickResult:',
        unstakeQuickResult.effects.status.error
      );
    }
    expect(unstakeQuickResult.effects?.status.status).toEqual('success');
  });

  it('"claimQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "claimQuick".
    tx.setSender(sender);
    const rewardCoins = await tx.claimQuick('ssui');
    tx.transferObjects(rewardCoins, sender);
    const claimQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('ClaimQuickResult:', claimQuickResult.effects.status.error);
    }
    expect(claimQuickResult.effects?.status.status).toEqual('success');
  });
});

describe('Test Scallop Borrow Incentive Builder', () => {
  it('"stakeObligationQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "stakeObligationQuick".
    tx.setSender(sender);
    await tx.stakeObligationQuick();
    const stakeObligationQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'StakeObligationQuickResult:',
        stakeObligationQuickResult.effects.status.error
      );
    }
    expect(stakeObligationQuickResult.effects?.status.status).toEqual(
      'success'
    );
  });

  it('"unstakeObligationQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "unstakeObligationQuick".
    tx.setSender(sender);
    await tx.unstakeObligationQuick();
    const unstakeObligationQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'UnstakeObligationQuickResult:',
        unstakeObligationQuickResult.effects.status.error
      );
    }
    expect(unstakeObligationQuickResult.effects?.status.status).toEqual(
      'success'
    );
  });

  it('"claimBorrowIncentiveQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "claimQuick".
    tx.setSender(sender);
    const rewardCoin = await tx.claimBorrowIncentiveQuick('sui', 'sui');
    tx.transferObjects([rewardCoin], sender);
    const claimBorrowIncentiveQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'ClaimBorrowIncentiveQuickResult:',
        claimBorrowIncentiveQuickResult
      );
    }
    expect(claimBorrowIncentiveQuickResult.effects?.status.status).toEqual(
      'success'
    );
  });

  if (obligations.length > 0) {
    it('"stakeObligationWithVeScaQuick" should succeed on non boosted obligation', async () => {
      const { id, keyId } = obligations[0];
      const tx = scallopBuilder.createTxBlock();
      // Sender is required to invoke "stakeObligationWithVeScaQuick".
      tx.setSender(sender);
      await tx.unstakeObligationQuick(id, keyId);
      await tx.stakeObligationWithVeScaQuick(id, keyId);
      const stakeObligationWithVeScaQuickResult =
        await scallopBuilder.suiKit.inspectTxn(tx);
      if (ENABLE_LOG) {
        console.info(
          'StakeObligationWithVeScaQuickResult:',
          stakeObligationWithVeScaQuickResult.effects.status.error
        );
      }
      expect(
        stakeObligationWithVeScaQuickResult.effects?.status.status
      ).toEqual('success');
    });

    it('"stakeObligationWithVeScaQuick" with not owned veScaKey should fail on non boosted obligation', async () => {
      const { id, keyId } = obligations[0];
      const tx = scallopBuilder.createTxBlock();
      // Sender is required to invoke "stakeObligationWithVeScaQuick".
      tx.setSender(sender);
      // unstake first
      await tx.unstakeObligationQuick(id, keyId);
      await tx.stakeObligationWithVeScaQuick(
        id,
        keyId,
        OTHER_VESCA_KEY // use someone's veScaKey
      );
      const stakeObligationWithVeScaQuickResult =
        await scallopBuilder.suiKit.inspectTxn(tx);
      if (ENABLE_LOG) {
        console.info(
          'StakeObligationWithVeScaQuickResult:',
          stakeObligationWithVeScaQuickResult.effects
        );
      }
      expect(
        stakeObligationWithVeScaQuickResult.effects?.status.status
      ).toEqual('failure');
    });

    if (veScas.length > 0) {
      if (obligationWithBoost) {
        const { id, keyId } = obligationWithBoost;
        it('"stakesObligationWithVeScaQuick" with correct veScakey on boosted obligation should succeed', async () => {
          const tx = scallopBuilder.createTxBlock();
          tx.setSender(sender);
          await tx.unstakeObligationQuick(id, keyId);
          await tx.stakeObligationWithVeScaQuick(id, keyId, veScas[0].keyId);
          const stakeObligationWithVeScaQuickResult =
            await scallopBuilder.suiKit.inspectTxn(tx);
          if (ENABLE_LOG) {
            console.info(
              'StakeObligationWithVeScaQuickResult:',
              stakeObligationWithVeScaQuickResult.effects.status.error
            );
          }
          expect(
            stakeObligationWithVeScaQuickResult.effects?.status.status
          ).toEqual('success');
        });

        it('"stakesObligationWithVeScaQuick" with incorrect veScakey on boosted obligation should auto switch to correct binded obligation automatically and succeed', async () => {
          const tx = scallopBuilder.createTxBlock();
          tx.setSender(sender);
          await tx.unstakeObligationQuick(id, keyId);
          await tx.stakeObligationWithVeScaQuick(id, keyId, OTHER_VESCA_KEY);
          const stakeObligationWithVeScaQuickResult =
            await scallopBuilder.suiKit.inspectTxn(tx);
          if (ENABLE_LOG) {
            console.info(
              'StakeObligationWithVeScaQuickResult:',
              stakeObligationWithVeScaQuickResult.effects.status.error
            );
          }
          expect(
            stakeObligationWithVeScaQuickResult.effects?.status.status
          ).toEqual('success');
        });

        it('"deactivateBoost" should success', async () => {
          const tx = scallopBuilder.createTxBlock();
          tx.setSender(sender);
          tx.deactivateBoost(id, veScas[0].keyId);
          const stakeObligationWithVeScaQuickResult =
            await scallopBuilder.suiKit.inspectTxn(tx);
          if (ENABLE_LOG) {
            console.info(
              'StakeObligationWithVeScaQuickResult:',
              stakeObligationWithVeScaQuickResult.effects.status.error
            );
          }
          expect(
            stakeObligationWithVeScaQuickResult.effects?.status.status
          ).toEqual('success');
        });

        if (veScas[1]?.keyId)
          it('"stakesObligationWithVeScaQuick" with other veScaKey after "deactivateBoost" should success', async () => {
            const tx = scallopBuilder.createTxBlock();
            tx.setSender(sender);
            tx.deactivateBoost(id, veScas[0].keyId);
            await tx.unstakeObligationQuick(id, keyId);
            await tx.stakeObligationWithVeScaQuick(id, keyId, veScas[1].keyId);
            const stakeObligationWithVeScaQuickResult =
              await scallopBuilder.suiKit.inspectTxn(tx);
            if (ENABLE_LOG) {
              console.info(
                'StakeObligationWithVeScaQuickResult:',
                stakeObligationWithVeScaQuickResult.effects.status.error
              );
            }
            expect(
              stakeObligationWithVeScaQuickResult.effects?.status.status
            ).toEqual('success');
          });
      }
    }
  }
});

describe('Test Scallop VeSca Builder', () => {
  // ----------------------------- No VeSCA ----------------------------------

  if (!hasVeSca) {
    it('lockScaQuick" Initial lock with auto check should succeed', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockPeriodInDays = 1; // lock for 1 day

      await tx.lockScaQuick(10 * 10 ** 9, lockPeriodInDays);
      const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
      if (ENABLE_LOG) {
        console.info(
          'LockScaQuickResult:',
          lockScaQuickResult.effects.status.error
        );
      }
      expect(lockScaQuickResult.effects.status.status).toEqual('success');
    });

    it('"lockScaQuick" Initial lock with auto check (lock more than 1460 days) should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      tx.setSender(sender);
      const lockPeriodInDays = 1461;

      await expect(
        tx.lockScaQuick(10 * 10 ** 9, lockPeriodInDays)
      ).rejects.toThrow(
        Error(`Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`)
      );
    });

    it('"lockScaQuick" Initial lock with auto check (lock less than 10 amount) should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockAmount = 1 * 10 ** 9; // lock less than 10 amount

      await expect(tx.lockScaQuick(lockAmount, 1)).rejects.toThrow(
        Error('Minimum lock amount for initial lock is 10 SCA')
      );
    });

    it('"lockScaQuick" Initial lock with auto check (lock without lockPeriodInDays) should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockAmount = 10 * 10 ** 9;

      await expect(tx.lockScaQuick(lockAmount)).rejects.toThrow(
        Error('SCA amount and lock period is required for initial lock')
      );
    });

    it('"lockScaQuick" Initial lock without auto check (lock more than 1460 days) should success', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockPeriodInDays = 1461; // lock for more than 1460 day

      await tx.lockScaQuick(10 * 10 ** 9, lockPeriodInDays, false);
      const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
      if (ENABLE_LOG) {
        console.info(
          'LockScaQuickResult:',
          lockScaQuickResult.effects.status.error
        );
      }
      expect(lockScaQuickResult.effects?.status.status).toEqual('success');
    });

    it('"lockScaQuick" Initial lock without auto check should success', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockPeriodInDays = 0.4;

      await tx.lockScaQuick(10 * 10 ** 9, lockPeriodInDays, false);
      const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
      if (ENABLE_LOG) {
        console.info(
          'LockScaQuickResult:',
          lockScaQuickResult.effects.status.error
        );
      }
      expect(lockScaQuickResult.effects?.status.status).toEqual('success');
    });
  }

  // ------------------------ Has VeSCA ------------------------

  if (hasVeSca && !isVeScaExpired) {
    it('"lockScaQuick" extend lock with auto check (lock less than 1 amount) should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockAmount = 0.5 * 10 ** 9; // lock less than 1 amount

      await expect(tx.lockScaQuick(lockAmount, 1)).rejects.toThrow(
        Error('Minimum top up amount is 1 SCA')
      );
    });

    it('"lockScaQuick" extend lock period that results in lock period > 1460 days should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockAmount = 1 * 10 ** 9; // extend 1 amount
      const lockPeriodInDays = MAX_LOCK_ROUNDS; // extend for more than 1459 day

      const newUnlockAtInSecondTimestamp = scallopBuilder.utils.getUnlockAt(
        lockPeriodInDays,
        veScas[0].unlockAt
      );
      const availableLockPeriodInDays = Math.floor(
        (newUnlockAtInSecondTimestamp - Math.floor(veScas[0].unlockAt / 1000)) /
          UNLOCK_ROUND_DURATION
      );
      await expect(
        tx.lockScaQuick(lockAmount, lockPeriodInDays)
      ).rejects.toThrowError(
        Error(
          `Cannot extend lock period by ${lockPeriodInDays} days, maximum lock period is ~4 years (${MAX_LOCK_ROUNDS} days), remaining lock period is ${
            MAX_LOCK_ROUNDS - availableLockPeriodInDays
          }`
        )
      );
    });

    it('"lockScaQuick" extend lock period less than 1 day should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockAmount = 1 * 10 ** 9; // extend 1 amount
      const lockPeriodInDays = 0.5; // extend for more than 1459 day

      await expect(
        tx.lockScaQuick(lockAmount, lockPeriodInDays)
      ).rejects.toThrow(Error('Minimum lock period is 1 day'));
    });
  }

  // -----------------------------------------------------------

  it('"lockScaQuick" extend lock without auto check (Only give amount) should success', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 10 * 10 ** 9; // only extend 1 amount

    await tx.lockScaQuick(lockAmount, 0 || undefined, false);
    const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'LockScaQuickResult:',
        lockScaQuickResult.effects.status.error
      );
    }
    expect(lockScaQuickResult.effects?.status.status).toEqual('success');
  });

  it('"lockScaQuick" extend lock without auto check (Only give period) should success', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockPeriodInDays = 1460; // extend for more than 1459 day

    await tx.lockScaQuick(0 || undefined, lockPeriodInDays, false);
    const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'LockScaQuickResult:',
        lockScaQuickResult.effects.status.error
      );
    }
    expect(lockScaQuickResult.effects?.status.status).toEqual('success');
  });

  it('"extendLockAmountQuick" extend lock with auto check (lock less than 1 amount) should throw error', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 0.5 * 10 ** 9; // lock less than 1 amount

    await expect(
      // tx.extendLockAmountQuick(lockAmount, expiredVeScaKey)
      tx.extendLockAmountQuick(lockAmount)
    ).rejects.toThrow(Error('Minimum top up amount is 1 SCA'));
  });

  it('"extendLockAmountQuick" extend lock with auto check (lock more or equal to 1 SCA) should success', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 1 * 10 ** 9; // lock less than 1 amount
    tx.extendLockAmountQuick(lockAmount);

    const extendLockPeriodQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'ExtendLockPeriodQuickResult:',
        extendLockPeriodQuickResult.effects.status.error
      );
    }
    expect(extendLockPeriodQuickResult.effects?.status.status).toEqual(
      'success'
    );
  });

  it('"extendLockAmountQuick" extend lock without auto check should success', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 1 * 10 ** 9; // only extend 1 amount

    await tx.extendLockAmountQuick(lockAmount, undefined, false);
    const extendLockAmountQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'ExtendLockAmountQuickResult:',
        extendLockAmountQuickResult.effects.status.error
      );
    }
    expect(extendLockAmountQuickResult.effects?.status.status).toEqual(
      'success'
    );
  });

  it('"extendLockAmountQuick" extend lock with expired veSCA should throw error', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 1 * 10 ** 9; // only extend 1 amount
    await expect(
      tx.extendLockAmountQuick(lockAmount, expiredVeScaKey)
    ).rejects.toThrow(
      Error('veSca is expired, use renewExpiredVeScaQuick instead')
    );
  });

  it('"extendLockPeriodQuick" extend lock on expired veSCA should throw error', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockPeriodInDays = 0; // extend for less than 1 day

    await expect(
      tx.extendLockPeriodQuick(lockPeriodInDays, expiredVeScaKey)
    ).rejects.toThrow(
      Error('veSca is expired, use renewExpiredVeScaQuick instead')
    );
  });

  it('"extendLockPeriodQuick" extend lock without auto check should success', async () => {
    const { tx, veScaKey } = await createNewVeScaTx();

    const lockPeriodInDays = 1460; // extend for more than 1459 day

    await tx.extendLockPeriodQuick(lockPeriodInDays, veScaKey, false);
    const extendLockPeriodQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'ExtendLockPeriodQuickResult:',
        extendLockPeriodQuickResult.effects.status.error
      );
    }
    expect(extendLockPeriodQuickResult.effects?.status.status).toEqual(
      'success'
    );
  });

  it('"extendLockPeriodQuick" extend lock with expired veSCA should throw error', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockPeriodInDays = 7;

    await expect(
      tx.extendLockPeriodQuick(lockPeriodInDays, expiredVeScaKey)
    ).rejects.toThrow(
      Error('veSca is expired, use renewExpiredVeScaQuick instead')
    );
  });

  it('"renewExpiredVeScaQuick" renew with < 10 SCA, checkRenewExpiredVeSca should throw error ', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 1e9;
    const lockPeriod = 1;
    await expect(
      tx.renewExpiredVeScaQuick(lockAmount, lockPeriod, expiredVeScaKey)
    ).rejects.toThrow(
      Error('Minimum lock amount for renewing expired vesca 10 SCA')
    );
  });

  it('"renewExpiredVeScaQuick" renew with > 4 years lock period, checkRenewExpiredVeSca should throw error ', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 10e9;
    const lockPeriod = MAX_LOCK_ROUNDS + 1;
    await expect(
      tx.renewExpiredVeScaQuick(lockAmount, lockPeriod, expiredVeScaKey)
    ).rejects.toThrow(
      Error(`Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`)
    );
  });

  it('"renewExpiredVeScaQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 10 * 10 ** 9;
    const lockPeriodInDays = 1;

    await tx.renewExpiredVeScaQuick(
      lockAmount,
      lockPeriodInDays,
      expiredVeScaKey
    );
    const renewExpiredVeScaQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'RenewExpiredVeScaQuickResult:',
        renewExpiredVeScaQuickResult.effects.status.error
      );
    }
    expect(renewExpiredVeScaQuickResult.effects?.status.status).toEqual(
      'success'
    );
  });

  it('"renewExpiredVeScaQuick" should fail if veSCA is not expired yet', async () => {
    const tx = await createNotExpiredVeScaTx();

    const lockAmount = 10 * 10 ** 9;
    const lockPeriodInDays = 1;

    await tx.renewExpiredVeScaQuick(
      lockAmount,
      lockPeriodInDays,
      expiredVeScaKey
    );

    const renewExpiredVeScaQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'RenewExpiredVeScaQuickResult:',
        renewExpiredVeScaQuickResult.effects.status.error
      );
    }
    expect(renewExpiredVeScaQuickResult.effects?.status.status).toEqual(
      'failure'
    );
  });

  it('"redeemScaQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    await tx.redeemScaQuick(expiredVeScaKey);
    const redeemScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'RedeemScaQuickResult:',
        redeemScaQuickResult.effects.status.error
      );
    }

    expect(redeemScaQuickResult.effects?.status.status).toEqual('success');
  });

  it('"redeemScaQuick" should fail', async () => {
    const tx = createExpiredEmptyVeScaTx();

    await tx.redeemScaQuick(expiredVeScaKey);
    const redeemScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'RedeemScaQuickResult:',
        redeemScaQuickResult.effects.status.error
      );
    }
    expect(redeemScaQuickResult.effects?.status.status).toEqual('failure');
  });

  it('"mergeVeSca" should succeed', async () => {
    const {
      tx,
      veScaKey1: targetKey,
      veScaKey2: sourceKey,
    } = await createVeScasForMergeSplit();
    tx.mergeVeSca(targetKey, sourceKey);
    const mergeVeScaResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('MergeVeScaResult:', mergeVeScaResult.effects.status.error);
    }
    console.log(mergeVeScaResult.error);
    console.log(tx.blockData.transactions);
    expect(mergeVeScaResult.effects?.status.status).toEqual('success');
  });

  it('"splitVeSca" should succeed', async () => {
    const { tx, veScaKey } = await createNewVeScaTx();
    const splitVeScaKey = tx.splitVeSca(veScaKey, '0');
    const splitVeScaResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('SplitVeScaResult:', splitVeScaResult.effects.status.error);
    }
    expect(splitVeScaResult.effects?.status.status).toEqual('success');
    expect(splitVeScaKey).toBeDefined();
  });
});

describe('Test Scallop Referral Builder', () => {
  // must use an account that haven't bind to any referral
  it('"bindToReferral" should succeed', async () => {
    const randomBuilder = await createRandomWalletAccountBuilder();
    const tx = randomBuilder.createTxBlock();
    tx.bindToReferral(veScaReferral);

    const bindReferralResult = await randomBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'BindReferralResult:',
        bindReferralResult.effects.status.error
      );
    }
    expect(bindReferralResult.effects?.status.status).toEqual('success');
  });

  // use account that already binds to a referral
  it('"bindToReferral" should fail', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.bindToReferral(veScaReferral);

    const bindReferralResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'BindReferralResult:',
        bindReferralResult.effects.status.error
      );
    }
    expect(bindReferralResult.effects?.status.status).toEqual('failure');
    const error = bindReferralResult.effects?.status.error as string;
    expect(error.includes('Some("bind_ve_sca_referrer") }, 405')).toBe(true);
  });

  it('"claimReferralTicket" and "burnReferralTicket" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();

    const ticket = await tx.claimReferralTicket('sui');
    tx.burnReferralTicket(ticket, 'sui');

    const claimReferralTicketResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'ClaimReferralTicketResult:',
        claimReferralTicketResult.effects.status.error
      );
    }
    expect(claimReferralTicketResult.effects?.status.status).toEqual('success');
  });
});

describe('Test Scallop Loyalty Program Builder', () => {
  // Please set IS_VE_SCA_TEST to true in constants/common.ts

  // make sure account has pending reward
  it('"claimRevenueQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "claimRevenueQuick".
    tx.setSender(sender);
    await tx.claimLoyaltyRevenueQuick();
    const claimRevenueQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'ClaimRevenueQuickResult:',
        claimRevenueQuickResult.effects.status.error
      );
    }
    expect(claimRevenueQuickResult.effects?.status.status).toEqual('success');
  });
});

describe('Test sCoin Builder', () => {
  it('"mintSCoin" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    // depositQuick and mint sCoin
    const marketCoin = await tx.depositQuick(COIN_AMOUNT, COIN_NAME, false);
    const sCoin = tx.mintSCoin('ssui', marketCoin);
    tx.transferObjects([sCoin], sender);

    const mintSCoinResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('mintSCoin:', mintSCoinResult.effects.status.error);
    }
    expect(mintSCoinResult.effects?.status.status).toEqual('success');
  });

  it('"burnSCoin" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    // depositQuick and mint sCoin
    const sCoin = await tx.depositQuick(COIN_AMOUNT, COIN_NAME);

    // burn minted sCoin
    const marketCoin = tx.burnSCoin('ssui', sCoin);
    tx.transferObjects([marketCoin], sender);

    const burnSCoinResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('burnSCoin:', burnSCoinResult.effects.status.error);
    }
    expect(burnSCoinResult.effects?.status.status).toEqual('success');
  });

  it('"mintSCoinQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const sCoin = await tx.mintSCoinQuick(
      scallopBuilder.utils.parseMarketCoinName(COIN_NAME),
      COIN_AMOUNT
    );
    tx.transferObjects([sCoin], sender);

    const mintSCoinQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info(
        'mintSCoinQuick:',
        mintSCoinQuickResult.effects.status.error
      );
    }
    expect(mintSCoinQuickResult.effects?.status.status).toEqual('success');
  });

  // need to have sCoin in the wallet first
  if (hasSCoinInWallet) {
    it('"burnSCoinQuick" should succeed', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const sCoinName = scallopBuilder.utils.parseSCoinName(COIN_NAME);
      if (!sCoinName) throw new Error(`No sCoin for ${COIN_NAME}`);
      const marketCoin = await tx.burnSCoinQuick(sCoinName, 1e4);
      tx.transferObjects([marketCoin], sender);

      const burnSCoinQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
      if (ENABLE_LOG) {
        console.info(
          'burnSCoinQuick:',
          burnSCoinQuickResult.effects.status.error
        );
      }
      expect(burnSCoinQuickResult.effects?.status.status).toEqual('success');
    });
  }
});

describe('Test XOracle V2', () => {
  // console.info('\x1b[32mAddresses Id: \x1b[33m', TEST_ADDRESSES_ID);

  it('Should updates oracles success', async () => {
    const coins = ['sui', 'sca', 'usdc', 'deep', 'fud'] as string[];
    const txb = new SuiTxBlock();

    await updateOracles(scallopBuilder, txb, coins);
    const resp = await scallopBuilder.suiKit
      .client()
      .devInspectTransactionBlock({
        transactionBlock: txb.txBlock,
        sender: scallopBuilder.walletAddress,
      });
    expect(resp.effects?.status?.status).toEqual('success');
  });
});
