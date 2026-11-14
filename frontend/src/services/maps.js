// GeoJSON stores longitude first. Ignore the model's shared Hanoi default pin.
export function roomMapLinks(room) {
  const coordinates = room?.location?.coordinates;
  const [lng, lat] = Array.isArray(coordinates) ? coordinates : [];
  const hasPin = Number.isFinite(lng) && Number.isFinite(lat)
    && Math.abs(lng) <= 180 && Math.abs(lat) <= 90
    && !(lng === 0 && lat === 0)
    && !(Math.abs(lng - 105.8342) < 0.000001 && Math.abs(lat - 21.0278) < 0.000001);
  const address = [room?.address, room?.district && !room?.address?.includes(room.district) ? room.district : '']
    .filter(value => typeof value === 'string' && value.trim()).join(', ').trim();
  const destination = hasPin ? `${lat},${lng}` : address;
  if (!destination) return null;
  const query = encodeURIComponent(destination);
  return {
    search: `https://www.google.com/maps/search/?api=1&query=${query}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    embed: hasPin ? `https://www.openstreetmap.org/export/embed.html?bbox=${Math.max(-180, lng - 0.006)},${Math.max(-90, lat - 0.004)},${Math.min(180, lng + 0.006)},${Math.min(90, lat + 0.004)}&layer=mapnik&marker=${lat},${lng}` : null,
  };
}
