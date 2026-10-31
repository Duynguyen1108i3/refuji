import React, { useState, useEffect } from 'react';
import { ClientLayout } from '../layouts/ClientLayout.tsx';
import { HomePage } from '../pages/client/HomePage.tsx';
import { CatalogPage } from '../pages/client/CatalogPage.tsx';
import { ModelDetailPage } from '../pages/client/ModelDetailPage.tsx';
import { BookingCheckoutPage } from '../pages/client/BookingCheckoutPage.tsx';
import { VnpayReturnPage } from '../pages/client/VnpayReturnPage.tsx';
import { MyOrdersPage } from '../pages/client/MyOrdersPage.tsx';
import { OrderTrackingPage } from '../pages/client/OrderTrackingPage.tsx';
import { UserProfileKycPage } from '../pages/client/UserProfileKycPage.tsx';
import { MembershipReputationPage } from '../pages/client/MembershipReputationPage.tsx';
import { LegalPoliciesPage } from '../pages/client/LegalPoliciesPage.tsx';

import { LoginPage } from '../pages/auth/LoginPage.tsx';
import { RegisterPage } from '../pages/auth/RegisterPage.tsx';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.tsx';

import { DashboardReportPage } from '../pages/admin-staff/DashboardReportPage.tsx';
import { CatalogManagePage } from '../pages/admin-staff/CatalogManagePage.tsx';
import { SerialInventoryPage } from '../pages/admin-staff/SerialInventoryPage.tsx';
import { OrderApprovalPage } from '../pages/admin-staff/OrderApprovalPage.tsx';
import { CheckoutWizardPage } from '../pages/admin-staff/CheckoutWizardPage.tsx';
import { CheckinSettlementPage } from '../pages/admin-staff/CheckinSettlementPage.tsx';
import { MaintenanceLogsPage } from '../pages/admin-staff/MaintenanceLogsPage.tsx';
import { CustomerManagePage } from '../pages/admin-staff/CustomerManagePage.tsx';
import { PaymentReconcilePage } from '../pages/admin-staff/PaymentReconcilePage.tsx';
import { AuditLogsViewerPage } from '../pages/admin-staff/AuditLogsViewerPage.tsx';

import { MembershipTier } from '@refuji/shared';

export const AppRoutes: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Example demo user state: Set to MembershipTier.GOLD (or null to test guest state)
  const [userTier, setUserTier] = useState<MembershipTier | null>(MembershipTier.GOLD);
  const [userName, setUserName] = useState<string | null>('Trần Văn An');

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth pages (no ClientLayout wrapper)
  if (currentPath === '/login') return <LoginPage />;
  if (currentPath === '/register') return <RegisterPage />;
  if (currentPath === '/forgot-password') return <ForgotPasswordPage />;

  // Admin / Staff POS screens (wrapped in StaffPosLayout internally)
  if (currentPath.startsWith('/staff/')) {
    if (currentPath === '/staff/dashboard') return <DashboardReportPage />;
    if (currentPath === '/staff/catalog') return <CatalogManagePage />;
    if (currentPath === '/staff/inventory') return <SerialInventoryPage />;
    if (currentPath === '/staff/approval') return <OrderApprovalPage />;
    if (currentPath === '/staff/checkout-wizard') return <CheckoutWizardPage />;
    if (currentPath === '/staff/checkin-settlement') return <CheckinSettlementPage />;
    if (currentPath === '/staff/maintenance') return <MaintenanceLogsPage />;
    if (currentPath === '/staff/customers') return <CustomerManagePage />;
    if (currentPath === '/staff/reconcile') return <PaymentReconcilePage />;
    if (currentPath === '/staff/audit-logs') return <AuditLogsViewerPage />;
    return <DashboardReportPage />;
  }

  // Client pages (wrapped in ClientLayout)
  const renderClientPage = () => {
    if (currentPath === '/catalog') return <CatalogPage userTier={userTier} />;
    if (currentPath.startsWith('/catalog/')) return <ModelDetailPage userTier={userTier} />;
    if (currentPath === '/checkout') return <BookingCheckoutPage userTier={userTier} />;
    if (currentPath.startsWith('/vnpay-return')) return <VnpayReturnPage />;
    if (currentPath === '/orders') return <MyOrdersPage />;
    if (currentPath.startsWith('/orders/tracking/')) return <OrderTrackingPage />;
    if (currentPath === '/profile') return <UserProfileKycPage />;
    if (currentPath === '/membership') return <MembershipReputationPage />;
    if (currentPath === '/policies') return <LegalPoliciesPage />;
    return <HomePage userTier={userTier} onOpenAuth={() => (window.location.href = '/login')} />;
  };

  return (
    <ClientLayout
      userTier={userTier}
      userName={userName}
      cartCount={2}
      onOpenAuth={() => (window.location.href = '/login')}
    >
      {renderClientPage()}
    </ClientLayout>
  );
};
