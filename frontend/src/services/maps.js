const fold = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const string = value => typeof value === 'string' ? value.trim() : '';
// Old locality names remain useful search aliases for imported room addresses.
const localities = ['Hà Nội','Hồ Chí Minh','TP HCM','TPHCM','Sài Gòn','Đà Nẵng','Hải Phòng','Cần Thơ','Huế','Quảng Ninh','Bắc Ninh','Hưng Yên','Hải Dương','Nam Định','Thái Bình','Ninh Bình','Thanh Hóa','Nghệ An','Hà Tĩnh','Quảng Bình','Quảng Trị','Quảng Nam','Quảng Ngãi','Bình Định','Phú Yên','Khánh Hòa','Ninh Thuận','Bình Thuận','Kon Tum','Gia Lai','Đắk Lắk','Đắk Nông','Lâm Đồng','Bình Phước','Bình Dương','Đồng Nai','Tây Ninh','Bà Rịa','Vũng Tàu','Long An','Tiền Giang','Bến Tre','Trà Vinh','Vĩnh Long','Đồng Tháp','An Giang','Kiên Giang','Hậu Giang','Sóc Trăng','Bạc Liêu','Cà Mau','Lào Cai','Lai Châu','Điện Biên','Sơn La','Hòa Bình','Yên Bái','Phú Thọ','Tuyên Quang','Hà Giang','Bắc Kạn','Thái Nguyên','Cao Bằng','Lạng Sơn','Bắc Giang','Vĩnh Phúc','Hà Nam'];

export function cleanMapAddress(value) {
  return string(value)
    .replace(/^\s*(?:cho thuê|cần cho thuê)\s+(?:(?:nhà nguyên căn|nhà|phòng trọ|phòng|căn hộ)\s+)*/iu, '')
    .replace(/^mặt\s+(?=ngõ|ngách|đường|phố)/iu, '')
    .replace(/\([^)]*(?:ô\s*tô|oto|đỗ\s*cửa|full\s*đồ|nội\s*thất|thang\s*máy)[^)]*\)/giu, '')
    .replace(/^SN\s*(?=\d)/iu, 'Số nhà ')
    .replace(/\bHN\b/giu, 'Hà Nội')
    .replace(/\s+[–—-]\s+/gu, ', ')
    .replace(/[\r\n;]+/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(?:,\s*){2,}/g, ', ')
    .replace(/^[,\s]+|[,\s]+$/g, '');
}

export function roomMapAddress(room, defaultCity = 'Hà Nội') {
  const address = cleanMapAddress(room?.address);
  const district = cleanMapAddress(room?.district);
  if (!address && !district) return '';
  const parts = [address];
  if (district && !fold(address).includes(fold(district))) parts.push(district);
  let result = parts.filter(Boolean).join(', ');
  const normalized = fold(result).replace(/\./g, '');
  const hasCountry = /(?:viet nam|vietnam|\bvn)\s*$/.test(normalized);
  const addressWithoutCountry = normalized.replace(/,?\s*(?:viet nam|vietnam|vn)\s*$/, '').trim();
  const localityKey = value => fold(value).replace(/\./g, '').trim().replace(/^(?:thanh pho|tinh)\s+|^tp\s*/u, '');
  const lastPart = localityKey(addressWithoutCountry.split(',').at(-1));
  const hasLocality = localities.some(city => lastPart === localityKey(city));
  const city = string(room?.city) || string(room?.province) || string(defaultCity);
  // Hanoi is the application's current search area. Never append a conflicting
  // city when an explicit locality is already included in the room address.
  if (city && !hasLocality && !hasCountry && !normalized.includes(fold(city))) result += `, ${city}`;
  if (!hasCountry) result += ', Việt Nam';
  return result;
}

export function roomMapLinks(room, options = {}) {
  // Imported coordinates may be stale. Address is always the search source.
  const query = options.query !== undefined ? cleanMapAddress(options.query) : roomMapAddress(room, options.defaultCity);
  if (!query) return null;
  const encoded = encodeURIComponent(query);
  return {
    query,
    source: 'address',
    search: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`,
    embed: `https://www.google.com/maps?q=${encoded}&output=embed&hl=vi`,
  };
}
