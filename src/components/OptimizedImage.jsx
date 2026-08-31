import React, { useState } from 'react';
import { safeHref } from '../utils/validators';

/**
 * OptimizedImage Component
 * - Enforces responsive dimensions and aspect ratio to prevent CLS
 * - Built-in error handling with fallback to deterministic Dicebear SVGs
 * - Default async decoding and lazy loading
 * - Sanitizes URLs via safeHref for XSS prevention
 */
export default function OptimizedImage({
  src,
  webpSrc,
  alt = '',
  className = '',
  width,
  height,
  loading = 'lazy',
  fetchPriority,
  fallbackType = 'avatar', // 'creator' | 'brand' | 'user' | 'general'
  seed = 'default',
  style = {},
  ...rest
}) {
  const [hasError, setHasError] = useState(false);

  // Generate fallback URL based on type
  const getFallbackUrl = () => {
    const cleanSeed = encodeURIComponent(String(seed || 'default'));
    if (fallbackType === 'brand') {
      return `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanSeed}`;
    }
    if (fallbackType === 'creator') {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanSeed}`;
    }
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${cleanSeed}`;
  };

  let validatedSrc = safeHref(src);
  if (validatedSrc && validatedSrc.startsWith('http://')) {
    validatedSrc = validatedSrc.replace(/^http:\/\//i, 'https://');
  }
  const effectiveSrc = (!hasError && validatedSrc) ? validatedSrc : getFallbackUrl();

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };

  if (webpSrc && !hasError) {
    return (
      <picture className="inline-block">
        <source type="image/webp" srcSet={webpSrc} />
        <img
          src={effectiveSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          onError={handleError}
          className={className}
          style={style}
          {...rest}
        />
      </picture>
    );
  }

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={handleError}
      className={className}
      style={style}
      {...rest}
    />
  );
}
