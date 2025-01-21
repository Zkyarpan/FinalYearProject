// utils/contentCleaner.ts

/**
 * Cleans HTML content while preserving meaningful formatting
 */
export const cleanContent = (content: string): string => {
  // If you want to completely strip HTML tags
  if (typeof content !== 'string') return '';

  return (
    content
      // Replace common block elements with line breaks
      .replace(/<(p|div|br)[^>]*>/gi, '')
      .replace(/<\/(p|div)>/gi, '\n')
      // Replace multiple line breaks with single one
      .replace(/\n\s*\n/g, '\n')
      // Trim extra whitespace
      .trim()
  );
};

/**
 * Preserves formatting but cleans unnecessary tags
 */
export const sanitizeContent = (content: string): string => {
  if (typeof content !== 'string') return '';

  return (
    content
      // Remove empty paragraphs
      .replace(/<p>\s*<\/p>/g, '')
      // Clean extra whitespace between tags
      .replace(/>\s+</g, '><')
      // Trim whitespace
      .trim()
  );
};

/**
 * Extracts plain text while preserving basic structure
 * Useful for previews or excerpts
 */
export const getContentExcerpt = (
  content: string,
  maxLength: number = 150
): string => {
  if (typeof content !== 'string') return '';

  // Remove all HTML tags first
  const plainText = content
    .replace(/<[^>]+>/g, ' ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate to maxLength and add ellipsis if needed
  return plainText.length > maxLength
    ? `${plainText.substring(0, maxLength)}...`
    : plainText;
};
