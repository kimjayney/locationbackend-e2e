import { jsonResponse, adjustTime } from '../utils';

export async function handleView(params: URLSearchParams, db: D1Database, headers: Headers) {
  const device = params.get('device');
  const order = params.get("order");
  const authorization = params.get('authorization');
  
  const { results } = await db.prepare(
    `SELECT * FROM Devices WHERE id = ? and authorization = ?`
  ).bind(device, authorization).all();

  if (results?.length > 0) {
    if (results[0].share_location == 1) {
      let timeInterval = "";
      let bindParams: (string | number)[] = [device!];
      
      if (params.has("timeInterval")) {
        const minutes = parseInt(params.get("timeInterval") ?? '0');
        if (isNaN(minutes) || minutes < 0 || minutes > 10080) {
          return jsonResponse({
            success: false,
            status: false,
            message_en_US: "Invalid timeInterval parameter",
            message_ko_KR: "잘못된 시간 간격 파라미터입니다."
          }, headers);
        }
        timeInterval = `AND created_at > datetime('now', '-' || ? || ' minutes')`;
        bindParams.push(minutes);
      }
      
      if (params.has("startDate")) {
        const startDate = adjustTime(params.get("startDate")!, params.get("timezone")!);
        const endDate = adjustTime(params.get("endDate")!, params.get("timezone")!);
        timeInterval = `AND created_at BETWEEN ? AND ?`;
        bindParams.push(startDate, endDate);
      }
      
      let deviceExistQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ?`;
      const tableResults = await db.prepare(deviceExistQuery).bind(`%${device}%`).all();
      let queryTable = tableResults.results.length > 0 ? `Locations_${device}` : `Locations`;
      
      const { results: locResults } = await db.prepare(
        `SELECT lat, lng, created_at, iv, ip_addr FROM ${queryTable} WHERE DeviceId = ? ${timeInterval} ORDER BY created_at DESC`
      ).bind(...bindParams).all();
      
      return jsonResponse({
        success: true,
        status: true,
        message_en_US: "Service",
        message_ko_KR: queryTable === `Locations_${device}` ? "Service , this is new user" : "Service , this is old user",
        data: locResults
      }, headers);
    } else {
      return jsonResponse({
        success: false,
        status: false,
        message_en_US: "Location Sharing is disabled by user.",
        message_ko_KR: "디바이스 사용자가 위치 공유 기능을 잠시 끈 상태입니다."
      }, headers);
    }
  } else {
    return jsonResponse({
      success: true,
      status: false,
      message_en_US: "Device auth code problem.",
      message_ko_KR: "디바이스 인증 코드가 잘못되었어요. "
    }, headers);
  }
}
