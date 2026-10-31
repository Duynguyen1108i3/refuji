import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, Search, CheckCircle2 } from 'lucide-react';
import { PRODUCT_FIXTURES } from '../../services/catalog-fixtures.ts';
import { Button } from '../../components/ui/Button.tsx';
import { StatusBadge } from '../../components/badges/StatusBadge.tsx';
import { formatVND, calcDeposit, MembershipTier, ProductModelEntity } from '@refuji/shared';

interface CatalogPageProps {
  userTier?: MembershipTier | null;
  onSelectModel?: (model: ProductModelEntity) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ userTier = null, onSelectModel }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMount, setSelectedMount] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = useMemo(() => {
    return PRODUCT_FIXTURES.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (selectedMount !== 'ALL' && item.mount !== selectedMount) return false;
      if (searchQuery && !item.modelName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [selectedCategory, selectedMount, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-white tracking-tight mb-2">
          KHO THIẾT BỊ FUJIFILM CHÍNH HÃNG
        </h1>
        <p className="text-sm text-zinc-400">
          Tra cứu toàn bộ máy ảnh, ống kính và phụ kiện có sẵn với thông số kỹ thuật chuẩn và biểu phí cọc minh bạch.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="liquid-glass rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4 border border-white/15">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Pills */}
          {['ALL', 'BODY', 'LENS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả' : cat === 'BODY' ? 'Thân máy' : 'Ống kính'}
            </button>
          ))}

          <span className="text-zinc-600">|</span>

          {/* Mount Pills */}
          {['ALL', 'X', 'G', 'FIXED'].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMount(m)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedMount === m
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {m === 'ALL' ? 'Mọi ngàm' : m === 'X' ? 'Ngàm X' : m === 'G' ? 'Ngàm G' : 'Ống kính liền'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo tên máy, ống kính..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="liquid-glass rounded-2xl p-4 flex flex-col justify-between border border-white/15 hover:border-emerald-500/40 transition-all group shadow-md"
          >
            <div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 mb-3 border border-white/10 p-2">
                <img
                  src={item.imageUrl}
                  alt={item.modelName}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                {item.modelName}
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{item.description}</p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 block">Giá thuê</span>
                <span className="text-sm font-bold text-emerald-400 num">
                  {formatVND(item.baseRentalPricePerDay)}
                </span>
                <span className="text-[11px] text-zinc-400">/ngày</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (onSelectModel) onSelectModel(item);
                  else window.location.href = `/catalog/${item.slug}`;
                }}
              >
                Chi tiết
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
