import type { SuiObjectRef } from '@mysten/sui.js/client';

export type Vesca = {
  id: string;
  keyId: string;
  keyObject?: SuiObjectRef;
  object?: SuiObjectRef;
  lockedScaAmount: string;
  lockedScaCoin: number;
  currentVeScaBalance: number;
  unlockAt: number;
};

export type VeScaTreasuryFields = {
  total_ve_sca_amount: string;
  sca_balance: string;
  unlock_schedule: {
    fields: {
      locked_sca_amount: string;
    };
  };
};

export type VeScaTreasuryInfo = {
  totalLockedSca: number;
  totalVeSca: number;
  averageLockingPeriod: number;
  averageLockingPeriodUnit: string;
};
