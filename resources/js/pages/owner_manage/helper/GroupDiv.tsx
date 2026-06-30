import React from 'react';

interface GroupDivProps {
     children: React.ReactNode;
     className?: string;
}

export const GroupDiv: React.FC<GroupDivProps> = ({ children, className = '' }) => {
  const hasBg = className.split(' ').some(c => c.startsWith('bg-'));
  const bgClass = hasBg ? '' : 'custom-card-container';
  return (
    <div className={`${bgClass} border rounded-[10px] p-6 space-y-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${className}`}>
      {children}
    </div>
  );
};
