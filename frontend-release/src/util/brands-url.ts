export interface BrandsOptions {
  domain: string;
  type: "icon" | "logo" | "icon@2x" | "logo@2x";
  useFallback?: boolean;
  darkOptimized?: boolean;
}

export const brandsUrl = (options: BrandsOptions): string =>
  `/local/brands/${options.domain}/icon.png`;

export const extractDomainFromBrandUrl = (url: string) => url.split("/")[4];
