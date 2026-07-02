/** Devanāgarī numeral indexing: 1 → १, 108 → १०८. Safe for client and server. */
export function toDevanagari(n: number): string {
  const digits = "०१२३४५६७८९";
  return String(n)
    .split("")
    .map((d) => (/\d/.test(d) ? digits[Number(d)] : d))
    .join("");
}
