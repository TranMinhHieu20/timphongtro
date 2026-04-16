/**
 * Structured Manual Input Parser — Updated for robustness
 */

export const parsePriceValue = (text) => {
    if (!text) return 0;
    let clean = text.toLowerCase().replace(/,/g, "").trim();
    
    // 1 triệu = 1,000,000 (Sửa lỗi 100,000)
    if (clean.includes("tr") || clean.includes("triệu")) {
        let parts = clean.split(/(?:tr|triệu)/);
        let millions = parseFloat(parts[0]) || 0;
        let decimals = 0;
        if (parts[1]) {
            let sub = parts[1].trim().substring(0, 1);
            if (!isNaN(sub)) decimals = parseFloat(sub) * 100000;
        }
        return (millions * 1000000) + decimals;
    }
    
    if (clean.includes("k") || clean.includes("ngàn")) {
        return (parseFloat(clean.replace(/(?:k|ngàn)/g, "")) || 0) * 1000;
    }
    return parseFloat(clean.replace(/[^0-9]/g, "")) || 0;
};

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
        cashbackAmount: 0 
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
