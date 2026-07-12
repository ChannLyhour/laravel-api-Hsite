import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { TextSp } from '../helpers/TextSp';

interface ImageDetailProductProps {
     isOpen: boolean;
     onClose: () => void;
     images: string[];
     productName: string;
}

export const ImageDetailProduct: React.FC<ImageDetailProductProps> = ({
     isOpen,
     onClose,
     images,
     productName,
}) => {
     // Prevent scroll on body when open
     useEffect(() => {
          if (isOpen) {
               document.body.style.overflow = 'hidden';
          } else {
               document.body.style.overflow = '';
          }
          return () => {
               document.body.style.overflow = '';
          };
     }, [isOpen]);

     if (!isOpen) return null;
     if (typeof document === 'undefined') return null;

     return createPortal(
          <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto select-none animate-fade-in">
               {/* Header Bar */}
               <div className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-6 py-4">
                    <TextSp
                         as="span"
                         weight="black"
                         color="text-stone-950"
                         uppercase
                         tracking="widest"
                         className="font-kontomruy text-[10px] sm:text-xs"
                    >
                         {productName}
                    </TextSp>
                    <button
                         onClick={onClose}
                         className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer focus:outline-none"
                         aria-label="Close image viewer"
                    >
                         <FiX className="w-5 h-5" />
                    </button>
               </div>

               {/* Vertical Images Stack */}
               <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center gap-8 md:gap-12">
                    {images.map((img, idx) => (
                         <div key={idx} className="w-full bg-stone-50 rounded-lg overflow-hidden flex items-center justify-center border border-stone-100 shadow-3xs">
                              <img
                                   src={img}
                                   alt={`${productName} detail view ${idx + 1}`}
                                   className="w-full h-auto max-h-[85vh] object-contain select-none pointer-events-none"
                                   draggable={false}
                              />
                         </div>
                    ))}
               </div>
          </div>,
          document.body
     );
};
