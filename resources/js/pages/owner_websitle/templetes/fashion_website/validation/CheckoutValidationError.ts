export type ValidationErrorField = 'address' | 'preferredContact' | 'contactInput' | 'payment' | 'deliveryMethod';

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
}

export function validateCheckoutForm(
    input: CheckoutValidationInput
): CheckoutValidationError | null {
    // 1. Validate Delivery Address
    if (!input.hasSelectedAddress && !input.isGuestCheckoutEnabled) {
        return {
            field: 'address',
            message: 'Please select or add a delivery address.'
        };
    }

    // 2. Validate Preferred Contact Method
    if (!input.preferredContact) {
        return {
            field: 'preferredContact',
            message: 'Please select your preferred contact line (Phone call, Telegram, or WhatsApp).'
        };
    }

    // 3. Validate Contact Information Input
    if (!input.contactInput || !input.contactInput.trim()) {
        return {
            field: 'contactInput',
            message: 'Please enter your contact information.'
        };
    }

    // Validate telephone number format if 'phone' is selected
    if (input.preferredContact === 'phone') {
        const phoneRegex = /^[^0-9]*([0-9][^0-9]*){7,15}$/;
        if (!phoneRegex.test(input.contactInput.trim())) {
            return {
                field: 'contactInput',
                message: 'Please enter a valid telephone number.'
            };
        }
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
