import React, { useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { TextSp } from './TextSp';

export const DotTechSc: React.FC = () => {
     const [isVisible, setIsVisible] = useState(true);

     useEffect(() => {
          let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

          const handleScroll = () => {
               // Hide immediately when scrolling
               setIsVisible(false);

               if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
               }

               // Check if user reached near the bottom
               const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;

               if (!isAtBottom) {
                    // Show after scrolling stops for 1000ms
                    scrollTimeout = setTimeout(() => {
                         setIsVisible(true);
                    }, 1000);
               }
          };

          window.addEventListener('scroll', handleScroll, { passive: true });
          return () => {
               window.removeEventListener('scroll', handleScroll);
               if (scrollTimeout) clearTimeout(scrollTimeout);
          };
     }, []);

     const handleScrollDown = (e: React.MouseEvent) => {
          e.stopPropagation();

          const currentScroll = window.scrollY;
          if (currentScroll < 100) {
               // At the top: scroll past the hero banner
               const mainElement = document.querySelector('main');
               if (mainElement) {
                    const heroElement = mainElement.firstElementChild;
                    if (heroElement) {
                         const rect = heroElement.getBoundingClientRect();
                         window.scrollTo({
                              top: window.scrollY + rect.height,
                              behavior: 'smooth'
                         });
                         return;
                    }
               }
          }

          // Otherwise scroll down by 80% viewport height
          window.scrollTo({
               top: window.scrollY + window.innerHeight * 0.8,
               behavior: 'smooth'
          });
     };

     return (
          <div
               onClick={handleScrollDown}
               className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center justify-center select-none cursor-pointer transition-all duration-500 ease-in-out ${isVisible
                    ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
                    : 'opacity-0 translate-y-10 pointer-events-none scale-75'
                    }`}
          >

               {/* Pulsing Text Label */}
               <div className="flex items-center gap-1.5 mt-1 animate-pulse-slow bg-white/80 dark:bg-stone-800/80 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-2xs border border-stone-200/30">
                    <TextSp
                         size="3xs"
                         weight="black"
                         font="kontomruy"
                         color="text-stone-900 dark:text-stone-100"
                         className="tracking-wider uppercase text-[8px]"
                    >
                         អូសទៅក្រោម ដើម្បីមើលបន្ថែម
                    </TextSp>
                    <FiChevronDown className="w-3 h-3 text-stone-900 dark:text-stone-100 animate-bounce" />
               </div>
          </div>
     );
};
