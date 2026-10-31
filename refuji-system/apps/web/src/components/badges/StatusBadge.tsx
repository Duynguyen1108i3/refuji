import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PackageCheck, 
  XCircle, 
  RotateCcw, 
  Wrench, 
  HelpCircle 
} from 'lucide-react';
import { OrderStatus, ORDER_STATUS_LABELS } from '@refuji/shared';
import { ItemStatus, ITEM_STATUS_LABELS } from '@refuji/shared';

interface StatusBadgeProps {
  status: OrderStatus | ItemStatus | string;
  type?: 'order' | 'item';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'order',
  className = ''
}) => {
  if (type === 'item') {
    const itemKey = status as ItemStatus;
    const config = ITEM_STATUS_LABELS[itemKey] || {
      label: status,
      color: 'text-zinc-300',
      bg: 'bg-zinc-800 border-zinc-700'
    };

    const getIcon = () => {
      switch (itemKey) {
        case ItemStatus.AVAILABLE:
          return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />;
        case ItemStatus.RENTED:
          return <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />;
        case ItemStatus.MAINTENANCE:
          return <Wrench className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />;
        case ItemStatus.LOST:
          return <XCircle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />;
        default:
          return <HelpCircle className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />;
      }
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${className}`}
      >
        {getIcon()}
        <span>{config.label}</span>
      </span>
    );
  }

  // Order status
  const orderKey = status as OrderStatus;
  const config = ORDER_STATUS_LABELS[orderKey] || {
    label: status,
    color: 'text-zinc-300',
    bg: 'bg-zinc-800 border-zinc-700'
  };

  const getOrderIcon = () => {
    switch (orderKey) {
      case OrderStatus.PENDING_PAYMENT:
        return <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />;
      case OrderStatus.PENDING:
        return <Clock className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />;
      case OrderStatus.CONFIRMED:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />;
      case OrderStatus.DELIVERED:
        return <PackageCheck className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />;
      case OrderStatus.OVERDUE:
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />;
      case OrderStatus.COMPLETED:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />;
      case OrderStatus.REFUNDED:
        return <RotateCcw className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${className}`}
    >
      {getOrderIcon()}
      <span>{config.label}</span>
    </span>
  );
};
