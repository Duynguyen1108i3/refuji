import { useState, useEffect, useCallback, useRef } from 'react';
import { EquipmentItem, CartItem } from '../types';

export function useCart(
  onNotification?: (msg: string) => void,
  currentUserId?: number | string | null
) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      // Nếu người dùng không đăng nhập (đã đăng xuất), không giữ lại giỏ hàng cũ của phiên đăng nhập trước
      const savedUser = localStorage.getItem('refuji_auth_user');
      if (!savedUser && !currentUserId) {
        localStorage.removeItem('refuji_cart_items');
        localStorage.removeItem('refuji_cart_user_id');
        return [];
      }
      const saved = localStorage.getItem('refuji_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const prevUserIdRef = useRef<number | string | null | undefined>(currentUserId);

  // Khi người dùng đăng xuất (chuyển từ có userId sang null): Tự động xóa giỏ hàng ngay lập tức
  useEffect(() => {
    if (prevUserIdRef.current && !currentUserId) {
      setCartItems([]);
      try {
        localStorage.removeItem('refuji_cart_items');
        localStorage.removeItem('refuji_cart_user_id');
      } catch (_) {}
    }
    prevUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Lắng nghe sự kiện refuji_cart_clear (được phát ra khi người dùng bấm Đăng xuất)
  useEffect(() => {
    const handleClearCartOnLogout = () => {
      setCartItems([]);
      try {
        localStorage.removeItem('refuji_cart_items');
        localStorage.removeItem('refuji_cart_user_id');
      } catch (_) {}
    };

    window.addEventListener('refuji_cart_clear', handleClearCartOnLogout);
    return () => {
      window.removeEventListener('refuji_cart_clear', handleClearCartOnLogout);
    };
  }, []);

  // Đồng bộ giỏ hàng vào localStorage khi có thay đổi
  useEffect(() => {
    try {
      if (cartItems.length > 0) {
        localStorage.setItem('refuji_cart_items', JSON.stringify(cartItems));
        if (currentUserId) {
          localStorage.setItem('refuji_cart_user_id', String(currentUserId));
        }
      } else {
        localStorage.removeItem('refuji_cart_items');
      }
    } catch (_) {}
  }, [cartItems, currentUserId]);

  // Ràng buộc tồn kho khi thêm vào giỏ hàng
  const handleAddToCart = useCallback(
    (item: EquipmentItem) => {
      const maxAvailable = (item as any).availableCount !== undefined ? (item as any).availableCount : 1;
      const isBooked = (item as any).status === 'BOOKED';

      if (maxAvailable <= 0 || isBooked) {
        if (onNotification) {
          onNotification(`Thiết bị "${item.name}" hiện đã hết hàng trong kho hoặc đang có người giữ chỗ!`);
        }
        return;
      }

      let reachedLimit = false;

      setCartItems((prev) => {
        const existing = prev.find((ci) => ci.id === item.id);
        if (existing) {
          if (existing.quantity >= maxAvailable) {
            reachedLimit = true;
            return prev;
          }
          return prev.map((ci) =>
            ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
          );
        }
        return [
          ...prev,
          {
            id: item.id,
            item: item as any,
            quantity: 1,
            addedAt: new Date().toISOString(),
          },
        ];
      });

      if (onNotification) {
        if (reachedLimit) {
          onNotification(`Kho chỉ còn ${maxAvailable} thiết bị "${item.name}". Đã đạt số lượng tối đa!`);
        } else {
          onNotification(`Đã thêm "${item.name}" vào giỏ hàng thuê!`);
        }
      }
    },
    [onNotification]
  );

  // Ràng buộc tồn kho khi cập nhật số lượng trong giỏ hàng
  const handleUpdateCartQuantity = useCallback((itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((ci) => ci.id !== itemId));
      return;
    }

    setCartItems((prev) =>
      prev.map((ci) => {
        if (ci.id === itemId) {
          const maxStock = (ci.item as any)?.availableCount !== undefined ? (ci.item as any).availableCount : 1;
          if (newQty > maxStock) {
            if (onNotification) {
              onNotification(`Kho chỉ còn tối đa ${maxStock} thiết bị "${ci.item.name}".`);
            }
            return { ...ci, quantity: maxStock };
          }
          return { ...ci, quantity: newQty };
        }
        return ci;
      })
    );
  }, [onNotification]);

  const handleRemoveFromCart = useCallback(
    (itemId: string) => {
      setCartItems((prev) => prev.filter((ci) => ci.id !== itemId));
      if (onNotification) {
        onNotification('Đã xóa thiết bị khỏi giỏ hàng.');
      }
    },
    [onNotification]
  );

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    try {
      localStorage.removeItem('refuji_cart_items');
      localStorage.removeItem('refuji_cart_user_id');
    } catch (_) {}
    if (onNotification) {
      onNotification('Đã xóa toàn bộ giỏ hàng.');
    }
  }, [onNotification]);

  const cartCount = cartItems.reduce((acc, c) => acc + c.quantity, 0);

  return {
    cartItems,
    cartCount,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveFromCart,
    handleClearCart,
  };
}
