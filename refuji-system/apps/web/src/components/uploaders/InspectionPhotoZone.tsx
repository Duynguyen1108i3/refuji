import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button.tsx';

interface InspectionPhotoZoneProps {
  label?: string;
  requiredCount?: number;
  onPhotosChange: (photos: string[]) => void;
  className?: string;
}

export const InspectionPhotoZone: React.FC<InspectionPhotoZoneProps> = ({
  label = 'Ảnh đối chứng thiết bị (Mặt trước, mặt sau, cảm biến, số Serial)',
  requiredCount = 2,
  onPhotosChange,
  className = ''
}) => {
  const [photoList, setPhotoList] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newUrls: string[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newUrls.push(url);
    });

    const updated = [...photoList, ...newUrls];
    setPhotoList(updated);
    onPhotosChange(updated);
  };

  const removePhoto = (index: number) => {
    const updated = photoList.filter((_, i) => i !== index);
    setPhotoList(updated);
    onPhotosChange(updated);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-200">{label}</label>
        <span className="text-xs text-zinc-400 num">
          Đã chọn: {photoList.length}/{requiredCount} ảnh bắt buộc
        </span>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/20 hover:border-emerald-400/60 transition-colors rounded-2xl p-6 text-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04]"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <UploadCloud className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
        <p className="text-sm font-medium text-white mb-1">
          Kéo thả ảnh hoặc nhấn để chọn từ máy ảnh / thư viện
        </p>
        <p className="text-xs text-zinc-400">
          Định dạng hỗ trợ: JPG, PNG, WEBP (Tối đa 15MB/ảnh)
        </p>
      </div>

      {photoList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {photoList.map((url, idx) => (
            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/15 bg-black/40 group">
              <img src={url} alt={`Đối chứng ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                aria-label="Xóa ảnh"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1 left-1.5 flex items-center gap-1 text-[11px] bg-black/60 px-1.5 py-0.5 rounded text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ảnh {idx + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
