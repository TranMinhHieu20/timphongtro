export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export function matchesRoom(room, query) {
  if (!room || typeof room !== 'object') return false;
  const haystack = normalize([room.address, room.district, room.description, room.displayId, ...(Array.isArray(room.amenities) ? room.amenities : [])].join(' '));
  return normalize(query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}

export function searchSuggestions(rooms, query) {
  const available = (Array.isArray(rooms) ? rooms : []).filter(r => r?._id && r.status !== 'rented');
  const districts = new Map();
  for (const room of available) {
    const district = room.district?.trim() || room.address?.match(/(?:quận|huyện)\s+([^,]+)/i)?.[1]?.trim();
    if (!district) continue;
    const key = normalize(district);
    const group = districts.get(key) || { id: `district-${key}`, kind: 'district', label: district, query: district, count: 0 };
    group.count++; districts.set(key, group);
  }
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const groups = [...districts.values()].filter(d => words.every(w => normalize(d.label).includes(w)))
    .sort((a,b) => b.count - a.count).slice(0,3);
  const matches = available.filter(r => matchesRoom(r, query)).slice(0, 5 - groups.length)
    .map(r => ({ id: r._id, kind: 'room', label: r.address || r.district || r.displayId || 'Phòng đang cập nhật địa chỉ', query: r.address || r.district || r.displayId || '', price: r.price, status: r.status }));
  return { items: [...groups, ...matches], alternatives: [...districts.values()].sort((a,b) => b.count - a.count).slice(0,3) };
}
