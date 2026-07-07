import React from 'react';
import { ElectronicsGadgetCard } from '../Electronics_Gadget_Card';
import { BeautyCosmeticsCard } from '../Beauty_Cosmetics_card';
import { CoffeeBakeriesCard } from '../Coffee_Bakeries_Card';
import { SupermarketsCardGrocery } from '../SupermarketsCard_Grocery';

/**
 * Returns the appropriate product card component tailored for the specified store type.
 *
 * @param storeType - The identifier of the type of store (e.g. 'restaurant', 'electronics', 'fashion')
 * @returns A React functional component for rendering the product card.
 */
export const getProductCardByStoreType = (storeType: string): React.FC<any> => {
  const normalizedType = String(storeType).toLowerCase().trim();

  switch (normalizedType) {
    case 'electronics':
      return ElectronicsGadgetCard;
    case 'beauty':
    case 'fashion':
    case 'gifts':
    case 'handmade':
      return BeautyCosmeticsCard;
    case 'cafe':
    case 'restaurant':
    case 'bakery':
    case 'fast_food':
    case 'bar':
      return CoffeeBakeriesCard;
    case 'supermarket':
    case 'minimart':
    case 'digital':
    case 'service_other':
    default:
      return SupermarketsCardGrocery;
  }
};

export { ElectronicsGadgetCard } from '../Electronics_Gadget_Card';
export { BeautyCosmeticsCard } from '../Beauty_Cosmetics_card';
export { CoffeeBakeriesCard } from '../Coffee_Bakeries_Card';
export { SupermarketsCardGrocery } from '../SupermarketsCard_Grocery';
