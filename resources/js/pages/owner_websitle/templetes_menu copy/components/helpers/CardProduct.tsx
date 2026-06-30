import React from 'react';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { resolveImageUrl, getHoverImage } from '../../utils/imageUtils';
import { resolveColorHex } from '../../utils/priceUtils';
import type { StoreRow } from '@/api/owner/stores';

interface CardProductProps {
    item: any;
    ownerUserId?: number | string;
    stores?: StoreRow;
    storeName: string;
    onNavigate?: (to: string) => void;
    addToCart: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
    isFavorited?: boolean;
    onToggleFavorite?: (id: string, name: string) => void;
    customPrice?: number;
    customComparePrice?: number | null;
    enableHover?: boolean;
}

export const CardProduct: React.FC<CardProductProps> = ({
    item,
    addToCart,
    isFavorited,
    onToggleFavorite,
    customPrice,
    customComparePrice,
    enableHover = false,  // Set Hover CardProducts
}) => {
    const itemPrice = customPrice !== undefined ? customPrice : (parseFloat(item.price) || 0);
    const comparePrice = customComparePrice !== undefined ? customComparePrice : (item.compare_at_price ? parseFloat(item.compare_at_price) : null);

    // If there's a comparePrice greater than price, calculate discount label
    const discountAmount = comparePrice && comparePrice > itemPrice ? comparePrice - itemPrice : 0;
    const discountLabel = item.discount || (discountAmount > 0
        ? `-$${discountAmount.toFixed(2)}`
        : null);

    const isOutOfStock = item.status === 'archived' || item.status === 'inactive' || item.status === 'draft' || (
        item.has_options
            ? (item.variants && item.variants.length > 0 && item.variants.every((v: any) => (Number(v.stock_qty) ?? 0) <= 0))
            : (item.variants && item.variants.length > 0 && (Number(item.variants[0].stock_qty) ?? 0) <= 0)
    );

    const handleCardClick = () => {
        window.dispatchEvent(new CustomEvent('open_product_popup', { detail: { productId: String(item.id) } }));
    };

    return (
        <div
            className="group flex flex-col justify-between space-y-3 relative bg-transparent p-3.5 rounded-[3px] border border-transparent shadow-none cursor-pointer"
            onClick={(e) => {
                // Prevent routing if clicking favorite button
                if ((e.target as HTMLElement).closest('button')) return;
                handleCardClick();
            }}
        >
            {/* Product Image Area */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-[2px] bg-stone-50">
                {(() => {
                    const hoverImg = enableHover ? getHoverImage(item) : null;
                    return (
                        <div className="w-full h-full relative">
                            {hoverImg && (
                                <img
                                    src={hoverImg}
                                    alt={item.name}
                                    className="product-image-hover"
                                />
                            )}
                            <img
                                src={resolveImageUrl(item.display_image || item.image)}
                                alt={item.name}
                                className={`w-full h-full  product-image-primary ${hoverImg ? 'group-hover:opacity-0' : ''
                                    }`}
                            />
                        </div>
                    );
                })()}

                {/* Badges top-left overlay */}
                <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 z-10 pointer-events-none select-none">
                    {item.badge && (
                        <span
                            className="w-fit text-[10px] font-black uppercase px-2 py-0.5 rounded-[3px] tracking-wider leading-none shadow-3xs"
                            style={{
                                backgroundColor: item.badge.background_color || '#E61E25',
                                color: item.badge.text_color || '#FFFFFF',
                            }}
                        >
                            {item.badge.name}
                        </span>
                    )}
                    {discountLabel && (
                        <span className="w-fit bg-[#E61E25] text-white text-[12px] font-black uppercase px-2 py-0.5 rounded-[3px] tracking-wider leading-none shadow-3xs">
                            {discountLabel}
                        </span>
                    )}
                </div>

                {/* Hover Add to Bag Overlay */}
                {enableHover && !isOutOfStock && addToCart && (
                    <div className="absolute inset-x-3 bottom-3 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (item.has_options) {
                                    handleCardClick();
                                } else {
                                    const defaultSize = item.sizes?.[0];
                                    const defaultColor = item.colors?.[0];
                                    addToCart(item, 1, defaultSize, defaultColor);
                                }
                            }}
                            className="w-full py-2 bg-stone-950/90 hover:bg-[#E61E25] text-white text-[10px] font-black uppercase tracking-widest rounded-[2px] shadow-md transition-colors duration-300 cursor-pointer border-none flex items-center justify-center gap-1.5"
                        >
                            <FiShoppingBag className="w-3.5 h-3.5" />
                            <span>{item.has_options ? 'Select Options' : 'Add to Bag'}</span>
                        </button>
                    </div>
                )}
                
                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-stone-950/20 backdrop-blur-3xs flex items-center justify-center select-none pointer-events-none z-10">
                        <span className="bg-white/90 text-stone-900 border border-stone-200 text-[10px] font-black uppercase px-4 py-2 rounded-[2px] tracking-widest shadow-lg">
                            Out Of Stock
                        </span>
                    </div>
                )}


            </div>

            {/* Product Metadata Info Area */}
            <div className="space-y-1.5 pt-1 font-sans">
                {/* Price block + Heart icon inline */}
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline space-x-1.5 font-sans text-left">
                        <span className="text-[#E61E25] text-xs font-bold">
                            ${itemPrice.toFixed(2)}
                        </span>
                        {comparePrice && (
                            <span className="text-stone-400 text-[10px] line-through font-semibold">
                                ${comparePrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    {onToggleFavorite && (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                onToggleFavorite(String(item.id), item.name);
                            }}
                            className="text-stone-400 hover:text-[#E61E25] focus:outline-none transition-colors pr-0.5"
                        >
                            <FiHeart
                                className={`w-6 h-6 ${isFavorited ? 'fill-[#E61E25] text-[#E61E25]' : ''}`}
                            />
                        </button>
                    )}
                </div>

                {/* Product Name */}
                <h4 className={`text-2xs sm:text-xs font-black text-stone-900 uppercase tracking-wide truncate transition-colors leading-tight text-left ${
                    enableHover ? 'group-hover:text-[#E61E25]' : ''
                }`}>
                    {item.name}
                </h4>


                {/* Colors swatches preview */}
                <div className="h-3.5 flex items-center pt-0.5 select-none text-left">
                    {item.colors && item.colors.length > 0 ? (
                        <div className="flex items-center space-x-1">
                            {item.colors.slice(0, 3).map((col: string, cIdx: number) => (
                                <span
                                    key={cIdx}
                                    className="w-4 h-3 rounded-[3px] border border-stone-200/80 shrink-0"
                                    style={{ backgroundColor: resolveColorHex(item, col) }}
                                />
                            ))}
                            {item.colors.length > 3 && (
                                <span className="text-[8px] text-stone-400 font-extrabold leading-none">
                                    +{item.colors.length - 3}
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Sizing Label preview */}
                <div className="h-4 flex items-center select-none text-left">
                    {item.sizes && item.sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {item.sizes.slice(0, 3).map((sz: string, szIdx: number) => (
                                <span
                                    key={szIdx}
                                    className="text-[8px] font-black text-stone-400 bg-stone-50 border border-stone-200/40 px-1 py-0.5 rounded-[2px] uppercase leading-none"
                                >
                                    {sz}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

