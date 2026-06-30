import React from 'react';
import { parseAttributeValue } from '../../utils/priceUtils';

const nameToHexMap = {
    'red': '#dc2626',
    'black': '#171717',
    'blue': '#2563eb',
    'green': '#16a34a',
    'purple': '#9333ea',
    'violet': '#7c3aed',
    'indigo': '#4f46e5',
    'white': '#ffffff',
    'yellow': '#ca8a04',
    'pink': '#db2777',
    'gray': '#4b5563',
    'grey': '#4b5563',
    'orange': '#ea580c',
    'brown': '#78350f',
    'gold': '#d97706',
    'silver': '#d1d5db',
    'titanium gray': '#a1a1aa',
    'midnight black': '#18181b',
    'cream': '#fffdd0',
    'bronze': '#cd7f32',
    'charcoal': '#36454f',
    'navy': '#000080',
    'teal': '#008080',
    'olive': '#808000',
    'rose': '#f43f5e',
    'peach': '#ffcba4',
};

export const ListAttritubeProduct = ({
    productOptions,
    selectedOptions,
    setSelectedOptions,
    themeStyles,
    themeType,
    product,
    selectedAddons = {},
    setSelectedAddons
}) => {
    if (!productOptions || Object.keys(productOptions).length === 0) {
        if (!product?.addons || product.addons.length === 0) {
            return null;
        }
    }

    const resolveValueColor = (attrName, val) => {
        const nameLower = attrName.toLowerCase();
        const isColorAttr = nameLower === 'color' || nameLower === 'colour' || nameLower === 'shade' || nameLower === 'tone';
        const parsed = parseAttributeValue(val, isColorAttr);
        if (parsed.isColor) {
            if (parsed.colorHex) {
                return parsed.colorHex;
            }
            const nameKey = parsed.colorName.toLowerCase().trim();
            if (nameToHexMap[nameKey]) {
                return nameToHexMap[nameKey];
            }
            return nameKey;
        }
        return null;
    };

    const getDisplayValue = (attrName, val) => {
        const nameLower = attrName.toLowerCase();
        const isColorAttr = nameLower === 'color' || nameLower === 'colour' || nameLower === 'shade' || nameLower === 'tone';
        const parsed = parseAttributeValue(val, isColorAttr);
        return parsed.value || val;
    };

    return (
        <>
            {productOptions && Object.entries(productOptions).map(([attrName, values], index) => {
                if (!values || values.length === 0) return null;

                return (
                    <div key={attrName} className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-3 text-left">
                        <div className="flex justify-between items-left">
                            <h3 className="font-extrabold text-stone-800 text-xs uppercase tracking-wider">
                                {attrName}
                            </h3>
                            {index === 0 && (
                                <span className={`text-[13px] font-black  ${themeStyles.badge} px-2.5 py-0.5 rounded-[5px]`}>
                                    Required
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {values.map((val) => {
                                const isSelected = selectedOptions[attrName] === val;
                                const colorHex = resolveValueColor(attrName, val);
                                const displayName = getDisplayValue(attrName, val);

                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => {
                                            setSelectedOptions(prev => ({
                                                ...prev,
                                                [attrName]: val
                                            }));
                                        }}
                                        className={`flex items-center gap-3 py-2.5 px-4 text-left text-xs font-bold rounded-[5px] transition-all border cursor-pointer ${
                                            isSelected
                                                ? themeStyles.checkboxActive || 'bg-stone-100 text-stone-900 border-stone-400 shadow-sm'
                                                : 'bg-[#FCFAF7] hover:bg-stone-50 text-stone-700 border-stone-200'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                            isSelected 
                                                ? 'border-current' 
                                                : 'border-stone-300'
                                        }`}>
                                            {isSelected && (
                                                <div className="w-2 h-2 rounded-full bg-current" />
                                            )}
                                        </div>

                                        {colorHex && (
                                            <span
                                                className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                                                style={{ backgroundColor: colorHex }}
                                            />
                                        )}
                                        <span className="truncate">{displayName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Addons List */}
            {product?.addons && product.addons.length > 0 && (
                <div className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-3 text-left">
                    <div className="flex justify-between items-left">
                        <h3 className="font-extrabold text-stone-800 text-xs uppercase tracking-wider">
                            Product Addons
                        </h3>
                        <span className="text-[11px] text-stone-400 font-medium">
                            Optional (Select multiple)
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {product.addons.map((addon) => {
                            const isSelected = !!selectedAddons[addon.id];
                            return (
                                <button
                                    key={addon.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedAddons(prev => ({
                                            ...prev,
                                            [addon.id]: !prev[addon.id]
                                        }));
                                    }}
                                    className={`flex items-center justify-between py-2.5 px-4 text-left text-xs font-bold rounded-[5px] transition-all border cursor-pointer ${
                                        isSelected
                                            ? themeStyles.checkboxActive || 'bg-stone-100 text-stone-900 border-stone-400 shadow-sm'
                                            : 'bg-[#FCFAF7] hover:bg-stone-50 text-stone-700 border-stone-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 ${
                                            isSelected 
                                                ? 'bg-current border-current' 
                                                : 'border-stone-300 bg-white'
                                        }`}>
                                            {isSelected && (
                                                <svg className="w-2.5 h-2.5 stroke-[3] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="truncate">{addon.addon_name}</span>
                                    </div>
                                    <span className="shrink-0 font-mono text-stone-500">
                                        +${parseFloat(addon.additional_price).toFixed(2)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};
