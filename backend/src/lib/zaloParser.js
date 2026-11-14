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

export const parseZaloText = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l !== "");
    const result = {
        address: "",
        price: 0,
        roomNumber: "",
        availability: "",
        status: "available",
        description: "",
        notes: [],
        code: "",
        commissionRaw: "",
        commissionRate: 0,
        ownerInfo: { name: "", phone: "" },
        cashbackAmount: undefined
    };

    let currentSection = "";

    lines.forEach(line => {
        // Nới lỏng regex: Cho phép emoji ở đầu, dấu hai chấm có thể có hoặc không
        
        // 1. Hoa hồng
        if (line.match(/Hoa\s*hồng\s*:?/i)) {
            const val = line.split(/Hoa\s*hồng\s*:?/i)[1]?.trim();
            if (val) {
                result.commissionRaw = val;
                const rate = val.match(/(\d+)/);
                if (rate) result.commissionRate = parseFloat(rate[1]);
            }
            return;
        }

        // 2. Mã phòng
        if (line.match(/Mã\s*:?/i)) {
            result.code = line.split(/Mã\s*:?/i)[1]?.trim() || "";
            return;
        }

        // 3. Số phòng
        if (line.match(/Phòng\s*:?/i)) {
            result.roomNumber = line.split(/Phòng\s*:?/i)[1]?.trim() || "";
            return;
        }

        // 4. Giá
        if (line.match(/Giá\s*:?/i)) {
            const priceText = line.split(/Giá\s*:?/i)[1]?.trim();
            result.price = parsePriceValue(priceText);
            return;
        }

        // 5. Địa chỉ
        if (line.match(/Địa\s*chỉ\s*:?/i)) {
            result.address = line.split(/Địa\s*chỉ\s*:?/i)[1]?.trim() || "";
            return;
        }

        // 6. Trạng thái
        if (line.match(/Trạng\s*thái\s*:?/i)) {
            const st = line.split(/Trạng\s*thái\s*:?/i)[1]?.trim() || "";
            result.availability = st;
            const lower = st.toLowerCase();
            if (lower.includes("hết") || lower.includes("thuê")) result.status = "rented";
            else if (lower.includes("sắp")) result.status = "coming-soon";
            else result.status = "available";
            return;
        }

        // 7. Mô tả
        if (line.match(/Mô\s*tả\s*:?/i)) {
            result.description = line.split(/Mô\s*tả\s*:?/i)[1]?.trim() || "";
            currentSection = "description";
            return;
        }

        // 8. Hoàn khách (Cashback)
        if (line.match(/Hoàn\s*(?:khách|trả)\s*:?/i)) {
            const val = line.split(/Hoàn\s*(?:khách|trả)\s*:?/i)[1]?.trim();
            result.cashbackAmount = parsePriceValue(val);
            return;
        }

        // 9. Lưu ý
        if (line.match(/Lưu\s*ý\s*:?/i)) {
            currentSection = "notes";
            const inlineNote = line.split(/Lưu\s*ý\s*:?/i)[1]?.trim();
            if (inlineNote) result.notes.push(inlineNote);
            return;
        }

        // Xử lý ghi chú hoặc mô tả xuống dòng
        if (currentSection === "description") {
            result.description += "\n" + line;
        } else if (currentSection === "notes") {
            result.notes.push(line.replace(/^-|^\d+\.\s*/, "").trim());
        }
    });

    return result;
};
