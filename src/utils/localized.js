/**
 * Localized Item String Resolver
 * Safely extracts localized string for a given field from an object or string.
 * Supports multilingual fallback: requested lang -> 'ar' -> 'fr' -> 'en' -> empty string.
 */
export const getLocalizedItem = (item, field, lang = 'ar') => {
  if (!item || !item[field]) return '';
  if (typeof item[field] === 'string') return item[field];
  return item[field][lang] || item[field]['ar'] || item[field]['fr'] || item[field]['en'] || '';
};

export default getLocalizedItem;
