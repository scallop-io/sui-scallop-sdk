// import { ScallopQuery } from './models';
// const main = async () => {
//   try {
//     const query = new ScallopQuery({
//       walletAddress:
//         '0x61819c99588108d9f7710047e6ad8f2da598de8e98a26ea62bd7ad9847f5123c',
//     });
//     await query.init();
//     const { suppliedValue: haSuiLendingValue } =
//       await query.getLending('hasui');
//     const obligations = await query.getObligationAccounts();

//     const haSuiCollateralUsdValue = Object.values(obligations).reduce(
//       (acc, obligation) => {
//         acc += obligation?.collaterals.hasui?.depositedValue ?? 0;
//         return acc;
//       },
//       0
//     );

//     const totalStaked = haSuiCollateralUsdValue + haSuiLendingValue;
//     console.log(totalStaked);
//   } catch (e) {
//     console.error(e);
//   } finally {
//     process.exit(0);
//   }
// };

// main();
