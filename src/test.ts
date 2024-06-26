import { Scallop } from './models';
import * as dotenv from 'dotenv';
dotenv.config();
const scallop = new Scallop({
  secretKey: process.env.SECRET_KEY as string,
});

const main = async () => {
  const query = await scallop.createScallopQuery();

  const res = await query.getVeScas(
    '0xd1a70cfe7332e994a950b9c570e93def4b6d2ec53b34ff5c0cc9946226a7cf3d'
  );
  console.dir(res, { depth: null });
};
main()
  .then()
  .catch(console.error)
  .finally(() => process.exit(0));
