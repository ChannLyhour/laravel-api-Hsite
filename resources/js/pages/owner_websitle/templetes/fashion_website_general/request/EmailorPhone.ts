/**
 * Helper utility to validate, parse and determine type for email or phone entries on checkout page.
 */
export const EmailOrPhoneHelper = {
    /**
     * Checks if a given input string looks like an email address.
     */
    isEmail(input: string): boolean {
        const trimmed = input.trim();
        return trimmed.includes("@");
    },

    /**
     * Validates whether the given input is a syntactically valid email.
     */
    validateEmail(email: string): boolean {
        const trimmed = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed);
    },

    /**
     * Validates whether the given input is a valid phone number format.
     */
    validatePhone(phone: string): boolean {
        const trimmed = phone.trim();
        const phoneRegex = /^[+]*[0-9\s\-()]{6,20}$/;
        return phoneRegex.test(trimmed);
    },

    /**
     * Formats Cambodia phone numbers if they start with 0 to include +855 prefix.
     */
    formatPhone(phone: string): string {
        const trimmed = phone.trim();
        // If it starts with +855, or 855, keep it or clean it up
        if (trimmed.startsWith("+855")) return trimmed;
        if (trimmed.startsWith("855")) return `+${trimmed}`;

        // Remove leading 0 and prepend +855
        const cleaned = trimmed.replace(/^0/, "");
        return `+855${cleaned}`;
    },

    /**
     * Formats email or phone input correctly before submitting.
     */
    formatInput(input: string): string {
        const trimmed = input.trim();
        if (this.isEmail(trimmed)) {
            return trimmed;
        }
        return this.formatPhone(trimmed);
    },
};
