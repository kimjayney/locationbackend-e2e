import { jsonResponse } from '../utils';

export async function handleHealthCheck(db: D1Database, headers: Headers) {
  try {
    const { results } = await db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='Devices' LIMIT 1`
    ).all();

    if (results?.length > 0) {
      return jsonResponse({
        success: true,
        status: true,
        message_en_US: "Operational",
        message_ko_KR: "작동 중 입니다.",
      }, headers);
    } else {
      return jsonResponse({
        success: true,
        status: false,
        message_en_US: "Database tables not found",
        message_ko_KR: "데이터베이스 테이블을 찾을 수 없습니다."
      }, headers);
    }
  } catch (error) {
    return jsonResponse({
      success: true,
      status: false,
      message_en_US: "Database connection error",
      message_ko_KR: "데이터베이스 연결 오류"
    }, headers);
  }
}
