import type { CameraSeries } from '../types';

export interface CameraSeriesMeta {
  series: CameraSeries;
  rank: number;
  filterValue: string;
  shortLabel: string;
  featureSummary: string;
}

// Thứ tự Series chính thức:
// 1. X100 -> 2. X-S -> 3. X-T -> 4. X-M -> 5. X-E -> 6. X-Pro -> 7. GFX (-> X-H -> X half)
export const CAMERA_SERIES_META: CameraSeriesMeta[] = [
  {
    series: 'X100',
    rank: 1,
    filterValue: 'Fujifilm X100 Series',
    shortLabel: 'X100 Series',
    featureSummary: 'Compact, retro, street photography, du lịch',
  },
  {
    series: 'X-S',
    rank: 2,
    filterValue: 'Fujifilm X-S Series',
    shortLabel: 'X-S Series',
    featureSummary: 'Đa năng, chụp ảnh và quay vlog',
  },
  {
    series: 'X-T',
    rank: 3,
    filterValue: 'Fujifilm X-T Series',
    shortLabel: 'X-T Series',
    featureSummary: 'Thiết kế cổ điển, chụp ảnh du lịch, phong cảnh',
  },
  {
    series: 'X-M',
    rank: 4,
    filterValue: 'Fujifilm X-M Series',
    shortLabel: 'X-M Series',
    featureSummary: 'Nhỏ gọn, nhẹ, phù hợp người mới và vlog',
  },
  {
    series: 'X-E',
    rank: 5,
    filterValue: 'Fujifilm X-E Series',
    shortLabel: 'X-E Series',
    featureSummary: 'Rangefinder-style, street photography, du lịch',
  },
  {
    series: 'X-Pro',
    rank: 6,
    filterValue: 'Fujifilm X-Pro Series',
    shortLabel: 'X-Pro Series',
    featureSummary: 'Cao cấp, thiên về nhiếp ảnh và trải nghiệm rangefinder',
  },
  {
    series: 'GFX',
    rank: 7,
    filterValue: 'Fujifilm GFX Series',
    shortLabel: 'GFX Series',
    featureSummary: 'Medium Format, chất lượng ảnh cao cấp',
  },
  {
    series: 'X-H',
    rank: 8,
    filterValue: 'Fujifilm X-H Series',
    shortLabel: 'X-H Series',
    featureSummary: 'Flagship Hybrid tốc độ cao & quay chuyên nghiệp',
  },
  {
    series: 'X half',
    rank: 9,
    filterValue: 'Fujifilm X half Series',
    shortLabel: 'X half',
    featureSummary: 'Half-Frame hoài cổ siêu nhỏ gọn',
  },
];

export const CAMERA_SERIES_DROPDOWN_OPTIONS: string[] = [
  'Tất cả dòng máy',
  ...CAMERA_SERIES_META.map((m) => m.filterValue),
];

const SERIES_RANK_MAP: Record<CameraSeries, number> = CAMERA_SERIES_META.reduce(
  (acc, item) => {
    acc[item.series] = item.rank;
    return acc;
  },
  {} as Record<CameraSeries, number>
);

const BODY_MODEL_SUB_RANK: Array<[string, number]> = [
  ['X100VI', 1],
  ['X100V', 2],
  ['X-S20', 1],
  ['X-S10', 2],
  ['X-T50', 2],
  ['X-T30', 3],
  ['X-T4', 4],
  ['X-M5', 1],
  ['X-E5', 1],
  ['X-E4', 2],
  ['X-PRO3', 1],
  ['X-PRO2', 2],
  ['GFX100 II', 1],
  ['GFX100S II', 2],
  ['GFX100RF', 3],
  ['GFX ETERNA', 4],
  ['X-H2S', 1],
  ['X-H2', 2],
  ['X HALF', 1],
];

// Kiểm tra GFX trước X100 (vì GFX100 có chứa "X100") và X half trước X-H (vì X-HF1 có chứa "X-H")
export function detectCameraSeries(modelName: string): CameraSeries {
  const upper = String(modelName || '').toUpperCase();
  if (upper.includes('GFX')) return 'GFX';
  if (upper.includes('HALF') || upper.includes('X-HF')) return 'X half';
  if (upper.includes('X100')) return 'X100';
  if (/\bX-?S\d*/.test(upper)) return 'X-S';
  if (/\bX-?T\d*/.test(upper)) return 'X-T';
  if (/\bX-?M\d*/.test(upper)) return 'X-M';
  if (/\bX-?E\d*/.test(upper)) return 'X-E';
  if (upper.includes('X-PRO') || upper.includes('XPRO')) return 'X-Pro';
  if (upper.includes('X-H') || /\bXH\d/.test(upper)) return 'X-H';
  return 'X-T';
}

function getBodySubRank(name: string): number {
  const upper = String(name || '').toUpperCase();
  if (upper.includes('X-T5') && !upper.includes('X-T50')) {
    return 1;
  }
  for (const [key, rank] of BODY_MODEL_SUB_RANK) {
    if (upper.includes(key)) {
      return rank;
    }
  }
  return 99;
}

export function getCameraSeriesMeta(series?: CameraSeries | string): CameraSeriesMeta | undefined {
  return CAMERA_SERIES_META.find((m) => m.series === series || m.filterValue === series);
}

export function compareCamerasBySeries<
  T extends { name?: string; model_name?: string; series?: CameraSeries }
>(a: T, b: T): number {
  const nameA = a.name || a.model_name || '';
  const nameB = b.name || b.model_name || '';
  const serA = a.series || detectCameraSeries(nameA);
  const serB = b.series || detectCameraSeries(nameB);
  const rankDiff = (SERIES_RANK_MAP[serA] ?? 99) - (SERIES_RANK_MAP[serB] ?? 99);
  if (rankDiff !== 0) return rankDiff;

  const subDiff = getBodySubRank(nameA) - getBodySubRank(nameB);
  if (subDiff !== 0) return subDiff;

  return nameA.localeCompare(nameB);
}
