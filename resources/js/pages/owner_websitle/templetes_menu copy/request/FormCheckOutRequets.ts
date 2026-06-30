export interface CheckoutValidationInput {
    hasSelectedAddress: boolean;
    preferredContact: string;
    contactInput: string;
    selectedPayment: string;
    isGuestCheckoutEnabled: boolean;
    checkoutDeliveryAddress?: 'open' | 'close' | 'null';
    checkoutPreferredContact?: 'open' | 'close' | 'null';
    checkoutNote?: 'open' | 'close' | 'null';
    checkoutClaimCode?: 'open' | 'close' | 'null';
}

export interface CheckoutValidationError {
    field: 'address' | 'preferredContact' | 'contactInput' | 'payment';
    message: string;
}

/**
 * Validates the checkout form inputs.
 * Returns an error object if validation fails, or null if validation passes.
 */
export function validateCheckoutForm(input: CheckoutValidationInput): CheckoutValidationError | null {
    // 1. Validate Delivery Address
    const checkoutDeliveryAddress = input.checkoutDeliveryAddress || 'open';
    if (checkoutDeliveryAddress === 'open') {
        if (!input.hasSelectedAddress) {
            return {
                field: 'address',
                message: 'Please select or add a delivery address.'
            };
        }
    }

    // 2. Validate Preferred Contact Method
    const checkoutPreferredContact = input.checkoutPreferredContact || 'open';
    if (checkoutPreferredContact === 'open') {
        if (!input.preferredContact) {
            return {
                field: 'preferredContact',
                message: 'Please select your preferred contact line (Phone call, Telegram, or WhatsApp).'
            };
        }
        if (!input.contactInput || !input.contactInput.trim()) {
            return {
                field: 'contactInput',
                message: 'Please enter your contact information.'
            };
        }
    }

    // Validate telephone number format if 'phone' is selected and not empty
    if (input.preferredContact === 'phone' && input.contactInput && input.contactInput.trim()) {
        const phoneRegex = /^[+]*[0-9\s\-()]{6,20}$/;
        if (!phoneRegex.test(input.contactInput.trim())) {
            return {
                field: 'contactInput',
                message: 'Please enter a valid telephone number.'
            };
        }
    }

    // 4. Validate Payment Method selection
    if (!input.selectedPayment) {
        return {
            field: 'payment',
            message: 'Please select a payment method.'
        };
    }

    return null;
}
