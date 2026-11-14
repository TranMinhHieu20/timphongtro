import { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Search, RefreshCw, Loader2 } from 'lucide-react';
import { cleanMapAddress, roomMapLinks } from '../services/maps';

function AddressMap({ room }) {
  const initial = roomMapLinks(room);
  const [draft, setDraft] = useState(initial?.query || '');
  const [query, setQuery] = useState(initial?.query || '');
  const [reload, setReload] = useState(0);
  const [frameState, setFrameState] = useState('loading');
  const [error, setError] = useState('');
  const links = roomMapLinks(null, { query });

  function search(event) {
    event.preventDefault();
    const address = cleanMapAddress(draft);
    if (!address) { setError('Vui lòng nhập địa chỉ để tìm trên bản đồ.'); return; }
    setError(''); setDraft(address); setQuery(address); setReload(n => n + 1); setFrameState('loading');
  }
  function reset() {
    setDraft(initial?.query || ''); setQuery(initial?.query || ''); setError('');
    setReload(n => n + 1); setFrameState('loading');
  }
  return (
    <section id="room-map" style={{ scrollMarginTop: 160 }} className="rounded-2xl border border-slate-700/50 bg-slate-900/30 overflow-hidden" aria-label="Vị trí và chỉ đường đến phòng">
      <div className="p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-normal text-slate-100"><MapPin size={19} /> Vị trí & chỉ đường</h2>
        <p className="text-sm font-light leading-relaxed text-slate-300">Bản đồ tự tìm theo địa chỉ phòng. Nếu kết quả chưa đúng, bạn có thể bổ sung số nhà, ngõ hoặc thành phố bên dưới.</p>
        <form onSubmit={search} className="space-y-2">
          <label htmlFor="room-map-address" className="block text-sm font-normal text-slate-200">Địa chỉ tìm trên bản đồ</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input id="room-map-address" value={draft} onChange={event => { setDraft(event.target.value); setError(''); }} placeholder="Số nhà, ngõ, đường, quận, thành phố" className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-950/40 px-4 py-3 text-sm font-light text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400" />
            <button type="submit" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-normal text-white hover:bg-rose-600"><Search size={17} /> Tìm địa chỉ</button>
          </div>
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        </form>
        {!links && <p className="text-sm text-slate-400">Phòng chưa có địa chỉ để hiển thị. Bạn có thể nhập địa chỉ ở trên hoặc liên hệ người cho thuê.</p>}
        {links && <>
          <p className="text-xs font-light text-slate-400 break-words" aria-live="polite">Đang tìm: {links.query}</p>
          <div className="flex flex-wrap gap-3">
            <a href={links.directions} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-normal text-white hover:bg-rose-600"><Navigation size={17} /> Chỉ đường đến địa chỉ này</a>
            <a href={links.search} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-normal text-slate-200 hover:bg-slate-800"><ExternalLink size={16} /> Mở Google Maps</a>
            {query !== initial?.query && initial && <button type="button" onClick={reset} className="text-sm font-light text-slate-300 underline underline-offset-4">Dùng lại địa chỉ phòng</button>}
          </div>
          <p className="text-xs font-light text-slate-400">Google Maps cho phép chọn điểm xuất phát hoặc dùng vị trí hiện tại của bạn khi chỉ đường.</p>
        </>}
      </div>
      {links && <div className="relative border-t border-slate-700/40">
        {frameState === 'loading' && <div role="status" className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-slate-200 pointer-events-none"><Loader2 size={14} className="animate-spin" /> Đang tải bản đồ theo địa chỉ…</div>}
        {frameState === 'error' && <div role="alert" className="p-4 text-sm text-slate-300">Chưa tải được bản đồ. Bạn vẫn có thể mở Google Maps bằng nút phía trên. <button type="button" onClick={() => { setReload(n => n + 1); setFrameState('loading'); }} className="inline-flex items-center gap-1 underline"><RefreshCw size={14} /> Tải lại</button></div>}
        <iframe key={`${query}:${reload}`} src={links.embed} title={`Google Maps — ${links.query}`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={() => setFrameState('ready')} onError={() => setFrameState('error')} className="w-full h-80 sm:h-96 border-0" />
      </div>}
    </section>
  );
}

export default function RoomMap({ room }) {
  // Changing rooms discards the previous room's edited query and map.
  const identity = JSON.stringify([room?._id, room?.address, room?.district, room?.city, room?.province]);
  return <AddressMap key={identity} room={room} />;
}
