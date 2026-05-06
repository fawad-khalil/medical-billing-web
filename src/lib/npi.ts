/**
 * CMS NPI Luhn check digit validation.
 *
 * Algorithm (from CMS NPI Final Rule):
 * 1. Prepend '80840' to the 10-digit NPI to produce a 15-digit string.
 * 2. Starting from the rightmost digit, double every second digit
 *    (positions 2, 4, 6, ... from the right, 1-indexed).
 * 3. If a doubled value > 9, subtract 9.
 * 4. Sum all 15 digits (original + transformed).
 * 5. Valid if sum % 10 === 0.
 *
 * Assumes the input has already been validated as exactly 10 decimal digits.
 */
export function isValidNpi(npi: string): boolean {
  if (!/^\d{10}$/.test(npi)) return false;

  const digits = ('80840' + npi).split('').map(Number);
  const len = digits.length; // 15

  let sum = 0;
  for (let i = 0; i < len; i++) {
    // Position from the right is (len - i), 1-indexed.
    // Double every digit at an even position from the right.
    const posFromRight = len - i;
    if (posFromRight % 2 === 0) {
      let doubled = digits[i] * 2;
      if (doubled > 9) doubled -= 9;
      sum += doubled;
    } else {
      sum += digits[i];
    }
  }

  return sum % 10 === 0;
}
