import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Currency Formatting Utilities ---

export const LBP_CONVERSION_RATE = 90000;

/**
 * Formats a number as USD currency.
 * @param amount - The amount in USD.
 * @returns Formatted USD string (e.g., "$15.00").
 */
export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Formats a number as LBP currency.
 * @param amount - The amount in LBP.
 * @returns Formatted LBP string (e.g., "LBP 1,350,000").
 */
export function formatLbp(amount: number): string {
  return `LBP ${amount.toLocaleString('en-US')}`; // Use toLocaleString for comma separation
}

/**
 * Converts USD to LBP using the fixed rate.
 * @param usdAmount - The amount in USD.
 * @returns The equivalent amount in LBP.
 */
export function convertUsdToLbp(usdAmount: number): number {
  return usdAmount * LBP_CONVERSION_RATE;
}

/**
 * Formats a USD amount into both USD and LBP strings.
 * @param usdAmount - The amount in USD.
 * @returns An object containing formatted USD and LBP strings.
 */
export function formatCurrencyDual(usdAmount: number): { usd: string; lbp: string } {
  const lbpAmount = convertUsdToLbp(usdAmount);
  return {
    usd: formatUsd(usdAmount),
    lbp: formatLbp(lbpAmount),
  };
}

/**
 * Returns a string displaying both USD and LBP formatted amounts.
 * @param usdAmount - The amount in USD.
 * @param separator - String to separate the two currency displays (default: " / ").
 * @returns Combined string (e.g., "$15.00 / LBP 1,350,000").
 */
export function displayCurrencyDual(usdAmount: number, separator: string = " / "): string {
  const formatted = formatCurrencyDual(usdAmount);
  return `${formatted.usd}${separator}${formatted.lbp}`;
}
