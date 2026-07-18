import React from 'react';

export interface TotalProductCountProps {
  count?: number | string;
  className?: string;
}

export const TotalProductCount: React.FC<TotalProductCountProps> = ({
  count = 0,
  className = '',
}) => {
  return (
    <span
      className={`text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0 ${className}`}
    >
      {count}
    </span>
  );
};

export default TotalProductCount;
