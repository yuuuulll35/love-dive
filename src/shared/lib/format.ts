export const formatDepth = (m: number) => Math.round(m).toLocaleString('en-US');

/** 수압: depth / 10 + 1, 소수 1자리 */
export const toAtm = (m: number) => m / 10 + 1;
export const formatAtm = (m: number) => toAtm(m).toFixed(1);
