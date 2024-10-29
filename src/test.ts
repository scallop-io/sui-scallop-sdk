import { ScallopQuery } from './models';

const query = new ScallopQuery({
  walletAddress:
    '0xe78704e7c188b1902dbb630dc4c3ef7f46740c8cf121e38b3438ac1daea09f2d',
});

const main = async () => {
  try {
    await query.init();
    const result = await query.suiKit.client().getObject({
      id: '0xaa72bd551b25715b8f9d72f226fa02526bdf2e085a86faec7184230c5209bb6e',
      options: {
        showContent: true,
        showType: true,
      },
    });
    console.dir(result.data, { depth: null });
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
};

main();
