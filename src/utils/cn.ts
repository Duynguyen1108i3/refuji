import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes cleanly without conflicts
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Tính năng: Nhận diện ảnh thumbnail có viền trắng rộng để scale đồng đều kích thước trong khung vuông
export function isSmallThumbnailImage(item: { name: string; image: string }): boolean {
  const lowerImg = (item.image || '').toLowerCase();
  return (
    lowerImg.includes('thum') ||
    lowerImg.includes('small') ||
    lowerImg.includes('product-list_gfx100rf') ||
    item.name.includes('GFX')
  );
}
