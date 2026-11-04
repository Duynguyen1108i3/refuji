import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export const evaluatePasswordStrength = (password: string) => {
  const rules: PasswordRule[] = [
    {
      id: 'length',
      label: 'Tối thiểu 8 ký tự',
      met: password.length >= 8,
    },
    {
      id: 'case',
      label: 'Chữ in hoa (A-Z) & chữ thường (a-z)',
      met: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'Ít nhất 1 chữ số (0-9)',
      met: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'Ít nhất 1 ký tự đặc biệt (!@#$%^&*)',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const metCount = rules.filter((r) => r.met).length;

  let label = 'Rất yếu';
  let colorVar = 'var(--refuji-accent-rose)';
  let bgVar = 'var(--refuji-accent-rose-bg)';
  let textClass = 'text-rose-600 dark:text-rose-400';

  if (metCount === 0 || password.length === 0) {
    label = 'Chưa đạt yêu cầu';
    colorVar = 'var(--refuji-text-muted)';
    bgVar = 'var(--refuji-input-bg)';
    textClass = 'text-neutral-400 dark:text-neutral-500';
  } else if (metCount === 1) {
    label = 'Rất yếu';
    colorVar = 'var(--refuji-accent-rose)';
    bgVar = 'var(--refuji-accent-rose-bg)';
    textClass = 'text-rose-600 dark:text-rose-400';
  } else if (metCount === 2) {
    label = 'Yếu';
    colorVar = 'var(--refuji-accent-amber)';
    bgVar = 'var(--refuji-accent-amber-bg)';
    textClass = 'text-amber-600 dark:text-amber-400';
  } else if (metCount === 3) {
    label = 'Trung bình';
    colorVar = 'var(--refuji-accent-amber)';
    bgVar = 'var(--refuji-accent-amber-bg)';
    textClass = 'text-amber-600 dark:text-amber-400';
  } else if (metCount === 4) {
    label = 'Rất mạnh (Đạt chuẩn bảo mật)';
    colorVar = 'var(--refuji-accent-emerald)';
    bgVar = 'var(--refuji-accent-emerald-bg)';
    textClass = 'text-emerald-600 dark:text-emerald-400';
  }

  return {
    rules,
    score: metCount,
    label,
    colorVar,
    bgVar,
    textClass,
    isSecure: metCount === 4,
  };
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const { rules, score, label, colorVar, textClass } = useMemo(
    () => evaluatePasswordStrength(password),
    [password]
  );

  if (!password) return null;

  return (
    <div className="w-full space-y-2 mt-2 pt-1 transition-all">
      {/* Strength Bar Segments */}
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-[var(--refuji-text-muted)]">Độ mạnh mật khẩu:</span>
        <span className={`font-semibold ${textClass}`}>{label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => {
          const isActive = score >= step;
          return (
            <div
              key={step}
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                backgroundColor: isActive ? colorVar : 'var(--refuji-input-bg)',
                opacity: isActive ? 1 : 0.6,
              }}
            />
          );
        })}
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center gap-1.5 transition-colors"
            style={{
              color: rule.met
                ? 'var(--refuji-text-secondary)'
                : 'var(--refuji-text-muted)',
            }}
          >
            <span
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] transition-all"
              style={{
                backgroundColor: rule.met
                  ? 'var(--refuji-accent-emerald-bg)'
                  : 'var(--refuji-input-bg)',
                color: rule.met
                  ? 'var(--refuji-accent-emerald)'
                  : 'var(--refuji-text-muted)',
              }}
            >
              {rule.met ? <Check size={9} strokeWidth={3} /> : <X size={9} strokeWidth={2.5} />}
            </span>
            <span className={rule.met ? 'font-medium' : ''}>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
