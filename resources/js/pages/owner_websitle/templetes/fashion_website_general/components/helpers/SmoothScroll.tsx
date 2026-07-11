// components/helpers/SmoothScroll.tsx
import React, { useEffect } from 'react';

interface SmoothScrollProps {
     children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
     useEffect(() => {
          // Enable smooth scrolling globally on mount
          const root = document.documentElement;
          root.style.scrollBehavior = 'smooth';

          // Intercept local anchor link clicks for smooth transit
          const handleAnchorClick = (e: MouseEvent) => {
               const target = e.target as HTMLElement;
               const anchor = target.closest('a');

               if (
                    anchor &&
                    anchor.hash &&
                    anchor.origin === window.location.origin &&
                    anchor.pathname === window.location.pathname
               ) {
                    const targetElement = document.getElementById(anchor.hash.slice(1));
                    if (targetElement) {
                         e.preventDefault();
                         targetElement.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                         });
                         // Update URL hash without jumping
                         window.history.pushState(null, '', anchor.hash);
                    }
               }
          };

          document.addEventListener('click', handleAnchorClick);

          return () => {
               // Clean up styles and events on unmount
               root.style.scrollBehavior = '';
               document.removeEventListener('click', handleAnchorClick);
          };
     }, []);

     return <>{children}</>;
};