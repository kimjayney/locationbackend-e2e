import { jsonResponse, validateAndRespond, returnCreatedTime, sanitizeDeviceId, validateDeviceId } from '../utils';

export async function handleRegister(params: URLSearchParams, db: D1Database, headers: Headers) {
  const validation = validateAndRespond(params, ['device', 'authorization', 'shareControlKey']);
  if (validation) return jsonResponse(validation, headers);

  const device = params.get('device')!;
  const authorization = params.get("authorization")!;
  const shareControlKey = params.get("shareControlKey")!;

  // 기기 ID 검증 및 정제
  if (!validateDeviceId(device)) {
    return jsonResponse({
      success: false,
      status: false,
      message_en_US: "Invalid device ID format",
      message_ko_KR: "잘못된 기기 ID 형식입니다."
    }, headers);
  }

  // 특수문자 제거된 안전한 기기 ID
  const sanitizedDevice = sanitizeDeviceId(device);

  const { results } = await db.prepare(`SELECT * FROM Devices WHERE id = ?`).bind(device).all();
  if (results?.length > 0) {
    return jsonResponse({
      success: true,
      status: false,
      message_en_US: "Already registered",
      message_ko_KR: "이미 등록된 기기입니다.",
    }, headers);
  } else {
    const created_at = returnCreatedTime();
    const expired_at = returnCreatedTime(10);
    
    await db.prepare(
      "INSERT INTO Devices(id, is_enabled, created_at, expired_at, authorization, shareControlKey) VALUES(?, ?, ?, ?, ?, ?)"
    ).bind(device, 'true', created_at, expired_at, authorization, shareControlKey).all();

    // 안전한 테이블명 생성 (특수문자 제거)
    const safeTableName = `Locations_${sanitizedDevice}`;
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS ${safeTableName} (
        id integer PRIMARY KEY AUTOINCREMENT, 
        DeviceId VARCHAR(40), 
        lat TEXT, 
        lng TEXT, 
        IV TEXT, 
        created_at DATETIME,
        ip_addr VARCHAR(40),
        FOREIGN KEY (DeviceId) REFERENCES Devices(id) ON DELETE CASCADE
      )`).all();

    return jsonResponse({
      success: true,
      status: true,
      message_en_US: "Success",
      message_ko_KR: "기기가 등록되었어요. 인증번호를 기억해주세요.",
    }, headers);
  }
}
