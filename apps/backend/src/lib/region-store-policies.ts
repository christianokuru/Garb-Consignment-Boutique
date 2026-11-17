/**
 * Store policy values kept in each region's `metadata`. The storefront renders
 * the shipping/returns pages and structured data from these keys, and merchants
 * can change them in Settings → Regions → Metadata.
 */
export type RegionStorePolicies = {
  return_window_days: number;
  free_returns: boolean;
  shipping_rate: number;
  handling_days_min: number;
  handling_days_max: number;
  transit_days_min: number;
  transit_days_max: number;
};

export const DEFAULT_REGION_STORE_POLICIES: RegionStorePolicies = {
  // Online purchases from Garb are final sale.
  return_window_days: 0,
  free_returns: false,
  shipping_rate: 20,
  handling_days_min: 1,
  handling_days_max: 2,
  transit_days_min: 2,
  transit_days_max: 6,
};
