export interface Env {
  DB_LOCAL: D1Database;
  DB_CI: D1Database;
  DB_PROD: D1Database;
}

const LENGTH_LIMITS = {
  DEVICE_ID: 40,
  AUTHORIZATION: 40,
  SHARE_CONTROL_KEY: 100,
  LAT: 120,
  LNG: 120,
  IV: 24,
  IP_ADDR: 45,
};

const ALLOWED_ORIGINS = [
  "https://jayneycoffee.location.rainclab.net",
  "http://localhost:8000"
];

// ===== 유틸리티 함수 =====
function jsonResponse(obj: any, headers: Headers, status = 200) {
  return new Response(JSON.stringify(obj), { headers, status });
}

function createHeaders(origin: string | null) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

function validateLength(value: string | null, maxLength: number, fieldName: string): string | null {
  if (!value) return null;
  if (value.length > maxLength) {
    throw new Error(`${fieldName} 길이가 너무 깁니다. 최대 ${maxLength}자까지 허용됩니다.`);
  }
  return value;
}

function validateAndRespond(params: URLSearchParams, requiredFields: string[]) {
  try {
    for (const field of requiredFields) {
      const value = params.get(field);
      if (!value) {
        return {
          success: false,
          message_en_US: `Missing required field: ${field}`,
          message_ko_KR: `필수 필드가 누락되었습니다: ${field}`
        };
      }
      switch (field) {
        case 'device':
          validateLength(value, LENGTH_LIMITS.DEVICE_ID, 'Device ID');
          break;
        case 'authorization':
          validateLength(value, LENGTH_LIMITS.AUTHORIZATION, 'Authorization');
          break;
        case 'shareControlKey':
          validateLength(value, LENGTH_LIMITS.SHARE_CONTROL_KEY, 'Share Control Key');
          break;
        case 'lat':
          validateLength(value, LENGTH_LIMITS.LAT, 'Latitude');
          break;
        case 'lng':
          validateLength(value, LENGTH_LIMITS.LNG, 'Longitude');
          break;
        case 'iv':
          validateLength(value, LENGTH_LIMITS.IV, 'IV');
          break;
        default:
          // 기타 필드는 검증 없음
          break;
      }
    }
    return null;
  } catch (error) {
    return {
      success: false,
      message_en_US: error instanceof Error ? error.message : 'Validation error',
      message_ko_KR: '데이터 검증 오류가 발생했습니다.'
    };
  }
}

function returnCreatedTime(expire_year = 0) {
  const today = new Date();
  const year = today.getFullYear() + expire_year;
  const month = ('0' + (today.getMonth() + 1)).slice(-2);
  const day = ('0' + today.getDate()).slice(-2);
  const hours = ('0' + today.getHours()).slice(-2);
  const minutes = ('0' + today.getMinutes()).slice(-2);
  const seconds = ('0' + today.getSeconds()).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function adjustTime(inputTime, timezone) {
  const inputDate = new Date(inputTime);
  const timeZoneOffsetHours = Number(timezone) || 0;
  const timeAdjustment = timeZoneOffsetHours * 60 * 60 * 1000;
  const adjustedTime = new Date(inputDate.getTime() - timeAdjustment);
  return adjustedTime.toISOString().slice(0, 19).replace('T', ' ');
}

function interpolateSQL(sql, values) {
  const escaped = [...values];
  return sql.replace(/\?/g, () => {
    const v = escaped.shift();
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (v instanceof Date) return `'${v.toISOString()}'`;
    return v;
  });
}

// ====== 엔드포인트 핸들러 ======
async function handleRegister(params, db, headers) {
  const validation = validateAndRespond(params, ['device', 'authorization', 'shareControlKey']);
  if (validation) return jsonResponse(validation, headers);

  const device = params.get('device')!;
  const authorization = params.get("authorization")!;
  const shareControlKey = params.get("shareControlKey")!;

  if (!/^[a-zA-Z0-9]{1,20}$/.test(device)) {
    return jsonResponse({
      success: false,
      status: false,
      message_en_US: "Invalid device ID format",
      message_ko_KR: "잘못된 기기 ID 형식입니다."
    }, headers);
  }

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

    await db.prepare(
      `CREATE TABLE IF NOT EXISTS Locations_${device} (
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

async function handleHealthCheck(db, headers) {
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

async function handleUpdate(params, db, headers, request) {
  const validation = validateAndRespond(params, ['device', 'authorization', 'lat', 'lng', 'iv']);
  if (validation) return jsonResponse(validation, headers);

  const device = params.get('device')!;
  const authorization = params.get('authorization')!;
  const lat = decodeURIComponent(params.get('lat')!);
  const lng = decodeURIComponent(params.get('lng')!);
  const iv = params.get("iv")!;
  const created_at = returnCreatedTime();
  const host = request.headers.get('CF-Connecting-IP');

  const { results } = await db.prepare(
    `SELECT * FROM Devices WHERE id = ? and authorization = ?`
  ).bind(device, authorization).all();

  if (results?.length > 0) {
    const sql = `INSERT INTO Locations_${device}(DeviceId, lat, lng, created_at, iv, ip_addr) VALUES(?, ?, ?, ?, ?, ?)`;
    const boundValues = [device, lat, lng, created_at, iv, host];
    await db.prepare(sql).bind(...boundValues).all();
    const actualSql = interpolateSQL(sql, [...boundValues]);
    const auditSql = interpolateSQL(
      "INSERT INTO AuditLogs(query, created_at,device_id_v2) VALUES(?, ?, ?)",
      [actualSql, new Date().toISOString(), device]
    );
    await db.exec(auditSql);
    return new Response("201");
  } else {
    return new Response("not");
  }
}

async function handleView(params, db, headers) {
  const device = params.get('device');
  const authorization = params.get('authorization');
  const { results } = await db.prepare(
    `SELECT * FROM Devices WHERE id = ? and authorization = ?`
  ).bind(device, authorization).all();

  if (results?.length > 0) {
    if (results[0].share_location == 1) {
      let timeInterval = "";
      let bindParams = [device];
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
        const startDate = adjustTime(params.get("startDate"), params.get("timezone"));
        const endDate = adjustTime(params.get("endDate"), params.get("timezone"));
        timeInterval = `AND created_at BETWEEN ? AND ?`;
        bindParams.push(startDate, endDate);
      }
      let deviceExistQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ?`
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

// ===== 엔트리포인트 =====
export default {
  async fetch(request: Request, env: Env) {
    const db = env.DB_CI || env.DB_LOCAL || env.DB_PROD;
    const url = new URL(request.url);
    const pathname = url.pathname;
    const params = new URLSearchParams(url.search);
    const origin = request.headers.get("Origin");
    const headers = createHeaders(origin);

    if (pathname === "/api/device/register") {
      return handleRegister(params, db, headers);
    }
    if (pathname === "/api/healthcheck") {
      return handleHealthCheck(db, headers);
    }
    if (pathname === "/api/update") {
      return handleUpdate(params, db, headers, request);
    }
    if (pathname === "/api/view") {
      return handleView(params, db, headers);
    }
    // (다른 엔드포인트도 여기에 추가 가능)

    return new Response(`jayney-coffee${pathname}`, { headers });
  },
};
