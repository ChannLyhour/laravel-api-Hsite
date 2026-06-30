import React, { useState, useMemo } from 'react';
import { FiTrash2, FiEdit2, FiChevronDown, FiCheck, FiHeart } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import type { Root2 } from '@/api/owner/categories';
import type { StoreRow } from '@/api/owner/stores';
import { resolveImageUrl } from '../utils/imageUtils';
import { FASHION_ROUTES } from '../routes';
import {
    getProductColors,
    getProductSizes,
    mapToUIItem,
} from '../utils/priceUtils';
import '../styles/animation.css';

export interface ListProductLikeProps {
    items: Root2[];
    favorites: Record<string, boolean>;
    toggleFavorite: (id: string, name: string) => void;
    addToCart: (item: Root2, qty: number, size?: string, color?: string) => void;
    onNavigate?: (to: string) => void;
    storeName?: string;
    stores?: StoreRow;
    ownerUserId?: number | string;
}

interface LikedProductRowProps {
    item: Root2;
    stores?: StoreRow;
    storeName: string;
    toggleFavorite: (id: string, name: string) => void;
    addToCart: (item: Root2, qty: number, size?: string, color?: string) => void;
    onNavigate?: (to: string) => void;
    ownerUserId?: number | string;
    isEditMode: boolean;
    isSelected: boolean;
    onSelectToggle: () => void;
}

const LikedProductRow: React.FC<LikedProductRowProps> = ({
    item,
    stores,
    storeName,
    toggleFavorite,
    addToCart,
    onNavigate,
    ownerUserId,
    isEditMode,
    isSelected,
    onSelectToggle,
}) => {
    // Parse colors & sizes using price utilities
    const uiItem = useMemo(() => mapToUIItem(item), [item]);
    const rawColors = useMemo(() => getProductColors(item), [item]);
    const colors = rawColors.length > 0 ? rawColors : uiItem.colors || [];

    const rawSizes = useMemo(() => getProductSizes(item), [item]);
    const sizes = rawSizes.length > 0 ? rawSizes : uiItem.sizes || [];

    const [selectedColor, setSelectedColor] = useState(() => colors[0] || '');
    const [selectedSize, setSelectedSize] = useState(() => sizes[0] || '');

    // Prices computation
    const itemPrice = parseFloat(uiItem.price) || 0;
    const comparePrice = uiItem.compare_at_price ? parseFloat(uiItem.compare_at_price) : null;
    const discountLabel = uiItem.discount ? uiItem.discount.replace('-', '') : null;

    const handleRowClick = () => {
        if (isEditMode) {
            onSelectToggle();
            return;
        }
        if (onNavigate) {
            const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
            onNavigate(FASHION_ROUTES.getProduct(item.id, ownerUserId, storeSlug));
        }
    };

    const handleMoveToBag = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(item, 1, selectedSize, selectedColor);
        toggleFavorite(String(item.id), item.name);
        toast.success(`"${item.name}" moved to bag!`);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(String(item.id), item.name);
        toast.success(`Removed "${item.name}" from wishlist.`);
    };

    return (
        <div className="bg-white p-4 sm:p-5 rounded-[4px] border border-stone-200/60 shadow-3xs hover:shadow-xs transition-shadow duration-300 relative text-left">
            <div className="flex gap-4 sm:gap-6 items-start">
                {/* Bulk edit selection checkbox/circle */}
                {isEditMode && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onSelectToggle(); }}
                        className={`mt-12 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300 hover:border-stone-400 bg-white'
                            }`}
                    >
                        {isSelected && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                )}

                {/* Product Image Area */}
                <div
                    onClick={handleRowClick}
                    className="relative w-24 h-32 sm:w-28 sm:h-38 bg-stone-50 border border-stone-150 rounded-[2px] overflow-hidden flex shrink-0 cursor-pointer group"
                >
                    <div className="flex-1 h-full overflow-hidden">
                        <img
                            src={resolveImageUrl(uiItem.display_image || uiItem.image)}
                            alt={uiItem.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                    {/* Vertical brand text rotated 90 deg along the right edge */}
                    <div className="w-6 h-full flex items-center justify-center bg-white border-l border-stone-150 select-none">
                        <span
                            className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 whitespace-nowrap"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                            {stores?.store_name || storeName || 'AURA'}
                        </span>
                    </div>
                </div>

                {/* Details Area */}
                <div className="flex-1 flex flex-col justify-between min-h-[128px] sm:min-h-[152px]">
                    <div>
                        {/* Price Line: Red Price | Discount % | Original Compare Price */}
                        <div className="flex items-baseline gap-2 flex-wrap font-mono">
                            <span className="text-[#E61E25] text-xs sm:text-sm font-black">
                                US ${itemPrice.toFixed(2)}
                            </span>
                            {discountLabel && (
                                <span className="text-stone-400 text-[10px] font-bold">
                                    {discountLabel}
                                </span>
                            )}
                            {comparePrice && (
                                <span className="text-stone-400 text-[10px] line-through font-semibold">
                                    US ${comparePrice.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* Product Title */}
                        <h3
                            onClick={handleRowClick}
                            className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide mt-1.5 hover:text-[#E61E25] transition-colors cursor-pointer"
                        >
                            {uiItem.name}
                        </h3>

                        {/* Product Code */}
                        <p className="text-[10px] text-stone-400 font-bold tracking-wide mt-0.5">
                            Code. {uiItem.code || uiItem.id}
                        </p>
                    </div>

                    {/* Color & Size Dropdown Selectors */}
                    <div className="flex gap-3 mt-3 max-w-[280px]">
                        {/* Color select dropdown */}
                        <div className="flex flex-col gap-1.5 flex-1 relative">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest block text-left">
                                Color
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedColor}
                                    onChange={(e) => setSelectedColor(e.target.value)}
                                    className="w-full appearance-none pl-3 pr-7 py-1.5 border border-stone-200 rounded-[2px] text-[10px] font-black uppercase tracking-wider text-stone-750 focus:outline-none focus:border-stone-900 bg-white cursor-pointer transition-colors"
                                >
                                    {colors.length > 0 ? (
                                        colors.map((c: string) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No color</option>
                                    )}
                                </select>
                                <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* Size select dropdown */}
                        <div className="flex flex-col gap-1.5 flex-1 relative">
                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest block text-left">
                                Size
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                    className="w-full appearance-none pl-3 pr-7 py-1.5 border border-stone-200 rounded-[2px] text-[10px] font-black uppercase tracking-wider text-stone-750 focus:outline-none focus:border-stone-900 bg-white cursor-pointer transition-colors"
                                >
                                    {sizes.length > 0 ? (
                                        sizes.map((s: string) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No size</option>
                                    )}
                                </select>
                                <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trash Can Remove button */}
                <button
                    onClick={handleRemove}
                    className="p-1.5 text-stone-400 hover:text-red-500 transition-colors focus:outline-none bg-transparent border-none cursor-pointer"
                    title="Remove from Wishlist"
                >
                    <FiTrash2 className="w-4.5 h-4.5 stroke-[2]" />
                </button>
            </div>

            {/* Move to bag CTA button (full width) */}
            <button
                onClick={handleMoveToBag}
                className="w-full mt-4 py-2.5 bg-white border border-stone-900 hover:bg-stone-900 hover:text-white text-stone-900 font-bold text-xs uppercase tracking-widest transition-colors rounded-[2px] cursor-pointer"
            >
                Move to bag
            </button>
        </div>
    );
};

export const ListProductLike: React.FC<ListProductLikeProps> = ({
    items,
    favorites,
    toggleFavorite,
    addToCart,
    onNavigate,
    storeName = '',
    stores,
    ownerUserId,
}) => {
    // Sort and Edit States
    const [sortBy, setSortBy] = useState<'recently' | 'oldest' | 'low-stock'>('recently');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});

    // Filter products by whether they exist in favorites list
    const likedProducts = useMemo(() => {
        return items.filter((item) => !!favorites[String(item.id)]);
    }, [items, favorites]);

    // Mock stock quantities generator based on item ID for low-stock sorting
    const getProductStock = (id: number) => {
        return ((id * 13) % 9) + 1; // Generates stock from 1 to 9
    };

    // Sort products list
    const sortedProducts = useMemo(() => {
        const list = [...likedProducts];
        if (sortBy === 'recently') {
            list.sort((a, b) => b.id - a.id); // Assuming higher ID is newer
        } else if (sortBy === 'oldest') {
            list.sort((a, b) => a.id - b.id);
        } else if (sortBy === 'low-stock') {
            list.sort((a, b) => getProductStock(a.id) - getProductStock(b.id));
        }
        return list;
    }, [likedProducts, sortBy]);

    // Bulk edit callbacks
    const handleSelectToggle = (id: number) => {
        setSelectedItemIds((prev) => ({
            ...prev,
            [String(id)]: !prev[String(id)],
        }));
    };

    const handleBulkDelete = () => {
        const idsToDelete = Object.entries(selectedItemIds)
            .filter(([_, checked]) => checked)
            .map(([id]) => id);

        if (idsToDelete.length === 0) {
            toast.error('No items selected.');
            return;
        }

        idsToDelete.forEach((id) => {
            const prod = items.find((item) => String(item.id) === id);
            toggleFavorite(id, prod?.name || 'Item');
        });

        setSelectedItemIds({});
        toast.success(`Removed ${idsToDelete.length} items from wishlist.`);
    };

    const handleSelectAll = () => {
        const allSelected = sortedProducts.every((p) => selectedItemIds[String(p.id)]);
        const updated: Record<string, boolean> = {};
        if (!allSelected) {
            sortedProducts.forEach((p) => {
                updated[String(p.id)] = true;
            });
        }
        setSelectedItemIds(updated);
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'recently':
                return 'Recently added';
            case 'oldest':
                return 'Long-standing';
            case 'low-stock':
                return 'Low stock first';
            default:
                return 'Recently added';
        }
    };

    return (
        <div className="bg-[#F9F9F9] min-h-screen pb-24 font-sans animate-fade-in text-stone-900">
            <div className="max-w-4xl mx-auto px-4 pt-10">

                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-6 relative">
                    {/* Wish List Count Title */}
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-sm sm:text-base font-black uppercase tracking-widest text-stone-900">
                            Wish List
                        </h1>
                        <span className="text-xs font-semibold text-stone-400">
                            ({likedProducts.length} {likedProducts.length === 1 ? 'item' : 'items'})
                        </span>
                    </div>

                    {/* Right: Pencil Edit + Sort Dropdown */}
                    <div className="flex items-center gap-4">
                        {/* Bulk Deletion Trigger (visible in edit mode) */}
                        {isEditMode && likedProducts.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[10px] uppercase tracking-wider transition-colors rounded-[2px] border-none cursor-pointer"
                                >
                                    {sortedProducts.every((p) => selectedItemIds[String(p.id)]) ? 'Deselect All' : 'Select All'}
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] uppercase tracking-wider transition-colors rounded-[2px] border-none cursor-pointer"
                                >
                                    Delete Selected
                                </button>
                            </div>
                        )}

                        {/* Pencil edit toggle icon */}
                        <button
                            onClick={() => {
                                setIsEditMode(!isEditMode);
                                setSelectedItemIds({});
                            }}
                            className={`p-1.5 rounded-full hover:bg-stone-150 transition-colors focus:outline-none border-none bg-transparent cursor-pointer flex items-center justify-center ${isEditMode ? 'text-[#E61E25] bg-stone-100' : 'text-stone-600 hover:text-stone-900'
                                }`}
                            title={isEditMode ? 'Done Editing' : 'Edit Wishlist'}
                        >
                            <FiEdit2 className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* Sorting custom dropdown select container */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center justify-between gap-1.5 px-3 py-1.5 border border-stone-300 text-[10px] font-black uppercase tracking-wider text-stone-800 bg-white focus:outline-none rounded-[2px] transition-colors cursor-pointer min-w-[130px] hover:border-stone-900"
                            >
                                <span>{getSortLabel()}</span>
                                <FiChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Floating dropdown menu items */}
                            {dropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40 bg-transparent"
                                        onClick={() => setDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-stone-200 rounded-[3px] shadow-lg z-50 py-1 divide-y divide-stone-50 overflow-hidden animate-fade-in">
                                        <button
                                            onClick={() => {
                                                setSortBy('recently');
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors border-none cursor-pointer ${sortBy === 'recently' ? 'bg-stone-50 text-stone-950 font-extrabold' : 'bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                                                }`}
                                        >
                                            Recently added
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('oldest');
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors border-none cursor-pointer ${sortBy === 'oldest' ? 'bg-stone-50 text-stone-950 font-extrabold' : 'bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                                                }`}
                                        >
                                            Long-standing
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('low-stock');
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors border-none cursor-pointer ${sortBy === 'low-stock' ? 'bg-stone-50 text-stone-950 font-extrabold' : 'bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                                                }`}
                                        >
                                            Low stock first
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid/List of Liked items */}
                {likedProducts.length === 0 ? (
                    <div className="py-24 text-center space-y-4 bg-white border border-stone-200/50 rounded-[4px] shadow-3xs">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-400">
                            <FiHeart className="w-8 h-8 stroke-[1.5]" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-stone-800 text-sm uppercase tracking-wider">
                                Your Wish List is Empty
                            </h3>
                            <p className="text-stone-400 text-2xs font-semibold mt-1">
                                Save items you like here to purchase them later.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if (onNavigate) {
                                    const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
                                    onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
                                }
                            }}
                            className="px-5 py-3 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-black uppercase tracking-widest transition-colors rounded-[2px] border-none cursor-pointer"
                        >
                            Discover runway
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        {sortedProducts.map((item) => (
                            <LikedProductRow
                                key={item.id}
                                item={item}
                                stores={stores}
                                storeName={storeName}
                                toggleFavorite={toggleFavorite}
                                addToCart={addToCart}
                                onNavigate={onNavigate}
                                ownerUserId={ownerUserId}
                                isEditMode={isEditMode}
                                isSelected={!!selectedItemIds[String(item.id)]}
                                onSelectToggle={() => handleSelectToggle(item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

