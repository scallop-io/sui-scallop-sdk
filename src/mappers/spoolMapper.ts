import { parseMoveTypeName } from './moveTypeMapper.js';
import { ScallopParseError } from 'src/errors/index.js';

export const mapSpoolData = <T extends { stakeType: unknown }>(raw: T) => ({
  ...raw,
  stakeType: parseSpoolStakeType(raw.stakeType),
});

const parseSpoolStakeType = (stakeType: unknown) => {
  try {
    return parseMoveTypeName(stakeType);
  } catch (cause) {
    throw new ScallopParseError('Failed to map Move type at spool.stakeType', {
      cause,
      context: { path: 'spool.stakeType' },
    });
  }
};
