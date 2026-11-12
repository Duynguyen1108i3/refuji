import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Camera,
  Users,
  Wallet,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  LogOut,
  ChevronDown,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavigationScrubber, NavScrubberItem } from '../../components/NavigationScrubber';
import { fetchDashboardOverview } from '../../services/dashboardApi';
import { DashboardGate } from '../../components/dashboard/DashboardGate';
import { OverviewTab } from '../../components/dashboard/OverviewTab';
import { OrdersOperationsTab } from '../../components/dashboard/OrdersOperationsTab';
import { InventoryMaintenanceTab } from '../../components/dashboard/InventoryMaintenanceTab';
import { CatalogTab } from '../../components/dashboard/CatalogTab';
import { CustomersKycTab } from '../../components/dashboard/CustomersKycTab';
import { FinanceLedgerTab } from '../../components/dashboard/FinanceLedgerTab';
import { AuditLogsTab } from '../../components/dashboard/AuditLogsTab';
import { CheckoutWizardModal } from '../../components/dashboard/CheckoutWizardModal';
import { CheckinSettlementModal } from '../../components/dashboard/CheckinSettlementModal';
import { OrderDossierModal } from '../../components/dashboard/OrderDossierModal';
import type { DashboardOverviewData, DashboardTabId } from '../../components/dashboard/dashboardTypes';

interface DashboardPageProps {
  onExitToStorefront: () => void;
}

const DASHBOARD_TAB_STORAGE_KEY = 'refuji_dashboard_active_tab';
const VALID_DASHBOARD_TABS: DashboardTabId[] = [
  'overview',
  'orders',
  'inventory',
  'catalog',
  'customers',
  'finance',
  'audit',
];

const getInitialDashboardTab = (): DashboardTabId => {
  if (typeof window === 'undefined') return 'overview';
  try {
    const saved = sessionStorage.getItem(DASHBOARD_TAB_STORAGE_KEY) as DashboardTabId | null;
    if (saved && VALID_DASHBOARD_TABS.includes(saved)) {
      return saved;
    }
  } catch (_) {}
  return 'overview';
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onExitToStorefront }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const isAuthorized = Boolean(
    isAuthenticated && user && (user.role === 'ADMIN' || user.role === 'STAFF')
  );

  const [activeTab, setActiveTabState] = useState<DashboardTabId>(getInitialDashboardTab);
  const [overviewData, setOverviewData] = useState<DashboardOverviewData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isSyncSpinning, setIsSyncSpinning] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [isOperatorMenuOpen, setIsOperatorMenuOpen] = useState(false);
  const operatorMenuRef = useRef<HTMLDivElement>(null);
  const syncSpinTimerRef = useRef<number | null>(null);

  const setActiveTab = useCallback((tab: DashboardTabId) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem(DASHBOARD_TAB_STORAGE_KEY, tab);
    } catch (_) {}
  }, []);

  // Shared Operational Modals
  const [checkoutOrderCode, setCheckoutOrderCode] = useState<string | null>(null);
  const [checkinOrderCode, setCheckinOrderCode] = useState<string | null>(null);
  const [dossierOrderCode, setDossierOrderCode] = useState<string | null>(null);

  // Clean Floating Notification Pill
  const [bannerToast, setBannerToast] = useState<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Đảm bảo URL luôn giữ #dashboard / /dashboard đồng bộ khi vào phân hệ Studio
  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthorized) return;
    const path = window.location.pathname.toLowerCase();
    const isPathRoute = path === '/dashboard' || path === '/admin';
    if (!isPathRoute && window.location.hash !== '#dashboard') {
      window.history.replaceState(null, '', '#dashboard');
    }
  }, [isAuthorized]);

  // Đóng popover tài khoản quản trị khi click ra ngoài
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (operatorMenuRef.current && !operatorMenuRef.current.contains(e.target as Node)) {
        setIsOperatorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const notify = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = String(Date.now());
      setBannerToast({ id, message, type });
      window.setTimeout(() => {
        setBannerToast((cur) => (cur?.id === id ? null : cur));
      }, 4500);
    },
    []
  );

  const loadOverview = useCallback(async (): Promise<boolean> => {
    if (!isAuthorized) return false;
    setIsLoadingOverview(true);
    try {
      const data = await fetchDashboardOverview();
      setOverviewData(data);
      return true;
    } catch (err: any) {
      notify(err?.message || 'Không thể tải báo cáo tổng quan.', 'error');
      return false;
    } finally {
      setIsLoadingOverview(false);
    }
  }, [isAuthorized, notify]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    return () => {
      if (syncSpinTimerRef.current) {
        window.clearTimeout(syncSpinTimerRef.current);
      }
    };
  }, []);

  const handleGlobalRefresh = useCallback(
    async (options?: { silentToast?: boolean }) => {
      setIsSyncSpinning(true);
      if (syncSpinTimerRef.current) {
        window.clearTimeout(syncSpinTimerRef.current);
      }
      syncSpinTimerRef.current = window.setTimeout(() => {
        setIsSyncSpinning(false);
      }, 600);

      setRefreshSignal((s) => s + 1);
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
      const ok = await loadOverview();

      if (ok && !options?.silentToast) {
        const nowStr = new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        notify(`Đã đồng bộ & làm mới dữ liệu lúc ${nowStr}`, 'success');
      }
    },
    [loadOverview, notify]
  );

  if (!isAuthorized) {
    return <DashboardGate onExitToStorefront={onExitToStorefront} />;
  }

  const navItems: NavScrubberItem[] = [
    { id: 'overview', label: 'Tổng quan', shortLabel: 'Home', icon: <LayoutDashboard size={15} /> },
    { id: 'orders', label: 'Đơn & POS', shortLabel: 'POS', icon: <ClipboardList size={15} /> },
    { id: 'inventory', label: 'Kho Serial', shortLabel: 'Kho', icon: <Wrench size={15} /> },
    { id: 'catalog', label: 'Danh mục', shortLabel: 'Mẫu', icon: <Camera size={15} /> },
    { id: 'customers', label: 'Khách & KYC', shortLabel: 'Khách', icon: <Users size={15} /> },
    { id: 'finance', label: 'Tài chính', shortLabel: 'Sổ cái', icon: <Wallet size={15} /> },
    { id: 'audit', label: 'Audit Logs', shortLabel: 'Audit', icon: <ShieldAlert size={15} /> },
  ];

  const initials = (user?.full_name || 'AD')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative min-h-screen bg-white text-[#14171f] selection:bg-[#14171f]/10 pb-28 lg:pb-16">
      {/* Forest Mist Atmosphere Top Backdrop echoing Storefront Hero */}
      <div
        className="fixed inset-x-0 top-0 h-[440px] bg-cover bg-top bg-no-repeat z-0 opacity-30 pointer-events-none no-print"
        style={{
          backgroundImage: `url('/assets/forest-clean.jpg')`,
          filter: 'grayscale(65%) contrast(106%) brightness(122%)',
        }}
      />
      <div className="fixed inset-x-0 top-0 h-[460px] bg-gradient-to-b from-white/55 via-white/90 to-white z-0 pointer-events-none no-print" />

      {/* Top Floating Home-Parity Liquid Bar (Matching LiquidNavbar.tsx without rigid centering) */}
      <header className="no-print sticky top-0 z-40 w-full pointer-events-none">
        <div className="bg-gradient-to-b from-white/95 via-white/80 to-transparent">
          <div className="w-full h-[84px] px-4 sm:px-6 lg:px-8 min-[1420px]:px-12 2xl:px-14 flex items-center justify-between gap-2.5 lg:gap-3 min-[1420px]:gap-4">
            {/* Left: Brand Wordmark matching Home LiquidNavbar */}
            <div className="flex items-center shrink-0 pointer-events-auto">
              <button
                type="button"
                onClick={onExitToStorefront}
                className="font-serif text-2xl sm:text-3xl tracking-[0.16em] font-medium text-[#14171f] hover:text-[#2c3242] transition-all drop-shadow-[0_2px_8px_rgba(20,24,32,0.08)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap focus:outline-none"
                title="Quay lại Trang chủ khách hàng"
              >
                REFUJI
              </button>
            </div>

            {/* Center/Main: Home-Parity NavigationScrubber (variant="header", identical height & typography scale) */}
            <div className="hidden lg:flex items-center justify-center min-w-0 pointer-events-auto">
              <NavigationScrubber
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as DashboardTabId)}
                items={navItems}
                variant="header"
                layoutId="dashboard-nav-desktop"
                className="!gap-0.5 min-[1360px]:!gap-1 min-[1500px]:!gap-1.5 [&>button]:lg:!px-2.5 [&>button]:xl:!px-2.5 [&>button]:min-[1360px]:!px-3.5 [&>button]:2xl:!px-4 [&>button>span]:lg:!text-xs [&>button>span]:min-[1360px]:!text-[13px] [&>button>span]:min-[1420px]:!text-sm"
              />
            </div>

            {/* Right: Home-Parity Floating White Pill Controls */}
            <div className="flex items-center justify-end gap-2 shrink-0 pointer-events-auto">
              <button
                type="button"
                onClick={() => void handleGlobalRefresh()}
                className="bg-white hover:bg-neutral-50 refuji-hover-lift w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-[#14171f] hover:text-[#0a0c10] border border-[#14171f]/10 hover:border-[#14171f]/25 shadow-[0_4px_16px_rgba(20,24,32,0.06)] cursor-pointer active:scale-95 transition-all"
                title="Đồng bộ dữ liệu toàn Dashboard"
                aria-label="Đồng bộ dữ liệu"
              >
                <RefreshCw size={16} className={isLoadingOverview || isSyncSpinning ? 'animate-spin' : ''} />
              </button>

              <button
                type="button"
                onClick={onExitToStorefront}
                className="bg-white hover:bg-neutral-50 refuji-hover-lift h-11 px-3.5 sm:px-4 2xl:px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 text-[#14171f] hover:text-[#0a0c10] border border-[#14171f]/10 hover:border-[#14171f]/25 shadow-[0_4px_16px_rgba(20,24,32,0.06)] cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
                title="Quay lại Trang chủ Cửa hàng"
              >
                <ArrowLeft size={15} className="shrink-0" />
                <span className="hidden sm:inline">Cửa hàng</span>
              </button>

              {/* Operator Profile Pill & Popover (Matching UserNavButton.tsx h-11 scale) */}
              <div className="relative shrink-0" ref={operatorMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsOperatorMenuOpen((o) => !o)}
                  className="bg-white hover:bg-neutral-50 refuji-hover-lift h-11 px-2.5 xl:pl-2.5 xl:pr-3.5 rounded-full flex items-center gap-2 xl:gap-2.5 text-[#14171f] border border-[#14171f]/10 hover:border-[#14171f]/25 shadow-[0_4px_16px_rgba(20,24,32,0.06)] cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
                  aria-label="Menu tài khoản quản trị"
                  aria-expanded={isOperatorMenuOpen}
                >
                  <div className="w-7 h-7 aspect-square rounded-full bg-[#14171f] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="hidden xl:flex flex-col text-left leading-tight">
                    <span className="text-xs font-semibold text-[#14171f] max-w-[120px] truncate">
                      {user?.full_name}
                    </span>
                    <span className="text-[9.5px] font-semibold text-[#5a6072] uppercase tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`hidden xl:block text-[#5a6072] shrink-0 transition-transform duration-200 ${
                      isOperatorMenuOpen ? 'rotate-180 text-[#14171f]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOperatorMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-72 liquid-glass-menu rounded-3xl p-3 z-50 overflow-hidden"
                    >
                      <div className="p-3 bg-[#f7f8fa] rounded-2xl mb-2 border border-[#14171f]/8">
                        <p className="font-semibold text-xs text-[#14171f] truncate">
                          {user?.full_name}
                        </p>
                        <p className="text-[11px] text-[#5a6072] num truncate mt-0.5">
                          {user?.email}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-[#14171f]/8 flex items-center justify-between text-[11px]">
                          <span className="text-[#5a6072] flex items-center gap-1.5 font-medium">
                            <ShieldCheck size={13} className="text-[#14171f]" />
                            <span>Phân quyền:</span>
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              user?.role === 'ADMIN'
                                ? 'bg-[#14171f] text-white border-[#14171f]'
                                : 'bg-sky-50 text-sky-800 border-sky-200'
                            }`}
                          >
                            {user?.role === 'ADMIN' ? 'ADMIN · Toàn quyền' : 'STAFF · Vận hành POS'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOperatorMenuOpen(false);
                            setActiveTab('overview');
                          }}
                          className="w-full px-3.5 py-2 text-left rounded-full hover:bg-[#14171f]/[0.05] flex items-center justify-between font-medium text-[#14171f] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <LayoutDashboard size={14} className="text-[#14171f]/75" />
                            <span>Tổng quan vận hành</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsOperatorMenuOpen(false);
                            onExitToStorefront();
                          }}
                          className="w-full px-3.5 py-2 text-left rounded-full hover:bg-[#14171f]/[0.05] flex items-center justify-between font-medium text-[#14171f] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <ArrowLeft size={14} className="text-[#14171f]/75" />
                            <span>Quay lại Trang chủ Storefront</span>
                          </span>
                          <ExternalLink size={12} className="text-[#8c93a4]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsOperatorMenuOpen(false);
                            logout();
                          }}
                          className="w-full px-3.5 py-2 text-left rounded-full hover:bg-rose-50 flex items-center gap-2 font-medium text-rose-600 transition-colors cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Đăng xuất phiên quản trị</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Bottom Floating Dock (Matching Storefront LiquidNavbar.tsx) */}
      <div
        className="no-print lg:hidden fixed bottom-5 inset-x-0 z-40 mx-auto w-[94%] max-w-[600px] flex justify-center pointer-events-auto"
        style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <NavigationScrubber
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as DashboardTabId)}
          items={navItems}
          variant="mobile-dock"
          layoutId="dashboard-nav-mobile"
          className="overflow-x-auto max-w-full justify-start"
        />
      </div>

      {/* Main Content Container (Exact Home Storefront max-w-6xl Width & Spacing) */}
      <main className="no-print relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                data={overviewData}
                isLoading={isLoadingOverview || isSyncSpinning}
                onRefresh={() => void handleGlobalRefresh()}
                onNavigateTab={setActiveTab}
                onOpenCheckout={(code) => setCheckoutOrderCode(code)}
                onOpenCheckin={(code) => setCheckinOrderCode(code)}
                onOpenDossier={(code) => setDossierOrderCode(code)}
                onNotify={notify}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersOperationsTab
                onOpenCheckout={(code) => setCheckoutOrderCode(code)}
                onOpenCheckin={(code) => setCheckinOrderCode(code)}
                onOpenDossier={(code) => setDossierOrderCode(code)}
                onNotify={notify}
                refreshSignal={refreshSignal}
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryMaintenanceTab
                onNotify={notify}
                onOpenDossier={(code) => setDossierOrderCode(code)}
                refreshSignal={refreshSignal}
              />
            )}
            {activeTab === 'catalog' && (
              <CatalogTab onNotify={notify} refreshSignal={refreshSignal} />
            )}
            {activeTab === 'customers' && (
              <CustomersKycTab
                onNotify={notify}
                onOpenDossier={(code) => setDossierOrderCode(code)}
                refreshSignal={refreshSignal}
              />
            )}
            {activeTab === 'finance' && (
              <FinanceLedgerTab
                onOpenDossier={(code) => setDossierOrderCode(code)}
                onNotify={notify}
                refreshSignal={refreshSignal}
              />
            )}
            {activeTab === 'audit' && (
              <AuditLogsTab onNotify={notify} refreshSignal={refreshSignal} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Notification Pill */}
      <AnimatePresence>
        {bannerToast && (
          <motion.div
            key={bannerToast.id}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="no-print fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-[260] crystal-liquid-glass border border-[#14171f]/12 bg-white px-5 py-2.5 rounded-full text-xs sm:text-[13px] text-[#14171f] shadow-[0_10px_34px_rgba(20,24,32,0.12)] flex items-center gap-2.5 font-medium max-w-[92vw]"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                bannerToast.type === 'error'
                  ? 'bg-rose-500'
                  : bannerToast.type === 'info'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="truncate">{bannerToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Operational Modals */}
      <AnimatePresence>
        {checkoutOrderCode && (
          <CheckoutWizardModal
            orderCode={checkoutOrderCode}
            onClose={() => setCheckoutOrderCode(null)}
            onCompleted={(_code, msg) => {
              notify(msg, 'success');
              void handleGlobalRefresh({ silentToast: true });
            }}
            onNotify={notify}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checkinOrderCode && (
          <CheckinSettlementModal
            orderCode={checkinOrderCode}
            onClose={() => setCheckinOrderCode(null)}
            onCompleted={(_code, msg) => {
              notify(msg, 'success');
              void handleGlobalRefresh({ silentToast: true });
            }}
            onOpenPrintDossier={(code) => setDossierOrderCode(code)}
            onNotify={notify}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dossierOrderCode && (
          <OrderDossierModal
            orderCode={dossierOrderCode}
            onClose={() => setDossierOrderCode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
