export function progressFor(booking) {
  const steps=['Đã gửi','Đã liên hệ',booking.type === 'reservation' ? 'Xác nhận giữ chỗ' : 'Xác nhận lịch xem','Ký hợp đồng','Hoàn tất'];
  const indices={pending:0,contacted:1,confirmed:2,contracted:3,completed:4};
  const index=Object.hasOwn(indices,booking.status) ? indices[booking.status] : -1;
  return {steps,index,cancelled:booking.status === 'cancelled'};
}

export function bookingStatusLabel(lead) {
  switch (lead?.status) {
    case 'contacted': return 'Đã liên hệ';
    case 'confirmed': return lead.type === 'reservation' ? 'Đã xác nhận giữ chỗ' : 'Đã xác nhận lịch xem';
    case 'contracted': return 'Đã ký hợp đồng';
    case 'completed': return 'Đã hoàn tất';
    case 'cancelled': return 'Đã hủy';
    default: return 'Chờ xác nhận';
  }
}
