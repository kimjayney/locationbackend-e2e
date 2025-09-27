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
    // 알림 제어를 위한 고유 키를 임의의 값으로 생성
    const notificationControlKey = crypto.randomUUID();
    
    await db.prepare(
      "INSERT INTO Devices(id, is_enabled, created_at, expired_at, authorization, shareControlKey, notificationControlKey) VALUES(?, ?, ?, ?, ?, ?, ?)"
    ).bind(device, 'true', created_at, expired_at, authorization, shareControlKey, notificationControlKey).run();

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

/**
 * 알림을 보낼 대상 기기를 등록하는 핸들러
 * /api/device/register-notification-target?deviceId=...&toDeviceId=...&tonotificationControlKey=...
 */
export async function handleRegisterNotificationTarget(params: URLSearchParams, db: D1Database, headers: Headers) {
  // 1. 필수 파라미터 검증
  const validation = validateAndRespond(params, ['deviceId', 'authorization', 'toDeviceId', 'tonotificationControlKey']);
  if (validation) return jsonResponse(validation, headers, 400);

  const deviceId = params.get('deviceId')!;
  const authorization = params.get('authorization')!;
  const toDeviceId = params.get('toDeviceId')!;
  const tonotificationControlKey = params.get('tonotificationControlKey')!;

  try {
    // 2. 요청 기기(deviceId)의 유효성 검증
    const requestingDevice = await db.prepare(
      `SELECT id FROM Devices WHERE id = ? AND authorization = ?`
    ).bind(deviceId, authorization).first();

    if (!requestingDevice) {
      return jsonResponse({
        success: false,
        message_en_US: "Invalid device or authorization.",
        message_ko_KR: "유효하지 않은 기기이거나 인증 정보가 잘못되었습니다."
      }, headers, 403);
    }

    // 3. 대상 기기(toDeviceId)의 유효성 검증
    //    - toDeviceId와 tonotificationControlKey가 일치하는 기기가 Devices 테이블에 있는지 확인
    const targetDevice = await db.prepare(
      `SELECT id FROM Devices WHERE id = ? AND notificationControlKey = ?`
    ).bind(toDeviceId, tonotificationControlKey).first();

    if (!targetDevice) {
      return jsonResponse({
        success: false,
        message_en_US: "The target device ID or notification control key is incorrect.",
        message_ko_KR: "알림을 받을 대상 기기의 ID 또는 알림 제어 키가 잘못되었습니다."
      }, headers, 404); // 404 Not Found가 더 적절합니다.
    }

    // 4. 이미 등록된 관계인지 확인
    const existingRelation = await db.prepare(
      `SELECT id FROM DeviceRelationNoti WHERE DeviceId = ? AND toDeviceId = ?`
    ).bind(deviceId, toDeviceId).first();

    if (existingRelation) {
      return jsonResponse({
        success: true,
        message_en_US: "This device is already registered for notifications.",
        message_ko_KR: "이미 알림 대상으로 등록된 기기입니다."
      }, headers);
    }

    // 5. DeviceRelationNoti 테이블에 새로운 관계 추가
    const createdAt = returnCreatedTime();
    await db.prepare(
      `INSERT INTO DeviceRelationNoti (DeviceId, toDeviceId, created_at) VALUES (?, ?, ?)`
    ).bind(deviceId, toDeviceId, createdAt).run();

    return jsonResponse({
      success: true,
      message_en_US: "Successfully registered the device for notifications.",
      message_ko_KR: "알림 대상 기기를 성공적으로 등록했습니다."
    }, headers, 201); // 201 Created

  } catch (err: any) {
    console.error("Error in handleRegisterNotificationTarget:", err);
    return jsonResponse({ success: false, error: err.message }, headers, 500);
  }
}

/**
 * 등록된 알림 대상 기기 목록을 조회하는 핸들러
 * /api/device/notification-targets?deviceId=...&authorization=...
 */
export async function handleGetNotificationTargets(params: URLSearchParams, db: D1Database, headers: Headers) {
  // 1. 필수 파라미터 검증
  const validation = validateAndRespond(params, ['deviceId', 'authorization']);
  if (validation) return jsonResponse(validation, headers, 400);

  const deviceId = params.get('deviceId')!;
  const authorization = params.get('authorization')!;

  try {
    // 2. 요청 기기의 유효성 검증
    const requestingDevice = await db.prepare(
      `SELECT id FROM Devices WHERE id = ? AND authorization = ?`
    ).bind(deviceId, authorization).first();

    if (!requestingDevice) {
      return jsonResponse({
        success: false,
        message_en_US: "Invalid device or authorization.",
        message_ko_KR: "유효하지 않은 기기이거나 인증 정보가 잘못되었습니다."
      }, headers, 403);
    }

    // 3. DeviceRelationNoti 테이블에서 알림 대상 목록 조회
    const { results } = await db.prepare(
      `SELECT toDeviceId, created_at FROM DeviceRelationNoti WHERE DeviceId = ? ORDER BY created_at DESC`
    ).bind(deviceId).all();

    return jsonResponse({
      success: true,
      count: results.length,
      targets: results
    }, headers);

  } catch (err: any) {
    console.error("Error in handleGetNotificationTargets:", err);
    return jsonResponse({ success: false, error: err.message }, headers, 500);
  }
}

/**
 * 특정 기기의 notificationToken을 조회하는 핸들러
 * /api/device/notification-token?deviceId=...&authorization=...
 */
export async function handleGetNotificationToken(params: URLSearchParams, db: D1Database, headers: Headers) {
  // 1. 필수 파라미터 검증
  const validation = validateAndRespond(params, ['deviceId', 'authorization']);
  if (validation) return jsonResponse(validation, headers, 400);

  const deviceId = params.get('deviceId')!;
  const authorization = params.get('authorization')!;

  try {
    // 2. 요청 기기의 유효성 검증 및 토큰 조회
    const device = await db.prepare(
      `SELECT notiToken FROM Devices WHERE id = ? AND authorization = ?`
    ).bind(deviceId, authorization).first<{ notiToken: string | null }>();

    if (!device) {
      return jsonResponse({
        success: false,
        message_en_US: "Invalid device or authorization.",
        message_ko_KR: "유효하지 않은 기기이거나 인증 정보가 잘못되었습니다."
      }, headers, 403);
    }

    // 3. 토큰 반환
    return jsonResponse({
      success: true,
      notificationToken: device.notiToken
    }, headers);

  } catch (err: any) {
    console.error("Error in handleGetNotificationToken:", err);
    return jsonResponse({ success: false, error: err.message }, headers, 500);
  }
}
