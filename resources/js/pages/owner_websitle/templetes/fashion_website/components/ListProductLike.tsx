import React, { useState, useMemo } from 'react';
import { FiTrash2, FiEdit2, FiChevronDown, FiCheck, FiHeart, FiShoppingBag } from 'react-icons/fi';
import { toast } from '../utils/toast';
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
        addToCart(item, 1, selectedSize || 'No size', selectedColor || 'No color');
        toggleFavorite(String(item.id), item.name);
        toast.success(`"${item.name}" moved to bag!`);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(String(item.id), item.name);
        toast.success(`Removed "${item.name}" from wishlist.`);
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300 relative flex flex-col justify-between text-left">
            <div>
                {/* Trash Can Remove button */}
                <button
                    onClick={handleRemove}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-[#E61E25] hover:bg-red-50/50 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer flex items-center justify-center z-10"
                    title="Remove from Wishlist"
                >
                    <FiTrash2 className="w-4 h-4 stroke-[2]" />
                </button>

                <div className="flex gap-4 items-start">
                    {/* Bulk edit selection checkbox/circle */}
                    {isEditMode && (
                        <div
                            onClick={(e) => { e.stopPropagation(); onSelectToggle(); }}
                            className={`mt-14 shrink-0 w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                isSelected 
                                    ? 'bg-stone-900 border-stone-900 text-white scale-105' 
                                    : 'border-stone-300 hover:border-stone-450 bg-white hover:scale-102'
                            }`}
                        >
                            {isSelected && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                    )}

                    {/* Product Image Area */}
                    <div
                        onClick={handleRowClick}
                        className="relative w-28 h-36 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shrink-0 cursor-pointer group shadow-2xs"
                    >
                        <img
                            src={resolveImageUrl(uiItem.display_image || uiItem.image)}
                            alt={uiItem.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>

                    {/* Details Area */}
                    <div className="flex-1 min-w-0 pr-6">
                        {/* Brand Label */}
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#E61E25] block">
                            {stores?.store_name || storeName || 'AURA'}
                        </span>

                        {/* Product Title */}
                        <h3
                            onClick={handleRowClick}
                            className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight mt-1 hover:text-[#E61E25] transition-colors cursor-pointer line-clamp-2"
                        >
                            {uiItem.name}
                        </h3>

                        {/* Price Line: Red Price | Discount % | Original Compare Price */}
                        <div className="flex items-baseline gap-2 flex-wrap font-mono mt-2">
                            <span className="text-[#E61E25] text-xs sm:text-sm font-black">
                                US ${itemPrice.toFixed(2)}
                            </span>
                            {discountLabel && (
                                <span className="text-emerald-600 text-[10px] font-black bg-emerald-50 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wide">
                                    {discountLabel} OFF
                                </span>
                            )}
                            {comparePrice && (
                                <span className="text-stone-400 text-[10px] line-through font-semibold">
                                    US ${comparePrice.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Color Swatches */}
                {colors.length > 0 && (
                    <div className="flex flex-col gap-1 mt-4">
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest block text-left">
                            Color: <span className="text-stone-800 font-black">{selectedColor}</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {colors.map((c: string) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSelectedColor(c)}
                                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border transition-all cursor-pointer ${
                                        selectedColor === c
                                            ? 'bg-stone-950 text-white border-stone-950 shadow-2xs'
                                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-55'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Size Swatches */}
                {sizes.length > 0 && (
                    <div className="flex flex-col gap-1 mt-4">
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest block text-left">
                            Size: <span className="text-stone-800 font-black">{selectedSize}</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {sizes.map((s: string) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSelectedSize(s)}
                                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border transition-all cursor-pointer ${
                                        selectedSize === s
                                            ? 'bg-stone-950 text-white border-stone-950 shadow-2xs'
                                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-55'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Move to bag CTA button (full width) */}
            <button
                onClick={handleMoveToBag}
                className="w-full mt-6 py-3 bg-stone-950 hover:bg-stone-850 text-white font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs active:scale-98"
            >
                <FiShoppingBag className="w-4 h-4" />
                <span>Move to bag</span>
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
        <div className="bg-[#FAFBFD] min-h-screen pb-24 font-sans animate-fade-in text-stone-900">
            <div className="max-w-5xl mx-auto px-4 pt-12">

                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-6 mb-8 relative">
                    {/* Wish List Count Title */}
                    <div>
                        <div className="flex items-center gap-2">
                            <FiHeart className="w-5 h-5 text-[#E61E25] fill-[#E61E25]" />
                            <h1 className="text-base sm:text-lg font-black uppercase tracking-widest text-stone-900">
                                My Wishlist
                            </h1>
                        </div>
                        <p className="text-2xs font-extrabold text-stone-400 uppercase tracking-widest mt-1.5 block text-left">
                            {likedProducts.length} {likedProducts.length === 1 ? 'item' : 'items'} saved
                        </p>
                    </div>

                    {/* Right: Pencil Edit + Sort Dropdown */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                        {/* Bulk Deletion Trigger (visible in edit mode) */}
                        {isEditMode && likedProducts.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-[10px] uppercase tracking-widest transition-colors rounded-full border-none cursor-pointer"
                                >
                                    {sortedProducts.every((p) => selectedItemIds[String(p.id)]) ? 'Deselect All' : 'Select All'}
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-655 font-extrabold text-[10px] uppercase tracking-widest transition-colors rounded-full border-none cursor-pointer"
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
                            className={`p-2.5 rounded-full hover:bg-stone-100 transition-all focus:outline-none border-none bg-transparent cursor-pointer flex items-center justify-center shadow-2xs ${
                                isEditMode 
                                    ? 'text-[#E61E25] bg-red-50/50 border border-red-200' 
                                    : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
                            }`}
                            title={isEditMode ? 'Done Editing' : 'Edit Wishlist'}
                        >
                            <FiEdit2 className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* Sorting custom dropdown select container */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center justify-between gap-2 px-4 py-2 border border-stone-200 text-2xs font-extrabold uppercase tracking-wider text-stone-800 bg-white focus:outline-none rounded-full transition-all cursor-pointer min-w-[150px] hover:border-stone-900 shadow-2xs"
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
                                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-stone-100 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden animate-fade-in-down">
                                        <button
                                            onClick={() => {
                                                setSortBy('recently');
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors border-none cursor-pointer ${
                                                sortBy === 'recently' 
                                                    ? 'bg-stone-55 text-stone-955 font-extrabold' 
                                                    : 'bg-white text-stone-500 hover:bg-stone-55 hover:text-stone-900'
                                            }`}
                                        >
                                            Recently added
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('oldest');
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors border-none cursor-pointer ${
                                                sortBy === 'oldest' 
                                                    ? 'bg-stone-55 text-stone-955 font-extrabold' 
                                                    : 'bg-white text-stone-500 hover:bg-stone-55 hover:text-stone-955'
                                            }`}
                                        >
                                            Long-standing
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('low-stock');
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors border-none cursor-pointer ${
                                                sortBy === 'low-stock' 
                                                    ? 'bg-stone-55 text-stone-955 font-extrabold' 
                                                    : 'bg-white text-stone-500 hover:bg-stone-55 hover:text-stone-955'
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
                    <div className="py-24 text-center space-y-5 bg-white border border-slate-100 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-[#E61E25]">
                            <FiHeart className="w-7 h-7 stroke-[2] fill-red-100" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-stone-850 text-base uppercase tracking-wider">
                                Your Wish List is Empty
                            </h3>
                            <p className="text-stone-400 text-2xs font-extrabold uppercase tracking-widest">
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
                            className="px-6 py-3.5 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-black uppercase tracking-widest transition-all rounded-full border-none cursor-pointer shadow-sm hover:shadow-md active:scale-98"
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
