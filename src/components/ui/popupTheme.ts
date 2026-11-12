import type React from 'react';

// Tính năng: Chuẩn hóa cố định 1 khung popup duy nhất toàn dự án (có khoảng thụt vào giữa khung ngoài và hộp nội dung bên trong)
export const POPUP_BACKDROP_CLASS =
  'fixed inset-0 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md';

const POPUP_FRAME_BASE_CLASS =
  'relative w-full bg-[#f5f6f8] rounded-[28px] p-3 sm:p-3.5 shadow-[0_24px_70px_rgba(20,24,32,0.18)] border border-[#14171f]/12 overflow-hidden flex flex-col text-[#14171f] select-text';

export const POPUP_FRAME_CLASS = `${POPUP_FRAME_BASE_CLASS} max-w-2xl h-[670px] max-h-[90vh]`;

export const buildPopupFrameClass = (
  maxWidthClass = 'max-w-2xl',
  heightClass = 'h-[670px] max-h-[90vh]'
) => `${POPUP_FRAME_BASE_CLASS} ${maxWidthClass} ${heightClass}`;

export const POPUP_INNER_CLASS =
  'relative flex-1 min-h-0 w-full bg-white rounded-2xl border border-[#14171f]/12 shadow-[0_2px_10px_rgba(20,24,32,0.03)] overflow-hidden flex flex-col';

export const POPUP_CLOSE_BUTTON_CLASS =
  'absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center text-[#62687a] hover:text-[#14171f] bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer active:scale-95';

// Tính năng: Cho phép bấm vùng nền mờ bên ngoài khung popup để đóng (vẫn giữ nút X và chống đóng nhầm khi bôi đen chữ)
export const getBackdropDismissProps = (onClose: () => void) => ({
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.dataset.backdropDown = e.target === e.currentTarget ? '1' : '0';
  },
  onClick: (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.currentTarget.dataset.backdropDown !== '0') {
      onClose();
    }
    delete e.currentTarget.dataset.backdropDown;
  },
});
