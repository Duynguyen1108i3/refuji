import React from 'react';
import { Camera, ShieldCheck, ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col md:flex-row">
      {/* Left visual column */}
      <div className="relative md:w-1/2 min-h-[280px] md:min-h-screen bg-cover bg-center flex flex-col justify-between p-8 md:p-12 overflow-hidden border-b md:border-b-0 md:border-r border-white/10"
        style={{ backgroundImage: `url('/assets/forest-clean.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/70 to-[#07070a]/40 z-0" />
        
        {/* Top brand */}
        <div className="relative z-10 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 text-white hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Về trang chủ</span>
          </a>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-serif text-xl font-bold tracking-wider">REFUJI</span>
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 max-w-md hidden md:block">
          <blockquote className="text-lg font-serif italic text-white/95 leading-relaxed">
            "Máy ảnh là tấm vé đưa bạn đến với những khoảnh khắc mà thời gian không thể xóa nhòa."
          </blockquote>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cam kết tuân thủ Luật Bảo vệ Dữ liệu Cá nhân Việt Nam 2025</span>
          </div>
        </div>
      </div>

      {/* Right form column */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-wide mb-2">{title}</h1>
            <p className="text-sm text-zinc-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
