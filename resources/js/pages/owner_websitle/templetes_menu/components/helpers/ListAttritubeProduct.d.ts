import React from 'react';

export interface ListAttritubeProductProps {
    productOptions?: Record<string, string[]>;
    selectedOptions: Record<string, string>;
    setSelectedOptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    themeStyles: any;
    themeType: string;
    product: any;
    selectedAddons?: Record<number | string, boolean>;
    setSelectedAddons: React.Dispatch<React.SetStateAction<Record<number | string, boolean>>>;
}

export const ListAttritubeProduct: React.FC<ListAttritubeProductProps>;
