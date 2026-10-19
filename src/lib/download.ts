/** The file name in a URL's path, e.g. "67ced02b….png". */
export const fileNameOf = (url: string) => new URL(url).pathname.split("/").pop() ?? "file";

/**
 * Saves a file from another origin. Browsers ignore `download` on cross-origin links, so the file
 * is fetched first (Magica's CDN allows CORS); if that fails, it opens in a new tab instead.
 */
export async function downloadFile(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(String(response.status));
    const href = URL.createObjectURL(await response.blob());
    const link = Object.assign(document.createElement("a"), { href, download: fileNameOf(url) });
    link.click();
    URL.revokeObjectURL(href);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}
