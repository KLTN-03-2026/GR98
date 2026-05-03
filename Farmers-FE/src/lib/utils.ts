import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(item: any): string | null {
  if (!item) return null;
  if (item.product?.thumbnailUrl) return item.product.thumbnailUrl;
  if (item.product?.imageUrls?.length) return item.product.imageUrls[0];
  if (item.imageUrls?.length) return item.imageUrls[0];
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.productImage) return item.productImage;
  return null;
}
