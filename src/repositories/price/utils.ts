import { BigNumber } from 'bignumber.js';

export const calculatePrice = ({
  price,
  expo,
}: {
  price: {
    magnitude: string;
    negative: boolean;
  };
  expo: {
    magnitude: string;
    negative: boolean;
  };
}) => {
  const expoSign = expo.negative ? -1 : 1;
  const priceSign = price.negative ? -1 : 1;
  return BigNumber(price.magnitude)
    .shiftedBy(expoSign * +expo.magnitude)
    .multipliedBy(priceSign);
};
