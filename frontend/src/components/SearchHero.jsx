import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search, MapPin, ArrowRight, Home } from 'lucide-react';
import { searchSuggestions } from '../services/roomSearch';

export default function SearchHero({ rooms = [], loading, failed, query = '', onSearch }) {
  const [value,setValue]=useState(query);
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(-1);
  const root=useRef(null);
  useEffect(()=>{setValue(query);setOpen(false);setActive(-1);},[query]);
  useEffect(()=>{
    const close=e=>{if(!root.current?.contains(e.target)) setOpen(false);};
    document.addEventListener('pointerdown',close);
    return ()=>document.removeEventListener('pointerdown',close);
  },[]);
  const safeRooms=(Array.isArray(rooms)?rooms:[]).filter(r=>r?._id && r.status !== 'rented');
  const {items,alternatives}=searchSuggestions(safeRooms,value);
  const suggestions=loading || failed ? [] : items;
  const selected=active >= 0 && active < suggestions.length ? active : -1;
  const featured=safeRooms.find(r=>Array.isArray(r.images) && r.images.length);
  const submit=(text=value)=>{
    const term=text.trim();setValue(term);setOpen(false);setActive(-1);onSearch(term);
    document.getElementById('search-results')?.scrollIntoView({behavior:'smooth',block:'start'});
  };
  return <section className="search-hero">
    <div className="hero-copy"><div className="hero-eyebrow"><span/> Phòng trọ tại Hà Nội</div>
      <h1>Tìm phòng trọ<br/><em>vừa ý, vừa túi tiền.</em></h1>
      <p>Chọn khu vực bạn muốn ở, xem giá và ảnh phòng.<br/>Tìm được phòng phù hợp thì đặt lịch đến xem.</p>
      <div className="hero-search" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget)) setOpen(false);}}>
        <form onSubmit={e=>{e.preventDefault();submit();}}>
          <MapPin size={21}/><div className="search-field"><label htmlFor="room-query">Bạn muốn tìm phòng ở đâu?</label><input id="room-query" value={value} placeholder="Thử “Cầu Giấy”, “ban công”…" autoComplete="off" role="combobox" aria-expanded={open} aria-controls={open?'room-suggestions':undefined} aria-autocomplete="list" aria-activedescendant={open && selected >= 0?`room-suggestion-${selected}`:undefined} onFocus={()=>setOpen(true)} onChange={e=>{setValue(e.target.value);setActive(-1);setOpen(true);}} onKeyDown={e=>{
            if(e.key==='Escape'){setOpen(false);setActive(-1);}
            if(e.key==='ArrowDown' && suggestions.length){e.preventDefault();setOpen(true);setActive(i=>(i+1)%suggestions.length);}
            if(e.key==='ArrowUp' && suggestions.length){e.preventDefault();setOpen(true);setActive(i=>(i<=0?suggestions.length:i)-1);}
            if(e.key==='Enter' && open && selected>=0){e.preventDefault();submit(suggestions[selected].query);}
          }}/></div><button type="submit" aria-label="Tìm phòng"><Search size={19}/><span>Tìm phòng</span></button>
        </form>
        {open && <div className="suggestions"><div className="suggestion-caption">{loading?'Đang tải gợi ý…':failed?'Chưa tải được gợi ý':value.trim()?'Khu vực và phòng phù hợp':'Khu vực đang có phòng'}</div>
          <ul id="room-suggestions" role="listbox" aria-label="Gợi ý tìm phòng">{suggestions.map((item,i)=><li key={item.id} role="presentation"><button id={`room-suggestion-${i}`} role="option" aria-selected={i===selected} tabIndex={-1} className={i===selected?'active':''} type="button" onPointerDown={e=>e.preventDefault()} onClick={()=>submit(item.query)}><MapPin size={17}/><span>{item.label}<small>{item.kind==='district'?`${item.count} phòng còn trống hoặc sắp trống`:Number.isFinite(item.price)?`${item.price.toLocaleString('vi-VN')} đ / tháng${item.status==='coming-soon'?' · Sắp trống':''}`:'Giá đang cập nhật'}</small></span><ArrowUpRight size={16}/></button></li>)}</ul>
          {!suggestions.length && <div className="suggestion-empty"><p>{loading?'Đang lấy danh sách phòng.':failed?'Bạn vẫn có thể nhập từ khóa; hãy tải lại danh sách khi có kết nối.':'Chưa có phòng khớp từ khóa này. Thử tên đường ngắn hơn hoặc khu vực khác.'}</p>{!loading && !failed && alternatives.length>0 && <div className="suggestion-alternatives">{alternatives.map(item=><button type="button" key={item.id} onClick={()=>submit(item.query)}>{item.label}<small>{item.count} phòng</small></button>)}</div>}</div>}
        </div>}
      </div>
      <div className="popular-search"><span>Tìm nhanh:</span>{(alternatives.length?alternatives.map(d=>d.label):['Cầu Giấy','Đống Đa','Thanh Xuân']).map(d=><button key={d} type="button" onClick={()=>submit(d)}>{d}<ArrowUpRight size={12}/></button>)}</div>
      <div className="hero-room-count"><span className="status-dot"/>{loading?'Đang cập nhật danh sách phòng…':failed?'Khám phá phòng trọ tại Hà Nội':`${safeRooms.length} phòng còn trống hoặc sắp trống`} <a href="#search-results">Xem danh sách <ArrowRight size={14}/></a></div>
    </div>
    <div className="hero-visual">{featured?<Link to={`/room/${featured._id}`} className="featured-room"><img src={featured.images[0]} alt={`Phòng tại ${featured.address}`}/><div className="featured-top">Xem thông tin phòng <ArrowUpRight size={18}/></div><div className="featured-caption"><span><small>Địa chỉ phòng</small><strong>{featured.address}</strong></span><b>{Number.isFinite(featured.price)?(featured.price/1000000).toLocaleString('vi-VN'):'—'} triệu<small>/ tháng</small></b></div></Link>:<div className="room-illustration"><div className="draw-window"/><div className="draw-plant">✦</div><div className="draw-bed"/><div className="illustration-caption"><Home size={20}/> Tìm phòng gần nơi học,<br/>thuận đường đi làm.</div></div>}<span className="visual-label">Phòng trọ tại Hà Nội</span></div>
  </section>;
}
