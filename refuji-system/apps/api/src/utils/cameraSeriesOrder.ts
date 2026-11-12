// Thứ tự chuẩn theo Series máy ảnh Fujifilm:
// 1. X100 -> 2. X-S -> 3. X-T -> 4. X-M -> 5. X-E -> 6. X-Pro -> 7. GFX (-> X-H -> X half)

export type CameraSeriesCode =
  | 'X100'
  | 'X-S'
  | 'X-T'
  | 'X-M'
  | 'X-E'
  | 'X-Pro'
  | 'GFX'
  | 'X-H'
  | 'X half';

export const CAMERA_SERIES_RANK: Record<CameraSeriesCode, number> = {
  X100: 1,
  'X-S': 2,
  'X-T': 3,
  'X-M': 4,
  'X-E': 5,
  'X-Pro': 6,
  GFX: 7,
  'X-H': 8,
  'X half': 9,
};

const BODY_MODEL_SUB_RANK: Array<[string, number]> = [
  ['X100VI', 1],
  ['X100V', 2],
  ['X-S20', 1],
  ['X-S10', 2],
  ['X-T5 BODY', 1],
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
export function detectCameraSeries(modelName: string): CameraSeriesCode {
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

function getBodySubRank(modelName: string): number {
  const upper = String(modelName || '').toUpperCase();
  if (upper.includes('X-T5') && !upper.includes('X-T50')) {
    return 1;
  }
  for (const [key, rank] of BODY_MODEL_SUB_RANK) {
    if (key === 'X-T5 BODY') continue;
    if (upper.includes(key)) {
      return rank;
    }
  }
  return 99;
}

function getCategoryOrder(cat?: string): number {
  const upper = String(cat || '').toUpperCase();
  if (upper === 'BODY') return 1;
  if (upper === 'LENS') return 2;
  if (upper === 'ACCESSORY') return 3;
  return 9;
}

export function sortModelsByCameraSeries<
  T extends { category?: string; model_name?: string; id?: number }
>(models: T[]): T[] {
  return [...models].sort((a, b) => {
    const catDiff = getCategoryOrder(a.category) - getCategoryOrder(b.category);
    if (catDiff !== 0) return catDiff;

    if (String(a.category || '').toUpperCase() === 'BODY') {
      const sA = CAMERA_SERIES_RANK[detectCameraSeries(a.model_name || '')] ?? 99;
      const sB = CAMERA_SERIES_RANK[detectCameraSeries(b.model_name || '')] ?? 99;
      if (sA !== sB) return sA - sB;

      const subDiff = getBodySubRank(a.model_name || '') - getBodySubRank(b.model_name || '');
      if (subDiff !== 0) return subDiff;
    }

    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
}
