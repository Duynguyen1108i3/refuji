import React, { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Package,
  Users,
  Sparkles,
  Wrench,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Calendar,
  CalendarDays,
  CalendarRange,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Check,
  FileText,
} from 'lucide-react';
import { triggerOperationalSweep } from '../../services/dashboardApi';
import {
  DashboardOverviewData,
  DashboardTabId,
  ORDER_STATUS_META,
  RevenuePeriodKey,
  PeriodRevenueSummary,
  PeriodTrendPoint,
  formatVnd,
  formatShortDate,
  formatDateTime,
  formatDateTimeWithSeconds,
} from './dashboardTypes';

interface OverviewTabProps {
  data: DashboardOverviewData | null;
  userRole?: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: DashboardTabId) => void;
  onOpenCheckout: (orderCode: string) => void;
  onOpenCheckin: (orderCode: string) => void;
  onOpenDossier: (orderCode: string) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  userRole,
  isLoading,
  onRefresh,
  onNavigateTab,
  onOpenCheckout,
  onOpenCheckin,
  onOpenDossier,
  onNotify,
}) => {
  const [isSweeping, setIsSweeping] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<RevenuePeriodKey>('all');
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const handleRunCronSweep = async () => {
    setIsSweeping(true);
    try {
      const res = await triggerOperationalSweep();
      onNotify(res.message, 'success');
      onRefresh();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể chạy quét vận hành.', 'error');
    } finally {
      setIsSweeping(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#5a6072]">
        <Loader2 size={28} className="animate-spin text-[#14171f]" />
        <span className="text-sm font-medium">Đang tổng hợp dữ liệu vận hành từ SQLite...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="liquid-glass rounded-3xl p-10 text-center space-y-3">
        <p className="text-sm text-[#5a6072]">Chưa có dữ liệu tổng quan.</p>
        <button
          type="button"
          onClick={onRefresh}
          className="px-5 py-2.5 rounded-full bg-[#14171f] text-white text-xs font-semibold cursor-pointer"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  const { kpis, trendSeries, categoryBreakdown, topModels, pickupToday, returnToday, maintenanceDueItems, recentAuditLogs } = data;
  const isStaff = userRole === 'STAFF' || data.role === 'STAFF';
  const totalCatRev = Math.max(1, categoryBreakdown.reduce((acc, c) => acc + c.revenue, 0));

  const guestInqCount = kpis.statusCounts?.GUEST_INQUIRY || 0;
  const overdueCount = (kpis.statusCounts?.OVERDUE || 0) + (kpis.statusCounts?.OVERDUE_CRITICAL || 0);

  const activePeriodSummary: PeriodRevenueSummary =
    (data.revenueByPeriod && data.revenueByPeriod[selectedPeriod]) || {
      periodKey: 'all',
      label: 'Toàn bộ',
      subLabel: 'Tổng tích lũy',
      grossRevenue: kpis.grossRevenue,
      netRevenue: kpis.netRevenue,
      baseRentalRevenue: kpis.baseRentalRevenue,
      penaltyRevenue: kpis.penaltyRevenue,
      maintenanceCost: kpis.maintenanceCostTotal,
      ordersCount: kpis.totalOrders,
      depositAmount: kpis.activeDepositHeld,
    };

  const currentTrendList: Array<any> =
    (data.trendSeriesByPeriod && data.trendSeriesByPeriod[chartPeriod]) || trendSeries;
  const maxTrendRev = Math.max(1, ...currentTrendList.map((d: any) => d.revenue || 0));

  return (
    <div className="space-y-8">
      {/* Editorial Section Header + Cron Action */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 radar-pulse-white" />
            <span>{isStaff ? 'Bảng Điều Phối Ca Quầy POS · Vận Hành Thực Tế' : 'Điều Hành Studio Thời Gian Thực'}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-[42px] xl:text-5xl font-normal text-[#14171f] uppercase tracking-tight">
            {isStaff ? 'TỔNG QUAN VẬN HÀNH CA QUẦY' : 'TỔNG QUAN VẬN HÀNH REFUJI'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5a6072] mt-1.5 num">
            {isStaff
              ? `Chỉ số thiết bị, hàng đợi giao nhận & tiền mặt tại quầy · Đồng bộ lúc ${formatDateTimeWithSeconds(data.updatedAt)}`
              : `Đồng bộ trực tiếp từ cơ sở dữ liệu lúc ${formatDateTimeWithSeconds(data.updatedAt)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {guestInqCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="px-4 py-2.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer num"
            >
              <Clock size={14} className="text-amber-700" />
              <span>{guestInqCount} đơn tại quầy chờ duyệt</span>
            </button>
          )}
          {overdueCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer num"
            >
              <AlertTriangle size={14} />
              <span>{overdueCount} đơn quá hạn trả</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRunCronSweep}
            disabled={isSweeping}
            className="px-5 py-2.5 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSweeping ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{isSweeping ? 'Đang quét...' : 'Quét quá hạn & Giữ chỗ (Cron)'}</span>
          </button>
        </div>
      </div>

      {/* Doanh Thu Theo Kỳ: Ngày, Tuần, Tháng, Năm Selector & Quick Glance Cards (Chỉ dành cho ADMIN) */}
      {!isStaff && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f7f8fa] p-2.5 sm:px-4 sm:py-2.5 rounded-3xl border border-[#14171f]/8">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#14171f]">
              <CalendarRange size={16} className="text-[#14171f]" />
              <span>Kỳ thống kê doanh thu:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {[
                { key: 'day', label: 'Hôm nay (Ngày)' },
                { key: 'week', label: 'Tuần này' },
                { key: 'month', label: 'Tháng này' },
                { key: 'year', label: 'Năm nay' },
                { key: 'all', label: 'Toàn bộ' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedPeriod(item.key as RevenuePeriodKey);
                    if (item.key !== 'all') {
                      setChartPeriod(item.key as 'day' | 'week' | 'month' | 'year');
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedPeriod === item.key
                      ? 'bg-[#14171f] text-white shadow-xs'
                      : 'bg-white hover:bg-neutral-100 text-[#5a6072] border border-[#14171f]/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Cards Hiện Doanh Thu: Ngày, Tuần, Tháng, Năm */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                key: 'day',
                label: 'Hôm nay',
                icon: <Calendar size={14} />,
                data: data.revenueByPeriod?.day,
              },
              {
                key: 'week',
                label: 'Tuần này',
                icon: <CalendarDays size={14} />,
                data: data.revenueByPeriod?.week,
              },
              {
                key: 'month',
                label: 'Tháng này',
                icon: <CalendarRange size={14} />,
                data: data.revenueByPeriod?.month,
              },
              {
                key: 'year',
                label: 'Năm nay',
                icon: <BarChart3 size={14} />,
                data: data.revenueByPeriod?.year,
              },
            ].map((item) => {
              const isSelected = selectedPeriod === item.key;
              const rev = item.data?.grossRevenue || 0;
              const orders = item.data?.ordersCount || 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedPeriod(item.key as RevenuePeriodKey);
                    setChartPeriod(item.key as 'day' | 'week' | 'month' | 'year');
                  }}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-[#14171f] text-white border-[#14171f] shadow-md scale-[1.01]'
                      : 'bg-white hover:bg-neutral-50 text-[#14171f] border-[#14171f]/10 hover:border-[#14171f]/25'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold flex items-center gap-1.5 ${
                        isSelected ? 'text-white' : 'text-[#5a6072]'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`text-[10px] num px-2 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#14171f]/[0.06] text-[#14171f]'
                      }`}
                    >
                      {orders} đơn
                    </span>
                  </div>
                  <div>
                    <div className="text-base sm:text-xl font-bold num whitespace-nowrap">
                      {formatVnd(rev)}
                    </div>
                    <p
                      className={`text-[10.5px] num mt-0.5 truncate ${
                        isSelected ? 'text-white/70' : 'text-[#7e8596]'
                      }`}
                    >
                      {item.data?.subLabel || '—'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Editorial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Revenue for Admin VS Cash Collected for Staff */}
        {isStaff ? (
          <div className="liquid-glass rounded-3xl p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                Tiền mặt thu quầy hôm nay
              </span>
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200">
                <Wallet size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 num whitespace-nowrap">
                {formatVnd(kpis.todayCashCollected || 0)}
              </div>
              <div className="mt-2 text-[11px] text-[#5a6072] num">
                Chốt két đối soát bàn giao ca trực
              </div>
              <div className="mt-1 text-[10.5px] text-[#7e8596]">
                Tiền mặt thực nhận từ khách tại quầy trong ngày
              </div>
            </div>
          </div>
        ) : (
          <div className="liquid-glass rounded-3xl p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                Doanh thu ({activePeriodSummary.label})
              </span>
              <div className="w-9 h-9 rounded-full bg-[#14171f]/[0.05] flex items-center justify-center text-[#14171f]">
                <TrendingUp size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#14171f] num whitespace-nowrap">
                {formatVnd(activePeriodSummary.grossRevenue)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#5a6072] num">
                <span>Ròng sau bảo dưỡng: <strong className="text-[#14171f]">{formatVnd(activePeriodSummary.netRevenue)}</strong></span>
                {activePeriodSummary.penaltyRevenue > 0 && (
                  <span className="text-amber-700 font-medium">Phạt: +{formatVnd(activePeriodSummary.penaltyRevenue)}</span>
                )}
              </div>
              <div className="mt-1 text-[10.5px] text-[#7e8596] num">
                {activePeriodSummary.subLabel} · {activePeriodSummary.ordersCount} đơn phát sinh
              </div>
            </div>
          </div>
        )}

        {/* KPI 2: Deposit Held for Admin VS Pickups & Returns for Staff */}
        {isStaff ? (
          <div className="liquid-glass rounded-3xl p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                Hàng đợi giao nhận hôm nay
              </span>
              <div className="w-9 h-9 rounded-full bg-[#14171f]/[0.05] flex items-center justify-center text-[#14171f]">
                <ClipboardList size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-[#14171f] num">
                  {pickupToday.length}
                </span>
                <span className="text-xs text-[#5a6072]">nhận · <strong className="text-rose-600 num">{returnToday.length}</strong> trả</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#5a6072] num">
                <span>Chờ giao: <strong className="text-[#14171f]">{pickupToday.length}</strong></span>
                <span>Chờ thu máy: <strong className="text-rose-600">{returnToday.length}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="mt-2 text-[11px] font-semibold text-[#14171f] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Mở hàng đợi Đơn &amp; POS</span>
                <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="liquid-glass rounded-3xl p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                Tiền cọc đang nắm giữ
              </span>
              <div className="w-9 h-9 rounded-full bg-[#14171f]/[0.05] flex items-center justify-center text-[#14171f]">
                <Wallet size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 num whitespace-nowrap">
                {formatVnd(kpis.activeDepositHeld)}
              </div>
              <div className="mt-2 text-[11px] text-[#5a6072] num whitespace-nowrap truncate">
                Hoàn cọc tức thì khi Check-in
              </div>
            </div>
          </div>
        )}

        {/* KPI 3: Fleet Occupancy */}
        <div className="liquid-glass rounded-3xl p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
              Hiệu suất kho ({kpis.totalSerials} Serial)
            </span>
            <div className="w-9 h-9 rounded-full bg-[#14171f]/[0.05] flex items-center justify-center text-[#14171f]">
              <Package size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#14171f] num">
                {kpis.occupancyPercent}%
              </span>
              <span className="text-xs text-[#5a6072] num">đang lưu hành</span>
            </div>
            <div className="mt-2.5 w-full h-2 rounded-full bg-neutral-100 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${kpis.totalSerials ? (kpis.availableSerials / kpis.totalSerials) * 100 : 0}%` }}
                title={`Sẵn sàng: ${kpis.availableSerials}`}
              />
              <div
                className="bg-sky-500 h-full"
                style={{ width: `${kpis.totalSerials ? (kpis.rentedSerials / kpis.totalSerials) * 100 : 0}%` }}
                title={`Đang thuê: ${kpis.rentedSerials}`}
              />
              <div
                className="bg-amber-400 h-full"
                style={{ width: `${kpis.totalSerials ? ((kpis.reservedSerials || 0) / kpis.totalSerials) * 100 : 0}%` }}
                title={`Giữ lịch: ${kpis.reservedSerials || 0}`}
              />
              <div
                className="bg-orange-500 h-full"
                style={{ width: `${kpis.totalSerials ? (kpis.maintenanceSerials / kpis.totalSerials) * 100 : 0}%` }}
                title={`Bảo dưỡng: ${kpis.maintenanceSerials}`}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-[#5a6072] num">
              <span className="whitespace-nowrap">Rảnh: <strong className="text-emerald-700">{kpis.availableSerials}</strong></span>
              <span className="whitespace-nowrap">Thuê: <strong className="text-sky-700">{kpis.rentedSerials}</strong></span>
              <span className="whitespace-nowrap">Giữ: <strong className="text-amber-700">{kpis.reservedSerials || 0}</strong></span>
              <span className="whitespace-nowrap">Bảo trì: <strong className="text-orange-700">{kpis.maintenanceSerials}</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 4: Orders & Guest/Member Split */}
        <div className="liquid-glass rounded-3xl p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
              Đơn hàng &amp; Tệp khách
            </span>
            <div className="w-9 h-9 rounded-full bg-[#14171f]/[0.05] flex items-center justify-center text-[#14171f]">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#14171f] num">{kpis.totalOrders}</span>
              <span className="text-xs text-[#5a6072]">đơn hệ thống</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#5a6072] num">
              <span>Thành viên: <strong className="text-[#14171f]">{kpis.memberOrdersCount}</strong></span>
              <span>Vãng lai (Guest): <strong className="text-amber-800">{kpis.guestOrdersCount}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Row (Chỉ hiển thị biểu đồ doanh thu cho ADMIN, nhân viên quầy hiển thị Trạng thái tồn kho) */}
      {!isStaff ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 cols: Revenue & Orders SVG Chart */}
        <div className="lg:col-span-2 liquid-glass rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#14171f]">
                Biểu Đồ Doanh Thu &amp; Lượt Thuê
              </h3>
              <p className="text-xs text-[#5a6072]">
                {chartPeriod === 'day'
                  ? 'Diễn biến doanh thu theo các ngày ghi nhận gần nhất'
                  : chartPeriod === 'week'
                  ? 'Diễn biến doanh thu theo từng tuần (6 tuần gần đây)'
                  : chartPeriod === 'month'
                  ? 'Diễn biến doanh thu theo 12 tháng trong năm hiện tại'
                  : 'So sánh tổng doanh thu qua các năm hoạt động'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#f5f6f8] p-1 rounded-full border border-[#14171f]/10">
                {[
                  { key: 'day', label: 'Ngày' },
                  { key: 'week', label: 'Tuần' },
                  { key: 'month', label: 'Tháng' },
                  { key: 'year', label: 'Năm' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setChartPeriod(item.key as any)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      chartPeriod === item.key
                        ? 'bg-[#14171f] text-white shadow-xs'
                        : 'text-[#5a6072] hover:text-[#14171f]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onRefresh}
                className="glass-button px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {currentTrendList.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-[#7e8596]">
              Chưa đủ dữ liệu biểu đồ cho kỳ đã chọn
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative h-56 flex items-end gap-2 sm:gap-3 pt-10 pb-2 border-b border-[#14171f]/10">
                {/* Faint horizontal reference lines mirroring minimal editorial rhythm */}
                <div className="pointer-events-none absolute inset-x-0 top-10 bottom-8 flex flex-col justify-between">
                  <div className="border-t border-dashed border-[#14171f]/[0.06] w-full" />
                  <div className="border-t border-dashed border-[#14171f]/[0.06] w-full" />
                  <div className="border-t border-dashed border-[#14171f]/[0.06] w-full" />
                </div>

                {currentTrendList.map((pt: any) => {
                  const hasRevenue = (pt.revenue || 0) > 0;
                  const rawPct = hasRevenue ? Math.max(12, Math.round(((pt.revenue || 0) / maxTrendRev) * 100)) : 4;
                  const displayLabel = pt.label || (pt.date ? pt.date.slice(5) : '');
                  const displayFullLabel = pt.fullLabel || (pt.date ? formatShortDate(pt.date) : displayLabel);
                  const ordersCount = pt.orders || 0;
                  return (
                    <div
                      key={pt.key || pt.date || displayLabel}
                      className="relative z-10 flex-1 flex flex-col items-center gap-1.5 group h-full justify-end min-w-0"
                    >
                      {/* Floating Tooltip Pill on Hover */}
                      <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-20 px-2.5 py-1 rounded-full bg-[#14171f] text-white text-[10px] font-semibold num whitespace-nowrap shadow-md">
                        {displayFullLabel}: {formatVnd(pt.revenue || 0)} · {ordersCount} đơn
                      </div>

                      {/* Order Count Badge cleanly ABOVE the bar (never clipped inside low bars) */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold num leading-tight transition-colors ${
                          ordersCount > 0
                            ? hasRevenue
                              ? 'bg-[#14171f]/[0.07] text-[#14171f] group-hover:bg-[#14171f] group-hover:text-white'
                              : 'bg-amber-50 border border-amber-200 text-amber-800'
                            : 'bg-[#14171f]/[0.04] text-[#7e8596]'
                        }`}
                      >
                        {ordersCount}
                      </span>

                      <div className="w-full max-w-[38px] flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-300 ${
                            hasRevenue
                              ? 'bg-gradient-to-t from-[#14171f]/80 to-[#14171f] group-hover:from-[#14171f] group-hover:to-[#262c3a] shadow-[0_4px_12px_rgba(20,24,32,0.12)]'
                              : ordersCount > 0
                              ? 'bg-amber-300/80 group-hover:bg-amber-400 border border-amber-400/60'
                              : 'bg-[#14171f]/20 group-hover:bg-[#14171f]/35 rounded-t-lg'
                          }`}
                          style={{ height: `${rawPct}%`, minHeight: hasRevenue ? '18px' : '10px' }}
                          title={`${displayFullLabel}: ${formatVnd(pt.revenue || 0)} (${ordersCount} đơn)`}
                        />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-medium text-[#5a6072] num truncate w-full text-center pt-0.5" title={displayFullLabel}>
                        {displayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5a6072]">
                <span className="flex items-center gap-3">
                  <span>Nhãn trên cột: số đơn ghi nhận</span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[10.5px] text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Cột hổ phách: có đơn nhưng chưa thu đủ tiền
                  </span>
                </span>
                <span className="num">
                  Tổng doanh thu {chartPeriod === 'day' ? 'các ngày' : chartPeriod === 'week' ? 'các tuần' : chartPeriod === 'month' ? 'các tháng' : 'các năm'}: <strong className="text-[#14171f]">{formatVnd(currentTrendList.reduce((s: number, p: any) => s + (Number(p.revenue) || 0), 0))}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right col: Category Split + Top Rented Units */}
        <div className="liquid-glass rounded-3xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-serif text-xl text-[#14171f]">Cơ Cấu Danh Mục</h3>
              <p className="text-xs text-[#5a6072]">Tỉ trọng doanh thu theo nhóm thiết bị</p>
            </div>

            <div className="space-y-3">
              {categoryBreakdown.map((cat) => {
                const share = Math.round((cat.revenue / totalCatRev) * 100);
                const labelMap: Record<string, string> = {
                  BODY: 'Thân máy (Body)',
                  LENS: 'Ống kính (Fujinon)',
                  ACCESSORY: 'Phụ kiện Studio',
                };
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs num">
                      <span className="font-medium text-[#14171f]">{labelMap[cat.category] || cat.category}</span>
                      <span className="text-[#5a6072] whitespace-nowrap">
                        <strong className="text-[#14171f]">{formatVnd(cat.revenue)}</strong> ({share}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#14171f]" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#14171f]/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                Top thiết bị hiệu suất cao
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('catalog')}
                className="text-[11px] font-semibold text-[#14171f] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Danh mục</span>
                <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {topModels.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[#14171f] truncate">{m.model_name}</span>
                  <span className="text-[11px] text-[#5a6072] num whitespace-nowrap shrink-0">
                    <strong className="text-[#14171f]">{m.rental_count || 0}</strong> lượt • {m.available_count}/{m.unit_count} rảnh
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ) : (
        /* Giao diện dành riêng cho STAFF: Phân bổ tồn kho thực tế & Tình trạng thiết bị sẵn sàng */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 cols: Trạng thái kho sẵn sàng */}
          <div className="lg:col-span-2 liquid-glass rounded-3xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#14171f]">
                  Trạng Thái Kho Thiết Bị Sẵn Sàng
                </h3>
                <p className="text-xs text-[#5a6072]">
                  Phân bổ máy ảnh &amp; ống kính khả dụng phục vụ khách quầy ngay trong ngày
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('orders')}
                  className="px-3.5 py-1.5 rounded-full bg-[#14171f] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ClipboardList size={13} />
                  <span>Xử lý Đơn POS</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('inventory')}
                  className="glass-button px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Package size={13} />
                  <span>Mở Kho Serial</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Sẵn sàng thuê</span>
                <span className="text-2xl font-bold text-emerald-900 num mt-1 block">{kpis.availableSerials}</span>
                <span className="text-[10.5px] text-emerald-700 mt-0.5 block">Máy có sẵn tại quầy</span>
              </div>
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
                <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider block">Đang giao khách</span>
                <span className="text-2xl font-bold text-sky-900 num mt-1 block">{kpis.rentedSerials}</span>
                <span className="text-[10.5px] text-sky-700 mt-0.5 block">Đang lưu hành ngoài</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Đang giữ chỗ</span>
                <span className="text-2xl font-bold text-amber-900 num mt-1 block">{kpis.reservedSerials || 0}</span>
                <span className="text-[10.5px] text-amber-700 mt-0.5 block">Chờ khách Check-out</span>
              </div>
              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200">
                <span className="text-[11px] font-semibold text-orange-800 uppercase tracking-wider block">Đang bảo dưỡng</span>
                <span className="text-2xl font-bold text-orange-900 num mt-1 block">{kpis.maintenanceSerials}</span>
                <span className="text-[10.5px] text-orange-700 mt-0.5 block">Tạm ngừng cho thuê</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
                <div>
                  <p className="font-semibold text-[#14171f]">Nguyên tắc kiểm định khi Bàn giao (Check-out):</p>
                  <p className="text-[11px] text-[#5a6072] mt-0.5">
                    Bắt buộc đối chứng CCCD trùng khớp, chụp 4 góc ngoại quan máy và xác nhận tình trạng pin/sạc trước khi đưa khách.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="glass-button px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Vào hàng đợi Check-out
              </button>
            </div>
          </div>

          {/* Right col: Top models in stock for staff */}
          <div className="liquid-glass rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-[#14171f]">Tồn Kho Dòng Máy Hot</h3>
                  <p className="text-xs text-[#5a6072]">Khả dụng tư vấn cho khách đến quầy</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('catalog')}
                  className="text-[11px] font-semibold text-[#14171f] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Mẫu</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>

              <div className="space-y-3 mt-4">
                {topModels.slice(0, 5).map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-[#f7f8fa] border border-[#14171f]/8 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-semibold text-[#14171f] truncate block">{m.model_name}</span>
                      <span className="text-[10.5px] text-[#7e8596] num block">Giá ngày: {formatVnd(m.base_rental_price_per_day)}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold num ${
                        m.available_count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.available_count > 0 ? `Còn ${m.available_count} máy` : 'Hết máy'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#14171f]/10 text-[11px] text-[#7e8596] flex items-center justify-between">
              <span>Tổng mẫu đăng ký: {topModels.length}</span>
              <span className="font-medium text-[#14171f]">Cập nhật liên tục</span>
            </div>
          </div>
        </div>
      )}

      {/* Today Operations: Pickups & Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pickups Queue */}
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl text-[#14171f]">Hàng Đợi Bàn Giao (Check-out)</h3>
              <p className="text-xs text-[#5a6072]">Đơn đã đến lịch hoặc sẵn sàng giao khách</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="glass-button px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
            >
              Mở POS
            </button>
          </div>

          {pickupToday.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7e8596] bg-[#f7f8fa] rounded-2xl border border-[#14171f]/8">
              Không có đơn chờ bàn giao khẩn hôm nay.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pickupToday.map((o) => {
                const stMeta = ORDER_STATUS_META[o.order_status] || ORDER_STATUS_META.PENDING;
                const canCheckout = ['CONFIRMED', 'PENDING'].includes(o.order_status);
                return (
                  <div
                    key={o.order_code}
                    className="p-3.5 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onOpenDossier(o.order_code)}
                          className="text-xs font-bold text-[#14171f] hover:underline num cursor-pointer"
                        >
                          #{o.order_code}
                        </button>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stMeta.bg} ${stMeta.text} ${stMeta.border}`}>
                          {stMeta.label}
                        </span>
                        {o.is_guest === 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900">
                            Vãng lai
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#14171f] truncate">{o.model_name}</p>
                      <p className="text-[11px] text-[#5a6072] num">
                        {o.guest_name || o.user_full_name || 'Khách'} • Nhận: {formatShortDate(o.start_date)}
                      </p>
                    </div>
                    {canCheckout ? (
                      <button
                        type="button"
                        onClick={() => onOpenCheckout(o.order_code)}
                        className="px-4 py-2 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs font-semibold shrink-0 cursor-pointer transition-all"
                      >
                        Check-out ngay
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenDossier(o.order_code)}
                        className="glass-button px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Xem hồ sơ
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Returns & Overdue Queue */}
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl text-[#14171f]">Hàng Đợi Thu Hồi (Check-in)</h3>
              <p className="text-xs text-[#5a6072]">Đơn đang giao sắp đến hạn hoặc trễ hẹn trả</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="glass-button px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>

          {returnToday.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7e8596] bg-[#f7f8fa] rounded-2xl border border-[#14171f]/8">
              Hiện không có đơn quá hạn hoặc đến hạn thu hồi ngay.
            </div>
          ) : (
            <div className="space-y-2.5">
              {returnToday.map((o) => {
                const stMeta = ORDER_STATUS_META[o.order_status] || ORDER_STATUS_META.DELIVERED;
                return (
                  <div
                    key={o.order_code}
                    className="p-3.5 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onOpenDossier(o.order_code)}
                          className="text-xs font-bold text-[#14171f] hover:underline num cursor-pointer"
                        >
                          #{o.order_code}
                        </button>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stMeta.bg} ${stMeta.text} ${stMeta.border}`}>
                          {stMeta.label}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#14171f] truncate">{o.model_name}</p>
                      <p className="text-[11px] text-[#5a6072] num">
                        Hạn trả: <strong className="text-[#14171f]">{formatShortDate(o.expected_return_date)}</strong> • Cọc: {formatVnd(o.deposit_amount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenCheckin(o.order_code)}
                      className="px-4 py-2 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs font-semibold shrink-0 cursor-pointer transition-all"
                    >
                      Check-in Quyết toán
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Maintenance Alerts & Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Maintenance Due */}
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench size={17} className="text-[#14171f]" />
              <h3 className="font-serif text-xl text-[#14171f]">Thiết Bị Cần Bảo Dưỡng</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              className="glass-button px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
            >
              Mở Kho Serial
            </button>
          </div>

          {maintenanceDueItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-700 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-center gap-2">
              <CheckCircle2 size={15} />
              <span>Tất cả thiết bị đang đạt trạng thái kỹ thuật tốt.</span>
            </div>
          ) : (
            <div className="divide-y divide-[#14171f]/8">
              {maintenanceDueItems.slice(0, 5).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#14171f] num">{item.serial_number}</span>
                      <span className="text-[#5a6072] truncate">{item.model_name}</span>
                    </div>
                    <p className="text-[11px] text-[#5a6072] num mt-0.5">
                      Shutter: {Number(item.shutter_count).toLocaleString('vi-VN')} • Độ mới: {item.condition_percent}%
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shrink-0">
                    {item.status === 'MAINTENANCE' ? 'Đang bảo dưỡng' : 'Đến hạn kiểm tra'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right col: Audit Snapshot for Admin OR Operational Guide for Staff */}
        {!isStaff ? (
          <div className="liquid-glass rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-[#14171f]">Nhật Ký Hoạt Động Gần Đây</h3>
              <button
                type="button"
                onClick={() => onNavigateTab('audit')}
                className="glass-button px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
              >
                Xem Nhật ký Audit
              </button>
            </div>
            {recentAuditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7e8596] bg-[#f7f8fa] rounded-2xl border border-[#14171f]/8">
                Chưa có nhật ký kiểm toán gần đây.
              </div>
            ) : (
              <div className="divide-y divide-[#14171f]/8">
                {recentAuditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[#14171f]">{log.action}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-[#4b5262] num">
                          {log.entity_type} #{log.entity_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5a6072] line-clamp-1">
                        {log.description || log.actor_label}
                      </p>
                    </div>
                    <span className="text-[10.5px] text-[#7e8596] num whitespace-nowrap shrink-0">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="liquid-glass rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl text-[#14171f]">Quy Chuẩn Bàn Giao Quầy POS</h3>
                <p className="text-xs text-[#5a6072]">3 nguyên tắc an toàn khi giao &amp; thu máy</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#14171f] text-white uppercase tracking-wider">
                POS Standard
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/8 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#14171f] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-[#14171f]">Đối chứng CCCD gốc &amp; KYC</p>
                  <p className="text-[11px] text-[#5a6072] mt-0.5">So khớp CCCD chip bản gốc của khách với ảnh tải lên. Khách vãng lai bắt buộc giữ CCCD hoặc cọc 100%.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/8 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#14171f] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-[#14171f]">Chụp 4 góc ngoại quan &amp; Số shot</p>
                  <p className="text-[11px] text-[#5a6072] mt-0.5">Chụp rõ serial đáy máy, màn hình LCD, kính ống kính và test shutter count trước khi khách rời quầy.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/8 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#14171f] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-[#14171f]">Bàn giao đủ phụ kiện &amp; Ký biên bản</p>
                  <p className="text-[11px] text-[#5a6072] mt-0.5">Kiểm tra pin, sạc, nắp cáp, thẻ nhớ SD và in biên bản bàn giao có chữ ký xác nhận của hai bên.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
