import { roomService } from './api';

function parseCSV(text) {
  const result = [];
  let row = [];
  let inQuotes = false;
  let cell = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          cell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
        row.push(cell);
        result.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  
  if (cell || row.length > 0) {
    row.push(cell);
    result.push(row);
  }
  
  // Map rows to objects using the first row as headers
  if (result.length < 2) return [];
  const headers = result[0].map(h => h.trim());
  const objects = [];
  
  for (let i = 1; i < result.length; i++) {
    if (result[i].length === 1 && !result[i][0]) continue; // Skip empty rows
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = result[i][j] !== undefined ? result[i][j] : '';
    }
    objects.push(obj);
  }
  
  return objects;
}

export const sheetService = {
  /**
   * Fetches the Google Sheet CSV and parses it into JSON
   */
  async getLiveRooms() {
    try {
      const response = await roomService.getLiveSheet();
      const csvText = response.data;
      
      const parsedData = parseCSV(csvText);
      
      // Process the data: remove rows that don't look like actual rooms
      const data = parsedData.filter(row => row['Mã phòng'] && row['Trạng thái']);
      
      // Map keys for easier use in React
      const mappedData = data.map((item, index) => ({
        _id: item['Mã phòng'] + '_' + index, // unique React key
        stt: item['STT'],
        roomId: item['Mã phòng'],
        status: item['Trạng thái']?.trim(),
        updatedAt: item['Thời gian cập nhật'],
        agentGroup: item['Nhóm CTV'],
        receiveDate: item['Ngày nhận sale phòng'],
        price: item['Giá phòng'],
        address: item['Địa chỉ'],
        district: item['Quận'],
        info: item['Thông tin phòng'],
      }));
      
      return mappedData;
    } catch (error) {
      console.error('Error fetching live rooms:', error);
      throw error;
    }
  }
};
