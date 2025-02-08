export function isValidDate(dateString: string) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
