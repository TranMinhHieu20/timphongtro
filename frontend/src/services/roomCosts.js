export function amount(value) {
  if (!['number','string'].includes(typeof value) || typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1000000000 ? number : null;
}
export function estimateCosts(price, fields) {
  const rent = amount(price);
  const product = (a,b) => amount(a) == null || amount(b) == null ? null : Math.round(amount(a) * amount(b));
  const lines = [
    {key:'rent', label:'Tiền thuê phòng', value:rent},
    {key:'electricity', label:'Điện', value:product(fields.electricityRate, fields.electricityUnits)},
    {key:'water', label:'Nước', value:product(fields.waterRate, fields.people)},
    {key:'services', label:'Dịch vụ và Internet', value:amount(fields.services)},
    {key:'parking', label:'Gửi xe', value:amount(fields.parking)},
  ];
  const unknown = lines.filter(line => line.value == null).map(line => line.label);
  const monthly = lines.reduce((sum,line) => sum + (line.value ?? 0),0);
  const deposit = product(rent, fields.depositMonths);
  return {lines, unknown, monthly, deposit, upfront:monthly + (deposit ?? 0), complete:unknown.length === 0 && deposit !== null};
}
