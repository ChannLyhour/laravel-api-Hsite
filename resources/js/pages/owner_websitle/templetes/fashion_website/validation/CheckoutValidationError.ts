export type ValidationErrorField = 'address' | 'preferredContact' | 'contactInput' | 'payment' | 'deliveryMethod' | 'customCustomerName' | 'customCustomerPhone' | 'customCustomerAddress';

export interface CheckoutValidationError {
    field: ValidationErrorField;
    message: string;
}

export interface CheckoutValidationInput {
    hasSelectedAddress: boolean;
    preferredContact: string;
    contactInput: string;
    selectedPayment: string;
    isGuestCheckoutEnabled: boolean;
    // New fields
    hasSelectedDeliveryMethod: boolean;
    checkoutDeliveryAddress?: 'open' | 'close' | 'null';
    checkoutPreferredContact?: 'open' | 'close' | 'null';
    customCustomerName?: string;
    customCustomerPhone?: string;
    customCustomerAddress?: string;
}

export function validateCheckoutForm(
    input: CheckoutValidationInput
): CheckoutValidationError | null {
    // 1. Validate Delivery Address / Customer Information
    if (input.checkoutDeliveryAddress === 'close') {
        if (!input.customCustomerName || !input.customCustomerName.trim()) {
            return {
                field: 'customCustomerName',
                message: 'Please enter your name.'
            };
        }
        if (!input.customCustomerPhone || !input.customCustomerPhone.trim()) {
            return {
                field: 'customCustomerPhone',
                message: 'Please enter your phone number or email address.'
            };
        }
        const trimmed = input.customCustomerPhone.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[+]*[0-9\s\-()]{6,20}$/;
        const isEmail = trimmed.includes('@');
        
        if (isEmail) {
            if (!emailRegex.test(trimmed)) {
                return {
                    field: 'customCustomerPhone',
                    message: 'Please enter a valid email address.'
                };
            }
        } else {
            if (!phoneRegex.test(trimmed)) {
                return {
                    field: 'customCustomerPhone',
                    message: 'Please enter a valid phone number.'
                };
            }
        }
        if (!input.customCustomerAddress || !input.customCustomerAddress.trim()) {
            return {
                field: 'customCustomerAddress',
                message: 'Please enter your delivery address.'
            };
        }
    } else {
        if (!input.hasSelectedAddress) {
            return {
                field: 'address',
                message: 'Please select or add a delivery address.'
            };
        }
    }

    // 2. Validate Preferred Contact Method & Contact Input
    if (input.checkoutPreferredContact !== 'close') {
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
        if (input.preferredContact === 'phone') {
            const phoneRegex = /^[+]*[0-9\s\-()]{6,20}$/;
            if (!phoneRegex.test(input.contactInput.trim())) {
                return {
                    field: 'contactInput',
                    message: 'Please enter a valid telephone number.'
                };
            }
        }
    }

    // 3. Validate Delivery Method Selection
    if (!input.hasSelectedDeliveryMethod) {
        return {
            field: 'deliveryMethod',
            message: 'Please select a delivery method.'
        };
    }

    // 4. Validate Payment Method Selection
    if (!input.selectedPayment) {
        return {
            field: 'payment',
            message: 'Please select a payment method.'
        };
    }

    return null; // All validation passed
}

