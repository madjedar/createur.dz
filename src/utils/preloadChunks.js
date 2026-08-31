/**
 * Intent-Based Chunk Preloading Utility
 * Preloads dynamic component chunks on user intent (hover, focus, or idle)
 * ensuring zero perceived latency when the user clicks or navigates.
 */

// Cache map to ensure each chunk is only fetched once
const preloadedCache = new Set();

const safePreload = (key, importFn) => {
  if (preloadedCache.has(key)) return;
  preloadedCache.add(key);

  // Use requestIdleCallback if available, or execute asynchronously
  const doPreload = () => {
    importFn().catch((err) => {
      // If network fails during speculative prefetch, remove from cache so it can retry on click
      preloadedCache.delete(key);
      if (import.meta.env.DEV) {
        console.warn(`[Preload] Failed to prefetch chunk '${key}':`, err);
      }
    });
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(doPreload, { timeout: 1500 });
  } else {
    setTimeout(doPreload, 50);
  }
};

// Modal preloading functions
export const preloadAuthModal = () => safePreload('AuthModal', () => import('../components/AuthModal'));
export const preloadCreatorDashboardModal = () => safePreload('CreatorDashboardModal', () => import('../components/CreatorDashboardModal'));
export const preloadBrandDashboardModal = () => safePreload('BrandDashboardModal', () => import('../components/BrandDashboardModal'));
export const preloadAdminDashboardModal = () => safePreload('AdminDashboardModal', () => import('../components/AdminDashboardModal'));
export const preloadCreatorDetailsModal = () => safePreload('CreatorDetailsModal', () => import('../components/CreatorDetailsModal'));
export const preloadStoreDetailsModal = () => safePreload('StoreDetailsModal', () => import('../components/StoreDetailsModal'));
export const preloadCheckoutModal = () => safePreload('CheckoutModal', () => import('../components/CheckoutModal'));
export const preloadReviewModal = () => safePreload('ReviewModal', () => import('../components/ReviewModal'));
export const preloadProfileSettingsModal = () => safePreload('ProfileSettingsModal', () => import('../components/ProfileSettingsModal'));
export const preloadCampaignApplyModal = () => safePreload('CampaignApplyModal', () => import('../components/CampaignApplyModal'));
export const preloadContactModal = () => safePreload('ContactModal', () => import('../components/ContactModal'));

/**
 * Preload dashboard based on user role
 */
export const preloadDashboardForRole = (role) => {
  if (role === 'admin') preloadAdminDashboardModal();
  else if (role === 'brand') preloadBrandDashboardModal();
  else if (role === 'creator') preloadCreatorDashboardModal();
};
