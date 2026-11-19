/**
 * Clean Architecture --- UseCase: ValidatePhoneUseCase
 *
 * Enforces the business requirement for Bangladeshi mobile numbers:
 * Must be 11 digits starting with 01 (e.g. 017XXXXXXXX, 018XXXXXXXX, 019XXXXXXXX, 013XXXXXXXX, etc.)
 * Accepts numbers entered with country code (+8801... or 8801...) or spaces/dashes,
 * and normalizes them to canonical 11-digit local format.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

export class ValidatePhoneUseCase {
  public execute(rawInput: string): PhoneValidationResult {
    if (!rawInput || typeof rawInput !== "string") {
      return {
        isValid: false,
        normalized: "",
        error: "Phone number is required.",
      };
    }

    // Convert any Bengali numerals to ASCII numerals
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    let converted = rawInput.trim();
    for (let i = 0; i < 10; i++) {
      converted = converted.split(bengaliDigits[i]).join(String(i));
    }

    // Strip out all non-digits except a leading plus
    let digitsOnly = converted.replace(/[^\d+]/g, "");

    // Handle +880 or 880 prefix
    if (digitsOnly.startsWith("+880")) {
      digitsOnly = "0" + digitsOnly.slice(4);
    } else if (digitsOnly.startsWith("880")) {
      digitsOnly = "0" + digitsOnly.slice(3);
    }

    // Ensure it is 11 digits starting with 01
    const bdMobileRegex = /^01[3-9]\d{8}$/;
    if (!bdMobileRegex.test(digitsOnly)) {
      return {
        isValid: false,
        normalized: digitsOnly,
        error: "Enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).",
      };
    }

    return {
      isValid: true,
      normalized: digitsOnly,
    };
  }
}
