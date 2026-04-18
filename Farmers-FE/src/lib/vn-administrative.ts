import { useQuery } from '@tanstack/react-query';

export type VnDistrictOption = {
  value: string;
  label: string;
};

export type VnProvinceOption = {
  value: string;
  label: string;
  districts: VnDistrictOption[];
};

const FALLBACK_PROVINCES: VnProvinceOption[] = [
  { value: 'Hà Nội', label: 'Hà Nội', districts: [{ value: 'Đông Anh', label: 'Đông Anh' }] },
];

const DISTRICT_FALLBACK = [{ value: 'Đang cập nhật địa giới', label: 'Đang cập nhật địa giới' }];

const STATIC_VIETNAM_ADMINISTRATIVE: VnProvinceOption[] = [
  { value: 'Thành phố Hà Nội', label: 'Thành phố Hà Nội', districts: [{ value: 'Ba Đình', label: 'Ba Đình' }, { value: 'Đống Đa', label: 'Đống Đa' }, { value: 'Đông Anh', label: 'Đông Anh' }, { value: 'Sóc Sơn', label: 'Sóc Sơn' }, { value: 'Gia Lâm', label: 'Gia Lâm' }] },
  { value: 'Thành phố Hồ Chí Minh', label: 'Thành phố Hồ Chí Minh', districts: [{ value: 'Quận 1', label: 'Quận 1' }, { value: 'Quận 7', label: 'Quận 7' }, { value: 'Thủ Đức', label: 'Thủ Đức' }, { value: 'Bình Chánh', label: 'Bình Chánh' }, { value: 'Củ Chi', label: 'Củ Chi' }] },
  { value: 'Thành phố Hải Phòng', label: 'Thành phố Hải Phòng', districts: [{ value: 'Hồng Bàng', label: 'Hồng Bàng' }, { value: 'Ngô Quyền', label: 'Ngô Quyền' }, { value: 'Lê Chân', label: 'Lê Chân' }, { value: 'An Dương', label: 'An Dương' }] },
  { value: 'Thành phố Huế', label: 'Thành phố Huế', districts: [{ value: 'Phú Xuân', label: 'Phú Xuân' }, { value: 'Thuận Hóa', label: 'Thuận Hóa' }, { value: 'Hương Thủy', label: 'Hương Thủy' }] },
  { value: 'Thành phố Đà Nẵng', label: 'Thành phố Đà Nẵng', districts: [{ value: 'Hải Châu', label: 'Hải Châu' }, { value: 'Sơn Trà', label: 'Sơn Trà' }, { value: 'Ngũ Hành Sơn', label: 'Ngũ Hành Sơn' }, { value: 'Hòa Vang', label: 'Hòa Vang' }] },
  { value: 'Thành phố Cần Thơ', label: 'Thành phố Cần Thơ', districts: [{ value: 'Ninh Kiều', label: 'Ninh Kiều' }, { value: 'Cái Răng', label: 'Cái Răng' }, { value: 'Bình Thủy', label: 'Bình Thủy' }, { value: 'Phong Điền', label: 'Phong Điền' }] },
  { value: 'Tỉnh Cao Bằng', label: 'Tỉnh Cao Bằng', districts: DISTRICT_FALLBACK },
  { value: 'Tỉnh Điện Biên', label: 'Tỉnh Điện Biên', districts: DISTRICT_FALLBACK },
  { value: 'Tỉnh Lai Châu', label: 'Tỉnh Lai Châu', districts: DISTRICT_FALLBACK },
  { value: 'Tỉnh Lạng Sơn', label: 'Tỉnh Lạng Sơn', districts: DISTRICT_FALLBACK },
  { value: 'Tỉnh Lào Cai', label: 'Tỉnh Lào Cai', districts: [{ value: 'Lào Cai', label: 'Lào Cai' }, { value: 'Sa Pa', label: 'Sa Pa' }, { value: 'Bảo Thắng', label: 'Bảo Thắng' }] },
  { value: 'Tỉnh Quảng Ninh', label: 'Tỉnh Quảng Ninh', districts: [{ value: 'Hạ Long', label: 'Hạ Long' }, { value: 'Cẩm Phả', label: 'Cẩm Phả' }, { value: 'Uông Bí', label: 'Uông Bí' }] },
  { value: 'Tỉnh Tuyên Quang', label: 'Tỉnh Tuyên Quang', districts: [{ value: 'Tuyên Quang', label: 'Tuyên Quang' }, { value: 'Hàm Yên', label: 'Hàm Yên' }] },
  { value: 'Tỉnh Sơn La', label: 'Tỉnh Sơn La', districts: [{ value: 'Sơn La', label: 'Sơn La' }, { value: 'Mộc Châu', label: 'Mộc Châu' }, { value: 'Mai Sơn', label: 'Mai Sơn' }] },
  { value: 'Tỉnh Phú Thọ', label: 'Tỉnh Phú Thọ', districts: [{ value: 'Việt Trì', label: 'Việt Trì' }, { value: 'Phú Thọ', label: 'Phú Thọ' }, { value: 'Lâm Thao', label: 'Lâm Thao' }] },
  { value: 'Tỉnh Thái Nguyên', label: 'Tỉnh Thái Nguyên', districts: [{ value: 'Thái Nguyên', label: 'Thái Nguyên' }, { value: 'Sông Công', label: 'Sông Công' }, { value: 'Phổ Yên', label: 'Phổ Yên' }] },
  { value: 'Tỉnh Bắc Ninh', label: 'Tỉnh Bắc Ninh', districts: [{ value: 'Bắc Ninh', label: 'Bắc Ninh' }, { value: 'Từ Sơn', label: 'Từ Sơn' }, { value: 'Yên Phong', label: 'Yên Phong' }] },
  { value: 'Tỉnh Hưng Yên', label: 'Tỉnh Hưng Yên', districts: [{ value: 'Hưng Yên', label: 'Hưng Yên' }, { value: 'Mỹ Hào', label: 'Mỹ Hào' }, { value: 'Khoái Châu', label: 'Khoái Châu' }] },
  { value: 'Tỉnh Ninh Bình', label: 'Tỉnh Ninh Bình', districts: [{ value: 'Ninh Bình', label: 'Ninh Bình' }, { value: 'Tam Điệp', label: 'Tam Điệp' }, { value: 'Hoa Lư', label: 'Hoa Lư' }] },
  { value: 'Tỉnh Thanh Hóa', label: 'Tỉnh Thanh Hóa', districts: [{ value: 'Thanh Hóa', label: 'Thanh Hóa' }, { value: 'Sầm Sơn', label: 'Sầm Sơn' }, { value: 'Bỉm Sơn', label: 'Bỉm Sơn' }] },
  { value: 'Tỉnh Nghệ An', label: 'Tỉnh Nghệ An', districts: [{ value: 'Vinh', label: 'Vinh' }, { value: 'Cửa Lò', label: 'Cửa Lò' }, { value: 'Diễn Châu', label: 'Diễn Châu' }] },
  { value: 'Tỉnh Hà Tĩnh', label: 'Tỉnh Hà Tĩnh', districts: [{ value: 'Hà Tĩnh', label: 'Hà Tĩnh' }, { value: 'Hồng Lĩnh', label: 'Hồng Lĩnh' }, { value: 'Kỳ Anh', label: 'Kỳ Anh' }] },
  { value: 'Tỉnh Quảng Trị', label: 'Tỉnh Quảng Trị', districts: [{ value: 'Đông Hà', label: 'Đông Hà' }, { value: 'Quảng Trị', label: 'Quảng Trị' }, { value: 'Vĩnh Linh', label: 'Vĩnh Linh' }] },
  { value: 'Tỉnh Quảng Ngãi', label: 'Tỉnh Quảng Ngãi', districts: [{ value: 'Quảng Ngãi', label: 'Quảng Ngãi' }, { value: 'Đức Phổ', label: 'Đức Phổ' }, { value: 'Sơn Tịnh', label: 'Sơn Tịnh' }] },
  { value: 'Tỉnh Gia Lai', label: 'Tỉnh Gia Lai', districts: [{ value: 'Pleiku', label: 'Pleiku' }, { value: 'An Khê', label: 'An Khê' }, { value: 'Chư Sê', label: 'Chư Sê' }] },
  { value: 'Tỉnh Khánh Hòa', label: 'Tỉnh Khánh Hòa', districts: [{ value: 'Nha Trang', label: 'Nha Trang' }, { value: 'Cam Ranh', label: 'Cam Ranh' }, { value: 'Ninh Hòa', label: 'Ninh Hòa' }] },
  { value: 'Tỉnh Lâm Đồng', label: 'Tỉnh Lâm Đồng', districts: [{ value: 'Đà Lạt', label: 'Đà Lạt' }, { value: 'Bảo Lộc', label: 'Bảo Lộc' }, { value: 'Di Linh', label: 'Di Linh' }] },
  { value: 'Tỉnh Đắk Lắk', label: 'Tỉnh Đắk Lắk', districts: [{ value: 'Buôn Ma Thuột', label: 'Buôn Ma Thuột' }, { value: 'Buôn Hồ', label: 'Buôn Hồ' }, { value: 'Krông Pắk', label: 'Krông Pắk' }] },
  { value: 'Tỉnh Đồng Nai', label: 'Tỉnh Đồng Nai', districts: [{ value: 'Biên Hòa', label: 'Biên Hòa' }, { value: 'Long Khánh', label: 'Long Khánh' }, { value: 'Trảng Bom', label: 'Trảng Bom' }] },
  { value: 'Tỉnh Tây Ninh', label: 'Tỉnh Tây Ninh', districts: [{ value: 'Tây Ninh', label: 'Tây Ninh' }, { value: 'Hòa Thành', label: 'Hòa Thành' }, { value: 'Gò Dầu', label: 'Gò Dầu' }] },
  { value: 'Tỉnh Đồng Tháp', label: 'Tỉnh Đồng Tháp', districts: [{ value: 'Cao Lãnh', label: 'Cao Lãnh' }, { value: 'Sa Đéc', label: 'Sa Đéc' }, { value: 'Hồng Ngự', label: 'Hồng Ngự' }] },
  { value: 'Tỉnh Vĩnh Long', label: 'Tỉnh Vĩnh Long', districts: [{ value: 'Vĩnh Long', label: 'Vĩnh Long' }, { value: 'Bình Minh', label: 'Bình Minh' }, { value: 'Trà Ôn', label: 'Trà Ôn' }] },
  { value: 'Tỉnh Cà Mau', label: 'Tỉnh Cà Mau', districts: [{ value: 'Cà Mau', label: 'Cà Mau' }, { value: 'Năm Căn', label: 'Năm Căn' }, { value: 'Đầm Dơi', label: 'Đầm Dơi' }] },
  { value: 'Tỉnh An Giang', label: 'Tỉnh An Giang', districts: [{ value: 'Long Xuyên', label: 'Long Xuyên' }, { value: 'Châu Đốc', label: 'Châu Đốc' }, { value: 'Tân Châu', label: 'Tân Châu' }] },
].sort((a, b) => a.label.localeCompare(b.label, 'vi'));

export function useVietnamAdministrative() {
  return useQuery({
    queryKey: ['vn-administrative-static-v1'],
    queryFn: async () => STATIC_VIETNAM_ADMINISTRATIVE,
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    placeholderData: FALLBACK_PROVINCES,
  });
}
