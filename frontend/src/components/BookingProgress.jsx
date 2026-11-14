import { Check, XCircle } from 'lucide-react';
import { bookingStatusLabel, progressFor } from '../services/bookingStatus';
import './rental-tools.css';
export default function BookingProgress({booking}) {
  const {steps,index,cancelled}=progressFor(booking);
  return <section className="booking-progress" aria-label="Tiến trình yêu cầu">
    {cancelled ? <p className="progress-cancelled"><XCircle size={17}/> Yêu cầu đã hủy. Việc hoàn cọc, nếu có, cần được xác nhận riêng.</p> : index < 0 ? <p>Trạng thái đang được cập nhật. Hãy tải lại hoặc liên hệ người hỗ trợ.</p> : <ol>{steps.map((label,i)=><li key={label} className={i <= index ? 'reached' : ''} aria-current={i === index ? 'step' : undefined}><span className="progress-dot">{i < index ? <Check size={13}/> : i+1}</span><span>{label}</span></li>)}</ol>}
    <p className="cost-note">Trạng thái hiện tại: {index < 0 && !cancelled ? 'Chưa xác định' : bookingStatusLabel(booking)}. Các mốc mô tả quy trình; thời gian từng bước chưa được hệ thống lưu riêng.</p>
    {booking.type === 'reservation' && <p className="cost-note">Thanh toán: {({pending:'Chờ kiểm tra',paid:'Đã xác nhận nhận tiền',refunded:'Đã xác nhận hoàn tiền'})[booking.paymentStatus] || 'Chưa có thông tin'}. {booking.paymentStatus !== 'paid' && 'Gửi yêu cầu chưa đồng nghĩa đã giữ phòng.'}</p>}
  </section>;
}
