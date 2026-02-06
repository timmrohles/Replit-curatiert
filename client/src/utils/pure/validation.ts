/**
 * Validation utilities for form inputs
 * Security-hardened validation functions
 */

/**
 * ✅ SECURITY: Email validation with sanitization
 * Prevents XSS and validates format
 */
export function validateEmail(email: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Bitte geben Sie eine E-Mail-Adresse ein.' };
  }

  // Sanitize: trim and convert to lowercase
  const sanitized = email.trim().toLowerCase();

  // Check length constraints
  if (sanitized.length === 0) {
    return { valid: false, error: 'Bitte geben Sie eine E-Mail-Adresse ein.' };
  }

  if (sanitized.length > 254) {
    return { valid: false, error: 'Die E-Mail-Adresse ist zu lang.' };
  }

  // Validate format with regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' };
  }

  // Additional security: Check for potentially dangerous characters
  const dangerousChars = /<|>|&|"|'|`/;
  if (dangerousChars.test(sanitized)) {
    return { valid: false, error: 'Die E-Mail-Adresse enthält ungültige Zeichen.' };
  }

  return { valid: true, sanitized };
}

/**
 * ✅ SECURITY: Generic string sanitization
 * Removes HTML tags and dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"'`]/g, ''); // Remove dangerous chars
}

/**
 * ✅ SECURITY: URL validation
 * Ensures URLs are safe and properly formatted
 */
export function validateURL(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Ungültige URL' };
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Nur HTTP und HTTPS URLs sind erlaubt' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Ungültige URL' };
  }
}
