/**
 * Zalo Room Text Parser — Simplified Schema v2
 *
 * Supported Zalo format:
 *   🌹30%-12th.  Mã: TM292
 *   🏡 Địa chỉ: ngõ 255 Nguyễn Văn Trỗi, Hà Đông, HN
 *   ⏰Trống
 *   __________________
 *   💸Giá 4tr3 - P203
 *   👉Thang Máy
 *   ✅ Nội thất: như hình
 *   ✅ Dịch vụ: Điện 4000/số. Nước 35k/m3...
 *   ⛔️Lưu ý:
 *   - Đóng 1 cọc 1
 *   - Liên hệ 30p-1h trước khi qua
 *   SĐT: 0912345678
 *
 * Returns fields matching the Room schema.
 */
export const parseZaloText = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l !== "");

    const result = {
        // Public
        address:      "",
        price:        0,
        roomNumber:   "",
        availability: "",
        status:       "available",   // mapped from ⏰ text
        description:  "",
        notes:        [],

        // Admin-only
        code:           "",
        commissionRaw:  "",
        commissionRate: 0,
        ownerInfo: { name: "", phone: "" }
    };

    let inNotes = false;
    const descLines = [];

    for (const line of lines) {
        // Skip visual separator lines (_____, -----)
        if (/^[_\-=]{3,}$/.test(line)) continue;

        // ── 1. Mã phòng + Hoa hồng ─────────────────────────────────────────
        //   Format: "🌹30%-12th.  Mã: TM292"
        if (line.match(/Mã\s*:/i)) {
            if (line.includes("🌹")) {
                result.commissionRaw = line
                    .split("🌹")[1]
                    ?.split(/Mã\s*:/i)[0]
                    ?.replace(/[.\s]+$/, "")  // strip trailing dot/space
                    .trim() || "";

                // Extract numeric rate: "30%-12th" → 30
                const rateMatch = result.commissionRaw.match(/(\d+(?:\.\d+)?)\s*%/);
                result.commissionRate = rateMatch ? parseFloat(rateMatch[1]) : 0;
            }
            // Code: first clean token after "Mã:"
            const afterMa = line.replace(/.*Mã\s*:/i, "").trim();
            result.code = afterMa.split(/[\s,./]+/)[0].trim();
            continue;
        }

        // ── 2. Địa chỉ (🏡 / 🏠 / plain "Địa chỉ:") ──────────────────────
        if (line.match(/(🏡|🏠)\s*Địa\s*chỉ\s*:/i) || line.match(/^Địa\s*chỉ\s*:/i)) {
            result.address = line.replace(/.*Địa\s*chỉ\s*:/i, "").trim();
            continue;
        }

        // ── 3. Trạng thái / Vào ở (⏰Trống / ⏰ Sắp trống) ─────────────────
        if (line.match(/^⏰/)) {
            const text = line.replace(/^⏰\s*/, "").trim();
            result.availability = text;
            result.status = mapStatusText(text);
            continue;
        }
        if (line.match(/^(Vào\s*ở|Trạng\s*thái)\s*:/i)) {
            const text = line.replace(/^(Vào\s*ở|Trạng\s*thái)\s*:/i, "").trim();
            result.availability = text;
            result.status = mapStatusText(text);
            continue;
        }

        // ── 4. Giá + Số phòng (💸Giá 4tr3 - P203 / 💰 Giá: 4tr3) ──────────
        if (line.match(/(💸|💰)\s*Giá/i) || line.match(/^Giá\s*:/i)) {
            const cleaned = line
                .replace(/(💸|💰)\s*Giá\s*:?\s*/i, "")
                .replace(/^Giá\s*:\s*/i, "")
                .trim();

            const dashParts = cleaned.split(/\s*[-–]\s*/);
            result.price = parsePriceValue(dashParts[0]);

            if (dashParts[1] && /^[Pp]\d+|Phòng/i.test(dashParts[1].trim())) {
                result.roomNumber = dashParts[1].trim();
            } else if (dashParts[1]) {
                descLines.push(dashParts[1].trim());
            }
            continue;
        }

        // ── 5. Số phòng standalone ────────────────────────────────────────
        if (line.match(/^Phòng\s*:/i)) {
            result.roomNumber = line.replace(/^Phòng\s*:/i, "").trim();
            continue;
        }

        // ── 6. SĐT Chủ / Liên hệ ─────────────────────────────────────────
        if (line.match(/^(SĐT|Liên\s*hệ|Phone|đt|Tel)\s*:/i)) {
            const phone = line
                .replace(/^(SĐT|Liên\s*hệ|Phone|đt|Tel)\s*:/i, "")
                .replace(/[^0-9]/g, "")
                .trim();
            if (phone.length >= 10) result.ownerInfo.phone = phone;
            continue;
        }

        // ── 7. Lưu ý header (⛔️ / ⚠️ / ❗) ───────────────────────────────
        if (line.match(/(⛔️?|⚠️?|❗)\s*Lưu\s*ý\s*:?/iu) || line.match(/^Lưu\s*ý\s*:/i)) {
            inNotes = true;
            continue;
        }

        // ── 8. Nội dung Lưu ý ────────────────────────────────────────────
        if (inNotes) {
            if (line.startsWith("-") || /^\d+\./.test(line)) {
                result.notes.push(line.replace(/^-|^\d+\./, "").trim());
            } else if (line.length > 2) {
                result.notes.push(line);
            }
            continue;
        }

        // ── 9. Tất cả còn lại → Mô tả ─────────────────────────────────────
        //   Nội thất (✅), tiện ích (👉), dịch vụ (✅), v.v.
        const cleaned = line
            .replace(/^(✅|👉|💡|🔑|🚗|🏋️|📦|⭐|🌟)\s*/u, "")
            .trim();
        if (cleaned) descLines.push(cleaned);
    }

    result.description = descLines.filter(l => l).join("\n").trim();
    return result;
};

/**
 * Map availability text to status enum
 */
function mapStatusText(text) {
    const t = text.toLowerCase();
    if (t.includes("đã thuê") || t.includes("hết phòng") || t.includes("rented")) return "rented";
    if (t.includes("sắp trống") || t.includes("sắp") || t.includes("coming")) return "coming-soon";
    return "available"; // "Trống", "Vào ở luôn", "Cuối tháng", etc.
}

/**
 * Parse Vietnamese price strings → number (VNĐ)
 * Supports: "4tr3", "3.5tr", "4,5tr", "4.000.000", "3 triệu", "3tr"
 */
export function parsePriceValue(str) {
    if (str === null || str === undefined) return 0;
    if (typeof str === "number") return str;

    let s = String(str).toLowerCase().trim().replace(/\s+/g, "");

    // "3tr5", "4tr3", "3tr", "4.5tr", "4,5tr"
    const trMatch = s.match(/^(\d+)([.,]\d+)?tr(\d+)?/);
    if (trMatch) {
        let val = parseInt(trMatch[1]) * 1_000_000;
        if (trMatch[2]) {
            // 4.5tr → 4,500,000
            val = parseFloat(trMatch[1] + trMatch[2].replace(",", ".")) * 1_000_000;
        } else if (trMatch[3]) {
            // 4tr3 → 4,300,000
            val += parseInt(trMatch[3]) * (trMatch[3].length === 1 ? 100_000 : 10_000);
        }
        return Math.round(val);
    }

    // "3 triệu", "3.5 triệu"
    if (s.includes("triệu")) {
        const v = parseFloat(s.replace("triệu", "").replace(",", "."));
        return Math.round(v * 1_000_000);
    }

    // Plain number: "4000000", "4.000.000"
    const numOnly = s.replace(/[^0-9]/g, "");
    return parseInt(numOnly) || 0;
}
