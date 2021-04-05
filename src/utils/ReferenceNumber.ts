/**
 * Generates a reference number.
 * @param id Payment ID
 * @returns Reference number
 */
export function generateReferenceNumber(id: number) {
  const baseNumber = ["10", String(id)].join("");
  if (baseNumber.length < 3 || baseNumber.length > 19) {
    throw new Error("baseNumber too long or short");
  }

  const multipliers = [7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1, 7];
  let sum = 0;
  let j = 0;
  baseNumber
    .split("")
    .reverse()
    .forEach(c => {
      sum += Number(c) * multipliers[j++];
    });

  return baseNumber + String((10 - (sum % 10)) % 10);
}
