import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShieldCheck,
  Award,
  Lock,
  Unlock,
  X,
  RefreshCw,
  FileText,
  UserCog,
  AlertTriangle,
  Loader2,
  Info,
} from 'lucide-react';
import {
  adjustCustomerReputation,
  fetchCustomerDetail,
  fetchCustomers,
  fetchGuestSummary,
  updateCustomerRole,
  updateCustomerStatus,
  updateCustomerTier,
} from '../../services/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import { GlassSelect } from './GlassSelect';
import {
  CustomerRow,
  GuestSummaryRow,
  formatVnd,
  formatShortDate,
} from './dashboardTypes';
import {
  POPUP_BACKDROP_CLASS,
  buildPopupFrameClass,
  POPUP_INNER_CLASS,
  POPUP_CLOSE_BUTTON_CLASS,
  getBackdropDismissProps,
} from '../ui/popupTheme';

interface CustomersKycTabProps {
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenDossier: (orderCode: string) => void;
  refreshSignal: number;
}

export const CustomersKycTab: React.FC<CustomersKycTabProps> = ({
  onNotify,
  onOpenDossier,
  refreshSignal,
}) => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [subTab, setSubTab] = useState<'members' | 'guests'>('members');
  const [members, setMembers] = useState<CustomerRow[]>([]);
  const [guests, setGuests] = useState<GuestSummaryRow[]>([]);
  const [tierFilter, setTierFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'OPS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<number | null>(null);
  const [confirmAdminTarget, setConfirmAdminTarget] = useState<CustomerRow | null>(null);
  const [showRbacGuide, setShowRbacGuide] = useState(true);

  const [repTarget, setRepTarget] = useState<CustomerRow | null>(null);
  const [repScore, setRepScore] = useState(100);
  const [repReason, setRepReason] = useState('');

  const [detailTarget, setDetailTarget] = useState<{ customer: CustomerRow; orders: any[] } | null>(null);

  const loadData = useCallback(async (manual = false) => {
    setIsLoading(true);
    try {
      const [mList, gList] = await Promise.all([
        fetchCustomers({ tier: tierFilter, role: roleFilter, search: searchTerm }),
        fetchGuestSummary(),
        manual ? new Promise((r) => setTimeout(r, 450)) : Promise.resolve(),
      ]);
      setMembers(mList);
      setGuests(gList);
      if (manual) {
        onNotify(`Đã làm mới ${mList.length} tài khoản & hồ sơ KYC`, 'success');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Không thể tải danh sách khách hàng.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [tierFilter, roleFilter, searchTerm, onNotify]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadData();
    }, 150);
    return () => clearTimeout(t);
  }, [loadData, refreshSignal]);

  const handleToggleLock = async (c: CustomerRow) => {
    try {
      const res = await updateCustomerStatus(
        c.id,
        !c.is_active,
        c.is_active ? 'Admin khóa tài khoản từ Dashboard' : 'Admin mở khóa tài khoản'
      );
      onNotify(res.message, 'success');
      await loadData();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể cập nhật trạng thái tài khoản.', 'error');
    }
  };

  const handleChangeTier = async (c: CustomerRow, nextTier: string) => {
    if (nextTier === c.membership_tier) return;
    try {
      const res = await updateCustomerTier(c.id, nextTier);
      onNotify(res.message, 'success');
      await loadData();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể đổi hạng thành viên.', 'error');
    }
  };

  const applyCustomerRole = async (c: CustomerRow, nextRole: 'CUSTOMER' | 'STAFF' | 'ADMIN') => {
    setUpdatingRoleUserId(c.id);
    try {
      const res = await updateCustomerRole(c.id, nextRole);
      onNotify(res.message, 'success');
      await loadData();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể cập nhật vai trò phân quyền.', 'error');
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleSelectRole = (c: CustomerRow, nextRoleStr: string) => {
    const nextRole = nextRoleStr as 'CUSTOMER' | 'STAFF' | 'ADMIN';
    if (nextRole === c.role) return;
    if (nextRole === 'ADMIN') {
      setConfirmAdminTarget(c);
      return;
    }
    void applyCustomerRole(c, nextRole);
  };

  const handleSaveReputation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repTarget) return;
    try {
      const res = await adjustCustomerReputation(repTarget.id, repScore, repReason);
      onNotify(res.message, repScore < 20 ? 'info' : 'success');
      setRepTarget(null);
      await loadData();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể điều chỉnh điểm uy tín.', 'error');
    }
  };

  const handleOpenCustomerDetail = async (id: number) => {
    try {
      const detail = await fetchCustomerDetail(id);
      setDetailTarget(detail);
    } catch (err: any) {
      onNotify(err?.message || 'Không thể tải lịch sử đơn hàng.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/80 radar-pulse-white" />
            <span>Hồ Sơ Định Danh KYC &amp; Phân Quyền</span>
          </div>
          <h2 className="font-serif text-3xl text-[#14171f]">
            Quản Lý Nhân Sự, Khách Hàng &amp; Phân Quyền
          </h2>
          <p className="text-xs sm:text-sm text-[#5a6072] mt-1">
            Phân quyền nhân viên (STAFF), kiểm soát điểm uy tín (tự khóa &lt; 20), phân hạng giảm cọc và thống kê khách vãng lai.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowRbacGuide((v) => !v)}
            className={`glass-button px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              showRbacGuide ? 'bg-[#14171f]/[0.06]' : ''
            }`}
          >
            <Info size={13} />
            <span>{showRbacGuide ? 'Ẩn sơ đồ quyền' : 'Sơ đồ phân quyền'}</span>
          </button>
          <button
            type="button"
            onClick={() => void loadData(true)}
            className="glass-button px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Subtab Pill Toggle */}
      <div className="inline-flex items-center gap-1 bg-white p-1.5 rounded-full border border-[#14171f]/10 shadow-xs">
        <button
          type="button"
          onClick={() => setSubTab('members')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer num ${
            subTab === 'members' ? 'bg-[#14171f] text-white' : 'text-[#5a6072] hover:text-[#14171f]'
          }`}
        >
          Thành viên &amp; Nhân sự ({members.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('guests')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer num ${
            subTab === 'guests' ? 'bg-[#14171f] text-white' : 'text-[#5a6072] hover:text-[#14171f]'
          }`}
        >
          Khách Vãng Lai ({guests.length})
        </button>
      </div>

      {subTab === 'members' ? (
        <>
          {/* Compact 3-Tier RBAC Recommendation Strip */}
          {showRbacGuide && (
            <div className="liquid-glass rounded-3xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserCog size={15} className="text-[#14171f]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14171f]">
                    Mô hình Phân Quyền 3 Tầng (CUSTOMER / STAFF / ADMIN)
                  </h3>
                </div>
                {!isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[10.5px] font-semibold text-sky-800">
                    Chỉ ADMIN mới có quyền thay đổi vai trò
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11.5px]">
                <div className="p-3 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/8 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-400" />
                    <span className="font-bold text-[#14171f]">1. Khách hàng (CUSTOMER)</span>
                  </div>
                  <p className="text-[#5a6072] leading-relaxed">
                    Chỉ đặt thuê &amp; xem đơn cá nhân ngoài Cửa hàng. Chặn truy cập Dashboard và mọi API `/api/admin/*`.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span className="font-bold text-sky-950">2. Nhân viên POS (STAFF — +1 bậc)</span>
                  </div>
                  <p className="text-sky-900/90 leading-relaxed">
                    Vào Dashboard kiểm tra đơn, duyệt &amp; Check-out/in, cập nhật Kho/Bảo dưỡng, Sổ cái &amp; Audit.{' '}
                    <strong className="text-sky-950">Không thể sửa giá, khóa nick, đổi VIP hay phân quyền.</strong>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#14171f]/[0.04] border border-[#14171f]/12 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#14171f]" />
                    <span className="font-bold text-[#14171f]">3. Quản trị viên (ADMIN)</span>
                  </div>
                  <p className="text-[#5a6072] leading-relaxed">
                    Toàn quyền cao nhất: điều chỉnh giá thuê &amp; tiền cọc mẫu máy, ẩn/hiện thiết bị, khóa tài khoản và nâng/hạ quyền <strong className="text-[#14171f]">STAFF</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Unified Home-Style Filter Bar */}
          <div className="liquid-glass rounded-3xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-[#62687a]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, email hoặc SĐT thành viên..."
                className="w-full pl-10 pr-9 py-2.5 rounded-full crystal-liquid-lens text-xs sm:text-sm text-[#14171f] focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#14171f]/10 hover:bg-[#14171f]/20 text-[#14171f] flex items-center justify-center cursor-pointer"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Role Filter Segmented Pill */}
              <div className="flex items-center gap-1 bg-[#f7f8fa] p-1 rounded-full border border-[#14171f]/10">
                {[
                  { id: 'ALL', label: 'Tất cả vai trò' },
                  { id: 'CUSTOMER', label: 'Khách hàng' },
                  { id: 'OPS', label: 'Nhân viên & Quản trị' },
                ].map((rf) => (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => setRoleFilter(rf.id as 'ALL' | 'CUSTOMER' | 'OPS')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      roleFilter === rf.id
                        ? 'bg-[#14171f] text-white shadow-xs'
                        : 'text-[#5a6072] hover:text-[#14171f]'
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>

              {/* Tier GlassSelect */}
              <GlassSelect
                value={tierFilter}
                onChange={setTierFilter}
                menuTitle="Lọc hạng thành viên"
                align="right"
                minMenuWidth={205}
                className="min-w-[175px]"
                ariaLabel="Lọc theo hạng thành viên"
                options={[
                  { value: 'ALL', label: 'Tất cả hạng' },
                  { value: 'BRONZE', label: 'BRONZE', dotClass: 'bg-amber-700' },
                  { value: 'SILVER', label: 'SILVER', badge: '-5% cọc', dotClass: 'bg-slate-400' },
                  { value: 'GOLD', label: 'GOLD', badge: '-10% cọc', dotClass: 'bg-amber-500' },
                  { value: 'PLATINUM', label: 'PLATINUM', badge: '-15% cọc', dotClass: 'bg-[#14171f]' },
                ]}
              />
            </div>
          </div>

          <div className="liquid-glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#14171f]/10 bg-[#f7f8fa] text-[10.5px] font-semibold uppercase tracking-wider text-[#5a6072]">
                    <th className="py-3.5 pl-4 pr-2">Thành viên</th>
                    <th className="py-3.5 px-2">Vai trò RBAC</th>
                    <th className="py-3.5 px-2">KYC</th>
                    <th className="py-3.5 px-2">Hạng</th>
                    <th className="py-3.5 px-2">Uy tín</th>
                    <th className="py-3.5 px-2 text-right">Đơn / Chi tiêu</th>
                    <th className="py-3.5 px-2">Trạng thái</th>
                    <th className="py-3.5 pl-2 pr-4 text-right">Quản lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14171f]/8">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#7e8596]">
                        {isLoading
                          ? 'Đang tải danh sách thành viên...'
                          : 'Không có thành viên nào phù hợp với bộ lọc.'}
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => {
                      const isSelf = m.id === currentUser?.id;
                      const roleMeta =
                        m.role === 'ADMIN'
                          ? { label: 'ADMIN · Quản trị', dot: 'bg-[#14171f]', pill: 'bg-[#14171f] text-white border-[#14171f]' }
                          : m.role === 'STAFF'
                          ? { label: 'STAFF (+1)', dot: 'bg-sky-500', pill: 'bg-sky-50 text-sky-800 border-sky-200' }
                          : { label: 'CUSTOMER', dot: 'bg-neutral-400', pill: 'bg-neutral-100 text-[#4b5262] border-neutral-200' };

                      return (
                      <tr key={m.id} className="hover:bg-[#f7f8fa]/70">
                        <td className="py-3.5 pl-4 pr-2 max-w-[178px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[#14171f] truncate max-w-[132px]">{m.full_name}</span>
                            {isSelf && (
                              <span className="px-2 py-0.5 rounded-full bg-[#14171f]/[0.07] text-[#14171f] text-[10px] font-semibold shrink-0">
                                Bạn
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#5a6072] num mt-0.5 truncate" title={`${m.email} • ${m.phone || '—'}`}>
                            {m.email} • {m.phone || '—'}
                          </p>
                        </td>

                        <td className="py-3.5 px-2 whitespace-nowrap">
                          {isAdmin && !isSelf ? (
                            <GlassSelect
                              value={m.role}
                              onChange={(nextVal) => handleSelectRole(m, nextVal)}
                              disabled={updatingRoleUserId === m.id}
                              size="sm"
                              variant="white"
                              menuTitle="Phân quyền truy cập hệ thống"
                              minMenuWidth={285}
                              className="w-[122px]"
                              ariaLabel={`Phân quyền vai trò cho ${m.full_name}`}
                              options={[
                                {
                                  value: 'CUSTOMER',
                                  label: 'CUSTOMER',
                                  badge: 'Khách hàng',
                                  dotClass: 'bg-neutral-400',
                                  description: 'Chỉ đặt thuê ngoài Cửa hàng Storefront, không vào Dashboard.',
                                },
                                {
                                  value: 'STAFF',
                                  label: 'STAFF (+1)',
                                  badge: 'Nhân viên POS',
                                  dotClass: 'bg-sky-500',
                                  description: 'Vào Dashboard kiểm tra đơn, Check-out/in, Kho & Sổ cái; không sửa giá hay phân quyền.',
                                },
                                {
                                  value: 'ADMIN',
                                  label: 'ADMIN',
                                  badge: 'Toàn quyền',
                                  dotClass: 'bg-[#14171f]',
                                  description: 'Toàn quyền cấu hình giá thuê, cọc, khóa tài khoản & phân quyền nhân sự.',
                                },
                              ]}
                            />
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border whitespace-nowrap ${roleMeta.pill}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  m.role === 'ADMIN' ? 'bg-white' : roleMeta.dot
                                }`}
                              />
                              <span>{roleMeta.label}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-2 num whitespace-nowrap">
                          {m.id_card_last4 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                              <ShieldCheck size={12} />
                              ****{m.id_card_last4}
                            </span>
                          ) : (
                            <span className="text-[#8c93a4] italic text-[11px]">Chưa KYC</span>
                          )}
                        </td>

                        <td className="py-3.5 px-2 whitespace-nowrap">
                          {isAdmin ? (
                            <GlassSelect
                              value={m.membership_tier}
                              onChange={(nextTier) => handleChangeTier(m, nextTier)}
                              size="sm"
                              variant="white"
                              menuTitle="Điều chỉnh hạng VIP"
                              minMenuWidth={195}
                              className="w-[114px]"
                              ariaLabel={`Hạng thành viên của ${m.full_name}`}
                              options={[
                                { value: 'BRONZE', label: 'BRONZE', dotClass: 'bg-amber-700' },
                                { value: 'SILVER', label: 'SILVER', badge: '-5% cọc', dotClass: 'bg-slate-400' },
                                { value: 'GOLD', label: 'GOLD', badge: '-10% cọc', dotClass: 'bg-amber-500' },
                                { value: 'PLATINUM', label: 'PLATINUM', badge: '-15% cọc', dotClass: 'bg-[#14171f]' },
                              ]}
                            />
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 font-bold text-[#14171f]">
                              {m.membership_tier}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-2 num whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-8 h-1.5 rounded-full bg-neutral-100 overflow-hidden shrink-0">
                              <div
                                className={`h-full rounded-full ${
                                  m.reputation_score >= 80
                                    ? 'bg-emerald-500'
                                    : m.reputation_score >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-rose-600'
                                }`}
                                style={{ width: `${m.reputation_score}%` }}
                              />
                            </div>
                            <span className={`font-bold ${m.reputation_score < 20 ? 'text-rose-700' : 'text-[#14171f]'}`}>
                              {m.reputation_score}/100
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-right num whitespace-nowrap">
                          <div className="font-bold text-[#14171f]">{formatVnd(m.total_spend)}</div>
                          <div className="text-[10.5px] text-[#5a6072]">
                            {m.total_orders} đơn • {m.total_completed_rentals} xong
                          </div>
                        </td>
                        <td className="py-3.5 px-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border whitespace-nowrap ${
                              m.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {m.is_active ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2 pr-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenCustomerDetail(m.id)}
                              className="glass-button px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Lịch sử
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRepTarget(m);
                                setRepScore(m.reputation_score);
                                setRepReason('');
                              }}
                              className="glass-button px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Award size={11} />
                              <span>Uy tín</span>
                            </button>
                            {isAdmin && !isSelf && (
                              <button
                                type="button"
                                onClick={() => handleToggleLock(m)}
                                className={`p-1.5 rounded-full border cursor-pointer shrink-0 ${
                                  m.is_active
                                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                                title={m.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              >
                                {m.is_active ? <Lock size={12} /> : <Unlock size={12} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Guest Directory */
        <div className="liquid-glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#14171f]/10 bg-[#f7f8fa] text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                  <th className="py-3.5 px-5">Số điện thoại</th>
                  <th className="py-3.5 px-4">Tên Khách vãng lai</th>
                  <th className="py-3.5 px-4">Email liên hệ</th>
                  <th className="py-3.5 px-4 text-center">Tổng đơn</th>
                  <th className="py-3.5 px-4 text-center">Chờ xử lý</th>
                  <th className="py-3.5 px-4 text-right">Tổng giá trị thuê</th>
                  <th className="py-3.5 px-5 text-right">Đơn gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14171f]/8 num">
                {guests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center font-sans text-[#7e8596]">
                      {isLoading
                        ? 'Đang tải danh sách khách vãng lai...'
                        : 'Chưa có khách vãng lai nào phát sinh đơn thuê.'}
                    </td>
                  </tr>
                ) : (
                  guests.map((g) => (
                    <tr key={g.guest_phone} className="hover:bg-[#f7f8fa]/70">
                      <td className="py-3.5 px-5 font-bold text-[#14171f]">{g.guest_phone}</td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-[#14171f]">{g.guest_name}</td>
                      <td className="py-3.5 px-4 font-sans text-[#5a6072]">{g.guest_email}</td>
                      <td className="py-3.5 px-4 text-center font-bold">{g.total_orders}</td>
                      <td className="py-3.5 px-4 text-center">
                        {g.pending_inquiries > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                            {g.pending_inquiries}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#14171f] whitespace-nowrap">
                        {formatVnd(g.total_rent_value)}
                      </td>
                      <td className="py-3.5 px-5 text-right text-[#5a6072]">{formatShortDate(g.last_order_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Điều chỉnh Điểm Uy Tín */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {repTarget && (
              <motion.div
                key="customer-rep-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setRepTarget(null))}
                className={`${POPUP_BACKDROP_CLASS} z-[220]`}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className={buildPopupFrameClass('max-w-md', 'h-auto max-h-[85vh]')}
              >
                <div className={POPUP_INNER_CLASS}>
                  <button type="button" onClick={() => setRepTarget(null)} className={POPUP_CLOSE_BUTTON_CLASS}>
                    <X size={16} />
                  </button>
                  <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14">
                    <h3 className="font-serif text-xl text-[#14171f]">Điều Chỉnh Điểm Uy Tín</h3>
                    <p className="text-xs text-[#5a6072] mt-0.5">{repTarget.full_name}</p>
                  </div>
                  <form onSubmit={handleSaveReputation} className="p-6 space-y-4 text-xs overflow-y-auto">
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">
                        Điểm uy tín mới (0–100) • &lt; 20 sẽ tự khóa tài khoản
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={repScore}
                        onChange={(e) => setRepScore(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Lý do điều chỉnh</label>
                      <input
                        type="text"
                        value={repReason}
                        onChange={(e) => setRepReason(e.target.value)}
                        placeholder="Bù điểm sai sót / Phạt vi phạm bảo quản..."
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setRepTarget(null)} className="glass-button px-4 py-2 rounded-full font-semibold cursor-pointer">
                        Hủy
                      </button>
                      <button type="submit" className="px-5 py-2 rounded-full bg-[#14171f] text-white font-semibold cursor-pointer">
                        Lưu điểm uy tín
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal: Chi tiết Lịch sử Khách hàng */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {detailTarget && (
              <motion.div
                key="customer-detail-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setDetailTarget(null))}
                className={`${POPUP_BACKDROP_CLASS} z-[220]`}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className={buildPopupFrameClass('max-w-2xl', 'h-auto max-h-[85vh]')}
              >
                <div className={POPUP_INNER_CLASS}>
                  <button type="button" onClick={() => setDetailTarget(null)} className={POPUP_CLOSE_BUTTON_CLASS}>
                    <X size={16} />
                  </button>
                  <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14">
                    <h3 className="font-serif text-xl text-[#14171f]">Hồ Sơ Thành Viên: {detailTarget.customer.full_name}</h3>
                    <p className="text-xs text-[#5a6072] num mt-0.5">
                      {detailTarget.customer.email} • Hạng {detailTarget.customer.membership_tier} • Uy tín {detailTarget.customer.reputation_score}/100
                    </p>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-2.5 text-xs">
                    {detailTarget.orders.length === 0 ? (
                      <p className="text-[#7e8596] text-center py-6">Thành viên này chưa có đơn thuê nào.</p>
                    ) : (
                      detailTarget.orders.map((o) => (
                        <div key={o.order_code} className="p-3.5 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 flex items-center justify-between gap-3 num">
                          <div>
                            <span className="font-bold text-[#14171f]">#{o.order_code}</span>
                            <span className="ml-2 font-sans font-medium text-[#14171f]">{o.model_name}</span>
                            <p className="text-[11px] text-[#5a6072]">
                              {formatShortDate(o.start_date)} → {formatShortDate(o.expected_return_date)} • {o.order_status}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#14171f] whitespace-nowrap">{formatVnd(o.total_rent)}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailTarget(null);
                                onOpenDossier(o.order_code);
                              }}
                              className="glass-button px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <FileText size={11} />
                              <span>Hồ sơ</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>,
          document.body
        )}

      {/* Modal xác nhận nâng lên toàn quyền ADMIN */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {confirmAdminTarget && (
              <motion.div
                key="confirm-admin-role-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setConfirmAdminTarget(null))}
                className={`${POPUP_BACKDROP_CLASS} z-[230]`}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  onClick={(e) => e.stopPropagation()}
                  className={buildPopupFrameClass('max-w-md', 'h-auto max-h-[85vh]')}
                >
                  <div className={POPUP_INNER_CLASS}>
                    <button
                      type="button"
                      onClick={() => setConfirmAdminTarget(null)}
                      className={POPUP_CLOSE_BUTTON_CLASS}
                    >
                      <X size={16} />
                    </button>
                    <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                        <AlertTriangle size={17} />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl text-[#14171f]">Cấp Toàn Quyền ADMIN?</h3>
                        <p className="text-xs text-[#5a6072] mt-0.5">{confirmAdminTarget.full_name}</p>
                      </div>
                    </div>

                    <div className="p-6 space-y-4 text-xs text-[#4b5262] leading-relaxed">
                      <p>
                        Bạn đang nâng cấp tài khoản{' '}
                        <strong className="text-[#14171f] num">{confirmAdminTarget.email}</strong> lên vai trò{' '}
                        <strong className="text-[#14171f]">ADMIN</strong>.
                      </p>
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1">
                        <p className="font-bold">Lưu ý phân tách trách nhiệm:</p>
                        <p>
                          Nếu chỉ muốn nhân viên vào Dashboard kiểm tra đơn, giao nhận máy và theo dõi kho/tài chính, hãy chọn{' '}
                          <strong>STAFF · Nhân viên</strong> (không sửa giá thuê/tiền cọc và không thay đổi quyền người khác).
                        </p>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setConfirmAdminTarget(null)}
                          className="glass-button px-4 py-2 rounded-full font-semibold cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          disabled={updatingRoleUserId === confirmAdminTarget.id}
                          onClick={async () => {
                            const target = confirmAdminTarget;
                            setConfirmAdminTarget(null);
                            await applyCustomerRole(target, 'ADMIN');
                          }}
                          className="px-5 py-2 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white font-semibold cursor-pointer flex items-center gap-1.5"
                        >
                          {updatingRoleUserId === confirmAdminTarget.id && (
                            <Loader2 size={13} className="animate-spin" />
                          )}
                          <span>Xác nhận cấp ADMIN</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
