import { ScallopQuery } from './models';

const main = async () => {
  try {
    const query = new ScallopQuery({});
    await query.init();

    const res = await query.getSpool('ssui');
    console.dir(res, { depth: null });
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
};

main();
