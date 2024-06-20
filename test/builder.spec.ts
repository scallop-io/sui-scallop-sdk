import { describe, it, expect } from 'vitest';
import {
  MAX_LOCK_ROUNDS,
  SCA_COIN_TYPE,
  Scallop,
  UNLOCK_ROUND_DURATION,
} from '../src';
import { TransactionBlock } from '@scallop-io/sui-kit';
import { scallopSDK } from './scallopSdk';

const ENABLE_LOG = false;

describe('Test Scallop Core Builder', async () => {
  const scallopBuilder = await scallopSDK.createScallopBuilder();
  const sender = scallopBuilder.walletAddress;

  console.info('Sender:', sender);

  const SUPPLY_COIN_NAME = 'sui';
  const COLLATERAL_COIN_NAME = 'sui';
  const BORROW_COIN_NAME = 'sui';

  it('"openObligationEntry" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.openObligationEntry();
    const openObligationResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('OpenObligationResult:', openObligationResult);
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
      console.info('AddCollateralQuickResult:', addCollateralQuickResult);
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
      console.info('TakeCollateralQuickResult:', takeCollateralQuickResult);
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
      console.info('txb:', JSON.stringify(tx.blockData));
      console.info('DepositQuickResult:', depositQuickResult);
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
      console.info('WithdrawQuickResult:', withdrawQuickResult);
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
      console.info('BorrowQuickResult:', borrowQuickResult);
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
      console.info('RepayQuickResult:', repayQuickResult);
    }
    expect(repayQuickResult.effects?.status.status).toEqual('success');
  });

  it('"borrowFlashLoan" & "repayFlashLoan" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);
    const [coin, loan] = tx.borrowFlashLoan(10 ** 8, SUPPLY_COIN_NAME);
    /**
     * Do something with the borrowed coin here
     * such as pass it to a dex to make a profit.
     */
    tx.repayFlashLoan(coin, loan, SUPPLY_COIN_NAME);
    const borrowFlashLoanResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('BorrowFlashLoanResult:', borrowFlashLoanResult);
    }
    expect(borrowFlashLoanResult.effects?.status.status).toEqual('success');
  });

  it('"ScallopTxBlock" should be an instance of "TransactionBlock"', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);
    expect(tx.txBlock).toBeInstanceOf(TransactionBlock);
    /**
     * For example, you can do the following:
     * 1. split SUI from gas.
     * 2. depoit SUI to Scallop.
     * 3. transfer SUI Market Coin to sender.
     */
    const suiTxBlock = tx.txBlock;
    const [coin] = suiTxBlock.splitCoins(suiTxBlock.gas, [
      suiTxBlock.pure(10 ** 6),
    ]);
    const marketCoin = tx.deposit(coin, SUPPLY_COIN_NAME);
    suiTxBlock.transferObjects([marketCoin], suiTxBlock.pure(sender));
    const txBlockResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('TxBlockResult:', txBlockResult);
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
      console.info('UpdateAssetPricesResult:', updateAssetPricesResult);
    }
    expect(updateAssetPricesResult.effects?.status.status).toEqual('success');
  });
});

describe('Test Scallop Spool Builder', async () => {
  const scallopBuilder = await scallopSDK.createScallopBuilder();
  const sender = scallopBuilder.walletAddress;

  console.info('Sender:', sender);

  it('"createStakeAccount" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    const stakeAccount = tx.createStakeAccount('ssui');
    tx.transferObjects([stakeAccount], sender);
    const createStakeAccountResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('CreateStakeAccountResult:', createStakeAccountResult);
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
      console.info('StakeQuickResult:', stakeQuickResult);
    }
    expect(stakeQuickResult.effects?.status.status).toEqual('success');
  });

  it('"unstakeQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "unstakeQuick".
    tx.setSender(sender);
    const marketCoins = await tx.unstakeQuick(10 ** 6, 'ssui');
    tx.transferObjects(marketCoins, sender);
    const unstakeQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('UnstakeQuickResult:', unstakeQuickResult);
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
      console.info('ClaimQuickResult:', claimQuickResult);
    }
    expect(claimQuickResult.effects?.status.status).toEqual('success');
  });
});

describe('Test Scallop Borrow Incentive Builder', async () => {
  const scallopBuilder = await scallopSDK.createScallopBuilder();
  const sender = scallopBuilder.walletAddress;

  console.info('Sender:', sender);

  it('"stakeObligationQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "stakeObligationQuick".
    tx.setSender(sender);
    await tx.stakeObligationQuick();
    const stakeObligationQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('StakeObligationQuickResult:', stakeObligationQuickResult);
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
        unstakeObligationQuickResult
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
    const rewardCoin = await tx.claimBorrowIncentiveQuick('sui', 'sca');
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
});

describe('Test Scallop VeSca Builder', async () => {
  const scallopBuilder = await scallopSDK.createScallopBuilder();
  const scallopQuery = await scallopSDK.createScallopQuery();
  const sender = scallopBuilder.walletAddress;

  const veScas = await scallopQuery.getVeScas(sender);
  const hasVeSca = veScas.length > 0;
  const isVeScaExpired =
    hasVeSca && veScas[0].unlockAt * 1000 <= new Date().getTime();

  console.info('hasVeSca: ', hasVeSca);
  console.info('Sender:', sender);

  const expiredVeScaKey =
    '0x0515056c4a6ee46007b1e53356c51ca99bf772629a656d4ff24554417713bfcd';

  const createNewVeScaTx = async (initialLockPeriodInDays: number = 1459) => {
    const tx = scallopBuilder.createTxBlock();
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
    // const lockPeriodInDays = 7; // lock for 1 day
    // const lockAmount = 10 * 10 ** 9;
    // await tx.renewExpiredVeScaQuick(
    //   lockAmount,
    //   lockPeriodInDays,
    //   expiredVeScaKey
    // );
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
        console.info('LockScaQuickResult:', lockScaQuickResult);
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
        console.info('LockScaQuickResult:', lockScaQuickResult);
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
      console.info('LockScaQuickResult:', lockScaQuickResult);
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
      console.info('LockScaQuickResult:', lockScaQuickResult);
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
      console.info('ExtendLockPeriodQuickResult:', extendLockPeriodQuickResult);
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
      console.info('ExtendLockAmountQuickResult:', extendLockAmountQuickResult);
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
      console.info('ExtendLockPeriodQuickResult:', extendLockPeriodQuickResult);
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
        renewExpiredVeScaQuickResult
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
        renewExpiredVeScaQuickResult
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
      console.info('RedeemScaQuickResult:', redeemScaQuickResult);
    }

    expect(redeemScaQuickResult.effects?.status.status).toEqual('success');
  });

  it('"redeemScaQuick" should fail', async () => {
    const tx = createExpiredEmptyVeScaTx();

    await tx.redeemScaQuick(expiredVeScaKey);
    const redeemScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('RedeemScaQuickResult:', redeemScaQuickResult);
    }
    expect(redeemScaQuickResult.effects?.status.status).toEqual('failure');
  });
});

describe('Test Scallop Referral Builder', async () => {
  const scallopBuilder = await scallopSDK.createScallopBuilder();
  const sender = scallopBuilder.walletAddress;

  console.info('Sender:', sender);

  const veScaReferral =
    '0xad50994e23ae4268fc081f477d0bdc3f1b92c7049c9038dedec5bac725273d18' as const;

  const createRandomWalletAccountBuilder = async () => {
    const scallopSDK = new Scallop({
      secretKey: '',
      networkType: 'mainnet',
    });
    const scallopBuilder = await scallopSDK.createScallopBuilder();
    return scallopBuilder;
  };

  // must use an account that haven't bind to any referral
  it('"bindToReferral" should succeed', async () => {
    const randomBuilder = await createRandomWalletAccountBuilder();
    const tx = randomBuilder.createTxBlock();
    tx.bindToReferral(veScaReferral);

    const bindReferralResult = await randomBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('BindReferralResult:', bindReferralResult);
    }
    expect(bindReferralResult.effects?.status.status).toEqual('success');
  });

  // use account that already binds to a referral
  it('"bindToReferral" should fail', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.bindToReferral(veScaReferral);

    const bindReferralResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('BindReferralResult:', bindReferralResult);
    }
    expect(bindReferralResult.effects?.status.status).toEqual('failure');
    const error = bindReferralResult.effects?.status.error as string;
    expect(error.includes('Some("bind_ve_sca_referrer") }, 405')).toBe(true);
  });

  it('"claimReferralTicket" and "burnReferralTicket" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();

    const ticket = tx.claimReferralTicket('sui');
    tx.burnReferralTicket(ticket, 'sui');

    const claimReferralTicketResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('ClaimReferralTicketResult:', claimReferralTicketResult);
    }
    expect(claimReferralTicketResult.effects?.status.status).toEqual('success');
  });
});

describe('Test Scallop Loyalty Program Builder', async () => {
  // Please set IS_VE_SCA_TEST to true in constants/common.ts
  const scallopBuilder = await scallopSDK.createScallopBuilder();
  const sender = scallopBuilder.walletAddress;

  console.info('Sender:', sender);

  // make sure account has pending reward
  it('"claimRevenueQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "claimRevenueQuick".
    tx.setSender(sender);
    await tx.claimLoyaltyRevenueQuick();
    const claimRevenueQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('ClaimRevenueQuickResult:', claimRevenueQuickResult);
    }
    expect(claimRevenueQuickResult.effects?.status.status).toEqual('success');
  });
});

describe('Test sCoin Builder', async () => {
  const scallopBuilder = await scallopSDK.createScallopBuilder();
  const sender = scallopBuilder.walletAddress;
  const COIN_NAME = 'sui';
  const COIN_AMOUNT = 1e5;

  // check for sCoin
  let hasSCoinInWallet = false;
  try {
    const sCoinName = scallopBuilder.utils.parseSCoinName(COIN_NAME);
    if (!sCoinName) throw new Error(`No sCoin for ${COIN_NAME}`);
    const sCoins = await scallopBuilder.suiKit.selectCoinsWithAmount(
      COIN_AMOUNT,
      sCoinName,
      sender
    );
    hasSCoinInWallet = sCoins.length > 0;
  } catch (e) {
    // no sCoin, just ignore
  }

  console.info('Sender:', sender);
  it('"mintSCoin" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    // depositQuick and mint sCoin
    const marketCoin = await tx.depositQuick(COIN_AMOUNT, COIN_NAME, false);
    const sCoin = tx.mintSCoin('ssui', marketCoin);
    tx.transferObjects([sCoin], sender);

    const mintSCoinResult = await scallopBuilder.suiKit.inspectTxn(tx);
    if (ENABLE_LOG) {
      console.info('ClaimRevenueQuickResult:', mintSCoinResult);
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
      console.info('ClaimRevenueQuickResult:', burnSCoinResult);
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
      console.info('ClaimRevenueQuickResult:', mintSCoinQuickResult);
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
        console.info('ClaimRevenueQuickResult:', burnSCoinQuickResult);
      }
      expect(burnSCoinQuickResult.effects?.status.status).toEqual('success');
    });
  }
});
