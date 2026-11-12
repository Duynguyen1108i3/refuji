// Tính năng: Quy trình Check-out POS tải đơn thật, hiển thị cảnh báo KYC bắt buộc với Khách vãng lai & cập nhật DELIVERED
import React, { useState, useEffect, useCallback } from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { InspectionPhotoZone } from '../../components/uploaders/InspectionPhotoZone.tsx';
import { StatusBadge } from '../../components/badges/StatusBadge.tsx';
import { CheckCircle2, Printer, ShieldAlert, Search, Loader2, AlertCircle } from 'lucide-react';
import { formatVND } from '@refuji/shared';

interface LoadedPosOrder {
  order_code: string;
  is_guest: boolean;
  customer_name: string;
  customer_phone: string;
  membership_tier: string;
  id_card_last4: string | null;
  model_name: string;
  start_date: string;
  expected_return_date: string;
  total_rent: number;
  deposit_amount: number;
  order_status: string;
  assigned_serials: string | null;
  warehouse_serials: Array<{
    model_id: number;
    model_name: string;
    serial_number: string;
    shutter_count: number;
    status: string;
  }>;
}

export const CheckoutWizardPage: React.FC = () => {
  const [orderCode, setOrderCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const qs = new URLSearchParams(window.location.search);
      return qs.get('orderCode') || '';
    }
    return '';
  });
  const [loadedOrder, setLoadedOrder] = useState<LoadedPosOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [idCardLast4Input, setIdCardLast4Input] = useState('');
  const [assignedSerial, setAssignedSerial] = useState('');
  const [shutterCount, setShutterCount] = useState('4120');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const fetchOrderDetail = useCallback(async (targetCode: string) => {
    const clean = targetCode.replace(/^#/, '').trim().toUpperCase();
    if (!clean) {
      setLoadError('Vui lòng nhập mã đơn hàng cần bàn giao.');
      return;
    }
    setIsLoadingOrder(true);
    setLoadError(null);
    setIsCompleted(false);
    try {
      const token = localStorage.getItem('refuji_token');
      const res = await fetch(`/api/admin/orders/${clean}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Không thể tải đơn #${clean}`);
      }
      setLoadedOrder(data);
      const firstAssigned = data.assigned_serials
        ? String(data.assigned_serials).split(',')[0].trim()
        : data.warehouse_serials?.[0]?.serial_number || '';
      setAssignedSerial(firstAssigned);
      if (data.warehouse_serials?.[0]?.shutter_count) {
        setShutterCount(String(data.warehouse_serials[0].shutter_count));
      }
    } catch (err: any) {
      setLoadedOrder(null);
      setLoadError(err.message || 'Lỗi khi tải thông tin đơn');
    } finally {
      setIsLoadingOrder(false);
    }
  }, []);

  useEffect(() => {
    if (orderCode) {
      fetchOrderDetail(orderCode);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompleteHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadError(null);

    if (!loadedOrder) {
      setLoadError('Vui lòng tải thông tin đơn hàng trước khi bàn giao.');
      return;
    }

    const cleanLast4 = idCardLast4Input.trim();
    if (!/^\d{4}$/.test(cleanLast4)) {
      setLoadError('Bắt buộc nhập đủ 4 chữ số cuối CCCD/VNeID đã đối chiếu trực tiếp tại quầy.');
      return;
    }

    if (!loadedOrder.is_guest && loadedOrder.id_card_last4 && cleanLast4 !== loadedOrder.id_card_last4) {
      setLoadError(
        `4 số cuối CCCD/VNeID không khớp với hồ sơ thành viên (yêu cầu: ${loadedOrder.id_card_last4}).`
      );
      return;
    }

    if (photos.length < 2) {
      setLoadError('Bắt buộc chụp tối thiểu 2 ảnh đối chứng ngoại quan và cảm biến trước khi bàn giao!');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('refuji_token');
      const res = await fetch(`/api/admin/orders/${loadedOrder.order_code}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'DELIVERED',
          assigned_serials: assignedSerial,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Không thể cập nhật trạng thái bàn giao');
      }
      setIsCompleted(true);
    } catch (err: any) {
      setLoadError(err.message || 'Lỗi xử lý bàn giao');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaffPosLayout activeKey="checkout">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
          QUY TRÌNH BÀN GIAO MÁY (CHECK-OUT)
        </h1>
        <p className="text-xs text-zinc-400 mb-6">
          Đối chiếu căn cước công dân VNeID, xác nhận tiền cọc, gán Serial thực tế và chụp ảnh thẩm định
        </p>

        {/* Thanh tra cứu tải đơn POS */}
        <div className="liquid-glass rounded-3xl p-5 border border-white/15 mb-6 flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Input
              label="Mã đơn cần bàn giao"
              placeholder="VD: ORD-12345678"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isLoadingOrder}
            onClick={() => fetchOrderDetail(orderCode)}
          >
            {isLoadingOrder ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Search className="w-4 h-4 mr-1.5" />
            )}
            <span>Tải đơn</span>
          </Button>
        </div>

        {loadError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Banner cảnh báo KYC bắt buộc cho Khách vãng lai */}
        {loadedOrder && loadedOrder.is_guest && !isCompleted && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 leading-relaxed">
              <p className="font-bold text-sm text-amber-300">
                CẢNH BÁO KHÁCH VÃNG LAI — CHƯA CÓ HỒ SƠ KYC TRÊN HỆ THỐNG
              </p>
              <p>
                Nhân viên <strong>BẮT BUỘC đối chiếu CCCD / VNeID bản gốc</strong> của khách hàng (không giữ giấy tờ gốc theo Luật Căn cước 2023) và <strong>xác nhận đã thu đủ 100% tiền cọc chuẩn ({formatVND(loadedOrder.deposit_amount)})</strong> trước khi bàn giao máy.
              </p>
            </div>
          </div>
        )}

        {loadedOrder && !isCompleted && (
          <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-sm">#{loadedOrder.order_code}</span>
                <StatusBadge status={loadedOrder.order_status} type="order" />
              </div>
              <p className="text-zinc-300">
                Khách: <strong>{loadedOrder.customer_name}</strong> ({loadedOrder.customer_phone}) •{' '}
                {loadedOrder.is_guest ? 'Khách vãng lai' : `Thành viên ${loadedOrder.membership_tier}`}
              </p>
              <p className="text-zinc-400">
                Thiết bị: <strong className="text-white">{loadedOrder.model_name}</strong> • Lịch:{' '}
                {loadedOrder.start_date} → {loadedOrder.expected_return_date}
              </p>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block">Thuê + Cọc cần thu đủ</span>
              <span className="text-base font-bold text-emerald-400 num">
                {formatVND(Number(loadedOrder.total_rent || 0) + Number(loadedOrder.deposit_amount || 0))}
              </span>
            </div>
          </div>
        )}

        {isCompleted ? (
          <div className="liquid-glass rounded-3xl p-8 border border-emerald-500/30 text-center flex flex-col items-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">BÀN GIAO THIẾT BỊ HOÀN TẤT</h2>
            <p className="text-sm text-zinc-300">
              Đơn hàng <strong>#{loadedOrder?.order_code || orderCode}</strong> đã chuyển sang trạng thái{' '}
              <strong>DELIVERED</strong>. Mã Serial <strong>{assignedSerial}</strong> đã được bàn giao.
            </p>
            <Button variant="primary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              <span>In Biên bản bàn giao ký tươi</span>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleCompleteHandover}
            className="liquid-glass rounded-3xl p-6 border border-white/15 flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Mã đơn đặt hàng"
                value={loadedOrder?.order_code || orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                required
              />
              <Input
                label={
                  loadedOrder?.is_guest
                    ? 'Nhập 4 số cuối CCCD / VNeID đối chiếu bản gốc (Khách vãng lai)'
                    : 'Đối chiếu 4 số cuối CCCD / VNeID của khách'
                }
                placeholder="Nhập 4 số cuối (VD: 8832)"
                maxLength={4}
                value={idCardLast4Input}
                onChange={(e) => setIdCardLast4Input(e.target.value)}
                required
              />
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Gán / Xác nhận mã Serial thiết bị trong kho
                </label>
                {loadedOrder && loadedOrder.warehouse_serials && loadedOrder.warehouse_serials.length > 0 ? (
                  <select
                    value={assignedSerial}
                    onChange={(e) => setAssignedSerial(e.target.value)}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-full bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none"
                  >
                    {loadedOrder.warehouse_serials.map((ws) => (
                      <option key={ws.serial_number} value={ws.serial_number}>
                        {ws.model_name} - Serial: {ws.serial_number} ({ws.shutter_count} shots • {ws.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={assignedSerial}
                    onChange={(e) => setAssignedSerial(e.target.value)}
                    placeholder="VD: SN-XT5-001"
                    required
                  />
                )}
              </div>
              <Input
                label="Ghi nhận số shot hiện tại (Shutter Count)"
                type="number"
                value={shutterCount}
                onChange={(e) => setShutterCount(e.target.value)}
                required
              />
            </div>

            <InspectionPhotoZone
              label="Ảnh chụp ngoại quan máy & số Serial thực tế tại quầy (Tối thiểu 2 ảnh)"
              requiredCount={2}
              onPhotosChange={setPhotos}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full font-bold" disabled={isSubmitting}>
              {isSubmitting ? 'Đang cập nhật bàn giao...' : 'Xác nhận bàn giao thiết bị'}
            </Button>
          </form>
        )}
      </div>
    </StaffPosLayout>
  );
};
