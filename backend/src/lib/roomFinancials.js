const allowed = ['price','code','address','description','availability','roomNumber','district','status','notes','images','videoUrl','location','commissionRate','cashbackAmount','totalCommission','commissionRaw','ownerInfo'];
function fail(message) { const error = new Error(message); error.status = 400; throw error; }
function number(value, name, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
    if (value === '' || value === null || typeof value === 'boolean' || !Number.isFinite(Number(value)) || Number(value) < minimum || Number(value) > maximum) fail(`${name} không hợp lệ`);
    return Number(value);
}
export function resolveRoomUpdate(input, existing) {
    const update = Object.fromEntries(allowed.filter(key => input[key] !== undefined).map(key => [key, input[key]]));
    const price = input.price !== undefined ? number(input.price, 'Giá thuê', 1) : existing.price;
    const rate = input.commissionRate !== undefined ? number(input.commissionRate, 'Hoa hồng', 0, 100) : existing.commissionRate || 0;
    if (input.price !== undefined) update.price = price;
    if (input.commissionRate !== undefined) update.commissionRate = rate;
    const priceChanged = input.price !== undefined && price !== existing.price;
    const rateChanged = input.commissionRate !== undefined && rate !== existing.commissionRate;
    update.cashbackAmount = input.cashbackAmount !== undefined ? number(input.cashbackAmount, 'Tiền hoàn khách') : priceChanged ? Math.round(price * .09) : existing.cashbackAmount || 0;
    update.totalCommission = input.totalCommission !== undefined ? number(input.totalCommission, 'Tổng hoa hồng') : priceChanged || rateChanged ? Math.round(price * rate / 100) : existing.totalCommission || 0;
    update.netProfit = update.totalCommission - update.cashbackAmount;
    if (input.notes !== undefined) update.notes = (Array.isArray(input.notes) ? input.notes : String(input.notes).split('\n')).map(s=>String(s).trim()).filter(Boolean);
    if (input.contactPhone !== undefined) update.ownerInfo = { ...(existing.ownerInfo?.toObject?.() || existing.ownerInfo || {}), ...(input.ownerInfo || {}), phone: String(input.contactPhone).trim() };
    return update;
}
