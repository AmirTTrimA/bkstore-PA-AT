/**
 * Formats a numerical amount into Iranian Rials (IRR) with thousands separators.
 * Example: 1500000 -> "1,500,000 IRR"
 *
 * @param {number|string} amount
 * @param {string} unit - Currency label (defaults to "IRR")
 * @returns {string}
 */
export function formatPrice(amount, unit = "IRR") {
  if (amount === null || amount === undefined || amount === "") {
    return `0 ${unit}`.trim();
  }

  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(numeric)) {
    return `0 ${unit}`.trim();
  }

  const formatted = Math.round(numeric).toLocaleString("en-US");
  return `${formatted} ${unit}`.trim();
}

export default formatPrice;
