export interface CropConfig {
  value: string;
  label: string;
  varieties: string[];
}

export const CROP_CONFIG: CropConfig[] = [
  {
    value: 'ca-phe',
    label: 'Cà Phê',
    varieties: ['Arabica', 'Robusta', 'Culi', 'Moka', 'Catimor', 'Typica'],
  },
  {
    value: 'sau-rieng',
    label: 'Sầu Riêng',
    varieties: ['Ri 6', 'Monthong', 'Musang King', 'D24', 'Black Thorn', 'Chuồng Bò'],
  },
];

export function getVarietiesForCrop(cropType: string): string[] {
  return CROP_CONFIG.find((c) => c.value === cropType)?.varieties ?? [];
}

export function getCropLabel(cropType: string): string {
  return CROP_CONFIG.find((c) => c.value === cropType)?.label ?? cropType;
}
