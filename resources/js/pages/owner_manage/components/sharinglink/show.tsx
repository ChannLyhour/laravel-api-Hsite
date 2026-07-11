import React, { useState } from 'react';
import { FiCopy, FiExternalLink, FiDownload, FiPrinter, FiRotateCcw, FiCheck } from 'react-icons/fi';
import { GenerateQRCode } from './qr/generateqrcode';
import { toast } from '@/pages/owner_manage/utils/toast';
import { getStoreUrl } from '@Security/Owner/configUrl';
import { resolveImageUrl } from '@/api/imageUtils';

interface SharingLinkShowProps {
     profile: any;
     settings: any;
}

export const SharingLinkShow: React.FC<SharingLinkShowProps> = ({ profile, settings }) => {
     const [fgColor, setFgColor] = useState('#0f172a'); // default dark slate
     const [bgColor, setBgColor] = useState('#ffffff');
     const [size, setSize] = useState(240);


     // Resolve store details
     const storeName = settings?.store_name || profile?.user?.name || 'My Store';
     const activeOwnerId = settings?.hashid || settings?.owner_id || settings?.created_by || (profile?.user?.role === 'admin'
          ? (localStorage.getItem('selected_owner_id') || profile?.user?.hashid || profile?.user?.id)
          : (profile?.user?.hashid || profile?.user?.id));

     const path = getStoreUrl(storeName, activeOwnerId);
     const shareUrl = path.startsWith('http') ? path : `${window.location.origin}${path}`;
     const logoUrl = settings?.logo || settings?.image_url || profile?.user?.image_url;
     const resolvedLogoUrl = logoUrl ? resolveImageUrl(logoUrl) : undefined;

     const handleCopyLink = () => {
          navigator.clipboard.writeText(shareUrl);
          toast.success('Public storefront link copied to clipboard!');
     };

     const handleDownloadPNG = () => {
          const svgElement = document.getElementById('store-qr-code-svg');
          if (!svgElement) {
               toast.error('QR code element not found.');
               return;
          }
          try {
               const svgString = new XMLSerializer().serializeToString(svgElement);
               const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
               const blobURL = window.URL.createObjectURL(svgBlob);

               const image = new Image();
               image.onload = () => {
                    const canvas = document.createElement('canvas');
                    const padding = 40;
                    canvas.width = size * 2 + padding * 2;
                    canvas.height = size * 2 + padding * 2;
                    const context = canvas.getContext('2d');
                    if (context) {
                         // Fill background
                         context.fillStyle = bgColor;
                         context.fillRect(0, 0, canvas.width, canvas.height);

                         // Draw QR Code
                         context.drawImage(image, padding, padding, size * 2, size * 2);

                         const png = canvas.toDataURL('image/png');
                         const downloadLink = document.createElement('a');
                         downloadLink.href = png;
                         downloadLink.download = `${storeName.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`;
                         document.body.appendChild(downloadLink);
                         downloadLink.click();
                         document.body.removeChild(downloadLink);
                         toast.success('QR Code downloaded as PNG!');
                    }
               };
               image.src = blobURL;
          } catch (err) {
               console.error(err);
               toast.error('Failed to download PNG.');
          }
     };

     const handlePrintStandee = () => {
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
               toast.error('Please allow popups to print the QR Code.');
               return;
          }

          const qrSvg = document.getElementById('store-qr-code-svg')?.outerHTML || '';

          printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code Standee - ${storeName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;700;900&family=Outfit:wght@400;600;800;900&display=swap');
            body {
              margin: 0;
              padding: 0;
              font-family: 'Outfit', 'Kantumruy Pro', sans-serif;
              background: #ffffff;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              color: #0f172a;
            }
            .standee-container {
              width: 450px;
              border: 12px double #f97316;
              border-radius: 20px;
              padding: 40px 30px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.05);
              background: #fff;
            }
            .store-name {
              font-size: 28px;
              font-weight: 900;
              margin-bottom: 5px;
              color: #f97316;
            }
            .subtitle {
              font-size: 14px;
              font-weight: 600;
              color: #64748b;
              margin-bottom: 30px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            .qr-wrapper {
              display: inline-block;
              padding: 20px;
              background: #f8fafc;
              border-radius: 15px;
              border: 2px dashed #cbd5e1;
              margin-bottom: 30px;
            }
            .qr-wrapper svg {
              width: 250px;
              height: 250px;
              display: block;
            }
            .call-to-action {
              font-size: 20px;
              font-weight: 900;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .scan-desc {
              font-size: 13px;
              font-weight: 600;
              color: #64748b;
              margin-bottom: 0;
            }
            .footer-url {
              margin-top: 35px;
              font-size: 12px;
              font-weight: 700;
              color: #94a3b8;
              word-break: break-all;
            }
            @media print {
              body {
                background: none;
              }
              .standee-container {
                box-shadow: none;
                border-color: #f97316 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="standee-container">
            <div class="store-name">${storeName}</div>
            <div class="subtitle">Online Shop Website</div>
            
            <div class="qr-wrapper">
              ${qrSvg}
            </div>
            
            <div class="call-to-action">SCAN TO ORDER</div>
            <div class="scan-desc">ស្កេនទីនេះដើម្បីទស្សនា និងកុម្ម៉ង់ទំនិញផ្ទាល់ពីគេហទំព័ររបស់យើង</div>
            
            <div class="footer-url">${shareUrl}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
          printWindow.document.close();
     };

     const resetCustomizer = () => {
          setFgColor('#0f172a');
          setBgColor('#ffffff');
          setSize(240);
     };

     const presetColors = [
          { name: 'Slate Dark', hex: '#0f172a' },
          { name: 'Orange Core', hex: '#f97316' },
          { name: 'Indigo Premium', hex: '#4f46e5' },
          { name: 'Forest Green', hex: '#059669' },
          { name: 'Burgundy Red', hex: '#991b1b' },
          { name: 'Classic Black', hex: '#000000' }
     ];

     return (
          <div className="space-y-6 font-kuntomruy animate-fade-in w-full text-left">
               {/* Header */}
               <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2.5">
                         <FiExternalLink className="text-orange-500" />
                         <span>ផ្សព្វផ្សាយហាងទំនិញ (Online Store QR)</span>
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">
                         បង្កើត កែច្នៃ និងទាញយកកូដ QR សម្រាប់គេហទំព័រលក់ទំនិញអនឡាញផ្លូវការរបស់ហាងអ្នក។
                    </p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left 2/3 - URL & Customizer Panel */}
                    <div className="lg:col-span-2 space-y-6">
                         {/* Store URL info card */}
                         <div className="bg-white rounded-[10px] p-6 border shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
                              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider pb-2 border-b">
                                   Storefront Web Address
                              </h3>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                   <div className="flex-1 bg-slate-50 border px-4 py-3 rounded-[6px] text-xs font-bold text-slate-700 break-all select-all select-none">
                                        {shareUrl}
                                   </div>
                                   <div className="flex items-center gap-2 shrink-0">
                                        <button
                                             onClick={handleCopyLink}
                                             className="px-4 py-3 border border-orange-200/80 text-orange-600 hover:bg-orange-50 rounded-[6px] text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2"
                                        >
                                             <FiCopy className="w-4 h-4" />
                                             <span>Copy Link</span>
                                        </button>
                                        <a
                                             href={shareUrl}
                                             target="_blank"
                                             rel="noreferrer"
                                             className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-[6px] text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2 border-none no-underline shadow-3xs"
                                        >
                                             <FiExternalLink className="w-4 h-4" />
                                             <span>Visit Shop</span>
                                        </a>
                                   </div>
                              </div>
                         </div>

                         {/* QR Customizer */}
                         <div className="bg-white rounded-[10px] p-6 border shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
                              <div className="flex justify-between items-center pb-2 border-b">
                                   <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                                        Customize QR Code Style
                                   </h3>
                                   <button
                                        onClick={resetCustomizer}
                                        className="text-xs font-black text-slate-500 hover:text-orange-500 flex items-center gap-1.5 border-none bg-transparent cursor-pointer"
                                   >
                                        <FiRotateCcw className="w-3.5 h-3.5" />
                                        <span>Reset</span>
                                   </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   {/* Foreground Color */}
                                   <div className="space-y-3">
                                        <label className="text-2xs font-black text-slate-500 uppercase tracking-wider block">
                                             Foreground Color
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                             {presetColors.map((color) => (
                                                  <button
                                                       key={color.hex}
                                                       type="button"
                                                       onClick={() => setFgColor(color.hex)}
                                                       className="w-8 h-8 rounded-full border cursor-pointer transition-transform hover:scale-110 flex items-center justify-center relative shadow-3xs"
                                                       style={{ backgroundColor: color.hex, borderColor: fgColor === color.hex ? '#f97316' : '#cbd5e1' }}
                                                       title={color.name}
                                                  >
                                                       {fgColor === color.hex && (
                                                            <FiCheck className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                                       )}
                                                  </button>
                                             ))}
                                             <div className="w-8 h-8 rounded-full border border-slate-300 relative overflow-hidden cursor-pointer shadow-3xs hover:scale-110">
                                                  <input
                                                       type="color"
                                                       value={fgColor}
                                                       onChange={(e) => setFgColor(e.target.value)}
                                                       className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-150"
                                                       title="Custom Color"
                                                  />
                                             </div>
                                        </div>
                                   </div>


                              </div>


                         </div>
                    </div>

                    {/* Right 1/3 - Preview & Action Panel */}
                    <div className="bg-white rounded-[10px] p-6 border shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6 flex flex-col items-center">
                         <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider pb-2 border-b w-full text-center">
                              QR Code Live Preview
                         </h3>

                         <div
                              className="p-6 rounded-[12px] border border-slate-200/80 shadow-3xs flex items-center justify-center bg-white aspect-square"
                              style={{ width: `${size + 40}px`, backgroundColor: bgColor }}
                         >
                              <div className="w-full h-full flex items-center justify-center">
                                   <GenerateQRCode
                                        value={shareUrl}
                                        size={size}
                                        fgColor={fgColor}
                                        bgColor={bgColor}
                                        logoUrl={undefined}
                                   />
                              </div>
                         </div>

                         <div className="space-y-2.5 w-full pt-4 border-t">
                              <button
                                   onClick={handleDownloadPNG}
                                   className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-[6px] text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2 border-none shadow-3xs"
                              >
                                   <FiDownload className="w-4 h-4" />
                                   <span>Download PNG Image</span>
                              </button>

                              <button
                                   onClick={handlePrintStandee}
                                   className="w-full py-2.5 border border-orange-200/80 text-orange-600 hover:bg-orange-50 rounded-[6px] text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2"
                              >
                                   <FiPrinter className="w-4 h-4" />
                                   <span>Print Table Standee</span>
                              </button>
                         </div>

                         <div className="bg-orange-50/50 border border-orange-100 rounded-[8px] p-4 text-left w-full space-y-1.5">
                              <h4 className="text-3xs font-black text-orange-700 uppercase tracking-wider">💡 Marketing Tip</h4>
                              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                                   Print the **Table Standee** poster and place it at checkout counters or dining tables. Customers can scan to view your items, check prices, and place orders directly from their phones!
                              </p>
                         </div>
                    </div>
               </div>
          </div>
     );
};
