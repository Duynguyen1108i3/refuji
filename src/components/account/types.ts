import { Variants } from 'framer-motion';

export type MembershipTierType = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface RentalOrderRecord {
  id: number;
  order_code: string;
  model_id: string;
  model_name: string;
  start_date: string;
  expected_return_date: string;
  total_rent: number;
  deposit_amount: number;
  order_status: string;
  payment_deadline: string;
  created_at: string;
  assigned_serials?: string;
  items_detail?: string;
}

export interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: MembershipTierType;
  initialTab?: 'tiers' | 'orders' | 'profile';
  onChangeTier?: (tier: MembershipTierType) => void;
  onApplyVoucher?: (code: string, discount: number) => void;
}

export interface TierItem {
  id: MembershipTierType;
  label: string;
  discountText: string;
  minOrders: number;
  desc: string;
}

// Apple iOS / macOS Transition Motion Physics
export const appleTabVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 32 : -32,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      x: { type: 'spring', stiffness: 440, damping: 35, mass: 0.75 },
      opacity: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      filter: { duration: 0.16 },
    },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -32 : 32,
    opacity: 0,
    filter: 'blur(4px)',
    transition: {
      x: { type: 'spring', stiffness: 440, damping: 35, mass: 0.75 },
      opacity: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
      filter: { duration: 0.14 },
    },
  }),
};
