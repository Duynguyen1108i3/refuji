import { MembershipTier } from '../enums/membership-tier.enum.ts';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  isActive: boolean;
  reputationScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserKycProfile {
  id: number;
  userId: number;
  fullNameId: string;
  idCardLast4: string; // e.g. "1234" -> Displayed as "**** **** 1234"
  issueDate?: string | null;
  issuePlace?: string | null;
  privacyConsent: boolean;
  privacyConsentAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: number | null;
}

export interface UserAccountData extends UserProfile {
  kyc?: UserKycProfile | null;
  tier: MembershipTier;
  completedRentalsCount: number;
}
