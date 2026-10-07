export function readingTimeMinutes(markdown: string): number {
  const words = markdown.replace(/[#>*`\-\[\]()]/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
