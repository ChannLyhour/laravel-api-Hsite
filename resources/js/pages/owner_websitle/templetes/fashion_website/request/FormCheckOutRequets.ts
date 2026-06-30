import type { CheckoutValidationInput, CheckoutValidationError } from '../validation/CheckoutValidationError';
export type { CheckoutValidationInput, CheckoutValidationError };

/**
 * Validates the checkout form inputs.
 * Returns an error object if validation fails, or null if validation passes.
 */
export function validateCheckoutForm(input: CheckoutValidationInput): CheckoutValidationError | null {
    // 1. Validate Delivery Address
    if (!input.hasSelectedAddress) {
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

    // 3. Validate Contact Information input
    if (!input.contactInput || !input.contactInput.trim()) {
        return {
            field: 'contactInput',
            message: 'Please enter your contact information.'
        };
    }

    // Validate telephone number format if 'phone' is selected
    if (input.preferredContact === 'phone') {
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
