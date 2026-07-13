import React from 'react';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { toast } from '../../utils/toast';
import { FASHION_ROUTES } from '../../routes';
import { resolveImageUrl, getHoverImage } from '../../utils/imageUtils';
import { resolveColorHex, getProductColors, getProductSizes } from '../../utils/priceUtils';
import type { StoreRow } from '@/api/owner/stores';
import { TextSp } from './TextSp';
import { SkeletonCard } from './SkeletonSt';

interface CardProductProps {
    item?: any;
    isLoading?: boolean;
    ownerUserId?: number | string;
    stores?: StoreRow;
    storeName?: string;
    onNavigate?: (to: string) => void;
    addToCart?: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
    isFavorited?: boolean;
    onToggleFavorite?: (id: string, name: string) => void;
    customPrice?: number;
    customComparePrice?: number | null;
    showAddToCart?: boolean;
    showBadge?: boolean;
    isLarge?: boolean;
    font?: 'sans' | 'kontomruy' | string;
    aosDelay?: number;
    disableAos?: boolean;
}

export const CardProduct: React.FC<CardProductProps> = (props) => {
    if (props.isLoading || !props.item) {
        return <SkeletonCard isLarge={props.isLarge} />;
    }
    return <CardProductInner {...props} />;
};

const CardProductInner: React.FC<CardProductProps> = ({
    item,
    ownerUserId,
    stores,
    storeName,
    onNavigate,
    addToCart,
    isFavorited,
    onToggleFavorite,
    customPrice,
    customComparePrice,
    showAddToCart = false,
    showBadge = false,
    isLarge = false,
    font,
    aosDelay,
    disableAos = false,
}) => {
    const fontClass = font ? (font === 'sans' ? 'font-sans' : font === 'kontomruy' ? 'font-kontomruy' : font) : 'font-sans';
    const colors = item.colors || getProductColors(item) || [];
    const sizes = item.sizes || getProductSizes(item) || [];

    const containerRef = React.useRef<HTMLDivElement>(null);
    const [currentImgIdx, setCurrentImgIdx] = React.useState(0);
    const [startX, setStartX] = React.useState<number | null>(null);
    const [dragOffset, setDragOffset] = React.useState(0);
    const [autoDragOffsetPercent, setAutoDragOffsetPercent] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    const [transitionEnabled, setTransitionEnabled] = React.useState(true);
    const dragStartedRef = React.useRef(false);

    // Resolve all available images for the slider
    const allImages = React.useMemo(() => {
        const list: string[] = [];
        const primary = resolveImageUrl(item.display_image || item.image);
        if (primary) list.push(primary);

        let gallery = item.images;
        if (typeof gallery === 'string') {
            try {
                gallery = JSON.parse(gallery);
            } catch {
                gallery = null;
            }
        }
        if (gallery && Array.isArray(gallery)) {
            gallery.forEach((img: any) => {
                if (!img) return;
                const path = typeof img === 'string' ? img : (img.image || img.image_path);
                const url = resolveImageUrl(path);
                if (url && !list.includes(url)) {
                    list.push(url);
                }
            });
        }

        // Add variants images if any
        let variants = item.variants;
        if (typeof variants === 'string') {
            try {
                variants = JSON.parse(variants);
            } catch {
                variants = null;
            }
        }
        if (variants && Array.isArray(variants)) {
            variants.forEach((v: any) => {
                if (v && v.image_url) {
                    const url = resolveImageUrl(v.image_url);
                    if (url && !list.includes(url)) {
                        list.push(url);
                    }
                }
            });
        }

        // Add hover image if any
        const hover = getHoverImage(item);
        if (hover && !list.includes(hover)) {
            if (list.length > 1) {
                list.splice(1, 0, hover);
            } else {
                list.push(hover);
            }
        }
        return list;
    }, [item]);

    // Create cloned list for infinite looping [CloneLast, Item1, Item2, ..., CloneFirst]
    const loopImages = React.useMemo(() => {
        if (allImages.length <= 1) return allImages;
        return [
            allImages[allImages.length - 1],
            ...allImages,
            allImages[0]
        ];
    }, [allImages]);

    // Current active dot index mapping
    const activeDotIdx = React.useMemo(() => {
        if (currentImgIdx === -1) return allImages.length - 1;
        if (currentImgIdx === allImages.length) return 0;
        return currentImgIdx;
    }, [currentImgIdx, allImages.length]);

    const handleDragStart = (clientX: number) => {
        if (allImages.length <= 1) return;

        // Instantly reset auto drag offset if active
        setAutoDragOffsetPercent(0);

        // Instantly snap back to bounds if we are currently out of bounds (due to fast dragging bypassing transitionEnd)
        if (currentImgIdx < 0) {
            setTransitionEnabled(false);
            setCurrentImgIdx(allImages.length - 1);
        } else if (currentImgIdx >= allImages.length) {
            setTransitionEnabled(false);
            setCurrentImgIdx(0);
        }

        setStartX(clientX);
        setIsDragging(true);
        dragStartedRef.current = false;
    };

    const handleDragMove = (clientX: number) => {
        if (startX === null || !isDragging) return;
        const diff = clientX - startX;
        setDragOffset(diff);
    };

    const handleDragEnd = () => {
        if (startX === null || !isDragging) return;

        const threshold = 50;
        if (dragOffset < -threshold) {
            setCurrentImgIdx(prev => prev + 1);
        } else if (dragOffset > threshold) {
            setCurrentImgIdx(prev => prev - 1);
        }

        setStartX(null);
        setDragOffset(0);
        setIsDragging(false);
    };

    // Loop transition handler
    const handleTransitionEnd = (e: React.TransitionEvent) => {
        if (e.target !== e.currentTarget) return;
        if (currentImgIdx === -1) {
            setTransitionEnabled(false);
            setCurrentImgIdx(allImages.length - 1);
        } else if (currentImgIdx === allImages.length) {
            setTransitionEnabled(false);
            setCurrentImgIdx(0);
        }
    };

    // Reset state when product item changes (to avoid index state leak/reuse issues)
    React.useEffect(() => {
        setCurrentImgIdx(0);
        setDragOffset(0);
        setAutoDragOffsetPercent(0);
        setIsDragging(false);
        setTransitionEnabled(true);
    }, [item.id]);

    // Re-enable transition state after silent position update
    React.useEffect(() => {
        if (!transitionEnabled) {
            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTransitionEnabled(true);
                });
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [transitionEnabled]);

    // First Image Auto Drag 50% peek effect on mount or product change (only once, when currentImgIdx is 0)
    React.useEffect(() => {
        if (allImages.length <= 1 || currentImgIdx !== 0 || isDragging) return;

        // Delay 1.5s before starting the peek drag
        const delayTimer = setTimeout(() => {
            if (isDragging || currentImgIdx !== 0) return;

            // Slide left by 50% (showing next image partially)
            setAutoDragOffsetPercent(-90);

            // Hold and snap back after 1.2s
            const holdTimer = setTimeout(() => {
                setAutoDragOffsetPercent(0);
            }, 2000);

            return () => clearTimeout(holdTimer);
        }, 1500);

        return () => {
            clearTimeout(delayTimer);
        };
    }, [item.id, allImages.length, currentImgIdx, isDragging]);



    const itemPrice = customPrice !== undefined ? customPrice : (parseFloat(item.price) || 0);
    const comparePrice = customComparePrice !== undefined ? customComparePrice : (item.compare_at_price ? parseFloat(item.compare_at_price) : null);

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
        const storeSlug = (stores?.store_name || storeName || '').replace(/\s+/g, '_');
        const skuOrId = item.sku || item.id;
        const routeUrl = FASHION_ROUTES.getProduct(skuOrId, ownerUserId, storeSlug);

        if (onNavigate) {
            onNavigate(routeUrl);
        } else {
            window.dispatchEvent(new CustomEvent('open_product_popup', { detail: { productId: String(item.id) } }));
        }
    };

    return (
        <div
            data-aos={disableAos ? undefined : "fade-up"}
            data-aos-anchor-placement={disableAos ? undefined : "top-bottom"}
            data-aos-offset={disableAos ? undefined : 10}
            data-aos-delay={disableAos ? undefined : aosDelay}
            className={`group flex flex-col justify-between space-y-0.5 relative rounded-[3px] border cursor-pointer ${isLarge
                ? 'bg-white dark:bg-stone-900 border-amber-500/30 p-5 shadow-md ring-1 ring-amber-500/10 space-y-3'
                : 'bg-transparent p-0 border-transparent shadow-none'
                }`}
            onClick={(e) => {
                if (dragStartedRef.current) {
                    dragStartedRef.current = false;
                    return;
                }
                // Prevent routing if clicking favorite button
                if ((e.target as HTMLElement).closest('button')) return;
                handleCardClick();
            }}
        >
            {/* Product Image Area */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-stone-50">
                {/* Discount label is now rendered in the badges top-left stack to avoid overlaps */}

                <div
                    ref={containerRef}
                    className="w-full h-full relative select-none touch-pan-y"
                    onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        handleDragStart(e.clientX);
                    }}
                    onMouseMove={(e) => {
                        if (startX !== null) {
                            const diff = Math.abs(e.clientX - startX);
                            if (diff > 15) {
                                dragStartedRef.current = true;
                            }
                        }
                        handleDragMove(e.clientX);
                    }}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={(e) => {
                        if (e.touches.length > 0) {
                            handleDragStart(e.touches[0].clientX);
                        }
                    }}
                    onTouchMove={(e) => {
                        if (startX !== null && e.touches.length > 0) {
                            const diff = Math.abs(e.touches[0].clientX - startX);
                            if (diff > 15) {
                                dragStartedRef.current = true;
                            }
                        }
                        if (e.touches.length > 0) {
                            handleDragMove(e.touches[0].clientX);
                        }
                    }}
                    onTouchEnd={handleDragEnd}
                >
                    <div
                        className="flex w-full h-full flex-nowrap"
                        style={{
                            transform: `translate3d(calc(${allImages.length <= 1
                                ? -currentImgIdx * 100
                                : (-currentImgIdx - 1) * 100
                                }% + ${dragOffset}px + ${autoDragOffsetPercent}%), 0, 0)`,
                            transition: (isDragging || !transitionEnabled) ? 'none' : 'transform 350ms cubic-bezier(0.2, 0.8, 0.25, 1)',
                        }}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {loopImages.map((imgUrl, idx) => (
                            <div key={idx} className="w-full h-full shrink-0 relative overflow-hidden">
                                <img
                                    src={imgUrl}
                                    alt={`${item.name} ${idx + 1}`}
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 transform-gpu pointer-events-none select-none"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Drag indicator dots */}
                    {allImages.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-stone-950/40 px-2 py-1 rounded-full backdrop-blur-3xs pointer-events-none select-none">
                            {allImages.map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-1 h-1 rounded-full transition-all duration-300 ${i === activeDotIdx
                                        ? 'bg-white scale-125'
                                        : 'bg-white/45'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Badges top-left overlay (including discount and Top Seller crown) */}
                {(discountLabel || (showBadge && item.badge) || isLarge) && (
                    <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 z-10 pointer-events-none select-none">
                        {discountLabel && (
                            <span className="w-fit bg-[#E61E25] text-white text-[10px] sm:text-[11px] font-bold uppercase px-2.5 py-1 rounded-full leading-none shadow-md">
                                {discountLabel}
                            </span>
                        )}
                        {isLarge && (   
                            <span className="w-fit bg-gradient-to-r from-amber-500 to-yellow-600 text-white border border-amber-400 px-2.5 py-1 rounded-full leading-none shadow-md flex items-center gap-1">
                                👑 <TextSp size="3xs" weight="black" uppercase tracking="wider" font={font}>TOP SELLER</TextSp>
                            </span>
                        )}
                        {showBadge && item.badge && (
                            <span
                                className="w-fit px-2.5 py-1 rounded-full leading-none shadow-sm"
                                style={{
                                    backgroundColor: item.badge.background_color || '#E61E25',
                                    color: item.badge.text_color || '#FFFFFF',
                                }}
                            >
                                <TextSp size="2xs" weight="black" uppercase tracking="wider" font={font}>
                                    {item.badge.name}
                                </TextSp>
                            </span>
                        )}
                    </div>
                )}

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-stone-950/20 backdrop-blur-3xs flex items-center justify-center select-none pointer-events-none z-10">
                        <TextSp
                            size="xs"
                            weight="black"
                            color="text-stone-900"
                            uppercase
                            tracking="widest"
                            className="bg-white/90 border border-stone-200 px-4 py-2 rounded-[2px] shadow-lg"
                            font={font}
                        >
                            Out Of Stock
                        </TextSp>
                    </div>
                )}

                {/* Hover Add to Bag Overlay */}
                {!isOutOfStock && addToCart && showAddToCart && (
                    <div className="absolute inset-x-3 bottom-3 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const defaultSize = item.sizes?.[0] || 'No size';
                                const defaultColor = item.colors?.[0] || 'No color';
                                addToCart(item, 1, defaultSize, defaultColor);
                                toast.success(`"${item.name}" added to bag!`);

                                // Trigger flying cart animation
                                const startX = e.clientX || e.currentTarget.getBoundingClientRect().left + 20;
                                const startY = e.clientY || e.currentTarget.getBoundingClientRect().top + 20;
                                window.dispatchEvent(new CustomEvent('animate_to_cart', { detail: { startX, startY } }));
                            }}
                            className="w-full py-2 bg-stone-950/90 hover:bg-[#E61E25] text-white text-[10px] font-black uppercase tracking-widest rounded-[2px] shadow-md transition-colors duration-300 cursor-pointer border-none flex items-center justify-center gap-1.5"
                        >
                            <FiShoppingBag className="w-3.5 h-3.5" />
                            <TextSp
                                size="xs"
                                weight="black"
                                uppercase
                                tracking="widest"
                                font={font}
                            >
                                Add to Bag
                            </TextSp>
                        </button>
                    </div>
                )}
            </div>

            {/* Product Metadata Info Area */}
            <div className={`space-y-1.5 pt-1 ${fontClass}`}>
                {/* Price block + Heart icon inline */}
                <div className="flex items-center justify-between">
                    <div className={`flex items-baseline space-x-1.5 text-left ${fontClass}`}>
                        <TextSp
                            size={isLarge ? 'lg' : 'xl'}
                            weight="bold"
                            color="text-[#E61E25]"
                            font={font}
                        >
                            {`$${itemPrice.toFixed(2)}`}
                        </TextSp>
                        {comparePrice && (
                            <TextSp
                                size={isLarge ? 'xs' : '2xs'}
                                weight="semibold"
                                color="text-stone-400"
                                className="line-through"
                                font={font}
                            >
                                {`$${comparePrice.toFixed(2)}`}
                            </TextSp>
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
                <TextSp
                    as="p"
                    size={isLarge ? { mobile: '8px', tablet: 'sm' } : { mobile: '14px', tablet: '2xs' }}
                    weight="black"
                    color="text-stone-900 group-hover:text-[#E61E25] pb-4"
                    font={'kontomruy'}
                    // uppercase
                    tracking="tight"
                    truncateCount={{
                        mobile: 15,
                        tablet: 16,
                        desktop: 22
                    }}
                    className="transition-colors leading-tight block text-left"
                >
                    {item.name}
                </TextSp>


                {/* Colors & Sizes preview */}
                {(colors.length > 0 || sizes.length > 0) && (
                    <div className="flex items-center justify-between pt-1 select-none">
                        {/* Colors swatches */}
                        {colors.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                {colors.slice(0, 4).map((col: string, cIdx: number) => (
                                    <span
                                        key={cIdx}
                                        className="w-3.5 h-3.5 rounded-[3px] border border-stone-250 shrink-0 shadow-3xs hover:scale-110 transition-transform duration-200"
                                        style={{ backgroundColor: resolveColorHex(item, col) }}
                                    />
                                ))}
                                {colors.length > 4 && (
                                    <span className="text-[8px] text-stone-400 font-extrabold leading-none">
                                        +{colors.length - 4}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Sizing Labels */}
                        {sizes.length > 0 && (
                            <div className="flex items-center gap-1">
                                {sizes.slice(0, 3).map((sz: string, szIdx: number) => (
                                    <span
                                        key={szIdx}
                                        className="text-[8px] font-black text-stone-400 bg-stone-50 border border-stone-200/50 px-1.5 py-0.5 rounded-[2px] uppercase leading-none"
                                    >
                                        {sz}
                                    </span>
                                ))}
                                {sizes.length > 3 && (
                                    <span className="text-[8px] text-stone-400 font-extrabold leading-none">
                                        +{sizes.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

