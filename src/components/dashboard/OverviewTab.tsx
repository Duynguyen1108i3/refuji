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
} from 'lucide-react';
import { triggerOperationalSweep } from '../../services/dashboardApi';
import {
  DashboardOverviewData,
  DashboardTabId,
  ORDER_STATUS_META,
  formatVnd,
  formatShortDate,
  formatDateTime,
  formatDateTimeWithSeconds,
} from './dashboardTypes';

interface OverviewTabProps {
  data: DashboardOverviewData | null;
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
  isLoading,
  onRefresh,
  onNavigateTab,
  onOpenCheckout,
  onOpenCheckin,
  onOpenDossier,
  onNotify,
}) => {
  const [isSweeping, setIsSweeping] = useState(false);

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
  const maxTrendRev = Math.max(1, ...trendSeries.map((d) => d.revenue));
  const totalCatRev = Math.max(1, categoryBreakdown.reduce((acc, c) => acc + c.revenue, 0));

  const guestInqCount = kpis.statusCounts?.GUEST_INQUIRY || 0;
  const overdueCount = (kpis.statusCounts?.OVERDUE || 0) + (kpis.statusCounts?.OVERDUE_CRITICAL || 0);

  return (
    <div className="space-y-8">
      {/* Editorial Section Header + Cron Action */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 radar-pulse-white" />
            <span>Điều Hành Studio Thời Gian Thực</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-[42px] xl:text-5xl font-normal text-[#14171f] uppercase tracking-tight">
            TỔNG QUAN VẬN HÀNH REFUJI
          </h1>
          <p className="text-xs sm:text-sm text-[#5a6072] mt-1.5 num">
            Đồng bộ trực tiếp từ cơ sở dữ liệu lúc {formatDateTimeWithSeconds(data.updatedAt)}
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

      {/* 4 Editorial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Revenue */}
        <div className="liquid-glass rounded-3xl p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
              Doanh thu thực nhận
            </span>
            <div className="w-9 h-9 rounded-full bg-[#14171f]/[0.05] flex items-center justify-center text-[#14171f]">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#14171f] num whitespace-nowrap">
              {formatVnd(kpis.grossRevenue)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#5a6072] num">
              <span>Ròng sau bảo dưỡng: <strong className="text-[#14171f]">{formatVnd(kpis.netRevenue)}</strong></span>
              {kpis.penaltyRevenue > 0 && (
                <span className="text-amber-700 font-medium">Phạt: +{formatVnd(kpis.penaltyRevenue)}</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Deposit Held */}
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

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 cols: Revenue & Orders SVG Chart */}
        <div className="lg:col-span-2 liquid-glass rounded-3xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#14171f]">
                Biểu Đồ Doanh Thu &amp; Lượt Thuê
              </h3>
              <p className="text-xs text-[#5a6072]">
                10 phiên ghi nhận đơn gần nhất từ sổ đơn thực tế
              </p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="glass-button px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>

          {trendSeries.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-[#7e8596]">
              Chưa đủ dữ liệu biểu đồ
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

                {trendSeries.map((pt) => {
                  const rawPct = pt.revenue > 0 ? Math.max(12, Math.round((pt.revenue / maxTrendRev) * 100)) : 4;
                  const mmdd = pt.date.slice(5).split('-');
                  const shortLabel = mmdd.length === 2 ? `${mmdd[1]}/${mmdd[0]}` : pt.date.slice(5);
                  const hasRevenue = pt.revenue > 0;
                  return (
                    <div
                      key={pt.date}
                      className="relative z-10 flex-1 flex flex-col items-center gap-1.5 group h-full justify-end min-w-0"
                    >
                      {/* Floating Tooltip Pill on Hover */}
                      <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-20 px-2.5 py-1 rounded-full bg-[#14171f] text-white text-[10px] font-semibold num whitespace-nowrap shadow-md">
                        {formatVnd(pt.revenue)} · {pt.orders} đơn
                      </div>

                      {/* Order Count Badge cleanly ABOVE the bar (never clipped inside low bars) */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold num leading-tight transition-colors ${
                          pt.orders > 0
                            ? hasRevenue
                              ? 'bg-[#14171f]/[0.07] text-[#14171f] group-hover:bg-[#14171f] group-hover:text-white'
                              : 'bg-amber-50 border border-amber-200 text-amber-800'
                            : 'bg-[#14171f]/[0.04] text-[#7e8596]'
                        }`}
                      >
                        {pt.orders}
                      </span>

                      <div className="w-full max-w-[38px] flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-300 ${
                            hasRevenue
                              ? 'bg-gradient-to-t from-[#14171f]/80 to-[#14171f] group-hover:from-[#14171f] group-hover:to-[#262c3a] shadow-[0_4px_12px_rgba(20,24,32,0.12)]'
                              : pt.orders > 0
                              ? 'bg-amber-300/80 group-hover:bg-amber-400 border border-amber-400/60'
                              : 'bg-[#14171f]/20 group-hover:bg-[#14171f]/35 rounded-t-lg'
                          }`}
                          style={{ height: `${rawPct}%`, minHeight: hasRevenue ? '18px' : '10px' }}
                          title={`${formatShortDate(pt.date)}: ${formatVnd(pt.revenue)} (${pt.orders} đơn)`}
                        />
                      </div>
                      <span className="text-[10.5px] font-medium text-[#5a6072] num truncate w-full text-center pt-0.5">
                        {shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5a6072]">
                <span className="flex items-center gap-3">
                  <span>Nhãn trên cột: tổng số đơn trong ngày</span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[10.5px] text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Cột hổ phách: giữ chỗ/hủy chưa phát sinh doanh thu
                  </span>
                </span>
                <span className="num">Tổng tiền thuê: <strong className="text-[#14171f]">{formatVnd(kpis.baseRentalRevenue)}</strong></span>
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

        {/* Audit Snapshot */}
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
      </div>
    </div>
  );
};
