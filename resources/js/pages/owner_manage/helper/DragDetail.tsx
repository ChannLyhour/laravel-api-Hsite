import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DragDetailProps {
     isOpen: boolean;
     onClose: () => void;
     children: React.ReactNode;
     maxHeight?: string;
     maxWidth?: string;
}

export const DragDetail: React.FC<DragDetailProps> = ({
     isOpen,
     onClose,
     children,
     maxHeight = '85vh',
     maxWidth = 'max-w-md md:max-w-xl',
}) => {
     const [active, setActive] = useState(false);
     const [dragY, setDragY] = useState(0);
     const [isDragging, setIsDragging] = useState(false);
     const startY = useRef(0);

     useEffect(() => {
          if (isOpen) {
               document.body.style.overflow = 'hidden';
               const timer = setTimeout(() => setActive(true), 10);
               return () => {
                    clearTimeout(timer);
               };
          } else {
               setActive(false);
          }
     }, [isOpen]);

     const handleClose = () => {
          setActive(false);
          setTimeout(() => {
               onClose();
               document.body.style.overflow = '';
          }, 300);
     };

     const handleTouchStart = (e: React.TouchEvent) => {
          startY.current = e.touches[0].clientY;
          setIsDragging(true);
     };

     const handleTouchMove = (e: React.TouchEvent) => {
          if (!isDragging) return;
          const currentY = e.touches[0].clientY;
          const deltaY = currentY - startY.current;
          if (deltaY > 0) {
               setDragY(deltaY);
          }
     };

     const handleTouchEnd = () => {
          setIsDragging(false);
          if (dragY > 150) {
               handleClose();
          } else {
               setDragY(0);
          }
     };

     const handleMouseDown = (e: React.MouseEvent) => {
          startY.current = e.clientY;
          setIsDragging(true);
     };

     useEffect(() => {
          const handleMouseMove = (e: MouseEvent) => {
               if (!isDragging) return;
               const deltaY = e.clientY - startY.current;
               if (deltaY > 0) {
                    setDragY(deltaY);
               }
          };

          const handleMouseUp = () => {
               if (isDragging) {
                    setIsDragging(false);
                    if (dragY > 150) {
                         handleClose();
                    } else {
                         setDragY(0);
                    }
               }
          };

          if (isDragging) {
               window.addEventListener('mousemove', handleMouseMove);
               window.addEventListener('mouseup', handleMouseUp);
          }

          return () => {
               window.removeEventListener('mousemove', handleMouseMove);
               window.removeEventListener('mouseup', handleMouseUp);
          };
     }, [isDragging, dragY]);

     if (!isOpen) return null;

     return createPortal(
          <div className="fixed inset-0 z-[10000] flex items-end justify-center">
               {/* Backdrop overlay */}
               <div
                    className={`absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
                         active ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={handleClose}
               />

               {/* Bottom Sheet Panel container */}
               <div
                    className={`relative z-10 bg-white w-full ${maxWidth} rounded-t-[16px] shadow-2xl overflow-hidden flex flex-col ${
                         isDragging ? '' : 'transition-transform duration-300 ease-out'
                    }`}
                    style={{
                         height: maxHeight,
                         transform: active ? `translateY(${dragY}px)` : 'translateY(100%)',
                    }}
               >
                    {/* Drag Handle Bar */}
                    <div
                         className="w-full pt-3 pb-2 flex justify-center bg-white cursor-pointer select-none shrink-0"
                         onTouchStart={handleTouchStart}
                         onTouchMove={handleTouchMove}
                         onTouchEnd={handleTouchEnd}
                         onMouseDown={handleMouseDown}
                         onClick={handleClose}
                         title="Drag down or click to close"
                    >
                         <div className="w-12 h-1.5 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors" />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                         {children}
                    </div>
               </div>
          </div>,
          document.body
     );
};
