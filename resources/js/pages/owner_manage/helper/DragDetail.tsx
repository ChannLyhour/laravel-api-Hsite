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
     maxWidth = 'max-w-md',
}) => {
     const [active, setActive] = useState(false);
     const [dragX, setDragX] = useState(0);
     const [isDragging, setIsDragging] = useState(false);
     const startX = useRef(0);

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
          startX.current = e.touches[0].clientX;
          setIsDragging(true);
     };

     const handleTouchMove = (e: React.TouchEvent) => {
          if (!isDragging) return;
          const currentX = e.touches[0].clientX;
          const deltaX = currentX - startX.current;
          if (deltaX > 0) {
               setDragX(deltaX);
          }
     };

     const handleTouchEnd = () => {
          setIsDragging(false);
          if (dragX > 150) {
               handleClose();
          } else {
               setDragX(0);
          }
     };

     const handleMouseDown = (e: React.MouseEvent) => {
          startX.current = e.clientX;
          setIsDragging(true);
     };

     useEffect(() => {
          const handleMouseMove = (e: MouseEvent) => {
               if (!isDragging) return;
               const deltaX = e.clientX - startX.current;
               if (deltaX > 0) {
                    setDragX(deltaX);
               }
          };

          const handleMouseUp = () => {
               if (isDragging) {
                    setIsDragging(false);
                    if (dragX > 150) {
                         handleClose();
                    } else {
                         setDragX(0);
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
     }, [isDragging, dragX]);

     if (!isOpen) return null;

     return createPortal(
          <div className="fixed inset-0 z-[10000] flex justify-end items-stretch">
               {/* Backdrop overlay */}
               <div
                    className={`absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
                         active ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={handleClose}
               />

               {/* Right Side Panel container */}
               <div
                    className={`relative z-10 bg-white h-full w-full ${maxWidth} sm:rounded-l-[16px] shadow-2xl overflow-hidden flex flex-col pl-3.5 ${
                         isDragging ? '' : 'transition-transform duration-300 ease-out'
                    }`}
                    style={{
                         transform: active ? `translateX(${dragX}px)` : 'translateX(100%)',
                    }}
               >
                    {/* Left Drag Handle Bar (vertical handle) */}
                    <div
                         className="absolute left-0 top-0 bottom-0 w-3.5 flex items-center justify-center cursor-ew-resize select-none z-20 group hover:bg-slate-50/80 transition-colors"
                         onTouchStart={handleTouchStart}
                         onTouchMove={handleTouchMove}
                         onTouchEnd={handleTouchEnd}
                         onMouseDown={handleMouseDown}
                         title="Drag right to close"
                    >
                         <div className="w-1 h-16 bg-slate-200 group-hover:bg-slate-350 rounded-full transition-colors" />
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
