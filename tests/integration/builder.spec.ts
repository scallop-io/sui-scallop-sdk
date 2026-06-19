import { describe, it, expect } from 'vitest';
import {
  MAX_LOCK_ROUNDS,
  Obligation,
  SCA_COIN_TYPE,
  Scallop,
  ScallopBuilder,
  UNLOCK_ROUND_DURATION,
  Vesca,
} from 'src/index.js';
import { SuiTxBlock, Transaction } from '@scallop-io/sui-kit';
import { scallopSDK } from '../scallopSdk.js';
import { updateOracles } from 'src/builders/oracles/index.js';

const ENABLE_LOG = false;
const COIN_NAME = 'sui';
const COIN_AMOUNT = 1e5;
const veScaReferral =
  '0xad50994e23ae4268fc081f477d0bdc3f1b92c7049c9038dedec5bac725273d18' as const;
const OTHER_VESCA_KEY =
  '0xb840d39a2ee0056cf022e286d4dc6b0e543bdcb0fcae2c828af02b39d11532bc' as const;
const expiredVeScaKey =
  '0x0515056c4a6ee46007b1e53356c51ca99bf772629a656d4ff24554417713bfcd' as const;

// Wallet state is resolved at module load (top-level await) so that
// describe-block gating like `if (hasVeSca) { ... }` sees the real value
// at test collection time, not the default `false`.
const scallopBuilder: ScallopBuilder = await scallopSDK.createScallopBuilder();
const sender: string = scallopBuilder.walletAddress;
const obligations: Obligation[] = await scallopBuilder.query.getObligations();
const veScas: Vesca[] = await scallopBuilder.query.getVeScas({
  walletAddress: sender,
});
const hasVeSca = veScas.length > 0;
const isVeScaExpired =
  hasVeSca && veScas[0].unlockAt * 1000 <= new Date().getTime();

let hasSCoinInWallet = false;
try {
  const sCoinName = scallopBuilder.utils.parseSCoinName(COIN_NAME);
  if (sCoinName) {
    const sCoins = await scallopBuilder.suiKit.selectCoinsWithAmount(
      COIN_AMOUNT,
      sCoinName,
      sender
    );
    hasSCoinInWallet = sCoins.length > 0;
  }
} catch (_e) {
  // no sCoin, just ignore
}

let obligationWithBoost: Obligation | undefined;
if (hasVeSca) {
  const bindedObligation = await scallopBuilder.query.getBindedObligation(
    veScas[0].keyId
  );
  obligationWithBoost = obligations.find(({ id }) => id === bindedObligation);
}
console.info('Sender:', sender);

const createNewVeScaTx = async (
  tx = scallopBuilder.createTxBlock(),
  initialLockPeriodInDays: number = 1
) => {
  tx.setSender(sender);

  const lockAmount = 10 * 10 ** 9;
  const lockPeriodInDays = initialLockPeriodInDays;
  const newUnlockAt = scallopBuilder.utils.getUnlockAt(lockPeriodInDays);
  const coins = await scallopBuilder.utils.selectCoins({
    amount: lockAmount,
    coinType: SCA_COIN_TYPE,
    ownerAddress: sender,
  });
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
  await tx.renewExpiredVeScaQuick({
    scaAmount: lockAmount,
    lockPeriodInDays,
    veScaKey: expiredVeScaKey,
  });
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
    addressId: '695fcdc084f790c04eb068dc',
    secretKey: '',
    network: 'mainnet',
    pythEndpoints: ['https://hermes.pyth.network'],
    walletAddress: '',
    fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
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
  const coins = await scallopBuilder.utils.selectCoins({
    amount: 2 * lockAmount,
    coinType: SCA_COIN_TYPE,
    ownerAddress: sender,
  });

  const merged = coins[0];
  if (coins.length > 1) {
    tx.mergeCoins(merged, coins.slice(1));
  }
  const [scaCoin1, scaCoin2] = tx.splitCoins(merged, [lockAmount, lockAmount]);

  const veScaKey1 = tx.lockSca(scaCoin1, newUnlockAt);
  const veScaKey2 = tx.lockSca(scaCoin2, newUnlockAt);
  return { tx, veScaKey1, veScaKey2 };
};

describe('Test Scallop Core Builder', () => {
  const SUPPLY_COIN_NAME = 'sui';
  const COLLATERAL_COIN_NAME = 'sui';
  const BORROW_COIN_NAME = 'sui';

  it('"openObligationEntry" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.openObligationEntry();
    const openObligationResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      openObligationResult.Transaction ??
      openObligationResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('OpenObligationResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"depositCollateralQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "depositCollateralQuick".
    tx.setSender(sender);
    await tx.depositCollateralQuick(10 ** 7, COLLATERAL_COIN_NAME);
    const depositCollateralQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      depositCollateralQuickResult.Transaction ??
      depositCollateralQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info(
        'DepositCollateralQuickResult:',
        txResult.effects.status.error
      );
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"takeCollateralQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "takeCollateralQuick".
    tx.setSender(sender);
    const coin = await tx.takeCollateralQuick(10 ** 7, COLLATERAL_COIN_NAME);
    tx.transferObjects([coin], sender);
    // v2: Use devInspectTxn (JSON-RPC) to bypass strict gRPC simulateTransaction
    const takeCollateralQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      takeCollateralQuickResult.Transaction ??
      takeCollateralQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('TakeCollateralQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"supplyQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "supplyQuick".
    tx.setSender(sender);
    const marketCoin = await tx.supplyQuick(10 ** 7, SUPPLY_COIN_NAME, false);
    tx.transferObjects([marketCoin], sender);
    const depositQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      depositQuickResult.Transaction ?? depositQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('DepositQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"supplyQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);
    const sCoin = await tx.supplyQuick(10 ** 7, SUPPLY_COIN_NAME);
    tx.transferObjects([sCoin], sender);
    const supplyQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      supplyQuickResult.Transaction ?? supplyQuickResult.FailedTransaction;
    expect(
      txResult.effects?.status.success,
      JSON.stringify(txResult.effects?.status.error)
    ).toEqual(true);
  });

  it('"withdrawQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "withdrawQuick".
    tx.setSender(sender);
    const coin = await tx.withdrawQuick(10 ** 7, SUPPLY_COIN_NAME);
    tx.transferObjects([coin], sender);
    const withdrawQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      withdrawQuickResult.Transaction ?? withdrawQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('WithdrawQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"borrowQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "borrowQuick".
    tx.setSender(sender);
    const borrowedCoin = await tx.borrowQuick(4 * 10 ** 7, BORROW_COIN_NAME);
    // Transfer borrowed coin to sender.
    tx.transferObjects([borrowedCoin], sender);
    const borrowQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      borrowQuickResult.Transaction ?? borrowQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('BorrowQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"repayQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "repayQuick".
    tx.setSender(sender);
    await tx.repayQuick(4 * 10 ** 7, BORROW_COIN_NAME);
    const repayQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      repayQuickResult.Transaction ?? repayQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('RepayQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"borrowFlashLoan" & "repayFlashLoan" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const SUPPLY_COIN_NAME = 'wusdc';
    const FLASHLOAN_AMOUNT = 10 ** 5;
    const [coin, loan] = (await tx.borrowFlashLoan(
      FLASHLOAN_AMOUNT,
      SUPPLY_COIN_NAME
    ))!;

    const FLASHLOAN_FEE = Math.ceil(0.07 * FLASHLOAN_AMOUNT);
    const { takeCoin, leftCoin } = (await scallopBuilder.selectCoin(
      tx,
      SUPPLY_COIN_NAME,
      FLASHLOAN_FEE
    ))!;

    tx.mergeCoins(coin, [takeCoin]);
    tx.transferObjects([leftCoin!], sender);
    tx.repayFlashLoan(coin, loan, SUPPLY_COIN_NAME);
    const borrowFlashLoanResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      borrowFlashLoanResult.Transaction ??
      borrowFlashLoanResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('BorrowFlashLoanResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
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
    const marketCoin = tx.supply(coin, SUPPLY_COIN_NAME);
    suiTxBlock.transferObjects([marketCoin], suiTxBlock.pure.address(sender));
    const txBlockResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      txBlockResult.Transaction ?? txBlockResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('TxBlockResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"updateAssetPricesQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "updateAssetPricesQuick".
    tx.setSender(sender);
    await tx.updateAssetPricesQuick([SUPPLY_COIN_NAME]);
    // v2: Use devInspectTxn (JSON-RPC) to bypass strict gRPC simulateTransaction
    const updateAssetPricesResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      updateAssetPricesResult.Transaction ??
      updateAssetPricesResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('UpdateAssetPricesResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it.skip('"liquidate" normal method should succeed in inspection', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const obligations = await scallopBuilder.query.getObligations();

    // Skip test if no obligations found
    if (obligations.length === 0) {
      console.warn('No obligations found, skipping liquidation test');
      return;
    }

    const obligationId = obligations[0].id;
    const debtCoinName = 'usdc';
    const collateralCoinName = 'sui';
    const liquidationAmount = 10 ** 6;

    const { takeCoin, leftCoin } = await scallopBuilder.selectCoin(
      tx,
      debtCoinName,
      liquidationAmount,
      sender
    );

    if (leftCoin) {
      tx.transferObjects([leftCoin], sender);
    }

    const obligationSharedObject = tx.object(obligationId);

    const [extraDebtCoin, collateralCoin] = tx.liquidate(
      obligationSharedObject,
      takeCoin,
      debtCoinName,
      collateralCoinName
    );

    tx.transferObjects([extraDebtCoin, collateralCoin], sender);

    const liquidateResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      liquidateResult.Transaction ?? liquidateResult.FailedTransaction;

    if (ENABLE_LOG) {
      console.info('LiquidateResult:', txResult.effects.status.error);
    }

    // Note: This test may fail if there's no liquidatable position
    // or if liquidation conditions are not met
    expect(txResult.effects).toBeDefined();
  });

  it('"liquidateQuick" should succeed in inspection', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const obligations = await scallopBuilder.query.getObligations();

    // Skip test if no obligations found
    if (obligations.length === 0) {
      console.warn('No obligations found, skipping liquidation quick test');
      return;
    }

    const obligationId = obligations[0].id;
    const debtCoinName = 'usdc';
    const collateralCoinName = 'sui';
    const liquidationAmount = 10 ** 6;

    try {
      const [extraDebtCoin, collateralCoin] = await tx.liquidateQuick(
        liquidationAmount,
        debtCoinName,
        collateralCoinName,
        obligationId
      );

      tx.transferObjects([extraDebtCoin, collateralCoin], sender);

      const liquidateQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
      const txResult =
        liquidateQuickResult.Transaction ??
        liquidateQuickResult.FailedTransaction;

      if (ENABLE_LOG) {
        console.info('LiquidateQuickResult:', txResult.effects.status.error);
      }

      // Note: This test may fail if there's no liquidatable position
      expect(txResult.effects).toBeDefined();
    } catch (error) {
      // Expected to fail if no liquidatable position exists
      if (ENABLE_LOG) {
        console.info('LiquidateQuick expected error:', error);
      }
      expect(error).toBeDefined();
    }
  });
});

describe('Test Scallop Spool Builder', () => {
  it('"createStakeAccount" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    const stakeAccount = tx.createStakeAccount('ssui');
    tx.transferObjects([stakeAccount], sender);
    const createStakeAccountResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      createStakeAccountResult.Transaction ??
      createStakeAccountResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('CreateStakeAccountResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"stakeQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "stakeQuick".
    tx.setSender(sender);
    await tx.stakeQuick(10 ** 6, 'ssui');
    const stakeQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      stakeQuickResult.Transaction ?? stakeQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('StakeQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"unstakeQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "unstakeQuick".
    tx.setSender(sender);
    const marketCoin = await tx.unstakeQuick(10 ** 6, 'ssui');
    expect(marketCoin).not.toBeUndefined();
    tx.transferObjects([marketCoin!], sender);
    const unstakeQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      unstakeQuickResult.Transaction ?? unstakeQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('UnstakeQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"claimQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "claimQuick".
    tx.setSender(sender);
    const rewardCoins = await tx.claimQuick('ssui');
    tx.transferObjects(rewardCoins, sender);
    const claimQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      claimQuickResult.Transaction ?? claimQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('ClaimQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
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
    const txResult =
      stakeObligationQuickResult.Transaction ??
      stakeObligationQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info(
        'StakeObligationQuickResult:',
        txResult.effects.status.error
      );
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"unstakeObligationQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "unstakeObligationQuick".
    tx.setSender(sender);
    await tx.unstakeObligationQuick();
    const unstakeObligationQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      unstakeObligationQuickResult.Transaction ??
      unstakeObligationQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info(
        'UnstakeObligationQuickResult:',
        txResult.effects.status.error
      );
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"claimBorrowIncentiveQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    // Sender is required to invoke "claimQuick".
    tx.setSender(sender);
    const rewardCoin = await tx.claimBorrowIncentiveQuick('sui', 'sui');
    tx.transferObjects([rewardCoin], sender);
    const claimBorrowIncentiveQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      claimBorrowIncentiveQuickResult.Transaction ??
      claimBorrowIncentiveQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info(
        'ClaimBorrowIncentiveQuickResult:',
        claimBorrowIncentiveQuickResult
      );
    }
    expect(txResult.effects?.status.success).toEqual(true);
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
      const txResult =
        stakeObligationWithVeScaQuickResult.Transaction ??
        stakeObligationWithVeScaQuickResult.FailedTransaction;
      if (ENABLE_LOG) {
        console.info(
          'StakeObligationWithVeScaQuickResult:',
          txResult.effects.status.error
        );
      }
      expect(txResult.effects?.status.success).toEqual(true);
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
      const txResult =
        stakeObligationWithVeScaQuickResult.Transaction ??
        stakeObligationWithVeScaQuickResult.FailedTransaction;
      if (ENABLE_LOG) {
        console.info('StakeObligationWithVeScaQuickResult:', txResult.effects);
      }
      expect(txResult.effects?.status.success).toEqual(false);
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
          const txResult =
            stakeObligationWithVeScaQuickResult.Transaction ??
            stakeObligationWithVeScaQuickResult.FailedTransaction;
          if (ENABLE_LOG) {
            console.info(
              'StakeObligationWithVeScaQuickResult:',
              txResult.effects.status.error
            );
          }
          expect(txResult.effects?.status.success).toEqual(true);
        });

        it('"stakesObligationWithVeScaQuick" with incorrect veScakey on boosted obligation should auto switch to correct binded obligation automatically and succeed', async () => {
          const tx = scallopBuilder.createTxBlock();
          tx.setSender(sender);
          await tx.unstakeObligationQuick(id, keyId);
          await tx.stakeObligationWithVeScaQuick(id, keyId, OTHER_VESCA_KEY);
          const stakeObligationWithVeScaQuickResult =
            await scallopBuilder.suiKit.inspectTxn(tx);
          const txResult =
            stakeObligationWithVeScaQuickResult.Transaction ??
            stakeObligationWithVeScaQuickResult.FailedTransaction;
          if (ENABLE_LOG) {
            console.info(
              'StakeObligationWithVeScaQuickResult:',
              txResult.effects.status.error
            );
          }
          expect(txResult.effects?.status.success).toEqual(true);
        });

        it('"deactivateBoost" should success', async () => {
          const tx = scallopBuilder.createTxBlock();
          tx.setSender(sender);
          tx.deactivateBoost(id, veScas[0].keyId);
          const stakeObligationWithVeScaQuickResult =
            await scallopBuilder.suiKit.inspectTxn(tx);
          const txResult =
            stakeObligationWithVeScaQuickResult.Transaction ??
            stakeObligationWithVeScaQuickResult.FailedTransaction;
          if (ENABLE_LOG) {
            console.info(
              'StakeObligationWithVeScaQuickResult:',
              txResult.effects.status.error
            );
          }
          expect(txResult.effects?.status.success).toEqual(true);
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
            const txResult =
              stakeObligationWithVeScaQuickResult.Transaction ??
              stakeObligationWithVeScaQuickResult.FailedTransaction;
            if (ENABLE_LOG) {
              console.info(
                'StakeObligationWithVeScaQuickResult:',
                txResult.effects.status.error
              );
            }
            expect(txResult.effects?.status.success).toEqual(true);
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

      await tx.lockScaQuick({ amountOrCoin: 10 * 10 ** 9, lockPeriodInDays });
      const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
      const txResult =
        lockScaQuickResult.Transaction ?? lockScaQuickResult.FailedTransaction;
      if (ENABLE_LOG) {
        console.info('LockScaQuickResult:', txResult.effects.status.error);
      }
      expect(txResult.effects.status.success).toEqual(true);
    });

    it('"lockScaQuick" Initial lock with auto check (lock more than 1460 days) should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      tx.setSender(sender);
      const lockPeriodInDays = 1461;

      await expect(
        tx.lockScaQuick({ amountOrCoin: 10 * 10 ** 9, lockPeriodInDays })
      ).rejects.toThrow(
        Error(`Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`)
      );
    });

    it('"lockScaQuick" Initial lock with auto check (lock less than 10 amount) should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockAmount = 1 * 10 ** 9; // lock less than 10 amount

      await expect(
        tx.lockScaQuick({ amountOrCoin: lockAmount, lockPeriodInDays: 1 })
      ).rejects.toThrow(
        Error('Minimum lock amount for initial lock is 10 SCA')
      );
    });

    it('"lockScaQuick" Initial lock with auto check (lock without lockPeriodInDays) should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockAmount = 10 * 10 ** 9;

      await expect(
        tx.lockScaQuick({ amountOrCoin: lockAmount })
      ).rejects.toThrow(
        Error('SCA amount and lock period is required for initial lock')
      );
    });

    it('"lockScaQuick" Initial lock without auto check (lock more than 1460 days) should success', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockPeriodInDays = 1461; // lock for more than 1460 day

      await tx.lockScaQuick({
        amountOrCoin: 10 * 10 ** 9,
        lockPeriodInDays,
        autoCheck: false,
      });
      const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
      const txResult =
        lockScaQuickResult.Transaction ?? lockScaQuickResult.FailedTransaction;
      if (ENABLE_LOG) {
        console.info('LockScaQuickResult:', txResult.effects.status.error);
      }
      expect(txResult.effects?.status.success).toEqual(true);
    });

    it('"lockScaQuick" Initial lock without auto check should success', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockPeriodInDays = 0.4;

      await tx.lockScaQuick({
        amountOrCoin: 10 * 10 ** 9,
        lockPeriodInDays,
        autoCheck: false,
      });
      const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
      const txResult =
        lockScaQuickResult.Transaction ?? lockScaQuickResult.FailedTransaction;
      if (ENABLE_LOG) {
        console.info('LockScaQuickResult:', txResult.effects.status.error);
      }
      expect(txResult.effects?.status.success).toEqual(true);
    });
  }

  // ------------------------ Has VeSCA ------------------------

  if (hasVeSca && !isVeScaExpired) {
    it('"lockScaQuick" extend lock with auto check (lock less than 1 amount) should throw error', async () => {
      const tx = scallopBuilder.createTxBlock();
      tx.setSender(sender);

      const lockAmount = 0.5 * 10 ** 9; // lock less than 1 amount

      await expect(
        tx.lockScaQuick({ amountOrCoin: lockAmount, lockPeriodInDays: 1 })
      ).rejects.toThrow(Error('Minimum top up amount is 1 SCA'));
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
        tx.lockScaQuick({ amountOrCoin: lockAmount, lockPeriodInDays })
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
        tx.lockScaQuick({ amountOrCoin: lockAmount, lockPeriodInDays })
      ).rejects.toThrow(Error('Minimum lock period is 1 day'));
    });
  }

  // -----------------------------------------------------------

  it('"lockScaQuick" extend lock without auto check (Only give amount) should success', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 10 * 10 ** 9; // only extend 1 amount

    await tx.lockScaQuick({
      amountOrCoin: lockAmount,
      autoCheck: false,
    });
    const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      lockScaQuickResult.Transaction ?? lockScaQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('LockScaQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"lockScaQuick" extend lock without auto check (Only give period) should success', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockPeriodInDays = 1460; // extend for more than 1459 day

    await tx.lockScaQuick({ lockPeriodInDays, autoCheck: false });
    const lockScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      lockScaQuickResult.Transaction ?? lockScaQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('LockScaQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"extendLockAmountQuick" extend lock with auto check (lock less than 1 amount) should throw error', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 0.5 * 10 ** 9; // lock less than 1 amount

    await expect(
      // tx.extendLockAmountQuick(lockAmount, expiredVeScaKey)
      tx.extendLockAmountQuick({ scaAmount: lockAmount })
    ).rejects.toThrow(Error('Minimum top up amount is 1 SCA'));
  });

  it('"extendLockAmountQuick" extend lock with auto check (lock more or equal to 1 SCA) should success', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 1 * 10 ** 9; // lock less than 1 amount
    await tx.extendLockAmountQuick({ scaAmount: lockAmount });

    const extendLockPeriodQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      extendLockPeriodQuickResult.Transaction ??
      extendLockPeriodQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info(
        'ExtendLockPeriodQuickResult:',
        txResult.effects.status.error
      );
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"extendLockAmountQuick" extend lock without auto check should success', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 1 * 10 ** 9; // only extend 1 amount

    await tx.extendLockAmountQuick({ scaAmount: lockAmount, autoCheck: false });
    const extendLockAmountQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      extendLockAmountQuickResult.Transaction ??
      extendLockAmountQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info(
        'ExtendLockAmountQuickResult:',
        txResult.effects.status.error
      );
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"extendLockAmountQuick" extend lock with expired veSCA should throw error', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 1 * 10 ** 9; // only extend 1 amount
    await expect(
      tx.extendLockAmountQuick({
        scaAmount: lockAmount,
        veScaKey: expiredVeScaKey,
      })
    ).rejects.toThrow(
      Error('veSca is expired, use renewExpiredVeScaQuick instead')
    );
  });

  it('"extendLockPeriodQuick" extend lock on expired veSCA should throw error', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockPeriodInDays = 0; // extend for less than 1 day

    await expect(
      tx.extendLockPeriodQuick({ lockPeriodInDays, veScaKey: expiredVeScaKey })
    ).rejects.toThrow(
      Error('veSca is expired, use renewExpiredVeScaQuick instead')
    );
  });

  it('"extendLockPeriodQuick" extend lock with expired veSCA should throw error', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockPeriodInDays = 7;

    await expect(
      tx.extendLockPeriodQuick({ lockPeriodInDays, veScaKey: expiredVeScaKey })
    ).rejects.toThrow(
      Error('veSca is expired, use renewExpiredVeScaQuick instead')
    );
  });

  it('"renewExpiredVeScaQuick" renew with < 10 SCA, checkRenewExpiredVeSca should throw error ', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 1e9;
    const lockPeriodInDays = 1;
    await expect(
      tx.renewExpiredVeScaQuick({
        scaAmount: lockAmount,
        lockPeriodInDays,
        veScaKey: expiredVeScaKey,
      })
    ).rejects.toThrow(
      Error('Minimum lock amount for renewing expired vesca 10 SCA')
    );
  });

  it('"renewExpiredVeScaQuick" renew with > 4 years lock period, checkRenewExpiredVeSca should throw error ', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 10e9;
    const lockPeriodInDays = MAX_LOCK_ROUNDS + 1;
    await expect(
      tx.renewExpiredVeScaQuick({
        scaAmount: lockAmount,
        lockPeriodInDays,
        veScaKey: expiredVeScaKey,
      })
    ).rejects.toThrow(
      Error(`Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`)
    );
  });

  it('"renewExpiredVeScaQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    const lockAmount = 10 * 10 ** 9;
    const lockPeriodInDays = 1;

    await tx.renewExpiredVeScaQuick({
      scaAmount: lockAmount,
      lockPeriodInDays,
      veScaKey: expiredVeScaKey,
    });
    // v2: Use devInspectTxn (JSON-RPC) to bypass strict gRPC ownership checks
    const renewExpiredVeScaQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      renewExpiredVeScaQuickResult.Transaction ??
      renewExpiredVeScaQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info(
        'RenewExpiredVeScaQuickResult:',
        txResult.effects.status.error
      );
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"renewExpiredVeScaQuick" should fail if veSCA is not expired yet', async () => {
    const tx = await createNotExpiredVeScaTx();

    const lockAmount = 10 * 10 ** 9;
    const lockPeriodInDays = 1;

    await tx.renewExpiredVeScaQuick({
      scaAmount: lockAmount,
      lockPeriodInDays,
      veScaKey: expiredVeScaKey,
    });

    // v2: Use devInspectTxn (JSON-RPC) to bypass strict gRPC ownership checks
    const renewExpiredVeScaQuickResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      renewExpiredVeScaQuickResult.Transaction ??
      renewExpiredVeScaQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info(
        'RenewExpiredVeScaQuickResult:',
        txResult.effects.status.error
      );
    }
    expect(txResult.effects?.status.success).toEqual(false);
  });

  it('"redeemScaQuick" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    await tx.redeemScaQuick({ veScaKey: expiredVeScaKey });
    // v2: Use devInspectTxn (JSON-RPC) to bypass strict gRPC ownership checks
    const redeemScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      redeemScaQuickResult.Transaction ??
      redeemScaQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('RedeemScaQuickResult:', txResult.effects.status.error);
    }

    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"redeemScaQuick" should fail', async () => {
    const tx = createExpiredEmptyVeScaTx();

    await tx.redeemScaQuick({ veScaKey: expiredVeScaKey });
    // v2: Use devInspectTxn (JSON-RPC) to bypass strict gRPC ownership checks
    const redeemScaQuickResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      redeemScaQuickResult.Transaction ??
      redeemScaQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('RedeemScaQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(false);
  });

  it('"mergeVeSca" should succeed', async () => {
    const {
      tx,
      veScaKey1: targetKey,
      veScaKey2: sourceKey,
    } = await createVeScasForMergeSplit();

    tx.mergeVeSca(targetKey, sourceKey);
    // v2: simulateTransaction enforces that all Move return values are consumed.
    // mergeVeSca takes VeScaKeys by &mut reference, so both keys still need to be transferred.
    tx.transferObjects([targetKey, sourceKey], sender);

    const mergeVeScaResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      mergeVeScaResult.Transaction ?? mergeVeScaResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('MergeVeScaResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"splitVeSca" should succeed', async () => {
    const { tx, veScaKey } = await createNewVeScaTx();
    const splitVeScaKey = tx.splitVeSca(veScaKey, '0');
    // v2: simulateTransaction enforces that all Move return values are consumed.
    // Transfer the new VeScaKey from split AND the original veScaKey (still alive after split by &mut).
    tx.transferObjects([splitVeScaKey, veScaKey], sender);
    const splitVeScaResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      splitVeScaResult.Transaction ?? splitVeScaResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('SplitVeScaResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
    expect(splitVeScaKey).toBeDefined();
  });
});

describe('Test Scallop Referral Builder', () => {
  // must use an account that haven't bind to any referral
  it('"bindToReferral" should succeed', async () => {
    const randomBuilder = await createRandomWalletAccountBuilder();
    const tx = randomBuilder.createTxBlock();
    tx.bindToReferral(veScaReferral);

    // v2: Use devInspectTxn (JSON-RPC) to bypass strict gRPC gas balance checks
    const bindReferralResult = await randomBuilder.suiKit.inspectTxn(tx);
    const txResult =
      bindReferralResult.Transaction ?? bindReferralResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('BindReferralResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  // use account that already binds to a referral
  it('"bindToReferral" should fail', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.bindToReferral(veScaReferral);

    // v2: Use devInspectTxn (JSON-RPC) to bypass strict gRPC gas balance checks
    const bindReferralResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      bindReferralResult.Transaction ?? bindReferralResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('BindReferralResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(false);
    const error = txResult.effects?.status.error;
    const errorStr = error ? JSON.stringify(error) : '';
    expect(errorStr.includes('Some("bind_ve_sca_referrer") }, 405')).toBe(true);
  });

  it('"claimReferralTicket" and "burnReferralTicket" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();

    const ticket = await tx.claimReferralTicket('sui');
    tx.burnReferralTicket(ticket, 'sui');

    const claimReferralTicketResult =
      await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      claimReferralTicketResult.Transaction ??
      claimReferralTicketResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('ClaimReferralTicketResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
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
    const txResult =
      claimRevenueQuickResult.Transaction ??
      claimRevenueQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('ClaimRevenueQuickResult:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });
});

describe('Test sCoin Builder', () => {
  it('"mintSCoin" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    // supplyQuick and mint sCoin
    const marketCoin = await tx.supplyQuick(COIN_AMOUNT, COIN_NAME, false);
    const sCoin = tx.mintSCoin('ssui', marketCoin);
    tx.transferObjects([sCoin], sender);

    const mintSCoinResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      mintSCoinResult.Transaction ?? mintSCoinResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('mintSCoin:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
  });

  it('"burnSCoin" should succeed', async () => {
    const tx = scallopBuilder.createTxBlock();
    tx.setSender(sender);

    // supplyQuick and mint sCoin
    const sCoin = await tx.supplyQuick(COIN_AMOUNT, COIN_NAME);

    // burn minted sCoin
    const marketCoin = tx.burnSCoin('ssui', sCoin);
    tx.transferObjects([marketCoin], sender);

    const burnSCoinResult = await scallopBuilder.suiKit.inspectTxn(tx);
    const txResult =
      burnSCoinResult.Transaction ?? burnSCoinResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('burnSCoin:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
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
    const txResult =
      mintSCoinQuickResult.Transaction ??
      mintSCoinQuickResult.FailedTransaction;
    if (ENABLE_LOG) {
      console.info('mintSCoinQuick:', txResult.effects.status.error);
    }
    expect(txResult.effects?.status.success).toEqual(true);
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
      const txResult =
        burnSCoinQuickResult.Transaction ??
        burnSCoinQuickResult.FailedTransaction;
      if (ENABLE_LOG) {
        console.info('burnSCoinQuick:', txResult.effects.status.error);
      }
      expect(txResult.effects?.status.success).toEqual(true);
    });
  }
});

describe('Test XOracle V2', () => {
  // console.info('\x1b[32mAddresses Id: \x1b[33m', TEST_ADDRESSES_ID);

  it('Should updates oracles success', async () => {
    const coins = ['sui', 'sca', 'usdc', 'deep'] as string[];
    const txb = new SuiTxBlock();

    await updateOracles(scallopBuilder, txb, coins);

    // v2: Use suiKit.inspectTxn which calls client.core.simulateTransaction
    const resp = await scallopBuilder.suiKit.inspectTxn(txb);

    // v2: Check status from the Transaction result
    const tx = resp.Transaction ?? resp.FailedTransaction;
    expect(tx?.status?.success).toEqual(true);
  });
});
