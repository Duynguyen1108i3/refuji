import { useState, useEffect, useCallback, useRef } from 'react';
import { EquipmentItem, CartItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { getSavedUserFromStorage } from '../services/authApi';
import {
  CartApiError,
  readGuestCartFromStorage,
  writeGuestCartToStorage,
  clearGuestCartStorage,
  fetchServerCart,
  mergeGuestCartToServer,
  addServerCartItem,
  updateServerCartItem,
  removeServerCartItem,
  clearServerCart,
} from '../services/cartApi';

export interface UseCartOptions {
  onNotification?: (msg: string) => void;
  startDate?: string;
  endDate?: string;
  catalogItems?: EquipmentItem[];
}

// Tính năng: Giỏ hàng 2 tầng — khách vãng lai lưu localStorage, thành viên lưu DB & tự động gộp giỏ khi đăng nhập
export function useCart(options: UseCartOptions = {}) {
  const { onNotification, startDate, endDate, catalogItems } = options;
  const { user, isAuthReady, isResolvingCartIntent, loginRevision } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    // Nếu có phiên thành viên cache từ lần trước, đợi đồng bộ DB sau silent refresh thay vì chớp nháy giỏ vãng lai
    return getSavedUserFromStorage() ? [] : readGuestCartFromStorage();
  });
  const [isSyncingCart, setIsSyncingCart] = useState(false);

  const cartItemsRef = useRef<CartItem[]>(cartItems);
  const activeUserIdRef = useRef<number | null>(user?.id ?? null);
  activeUserIdRef.current = user?.id ?? null;

  const startDateRef = useRef(startDate);
  startDateRef.current = startDate;

  const endDateRef = useRef(endDate);
  endDateRef.current = endDate;

  const notifyRef = useRef(onNotification);
  notifyRef.current = onNotification;

  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingMutationsRef = useRef(0);
  const notifiedLoginRevRef = useRef<number>(0);
  const prevUserIdRef = useRef<number | null>(user?.id ?? null);

  const commitCartItems = useCallback((next: CartItem[]) => {
    cartItemsRef.current = next;
    setCartItems(next);
  }, []);

  const enqueueServerTask = useCallback((task: () => Promise<void>, isMutation = false) => {
    if (isMutation) {
      pendingMutationsRef.current += 1;
    }
    const run = mutationQueueRef.current
      .catch(() => {})
      .then(async () => {
        await task();
      })
      .finally(() => {
        if (isMutation) {
          pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
        }
      });
    mutationQueueRef.current = run;
    return run;
  }, []);

  const syncMemberCart = useCallback(
    (expectedUserId: number, expectedLoginRev: number, signal?: { cancelled: boolean }) => {
      return enqueueServerTask(async () => {
        if (signal?.cancelled || activeUserIdRef.current !== expectedUserId) return;

        setIsSyncingCart(true);
        try {
          const curStart = startDateRef.current;
          const curEnd = endDateRef.current;
          const guestItems = readGuestCartFromStorage();

          if (guestItems.length > 0) {
            const mergeRes = await mergeGuestCartToServer(guestItems, curStart, curEnd);
            if (activeUserIdRef.current !== expectedUserId) return;

            // Server đã gộp xong cho user này -> luôn xóa giỏ vãng lai để tránh gộp lặp lại
            clearGuestCartStorage();
            if (pendingMutationsRef.current === 0) {
              commitCartItems(mergeRes.cartItems);
            }

            const isFreshLogin =
              expectedLoginRev > 0 && notifiedLoginRevRef.current !== expectedLoginRev;
            if (isFreshLogin) {
              notifiedLoginRevRef.current = expectedLoginRev;
            }

            if (notifyRef.current) {
              if (mergeRes.warnings.length > 0) {
                const extra =
                  mergeRes.warnings.length > 1 ? ` (+${mergeRes.warnings.length - 1} lưu ý)` : '';
                notifyRef.current(`${mergeRes.warnings[0]}${extra}`);
              } else if (mergeRes.previousQuantity > 0) {
                notifyRef.current(
                  `Đã gộp ${mergeRes.mergedGuestCount} thiết bị mới vào ${mergeRes.previousQuantity} thiết bị sẵn có trong giỏ hàng!`
                );
              } else if (mergeRes.mergedGuestCount > 0 && isFreshLogin) {
                notifyRef.current(
                  `Đã đồng bộ ${mergeRes.mergedGuestCount} thiết bị vào giỏ hàng tài khoản.`
                );
              }
            }
          } else {
            const serverItems = await fetchServerCart(curStart, curEnd);
            if (activeUserIdRef.current !== expectedUserId) return;

            if (pendingMutationsRef.current === 0) {
              commitCartItems(serverItems);
            }

            const isFreshLogin =
              expectedLoginRev > 0 && notifiedLoginRevRef.current !== expectedLoginRev;
            if (isFreshLogin) {
              notifiedLoginRevRef.current = expectedLoginRev;
              const totalQty = serverItems.reduce((sum, ci) => sum + ci.quantity, 0);
              if (totalQty > 0 && notifyRef.current) {
                notifyRef.current(
                  `Đã khôi phục ${totalQty} thiết bị từ giỏ hàng cũ của tài khoản!`
                );
              }
            }
          }
        } catch (err) {
          console.error('Lỗi đồng bộ giỏ hàng tài khoản:', err);
        } finally {
          if (activeUserIdRef.current === expectedUserId) {
            setIsSyncingCart(false);
          }
        }
      }, false);
    },
    [enqueueServerTask, commitCartItems]
  );

  // Lắng nghe sự kiện refuji_cart_clear (khi người dùng chủ động bấm Đăng xuất)
  useEffect(() => {
    const handleClearCartOnLogout = () => {
      pendingMutationsRef.current = 0;
      clearGuestCartStorage();
      commitCartItems([]);
    };

    window.addEventListener('refuji_cart_clear', handleClearCartOnLogout);
    return () => {
      window.removeEventListener('refuji_cart_clear', handleClearCartOnLogout);
    };
  }, [commitCartItems]);

  // Đồng bộ giỏ hàng khi trạng thái đăng nhập / ngày thuê thay đổi
  useEffect(() => {
    if (!isAuthReady) return;

    const currentUserId = user?.id ?? null;

    if (!currentUserId) {
      // Nếu là khách vãng lai (hoặc silent refresh hết hạn): đọc giỏ vãng lai mà KHÔNG tự xóa
      if (prevUserIdRef.current !== null || cartItemsRef.current.length === 0) {
        const guestItems = readGuestCartFromStorage();
        commitCartItems(guestItems);
      }
      prevUserIdRef.current = null;
      return;
    }

    prevUserIdRef.current = currentUserId;

    if (isResolvingCartIntent) {
      // Đang tự động chốt đơn ngay từ giỏ hàng khi đăng nhập -> chờ hoàn tất trước khi sync DB cart cũ
      return;
    }

    const signal = { cancelled: false };
    syncMemberCart(currentUserId, loginRevision, signal);
    return () => {
      signal.cancelled = true;
    };
  }, [
    user?.id,
    isAuthReady,
    isResolvingCartIntent,
    loginRevision,
    startDate,
    endDate,
    syncMemberCart,
    commitCartItems,
  ]);

  // Làm mới tồn kho giỏ hàng thành viên khi có giữ chỗ / đặt đơn mới
  useEffect(() => {
    if (!isAuthReady || !user?.id || isResolvingCartIntent) return;
    const uid = user.id;
    const rev = loginRevision;

    const handleServerRefresh = () => {
      syncMemberCart(uid, rev);
    };

    window.addEventListener('refuji_catalog_refresh', handleServerRefresh);
    window.addEventListener('refuji_reservation_updated', handleServerRefresh);
    return () => {
      window.removeEventListener('refuji_catalog_refresh', handleServerRefresh);
      window.removeEventListener('refuji_reservation_updated', handleServerRefresh);
    };
  }, [user?.id, isAuthReady, isResolvingCartIntent, loginRevision, syncMemberCart]);

  // Đối với khách vãng lai: đối soát lại availableCount & trạng thái từng thiết bị khi lịch / danh mục cập nhật
  useEffect(() => {
    if (user?.id || !catalogItems || catalogItems.length === 0) return;
    const current = cartItemsRef.current;
    if (current.length === 0) return;

    const byId = new Map<string, EquipmentItem>();
    for (const eq of catalogItems) {
      byId.set(String(eq.id), eq);
    }

    let hasChanged = false;
    const next = current.map((ci) => {
      const live = byId.get(String(ci.id)) || byId.get(String(ci.item?.id));
      if (!live) return ci;

      const prevAvail = (ci.item as any)?.availableCount;
      const nextAvail = (live as any)?.availableCount;
      const prevStatus = (ci.item as any)?.status;
      const nextStatus = (live as any)?.status;

      if (
        prevAvail !== nextAvail ||
        prevStatus !== nextStatus ||
        ci.item.dailyRate !== live.dailyRate ||
        ci.item.depositRate !== live.depositRate ||
        ci.item.name !== live.name ||
        ci.item.image !== live.image
      ) {
        hasChanged = true;
        return {
          ...ci,
          item: live as any,
        };
      }
      return ci;
    });

    if (hasChanged) {
      commitCartItems(next);
      writeGuestCartToStorage(next);
    }
  }, [user?.id, catalogItems, commitCartItems]);

  // Ràng buộc tồn kho khi thêm vào giỏ hàng (vãng lai -> localStorage, thành viên -> SQLite DB)
  const handleAddToCart = useCallback(
    (item: EquipmentItem) => {
      const maxAvailable = (item as any).availableCount !== undefined ? (item as any).availableCount : 1;
      const isBooked = (item as any).status === 'BOOKED';

      if (maxAvailable <= 0 || isBooked) {
        notifyRef.current?.(
          `Thiết bị "${item.name}" hiện đã hết hàng trong kho hoặc đang có người giữ chỗ!`
        );
        return;
      }

      const current = cartItemsRef.current;
      const existing = current.find((ci) => ci.id === item.id);
      if (existing && existing.quantity >= maxAvailable) {
        notifyRef.current?.(
          `Kho chỉ còn ${maxAvailable} thiết bị "${item.name}". Đã đạt số lượng tối đa!`
        );
        return;
      }

      const nextItems: CartItem[] = existing
        ? current.map((ci) => (ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci))
        : [
            ...current,
            {
              id: item.id,
              item: item as any,
              quantity: 1,
              addedAt: new Date().toISOString(),
            },
          ];

      commitCartItems(nextItems);
      notifyRef.current?.(`Đã thêm "${item.name}" vào giỏ hàng thuê!`);

      const uid = activeUserIdRef.current;
      if (!uid) {
        writeGuestCartToStorage(nextItems);
        return;
      }

      enqueueServerTask(async () => {
        if (activeUserIdRef.current !== uid) return;
        try {
          const res = await addServerCartItem(
            item.id,
            1,
            startDateRef.current,
            endDateRef.current,
            item.name
          );
          if (activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
            commitCartItems(res.cartItems);
          }
        } catch (err: any) {
          if (activeUserIdRef.current !== uid) return;
          notifyRef.current?.(err?.message || `Không thể thêm "${item.name}" vào giỏ hàng.`);
          if (err instanceof CartApiError && err.serverCartItems) {
            if (pendingMutationsRef.current <= 1) {
              commitCartItems(err.serverCartItems);
            }
          } else {
            const latest = await fetchServerCart(startDateRef.current, endDateRef.current).catch(
              () => null
            );
            if (latest && activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
              commitCartItems(latest);
            }
          }
        }
      }, true);
    },
    [commitCartItems, enqueueServerTask]
  );

  // Ràng buộc tồn kho khi cập nhật số lượng trong giỏ hàng
  const handleUpdateCartQuantity = useCallback(
    (itemId: string, newQty: number) => {
      const current = cartItemsRef.current;
      const target = current.find((ci) => ci.id === itemId);
      if (!target) return;

      if (newQty <= 0) {
        const nextItems = current.filter((ci) => ci.id !== itemId);
        commitCartItems(nextItems);

        const uid = activeUserIdRef.current;
        if (!uid) {
          writeGuestCartToStorage(nextItems);
          return;
        }

        enqueueServerTask(async () => {
          if (activeUserIdRef.current !== uid) return;
          try {
            const serverItems = await removeServerCartItem(
              itemId,
              startDateRef.current,
              endDateRef.current
            );
            if (activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
              commitCartItems(serverItems);
            }
          } catch (err: any) {
            if (activeUserIdRef.current !== uid) return;
            notifyRef.current?.(err?.message || 'Không thể xóa thiết bị khỏi giỏ hàng.');
            const latest = await fetchServerCart(startDateRef.current, endDateRef.current).catch(
              () => null
            );
            if (latest && activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
              commitCartItems(latest);
            }
          }
        }, true);
        return;
      }

      const maxStock =
        (target.item as any)?.availableCount !== undefined ? (target.item as any).availableCount : 1;
      let boundedQty = newQty;
      if (newQty > target.quantity && newQty > maxStock) {
        notifyRef.current?.(`Kho chỉ còn tối đa ${maxStock} thiết bị "${target.item.name}".`);
        boundedQty = Math.max(target.quantity, maxStock);
        if (boundedQty === target.quantity) return;
      }

      const nextItems = current.map((ci) =>
        ci.id === itemId ? { ...ci, quantity: boundedQty } : ci
      );
      commitCartItems(nextItems);

      const uid = activeUserIdRef.current;
      if (!uid) {
        writeGuestCartToStorage(nextItems);
        return;
      }

      enqueueServerTask(async () => {
        if (activeUserIdRef.current !== uid) return;
        try {
          const serverItems = await updateServerCartItem(
            itemId,
            boundedQty,
            startDateRef.current,
            endDateRef.current
          );
          if (activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
            commitCartItems(serverItems);
          }
        } catch (err: any) {
          if (activeUserIdRef.current !== uid) return;
          notifyRef.current?.(err?.message || 'Không thể cập nhật số lượng thiết bị.');
          if (err instanceof CartApiError && err.serverCartItems) {
            if (pendingMutationsRef.current <= 1) {
              commitCartItems(err.serverCartItems);
            }
          } else {
            const latest = await fetchServerCart(startDateRef.current, endDateRef.current).catch(
              () => null
            );
            if (latest && activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
              commitCartItems(latest);
            }
          }
        }
      }, true);
    },
    [commitCartItems, enqueueServerTask]
  );

  const handleRemoveFromCart = useCallback(
    (itemId: string) => {
      const nextItems = cartItemsRef.current.filter((ci) => ci.id !== itemId);
      commitCartItems(nextItems);
      notifyRef.current?.('Đã xóa thiết bị khỏi giỏ hàng.');

      const uid = activeUserIdRef.current;
      if (!uid) {
        writeGuestCartToStorage(nextItems);
        return;
      }

      enqueueServerTask(async () => {
        if (activeUserIdRef.current !== uid) return;
        try {
          const serverItems = await removeServerCartItem(
            itemId,
            startDateRef.current,
            endDateRef.current
          );
          if (activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
            commitCartItems(serverItems);
          }
        } catch (err: any) {
          if (activeUserIdRef.current !== uid) return;
          notifyRef.current?.(err?.message || 'Không thể xóa thiết bị khỏi giỏ hàng.');
          const latest = await fetchServerCart(startDateRef.current, endDateRef.current).catch(
            () => null
          );
          if (latest && activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
            commitCartItems(latest);
          }
        }
      }, true);
    },
    [commitCartItems, enqueueServerTask]
  );

  const handleClearCart = useCallback(
    (silent?: boolean) => {
      const isSilent = silent === true;
      commitCartItems([]);
      if (!isSilent) {
        notifyRef.current?.('Đã xóa toàn bộ giỏ hàng.');
      }

      const uid = activeUserIdRef.current;
      if (!uid) {
        clearGuestCartStorage();
        return;
      }

      enqueueServerTask(async () => {
        if (activeUserIdRef.current !== uid) return;
        try {
          await clearServerCart();
          if (activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
            commitCartItems([]);
          }
        } catch (err: any) {
          if (activeUserIdRef.current !== uid) return;
          notifyRef.current?.(err?.message || 'Không thể xóa toàn bộ giỏ hàng.');
          const latest = await fetchServerCart(startDateRef.current, endDateRef.current).catch(
            () => null
          );
          if (latest && activeUserIdRef.current === uid && pendingMutationsRef.current <= 1) {
            commitCartItems(latest);
          }
        }
      }, true);
    },
    [commitCartItems, enqueueServerTask]
  );

  const cartCount = cartItems.reduce((acc, c) => acc + c.quantity, 0);

  return {
    cartItems,
    cartCount,
    isSyncingCart,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveFromCart,
    handleClearCart,
  };
}
