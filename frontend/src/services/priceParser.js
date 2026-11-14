export function parsePriceValue(value) {
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : NaN;
    if (typeof value !== 'string' || !value.trim()) return NaN;
    const text = value.trim().toLowerCase().replace(/\s+/g, '').replace(/(?:vnd|vnđ|đồng|đ|₫)$/, '');
    // 3tr5, 3.5tr and 3,5 triệu all mean 3,500,000 VND.
    const million = text.match(/^(\d+(?:[.,]\d+)?)(?:triệu|tr)(\d{1,3})?$/u);
    if (million) {
        if (million[2] && /[.,]/.test(million[1])) return NaN;
        return Math.round(Number(million[1].replace(',', '.')) * 1000000 + (million[2] ? Number('0.' + million[2]) * 1000000 : 0));
    }
    const thousand = text.match(/^(\d+(?:[.,]\d+)?)(?:nghìn|ngàn|k)$/u);
    if (thousand) return Math.round(Number(thousand[1].replace(',', '.')) * 1000);
    if (/^\d+$/.test(text)) return Number(text);
    if (/^\d{1,3}([.,])\d{3}(?:\1\d{3})*$/.test(text)) return Number(text.replace(/[.,]/g, ''));
    return NaN;
}
