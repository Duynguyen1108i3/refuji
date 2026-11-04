import { useState, useEffect, useCallback } from 'react';
import { EquipmentItem, CartItem } from '../types';

export function useCart(onNotification?: (msg: string) => void) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('refuji_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('refuji_cart_items', JSON.stringify(cartItems));
    } catch (_) {}
  }, [cartItems]);

  const handleAddToCart = useCallback(
    (item: EquipmentItem) => {
      setCartItems((prev) => {
        const existing = prev.find((ci) => ci.id === item.id);
        if (existing) {
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
        onNotification(`Đã thêm "${item.name}" vào giỏ hàng thuê!`);
      }
    },
    [onNotification]
  );

  const handleUpdateCartQuantity = useCallback((itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((ci) => ci.id !== itemId));
      return;
    }
    setCartItems((prev) =>
      prev.map((ci) => (ci.id === itemId ? { ...ci, quantity: newQty } : ci))
    );
  }, []);

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
