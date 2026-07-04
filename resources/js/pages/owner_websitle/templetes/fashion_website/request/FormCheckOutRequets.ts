import { validateCheckoutForm as validateBase } from '../validation/CheckoutValidationError';
import type { CheckoutValidationInput, CheckoutValidationError } from '../validation/CheckoutValidationError';
export type { CheckoutValidationInput, CheckoutValidationError };

/**
 * Validates the checkout form inputs.
 * Returns an error object if validation fails, or null if validation passes.
 */
export function validateCheckoutForm(input: CheckoutValidationInput): CheckoutValidationError | null {
    return validateBase(input);
}
