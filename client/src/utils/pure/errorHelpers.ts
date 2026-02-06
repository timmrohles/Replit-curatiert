/**
 * Type-safe Error Handling Utilities
 * 
 * Diese Utilities helfen dabei, `unknown` Errors sicher zu behandeln
 * und konsistente Error-Messages zu generieren.
 * 
 * @module errorHelpers
 */

/**
 * Type guard to check if value is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Safely extract error message from unknown error
 * 
 * @param error - Unknown error value
 * @param fallback - Fallback message if extraction fails
 * @returns Error message string
 * 
 * @example
 * ```ts
 * try {
 *   throw new Error('Something went wrong');
 * } catch (error: unknown) {
 *   console.error(getErrorMessage(error));
 * }
 * ```
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (hasMessage(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  // For other types, try JSON stringify
  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}

/**
 * Format error for console logging with context
 * 
 * @param context - Context string (e.g., "Failed to load books")
 * @param error - Unknown error value
 * @returns Formatted error string
 * 
 * @example
 * ```ts
 * catch (error: unknown) {
 *   console.error(formatError('Failed to fetch data', error));
 * }
 * ```
 */
export function formatError(context: string, error: unknown): string {
  return `${context}: ${getErrorMessage(error)}`;
}

/**
 * Log error to console with context
 * 
 * @param context - Context string
 * @param error - Unknown error value
 * 
 * @example
 * ```ts
 * catch (error: unknown) {
 *   logError('Failed to save curator', error);
 * }
 * ```
 */
export function logError(context: string, error: unknown): void {
  console.error(formatError(context, error));
  
  // If it's an actual Error object, also log the stack trace
  if (isError(error) && error.stack) {
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Create a user-friendly error message
 * Useful for displaying errors in alerts/toasts
 * 
 * @param error - Unknown error value
 * @param userFriendlyMessage - Optional user-friendly message
 * @returns User-friendly error string
 */
export function getUserErrorMessage(
  error: unknown,
  userFriendlyMessage?: string
): string {
  const errorMessage = getErrorMessage(error);
  
  if (userFriendlyMessage) {
    return `${userFriendlyMessage}: ${errorMessage}`;
  }
  
  return errorMessage;
}
