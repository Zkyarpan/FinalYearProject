export default function calculateReadTime(text: string): number {
  const wordsPerMinute = 250;
  const words = text.split(/\s+/).length;
  const readTime = Math.ceil(words / wordsPerMinute);
  return readTime;
}
