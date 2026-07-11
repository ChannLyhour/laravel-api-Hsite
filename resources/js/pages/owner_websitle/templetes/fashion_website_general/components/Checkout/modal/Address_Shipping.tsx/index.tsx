import React from 'react';
import type { ShippingAddress } from '@/api/owner/shippingAddresses';
import { CreateAddressModal } from './create';
import { EditAddressModal } from './edit';
import '@/pages/owner_websitle/templetes/fashion_website/styles/index.css';

export const CAMBODIA_CITIES = [
     'Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville',
     'Kampong Cham', 'Koh Kong', 'Kratie', 'Takéo', 'Kampot',
     'Pursat', 'Prey Veng', 'Svay Rieng', 'Kandal', 'Mondulkiri',
     'Ratanakiri', 'Stung Treng', 'Preah Vihear', 'Oddar Meanchey',
     'Pailin', 'Kep', 'Tbong Khmum', 'Banteay Meanchey',
     'Kampong Chhnang', 'Kampong Speu', 'Kampong Thom'
];

interface AddAddressModalProps {
     onClose: () => void;
     onSave: (addr: ShippingAddress) => void;
     isLoggedIn?: boolean;
     addressToEdit?: ShippingAddress | null;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
     onClose,
     onSave,
     isLoggedIn = false,
     addressToEdit = null,
}) => {
     if (addressToEdit) {
          return (
               <EditAddressModal
                    onClose={onClose}
                    onSave={onSave}
                    isLoggedIn={isLoggedIn}
                    addressToEdit={addressToEdit}
               />
          );
     }

     return (
          <CreateAddressModal
               onClose={onClose}
               onSave={onSave}
               isLoggedIn={isLoggedIn}
          />
     );
};
