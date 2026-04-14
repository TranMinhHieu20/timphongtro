/**
 * Utility to parse Zalo room rental text format into a Room object
 * @param {string} text 
 * @returns {Object} Parsed room data
 */
export const parseZaloText = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l !== "");
    
    const result = {
        code: "",
        commission: "",
        address: "",
        price: 0,
        description: "",
        amenities: [],
        services: {
            electricity: "",
            water: "",
            serviceFee: "",
            internet: ""
        },
        notes: [],
        roomNumber: "",
        availability: "",
        contactPhone: ""
    };

    let currentSection = "";

    lines.forEach(line => {
        // 1. Parse Mã and Commission (example: "Mã: TM016.🌹 1 triệu")
        if (line.match(/^Mã:?/i)) {
            const parts = line.split(/[.:]/);
            result.code = (parts[1] || "").replace(/🌹/g, "").trim();
            // If there's a third part or if commission is in the same line
            if (line.includes("🌹")) {
                result.commission = line.split("🌹")[1]?.trim() || "";
            }
        }
        
        // 2. Parse Address (example: "🏠 Địa chỉ: Số 12 ngõ 45 Cầu Giấy")
        else if (line.match(/🏠\s*Địa chỉ:?/i) || line.startsWith("Địa chỉ:")) {
            result.address = line.replace(/.*Địa chỉ:?/i, "").trim();
        }
        
        // 3. Parse Price (example: "💰 Giá: 3tr5", "💰 Giá: 4.000.000")
        else if (line.match(/💰\s*Giá:?/i) || line.startsWith("Giá:")) {
            const priceStr = line.replace(/.*Giá:?/i, "").trim();
            result.price = parsePriceValue(priceStr);
            // Append to description for context if needed
            result.description += `Giá thuê: ${priceStr}\n`;
        }
        
        // 4. Parse Amenities/Furniture (example: "✅ Nội thất: Điều hoà, nóng lạnh, giường, tủ")
        else if (line.match(/✅\s*Nội thất:?/i)) {
            const items = line.replace(/.*Nội thất:?/i, "").trim().split(/[,;]/);
            result.amenities = items.map(i => i.trim()).filter(i => i !== "");
        }
        
        // 5. Section Headers for Services and Notes
        else if (line.match(/✅\s*Dịch vụ:?/i)) {
            currentSection = "services";
        }
        else if (line.match(/⚠️\s*Lưu ý:?/i)) {
            currentSection = "notes";
        }
        
        // 5b. Parse Room Number (example: "Phòng: P404")
        else if (line.match(/^Phòng:?/i)) {
            result.roomNumber = line.replace(/^Phòng:?/i, "").trim();
        }
        
        // 5c. Parse Availability/Status (example: "Vào ở: Vào ở luôn", "Trạng thái: Cuối tháng")
        else if (line.match(/^(Vào ở|Trạng thái):?/i)) {
            result.availability = line.replace(/^(Vào ở|Trạng thái):?/i, "").trim();
        }
        
        // 5d. Parse Phone Number (example: "SĐT: 0912345678", "Liên hệ: 0912.345.678")
        else if (line.match(/^(SĐT|Liên hệ|Phone|đt):?/i)) {
            const phone = line.replace(/^(SĐT|Liên hệ|Phone|đt):?/i, "").replace(/[^0-9]/g, "").trim();
            if (phone.length >= 10) result.contactPhone = phone;
        }
        
        // 6. Parsing items under sections
        else if (currentSection === "services") {
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes("điện")) result.services.electricity = line.replace(/^-/,"").trim();
            else if (lowerLine.includes("nước")) result.services.water = line.replace(/^-/,"").trim();
            else if (lowerLine.includes("dịch vụ chung") || lowerLine.includes("dv chung") || lowerLine.includes("phí")) result.services.serviceFee = line.replace(/^-/,"").trim();
            else if (lowerLine.includes("mạng") || lowerLine.includes("internet") || lowerLine.includes("wifi")) result.services.internet = line.replace(/^-/,"").trim();
            else if (line.startsWith("-")) {
                // If it's a generic service not matched above, add to description
                result.description += `Dịch vụ: ${line.replace(/^-/,"").trim()}\n`;
            }
        }
        else if (currentSection === "notes") {
            if (line.startsWith("-") || line.match(/^\d+\./)) {
                result.notes.push(line.replace(/^-|^\d+\./, "").trim());
            }
        }
        
        // 7. General Description lines (those starting with - but not in sections)
        else if (line.startsWith("-") && currentSection === "") {
            result.description += line.replace(/^-/,"").trim() + "\n";
        }
        
        // 8. Catch-all for lines that don't match but might be important description
        else if (!line.match(/^[✅💰🏠⚠️Mã]/i) && currentSection === "") {
            // If it's not a header and we aren't in a section, it's probably address or desc
            if (!result.address && line.length > 10 && !line.includes(":")) {
                result.address = line; 
            } else {
                result.description += line + "\n";
            }
        }
    });

    // Final cleanups
    result.description = result.description.trim();
    result.cashbackAmount = Math.round(result.price * 0.09);

    return result;
};

/**
 * Helper to parse Vietnamese price strings like "3tr5", "4.000.000", "4,5tr"
 * @param {string} str 
 * @returns {number}
 */
export function parsePriceValue(str) {
    if (str === null || str === undefined) return 0;
    if (typeof str === 'number') return str;
    
    // Remove dots and commas used as thousand separators (e.g. 4.000.000 -> 4000000)
    // But be careful with 4,5tr where comma is a decimal point
    let cleanStr = String(str).toLowerCase().replace(/\s+/g, "");
    
    // Handle "tr" format (e.g. 3tr5, 4.5tr, 3tr)
    const trMatch = cleanStr.match(/(\d+)([.,]\d+)?tr(\d+)?/);
    if (trMatch) {
        let major = parseInt(trMatch[1]) * 1000000;
        let minor = 0;
        
        if (trMatch[2]) {
            // Handle decimal like 4.5tr
            minor = parseFloat(trMatch[2].replace(",", ".")) * 1000000;
            return major + minor; // wait, major is already included in float if we do 4.5
        }
        
        // Handle 3tr5 where 5 means 500k
        if (trMatch[3]) {
            minor = parseInt(trMatch[3]) * (trMatch[3].length === 1 ? 100000 : 10000);
        }
        
        return major + minor;
    }
    
    // Handle "triệu" format
    if (cleanStr.includes("triệu")) {
        const value = parseFloat(cleanStr.replace("triệu", "").replace(",", "."));
        return value * 1000000;
    }

    // Default numeric parse (remove non-digits except dots/commas)
    const numericOnly = cleanStr.replace(/[^0-9]/g, "");
    return parseInt(numericOnly) || 0;
}
