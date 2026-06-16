export const prepend0x = (str: string) => {
  return str.startsWith('0x') ? str : `0x${str}`;
};
