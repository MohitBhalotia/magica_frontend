/**
 * Microcredits as the reference shows them, in millions with a trailing "M" (DESIGN §6):
 * 2 decimals from 0.01M up ("29.26M", "0.02M"), 4 below ("0.0076M", "0.0050M").
 * Step rows use their own 3-decimal form ("0.005M", ToolSteps).
 */
export function formatCredits(micro: number) {
  const millions = micro / 1_000_000;
  return `${millions.toFixed(Math.abs(millions) >= 0.01 ? 2 : 4)}M`;
}
