import React, { useState } from 'react';
import { FiArrowLeft, FiShoppingBag, FiDollarSign, FiTag, FiClock, FiCheck, FiX, FiEdit2, FiSliders, FiPackage } from 'react-icons/fi';
import { resolveImageUrl } from '@/api/imageUtils';
import type { Category, MenuItem } from '@/api/owner/categories';
import '@/pages/owner_manage/style/font.css';

interface ShowPageProps {
    onClose: () => void;
    categories: Category[];
    item: MenuItem;
    onEdit: (item: MenuItem) => void;
    ownerId?: number | string;
    storeId?: number;
}

export const ShowPage: React.FC<ShowPageProps> = ({
    onClose,
    categories,
    item,
    onEdit,
    ownerId: _ownerId
}) => {
    const [activeTab, setActiveTab] = useState<'en' | 'km'>('en');
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

    const hasVariants = !!item.has_options;

    // Find Category Name (Full breadcrumb path: Root > Sub > Sub-Sub)
    const getCategoryPath = (catId: number, allCats: Category[]): string => {
        const path: string[] = [];
        let current = allCats.find(c => Number(c.id) === Number(catId));
        while (current) {
            path.unshift(current.name);
            if (!current.parent_id || current.parent_id === current.id) break;
            current = allCats.find(c => Number(c.id) === Number(current!.parent_id));
        }
        return path.join(' > ');
    };

    const categoryName = item.category_id
        ? getCategoryPath(item.category_id, categories) || 'Unknown Category'
        : 'Unknown Category';

    // Find Translations
    const transEn = item.translations?.find(t => t.locale === 'en');
    const transKh = item.translations?.find(t => t.locale === 'km');

    const nameEn = transEn?.name || item.name;
    const nameKh = transKh?.name || '';
    const descEn = transEn?.description || item.description || 'No description provided in English.';
    const descKh = transKh?.description || 'No description provided in Khmer.';

    const mainImageUrl = resolveImageUrl(item.image || item.display_image);

    // Total Stock across variants
    const totalStock = item.variants && item.variants.length > 0
        ? item.variants.reduce((sum, v) => sum + (v.stock_qty || 0), 0)
        : 0;

    // Attributes list preview
    const attributeValuesSet = new Set<string>();
    const attributeNames = new Set<string>();

    item.variants?.forEach(v => {
        v.attribute_values?.forEach((av: any) => {
            const attrName = av.attribute?.name || 'Option';
            const valText = av.value?.split('|')[0] || '';
            attributeNames.add(attrName);
            if (valText) {
                attributeValuesSet.add(`${attrName}: ${valText}`);
            }
        });
    });

    return (
        <div className="space-y-6 font-kuntomruy animate-fade-in w-full pb-10">

            {/* ── HEADER NAVIGATION row ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onClose}
                        className="p-2 border border-slate-200 rounded-[5px] hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-2xs"
                        title="Back to products list"
                    >
                        <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
                            <FiShoppingBag className="text-primary" />
                            <span>Product Details</span>
                        </h2>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                            Review recipe options, variants breakdown, pricing matrices, and localized descriptions.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onEdit(item)}
                        className="py-2 px-5 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-bold transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 flex items-center space-x-2 cursor-pointer border-none active:scale-95 duration-200"
                    >
                        <FiEdit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Edit Product</span>
                    </button>
                </div>
            </div>

            {/* ── TWO COLUMN MAIN LAYOUT ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">

                {/* Left Column (2/3 width) - Content Cards */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Card 1: Localized Content & Translations */}
                    <div className="bg-white border border-slate-100 rounded-[5px] p-6 sm:p-8 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                                Product Translations & Info
                            </h3>
                            <div className="flex bg-slate-50 p-1 rounded-[5px] border border-slate-200/50">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('en')}
                                    className={`px-3 py-1 text-center text-2xs font-extrabold rounded-[5px] transition-all cursor-pointer ${activeTab === 'en'
                                        ? 'bg-white text-slate-800 shadow-2xs border border-slate-200/50'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    🇬🇧 English (EN)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('km')}
                                    className={`px-3 py-1 text-center text-2xs font-extrabold rounded-[5px] transition-all cursor-pointer ${activeTab === 'km'
                                        ? 'bg-white text-slate-800 shadow-2xs border border-slate-200/50'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    🇰🇭 Khmer (KH)
                                </button>
                            </div>
                        </div>

                        {activeTab === 'en' ? (
                            <div className="space-y-4 animate-fade-in">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Product Title (EN)</span>
                                    <div className="text-base sm:text-lg font-black text-slate-900">{nameEn}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description / Recipe details (EN)</span>
                                    <div className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-4 border border-slate-100 rounded-[5px] whitespace-pre-line font-kuntomruy">
                                        {descEn}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Product Title (KH)</span>
                                    <div className="text-base sm:text-lg font-black text-slate-900">{nameKh || <span className="text-slate-300 italic font-semibold">Not Specified</span>}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description / Recipe details (KH)</span>
                                    <div className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-4 border border-slate-100 rounded-[5px] whitespace-pre-line font-kuntomruy">
                                        {descKh}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 2: Core Attributes & General Specs */}
                    <div className="bg-white border border-slate-100 rounded-[5px] p-6 sm:p-8 shadow-sm space-y-6">
                        <h3 className="font-extrabold text-slate-800 text-sm sm:text-base border-b border-slate-50 pb-2">
                            Specifications & Inventory Overview
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                            <div className="bg-slate-50/50 border border-slate-100 rounded-[5px] p-3.5 space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Category Tag</span>
                                <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate block" title={categoryName}>{categoryName}</span>
                            </div>
                            <div className="bg-slate-50/50 border border-slate-100 rounded-[5px] p-3.5 space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Base SKU</span>
                                <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate block">{item.sku || `PROD-${item.id}`}</span>
                            </div>
                            <div className="bg-slate-50/50 border border-slate-100 rounded-[5px] p-3.5 space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Barcode / EAN</span>
                                <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate block">{item.barcode || <span className="text-slate-300 font-semibold italic">None</span>}</span>
                            </div>
                            <div className="bg-slate-50/50 border border-slate-100 rounded-[5px] p-3.5 space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Stock Qty</span>
                                <span className={`text-xs sm:text-sm font-extrabold block ${totalStock > 20 ? 'text-emerald-600' : totalStock > 0 ? 'text-amber-500 font-black' : 'text-rose-500 font-black'}`}>
                                    {totalStock} items
                                </span>
                            </div>
                        </div>

                        {/* Selected Global Options Summary */}
                        {attributeValuesSet.size > 0 && (
                            <div className="pt-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Enabled Product Options ({attributeNames.size})</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {Array.from(attributeValuesSet).map((val, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2.5 py-1 bg-slate-100/80 text-slate-700 text-[11px] font-bold rounded-[5px] border border-slate-200/50 flex items-center space-x-1"
                                        >
                                            <FiSliders className="w-2.5 h-2.5 text-primary shrink-0" />
                                            <span>{val}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 3: Variants Breakdown List */}
                    <div className="bg-white border border-slate-100 rounded-[5px] p-6 sm:p-8 shadow-sm space-y-5">
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                                <FiSliders className="text-primary w-4 h-4" />
                                Active Options & Variants ({item.variants?.length || 0})
                            </h3>
                            <p className="text-slate-400 text-2xs font-semibold mt-0.5">Individual options with variant-specific retail parameters and active images.</p>
                        </div>

                        {item.variants && item.variants.length > 0 ? (
                            <div className="space-y-3.5">
                                {item.variants.map((v, index) => {
                                    const varImage = item.images?.find(img => img.product_variant_id === v.id);
                                    const imagePath = varImage?.image || '';

                                    // Parse specific options/attributes
                                    const variantOptions = v.attribute_values?.map((av: any) => {
                                        const cleanVal = av.value?.split('|')[0] || '';
                                        return { name: av.attribute?.name || 'Option', value: cleanVal };
                                    }) || [];

                                    return (
                                        <div
                                            key={v.id || index}
                                            className="border border-slate-100 hover:border-slate-200/80 rounded-[5px] bg-slate-50/20 p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                        >
                                            {/* Image + Title Options */}
                                            <div className="flex items-center gap-3">
                                                {hasVariants && (
                                                    <div className="w-11 h-11 rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200/40 shadow-3xs shrink-0">
                                                        <img
                                                            src={resolveImageUrl(imagePath)}
                                                            alt={v.variant_sku}
                                                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = mainImageUrl;
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                <div className="space-y-1">
                                                    <div className="font-extrabold text-slate-800 text-xs sm:text-sm">{v.variant_sku}</div>
                                                    {variantOptions.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {variantOptions.map((opt, oIdx) => (
                                                                <span
                                                                    key={oIdx}
                                                                    className="text-[9px] font-black bg-orange-50 text-primary border border-orange-100/50 px-2 py-0.5 rounded-[4px]"
                                                                >
                                                                    {opt.name}: {opt.value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-bold italic">Global Base Option</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Pricing + Stock info */}
                                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                                                <div className="text-left">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Purchase Price</span>
                                                    <span className="font-extrabold text-slate-700">${parseFloat(v.purchase_price || '0').toFixed(2)}</span>
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Retail Price</span>
                                                    <span className="font-black text-slate-900">${parseFloat(v.retail_price || '0').toFixed(2)}</span>
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Stock Quantity</span>
                                                    <span className={`inline-flex items-center gap-1 font-bold ${v.stock_qty > 15 ? 'text-emerald-600' : v.stock_qty > 0 ? 'text-amber-500 font-black' : 'text-rose-500 font-black'}`}>
                                                        <FiPackage className="w-3 h-3 shrink-0" />
                                                        {v.stock_qty} available
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 border border-dashed border-slate-200 rounded-[5px] text-center text-xs text-slate-400 font-bold italic bg-slate-50/20">
                                No custom options or variants drafted. Operating on a default Base Option matrix.
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column (1/3 width) - Media Presentation & Meta Details */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Card 4: Product Image Gallery Card */}
                    {!hasVariants && (
                        <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-sm space-y-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Dish Gallery Browser</span>

                            {/* Gallery computations */}
                            {(() => {
                                const rootImages = item.images ? item.images.filter(img => img.product_variant_id === null) : [];
                                const galleryList = rootImages.length > 0
                                    ? rootImages
                                    : [{ image: item.image || item.display_image || '', is_primary: true }];

                                const activeImg = galleryList[activeGalleryIndex] || galleryList[0];
                                const featuredUrl = resolveImageUrl(activeImg?.image);

                                return (
                                    <div className="space-y-3">
                                        {/* Large Featured Image */}
                                        <div className="relative aspect-square w-full rounded-[5px] overflow-hidden border border-slate-200 bg-slate-50/50 shadow-xs flex items-center justify-center group">
                                            <img
                                                src={featuredUrl}
                                                alt={nameEn}
                                                className="w-full h-full object-cover transition-all duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                                }}
                                            />

                                            {/* Primary Badge on Large Preview */}
                                            {activeImg?.is_primary && (
                                                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-orange-500 text-white rounded-[4px] text-[8px] font-black tracking-wider shadow-sm flex items-center gap-0.5 animate-pulse">
                                                    <span>★</span>
                                                    <span>MAIN PICTURE</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Multi-Thumbnail Selector Row */}
                                        {galleryList.length > 1 && (
                                            <div className="grid grid-cols-4 gap-2 pt-1">
                                                {galleryList.map((gImg, idx) => {
                                                    const thumbUrl = resolveImageUrl(gImg.image);
                                                    const isSelected = idx === activeGalleryIndex;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setActiveGalleryIndex(idx)}
                                                            className={`relative aspect-square rounded-[5px] overflow-hidden border transition-all cursor-pointer bg-slate-50 p-0 ${isSelected
                                                                ? 'border-orange-500 ring-2 ring-orange-500/20'
                                                                : 'border-slate-200 hover:border-orange-400'
                                                                }`}
                                                        >
                                                            <img
                                                                src={thumbUrl}
                                                                alt={`Thumbnail ${idx + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                                                }}
                                                            />
                                                            {gImg.is_primary && (
                                                                <span className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-orange-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold" title="Main Image">
                                                                    ★
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Availability status badge */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Availability Status</span>
                                {item.status === 'active' ? (
                                    <span className="py-1 px-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-[5px] text-[10px] font-extrabold flex items-center space-x-1">
                                        <FiCheck className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                                        <span>In Stock (Show)</span>
                                    </span>
                                ) : (
                                    <span className="py-1 px-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-[5px] text-[10px] font-extrabold flex items-center space-x-1">
                                        <FiX className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                                        <span>Sold Out (Hide)</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Card 5: Core Metadata & Quick Actions */}
                    <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Product Metadata</span>
                            {hasVariants && (
                                item.status === 'active' ? (
                                    <span className="py-1 px-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-[5px] text-[10px] font-extrabold flex items-center space-x-1 shadow-3xs">
                                        <FiCheck className="w-3 h-3 stroke-[3] shrink-0" />
                                        <span>In Stock</span>
                                    </span>
                                ) : (
                                    <span className="py-1 px-2.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-[5px] text-[10px] font-extrabold flex items-center space-x-1 shadow-3xs">
                                        <FiX className="w-3 h-3 stroke-[3] shrink-0" />
                                        <span>Sold Out</span>
                                    </span>
                                )
                            )}
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="flex items-center gap-1 font-bold">
                                    <FiTag className="w-3.5 h-3.5 text-slate-400" />
                                    Product ID
                                </span>
                                <span className="font-extrabold text-slate-800"># {item.id}</span>
                            </div>

                            {item.badge && (
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="flex items-center gap-1 font-bold">
                                        <FiTag className="w-3.5 h-3.5 text-slate-400" />
                                        Product Badge
                                    </span>
                                    <span 
                                        className="px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold shadow-sm"
                                        style={{ backgroundColor: item.badge.background_color, color: item.badge.text_color }}
                                    >
                                        {item.badge.name}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-slate-500">
                                <span className="flex items-center gap-1 font-bold">
                                    <FiDollarSign className="w-3.5 h-3.5 text-slate-400" />
                                    Base Retail Price
                                </span>
                                <span className="font-black text-slate-900">${parseFloat(item.price || '0').toFixed(2)}</span>
                            </div>

                            <div className="flex items-center justify-between text-slate-500">
                                <span className="flex items-center gap-1 font-bold">
                                    <FiClock className="w-3.5 h-3.5 text-slate-400" />
                                    Created Timestamp
                                </span>
                                <span className="font-bold text-slate-800">
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Unknown'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 space-y-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-xs font-bold transition-all border border-slate-200/50 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                            >
                                <FiArrowLeft className="w-3.5 h-3.5" />
                                <span>Return to Products List</span>
                            </button>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
};

