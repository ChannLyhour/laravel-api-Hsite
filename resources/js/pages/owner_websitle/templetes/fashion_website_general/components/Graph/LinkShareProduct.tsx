import React from 'react';
import {
     FaFacebookF,
     FaTelegramPlane,
     FaInstagram,
     FaTiktok,
} from 'react-icons/fa';
import { toast } from '../../utils/toast';

interface LinkShareProductProps {
     isOpen: boolean;
     shareUrl: string;
     productName: string;
}

export const LinkShareProduct: React.FC<LinkShareProductProps> = ({
     isOpen,
     shareUrl,
     productName,
}) => {
     if (!isOpen) return null;

     return (
          <div className="absolute top-12 right-0 z-[100] w-[210px] p-3 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-lg shadow-lg animate-fade-in">
               {/* Arrow Indicator */}
               <div className="absolute -top-1.5 right-[14px] w-3 h-3 bg-white dark:bg-stone-900 border-t border-l border-stone-200/80 dark:border-stone-800 rotate-45 z-10" />

               {/* Social Buttons Grid */}
               <div className="grid grid-cols-4 gap-2 justify-items-center relative z-20">
                    {/* Facebook */}
                    <a
                         href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#1877F2]/90 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-sm hover:shadow-md cursor-pointer"
                         title="Share on Facebook"
                    >
                         <FaFacebookF className="w-4.5 h-4.5" />
                    </a>

                    {/* Instagram */}
                    <button
                         type="button"
                         onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              toast.success('Link copied! Share it on Instagram.');
                              window.open('https://www.instagram.com', '_blank');
                         }}
                         className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-sm hover:shadow-md cursor-pointer border-none focus:outline-none"
                         title="Share on Instagram"
                    >
                         <FaInstagram className="w-4.5 h-4.5" />
                    </button>

                    {/* TikTok */}
                    <button
                         type="button"
                         onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              toast.success('Link copied! Share it on TikTok.');
                              window.open('https://www.tiktok.com', '_blank');
                         }}
                         className="w-10 h-10 rounded-full bg-black hover:bg-stone-900 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-sm hover:shadow-md cursor-pointer border-none focus:outline-none"
                         title="Share on TikTok"
                    >
                         <FaTiktok className="w-4.5 h-4.5" />
                    </button>

                    {/* Telegram */}
                    <a
                         href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out this product: ${productName}`)}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-10 h-10 rounded-full bg-[#229ED9] hover:bg-[#229ED9]/90 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-sm hover:shadow-md cursor-pointer"
                         title="Share on Telegram"
                    >
                         <FaTelegramPlane className="w-4.5 h-4.5" />
                    </a>
               </div>
          </div>
     );
};
