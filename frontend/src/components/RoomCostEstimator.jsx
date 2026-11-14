import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { estimateCosts } from '../services/roomCosts';
import './rental-tools.css';
const money = value => value.toLocaleString('vi-VN') + ' đ';
export default function RoomCostEstimator({room}) {
  const [fields,setFields] = useState({electricityUnits:'100',electricityRate:'',people:'1',waterRate:'',services:'',parking:'',depositMonths:''});
  const result = estimateCosts(room.price, fields);
  const inputs = [
    ['electricityRate','Giá điện (đ/kWh)',100000,1],['electricityUnits','Điện dự kiến (kWh/tháng)',10000,1],
    ['waterRate','Tiền nước (đ/người/tháng)',10000000,1],['people','Số người ở',100,1],
    ['services','Dịch vụ và Internet (đ/tháng)',100000000,1],['parking','Gửi xe tổng cộng (đ/tháng)',100000000,1],
    ['depositMonths','Cọc thuê nhà (số tháng tiền thuê)',24,0.5],
  ];
  return <section id="room-cost-estimate" className="rental-tool cost-estimator" aria-labelledby="cost-title">
    <div className="tool-heading"><Calculator size={21}/><h2 id="cost-title">Dự trù chi phí trước khi thuê</h2></div>
    <p className="tool-intro">Tiền thuê được lấy từ phòng đang xem. Nhập đơn giá đã trao đổi với người cho thuê để tính các khoản còn lại.</p>
    <div className="cost-layout"><div className="cost-inputs">{inputs.map(([key,label,max,step]) => <label key={key} htmlFor={`cost-${key}`}>{label}<input id={`cost-${key}`} type="number" inputMode="decimal" min="0" max={max} step={step} value={fields[key]} placeholder="Chưa biết" onChange={e => {const value=e.target.value;if(value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= max)) setFields(prev=>({...prev,[key]:value}));}}/></label>)}<p className="cost-note">Để trống nếu chưa biết; nhập 0 nếu không thu phí. Nước đang tính theo người. Nếu tính theo đồng hồ, hãy nhập tổng tiền nước dự kiến và đặt số người là 1.</p></div>
    <div className="cost-summary" aria-live="polite" aria-atomic="true"><dl>{result.lines.map(line=><div key={line.key}><dt>{line.label}</dt><dd>{line.value == null ? 'Chưa biết' : money(line.value)}</dd></div>)}<div className="cost-total"><dt>{result.unknown.length ? 'Tạm tính mỗi tháng' : 'Dự kiến mỗi tháng'}</dt><dd>{money(result.monthly)}</dd></div><div><dt>Cọc thuê nhà</dt><dd>{result.deposit == null ? 'Chưa biết' : money(result.deposit)}</dd></div><div className="cost-total"><dt>{result.complete ? 'Dự kiến lúc nhận phòng' : 'Tạm tính lúc nhận phòng'}</dt><dd>{money(result.upfront)}</dd></div></dl>
    <p className="cost-note">{result.unknown.length ? `Chưa bao gồm: ${result.unknown.join(', ')}. ` : ''}{result.deposit == null ? 'Chưa bao gồm cọc thuê nhà. ' : ''}Lúc nhận phòng tính một tháng chi phí cộng cọc. Cọc giữ chỗ chỉ được trừ khi hai bên xác nhận; chưa trừ ưu đãi hoàn tiền. Đây là ước tính, không phải yêu cầu thanh toán.</p></div></div>
  </section>;
}
