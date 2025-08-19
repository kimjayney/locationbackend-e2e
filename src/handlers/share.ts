import { jsonResponse, validateAndRespond, interpolateSQL } from '../utils';

export async function handleShareStatus(params: URLSearchParams, db: D1Database, headers: Headers) {
  const device = params.get('device'); 
  const authorization = params.get('authorization');

  const { results } = await db.prepare(
    `SELECT * FROM Devices WHERE id = ? and authorization = ?`
  ).bind(device, authorization).all();
  
  if (results?.length > 0) {
    return jsonResponse({
      success: true,
      status: false,
      message_en_US: String(results[0].share_location),
      message_ko_KR: String(results[0].share_location)
    }, headers);
  } else {
    return jsonResponse({
      success: true,
      status: false,
      message_en_US: "Device auth code problem.",
      message_ko_KR: "디바이스 인증 코드가 잘못되었어요."
    }, headers);
  }
}

export async function handleShareControl(params: URLSearchParams, db: D1Database, headers: Headers) {
  const validation = validateAndRespond(params, ['device', 'authorization', 'shareControlKey']);
  if (validation) return jsonResponse(validation, headers);
  
  const device = params.get('device')!; 
  const authorization = params.get('authorization')!;
  const sharecontrol = params.get('share');
  const shareControlKey = params.get('shareControlKey')!;

  const { results } = await db.prepare(
    `SELECT * FROM Devices WHERE id = ? and authorization = ? and shareControlKey = ?`
  ).bind(device, authorization, shareControlKey).all();
  
  if (results?.length === 0) {
    return jsonResponse({
      success: true,
      status: false,
      message_en_US: "Device auth code problem.",
      message_ko_KR: "디바이스 인증 코드가 잘못되었어요."
    }, headers);
  }
  
  let setShareControl: number;
  if (sharecontrol === '1') {
    setShareControl = 1;
  } else if (sharecontrol === '0') {
    setShareControl = 0;
  } else {
    return jsonResponse({
      success: false,
      status: false,
      message_en_US: "Invalid shareControl parameter. Only 0 or 1.",
      message_ko_KR: "shareControl 제어 값이 잘못 되었어요."
    }, headers);
  }
  
  const sql = `UPDATE Devices SET share_location = ? WHERE id = ?`;
  const boundValues = [setShareControl, device];
  
  await db.prepare(sql).bind(...boundValues).all();
  
  // 감사 로그 생성
  const actualSql = interpolateSQL(sql, [...boundValues]);
  const auditSql = interpolateSQL(
    "INSERT INTO AuditLogs(query, created_at, device_id_v2) VALUES(?, ?, ?)",
    [actualSql, new Date().toISOString(), device]
  );
  await db.exec(auditSql);
  
  return jsonResponse({
    success: true,
    status: true,
    message_en_US: "Success.",
    message_ko_KR: "shareControl 이 설정 되었어요."
  }, headers);
}
