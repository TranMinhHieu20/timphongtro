import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { roomMapLinks } from '../services/maps';

export default function RoomMap({ room }) {
  const links = roomMapLinks(room);
  if (!links) return null;
  return (
    <section id="room-map" style={{scrollMarginTop:160}} className="rounded-2xl border border-slate-700/50 bg-slate-900/30 overflow-hidden" aria-label="Vị trí và chỉ đường đến phòng">
      <div className="p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-normal text-slate-100"><MapPin size={19} /> Vị trí & chỉ đường</h2>
        <p className="text-sm font-light leading-relaxed text-slate-300">{room.address || room.district || 'Vị trí phòng trên bản đồ'}</p>
        {!links.embed && <p className="text-sm font-light leading-relaxed text-slate-400">Phòng chưa có ghim vị trí chính xác. Google Maps sẽ tìm theo địa chỉ; bạn nên xác nhận địa điểm với người cho thuê trước khi đến.</p>}
        <div className="flex flex-wrap gap-3">
          <a href={links.directions} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-normal text-white hover:bg-rose-600"><Navigation size={17} /> Chỉ đường đến phòng</a>
          <a href={links.search} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-normal text-slate-200 hover:bg-slate-800"><ExternalLink size={16} /> Mở Google Maps</a>
        </div>
        <p className="text-xs font-light text-slate-400">Mở Google Maps để chọn điểm xuất phát hoặc dùng vị trí hiện tại của bạn.</p>
      </div>
      {links.embed && <iframe src={links.embed} title="Bản đồ vị trí phòng" loading="lazy" referrerPolicy="no-referrer" className="w-full h-72 border-0" />}
    </section>
  );
}
