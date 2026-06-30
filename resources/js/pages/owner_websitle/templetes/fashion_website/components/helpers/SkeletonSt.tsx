import React from 'react';

interface SkeletonCardProps {
     isLarge?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ isLarge = false }) => {
     return (
          <div
               className={`flex flex-col justify-between space-y-3 relative rounded-[3px] animate-pulse w-full ${isLarge
                         ? 'bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-850 p-5 shadow-md'
                         : 'bg-transparent p-0 border-transparent shadow-none'
                    }`}
          >
               {/* Product Image Area Placeholder */}
               <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-stone-200 dark:bg-stone-800" />

               {/* Product Metadata Info Area Placeholder */}
               <div className="space-y-2 pt-1">
                    {/* Price block + Heart icon inline */}
                    <div className="flex items-center justify-between">
                         <div className="flex items-baseline space-x-1.5 w-1/2">
                              {/* Price placeholder */}
                              <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-2/3" />
                              {/* Compare Price placeholder */}
                              <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
                         </div>
                         {/* Heart icon placeholder */}
                         <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800" />
                    </div>

                    {/* Product Name Placeholder */}
                    <div className="space-y-1">
                         <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-5/6" />
                         <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
                    </div>

                    {/* Colors swatches preview Placeholder */}
                    <div className="h-4 flex items-center pt-0.5">
                         <div className="flex items-center space-x-1">
                              <div className="w-4 h-3 rounded-[3px] bg-stone-200 dark:bg-stone-800" />
                              <div className="w-4 h-3 rounded-[3px] bg-stone-200 dark:bg-stone-800" />
                              <div className="w-4 h-3 rounded-[3px] bg-stone-200 dark:bg-stone-800" />
                         </div>
                    </div>

                    {/* Sizing Label preview Placeholder */}
                    <div className="h-4 flex items-center">
                         <div className="flex items-center space-x-1">
                              <div className="w-6 h-3 bg-stone-200 dark:bg-stone-800 rounded-[2px]" />
                              <div className="w-6 h-3 bg-stone-200 dark:bg-stone-800 rounded-[2px]" />
                              <div className="w-6 h-3 bg-stone-200 dark:bg-stone-800 rounded-[2px]" />
                         </div>
                    </div>
               </div>
          </div>
     );
};

interface SkeletonGridProps {
     count?: number;
     gridColsClass?: string;
     isLarge?: boolean;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
     count = 4,
     gridColsClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-x-6 gap-y-10 w-full',
     isLarge = false,
}) => {
     return (
          <div className={gridColsClass}>
               {Array.from({ length: count }).map((_, i) => (
                    <SkeletonCard key={i} isLarge={isLarge} />
               ))}
          </div>
     );
};

interface LineLoadingProps {
     isLoading?: boolean;
}

export const LineLoading: React.FC<LineLoadingProps> = ({ isLoading = false }) => {
     if (!isLoading) return null;
     return (
          <div className="absolute bottom-0 left-0 right-0 w-full h-[3px] bg-stone-100/40 overflow-hidden z-[99]">
               <style>{`
                    @keyframes line-loading-anim {
                         0% { background-position: 200% 0; }
                         100% { background-position: -200% 0; }
                    }
                    .line-loading-bar {
                         position: absolute;
                         inset: 0;
                         background: linear-gradient(90deg, 
                              rgba(230, 30, 37, 0.15) 0%, 
                              rgba(230, 30, 37, 1) 50%, 
                              rgba(230, 30, 37, 0.15) 100%
                         );
                         background-size: 200% 100%;
                         animation: line-loading-anim 1.5s infinite linear;
                    }
               `}</style>
               <div className="line-loading-bar" />
          </div>
     );
};

export const SkeletonSocialMediaGrid: React.FC = () => {
     return (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto justify-center w-full">
               {Array.from({ length: 6 }).map((_, i) => (
                    <div
                         key={i}
                         className="relative rounded-xl border border-stone-200/50 dark:border-stone-850 bg-white dark:bg-stone-900 animate-pulse w-full aspect-square flex flex-col items-center justify-center p-3 space-y-2"
                    >
                         {/* Circle Icon Placeholder */}
                         <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-850" />
                         {/* Text Placeholders */}
                         <div className="space-y-1.5 w-full flex flex-col items-center">
                              <div className="h-3 bg-stone-200 dark:bg-stone-850 rounded w-1/2" />
                              <div className="h-2.5 bg-stone-200 dark:bg-stone-850 rounded w-1/3" />
                         </div>
                    </div>
               ))}
          </div>
     );
};
