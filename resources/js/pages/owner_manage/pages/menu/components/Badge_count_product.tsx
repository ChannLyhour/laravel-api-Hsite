import React from 'react';
import { FiBox } from 'react-icons/fi';

export interface BadgeCountProductProps {
  count: number;
  limit?: number;
  className?: string;
}

export const BadgeCountProduct: React.FC<BadgeCountProductProps> = ({
  count,
  limit,
  className = '',
}) => {
  const isUnlimited = limit === undefined || limit === Infinity || isNaN(limit);
  const isNearLimit = !isUnlimited && limit > 0 && count / limit >= 0.8;
  const isFull = !isUnlimited && limit > 0 && count >= limit;

  let badgeColorClass = 'bg-blue-50 text-blue-700 border-blue-200/80';
  let badgeDotClass = 'bg-blue-500';

  if (isFull) {
    badgeColorClass = 'bg-rose-50 text-rose-700 border-rose-200/80';
    badgeDotClass = 'bg-rose-500 animate-pulse';
  } else if (isNearLimit) {
    badgeColorClass = 'bg-amber-50 text-amber-700 border-amber-200/80';
    badgeDotClass = 'bg-amber-500';
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold shadow-3xs transition-all select-none ${badgeColorClass} ${className}`}
      title={isUnlimited ? `Total Products: ${count}` : `Product Limit Usage: ${count} of ${limit}`}
    >
      <span className={`w-2 h-2 rounded-full ${badgeDotClass}`} />
      <FiBox className="w-3.5 h-3.5 opacity-80 shrink-0" />
      <span>
        {count} {isUnlimited ? 'Products' : `/ ${limit} Products`}
      </span>
    </div>
  );
};

export default BadgeCountProduct;
