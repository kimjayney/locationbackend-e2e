
export interface Env {
	DB_LOCAL: D1Database;
	DB_CI: D1Database;
	DB_PROD: D1Database;
}

// 길이 제한 상수 (AES-CBC-256 암호화 데이터 고려)
const LENGTH_LIMITS = {
  DEVICE_ID: 40,           // 기기 ID 최대 길이
  AUTHORIZATION: 15,        // 인증 코드 최대 길이
  SHARE_CONTROL_KEY: 100,  // 공유 제어 키 최대 길이
  LAT: 120,                // 위도 (AES-CBC-256 암호화 + Base64, 최대 ~88자)
  LNG: 120,                // 경도 (AES-CBC-256 암호화 + Base64, 최대 ~88자)
  IV: 24,                  // 초기화 벡터 (16바이트 = Base64 24자)
  IP_ADDR: 45              // IP 주소 (IPv6 최대)
};

// 길이 검증 함수
function validateLength(value: string | null, maxLength: number, fieldName: string): string | null {
  if (!value) return null;
  if (value.length > maxLength) {
    throw new Error(`${fieldName} 길이가 너무 깁니다. 최대 ${maxLength}자까지 허용됩니다.`);
  }
  return value;
}

// 길이 검증 및 에러 응답 생성 함수
function validateAndRespond(params: URLSearchParams, requiredFields: string[]): { [key: string]: string } | null {
  const validated: { [key: string]: string } = {};
  
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
      
      // 길이 검증
      switch (field) {
        case 'device':
          validated[field] = validateLength(value, LENGTH_LIMITS.DEVICE_ID, 'Device ID') || '';
          break;
        case 'authorization':
          validated[field] = validateLength(value, LENGTH_LIMITS.AUTHORIZATION, 'Authorization') || '';
          break;
        case 'shareControlKey':
          validated[field] = validateLength(value, LENGTH_LIMITS.SHARE_CONTROL_KEY, 'Share Control Key') || '';
          break;
        case 'lat':
          validated[field] = validateLength(value, LENGTH_LIMITS.LAT, 'Latitude') || '';
          break;
        case 'lng':
          validated[field] = validateLength(value, LENGTH_LIMITS.LNG, 'Longitude') || '';
          break;
        case 'iv':
          validated[field] = validateLength(value, LENGTH_LIMITS.IV, 'IV') || '';
          break;
        default:
          validated[field] = value;
      }
    }
    return null; // 검증 성공
  } catch (error) {
    return {
      success: false,
      message_en_US: error instanceof Error ? error.message : 'Validation error',
      message_ko_KR: '데이터 검증 오류가 발생했습니다.'
    };
  }
}
 
export async function getIP(): Promise<string> {
  const response = await fetch('https://api.ipify.org');
  const ipAddress = await response.text();
  return ipAddress;
}
function returnCreatedTime(expire_year = 0) {
  var today = new Date();
  var year = today.getFullYear() + expire_year;
  var month = ('0' + (today.getMonth() + 1)).slice(-2);
  var day = ('0' + today.getDate()).slice(-2);
  var hours = ('0' + today.getHours()).slice(-2); 
  var minutes = ('0' + today.getMinutes()).slice(-2);
  var seconds = ('0' + today.getSeconds()).slice(-2); 
  var dateString = year + '-' + month  + '-' + day;
  var timeString = hours + ':' + minutes  + ':' + seconds;
  return `${dateString} ${timeString}`
}

function adjustTime(inputTime, timezone) {
  // 입력된 시간을 Date 객체로 변환합니다.
  const inputDate = new Date(inputTime);

  // 타임존을 기준으로 UTC와의 차이를 계산합니다. (예: UTC+9 -> 9, UTC-5 -> -5)
  const timeZoneOffsetHours = timezone;

  // 타임존 차이를 밀리초 단위로 변환합니다.
  const timeAdjustment = timeZoneOffsetHours * 60 * 60 * 1000;

  // 입력된 시간에서 타임존 차이만큼을 빼줍니다.
  const adjustedTime = new Date(inputDate.getTime() - timeAdjustment);

  // 조정된 시간을 원하는 형식("YYYY-MM-DD HH:mm:ss")으로 문자열로 변환하여 반환합니다.
  const adjustedTimeString = adjustedTime.toISOString().slice(0, 19).replace('T', ' ');
  return adjustedTimeString;
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
type QueryMetadata= {
  query : string
  deviceId : string,
  authCode : string
}



export default {
	async fetch(request: Request, env: Env) {
	  const { pathname } = new URL(request.url);
	  const url = new URL(request.url)
	  const params = new URLSearchParams(url.search)
    const allowedOrigins = [
      "https://jayneycoffee.location.rainclab.net",
      "http://localhost:8000"
    ];


function authorizedPromiseReturn(metadata: QueryMetadata ) {
 // Work on progress 
  let authPromise = (deviceId, authCode) => new Promise((resolve, reject) => {
    return env.DB_LOCAL.prepare("SELECT * FROM Devices WHERE id = ? and authorization = ?").bind(deviceId, authCode).all().then(
      (row) => {resolve(row.results)} , 
      (err) => {reject(err)}
    );
  }) 
  let authPromiseResolved = () => {

  }
  let authPromiseRejected = () => {
    return new Response(JSON.stringify({
          success: false, 
          status: false,
          message_en_US:"failed",
          message_ko_KR: "실패", 
        }), {headers})
  }
  authPromise(metadata.deviceId, metadata.authCode).then(authPromiseResolved, authPromiseRejected)
  
}


    const origin = request.headers.get("Origin");
    
	  let headers = new Headers({
      // "Access-Control-Allow-Origin": "https://jayneycoffee.location.rainclab.net", // Access-Control-Allow-Origin...뭘로고칠까..?ㅠㅠ
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    })
    if (origin && allowedOrigins.includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
    // if (allowedOrigins.includes(origin)) {
    //   headers.setHeader("Access-Control-Allow-Origin", origin);
    // }
    
    if (pathname === "/main") {

    }
    
    if (pathname === "/api/device/setShareControlKey") {
      const device = params.get('device'); 
      const authorization = params.get("authorization")
    }
    
    if (pathname === "/api/device/register") {
      // 길이 검증
      const validation = validateAndRespond(params, ['device', 'authorization', 'shareControlKey']);
      if (validation) {
        return new Response(JSON.stringify(validation), { headers });
      }
      
      const device = params.get('device')!; 
      const authorization = params.get("authorization")!;
      const shareControlKey = params.get("shareControlKey")!;
      
      // device ID 형식 검증 (기존 로직 유지)
      if (!/^[a-zA-Z0-9]{1,20}$/.test(device)) {
        return new Response(JSON.stringify({
          success: false, 
          status: false,
          message_en_US: "Invalid device ID format",
          message_ko_KR: "잘못된 기기 ID 형식입니다."
        }), {headers})
      }
      
      const { results } = await env.DB_LOCAL.prepare(
        `SELECT * FROM Devices WHERE id = ?`
      ).bind(device).all();
      if(results?.length > 0) {
        return new Response(JSON.stringify({
          success: true, 
          status: false,
          message_en_US:"Already registered",
          message_ko_KR: "이미 등록된 기기입니다.", 
        }), {headers})
      } else {
        const created_at = returnCreatedTime()
        const expired_at = returnCreatedTime(10)
        const { results } = await env.DB_LOCAL.prepare(
          "INSERT INTO Devices(id, is_enabled, created_at, expired_at, authorization,shareControlKey) VALUES(?, ?, ?, ?, ?,?)"
        )
        .bind(device, 'true', created_at, expired_at, authorization, shareControlKey)
        .all()
        const { resultsTableCreate } = await env.DB_LOCAL.prepare(
          `CREATE TABLE Locations_${device} (
          id integer PRIMARY KEY AUTOINCREMENT, 
          DeviceId VARCHAR(40), 
          lat TEXT, 
          lng TEXT , 
          IV TEXT, 
          created_at DATETIME,
          ip_addr VARCHAR(40),
          FOREIGN KEY (DeviceId) REFERENCES Devices(id) ON DELETE CASCADE ON UPDATE CASCADE ON INSERT RESTRICT
          )`).all()
        if (resultsTableCreate) {
          return new Response(JSON.stringify({
          success: false, 
          status: false,
          message_en_US:"Success",
          message_ko_KR: "뭔가 안된듯", 
        }), {headers})
        }
        return new Response(JSON.stringify({
          success: true, 
          status: true,
          message_en_US:"Success",
          message_ko_KR: "기기가 등록되었어요. 인증번호를 기억해주세요.", 
        }), {headers})
      } 
    }
    
    if (pathname === "/api/healthcheck") {
      try {
        // 간단한 테이블 존재 여부 확인
        const { results } = await env.DB_LOCAL.prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='Devices' LIMIT 1`
        ).all();
        
        if(results?.length > 0)  {
          return new Response(JSON.stringify({
            success: true, 
            status: true,
            message_en_US:"Operational",
            message_ko_KR: "작동 중 입니다.", 
          }), {headers})
        } else {
          return new Response(JSON.stringify({
            success: true, 
            status: false,
            message_en_US:"Database tables not found",
            message_ko_KR: "데이터베이스 테이블을 찾을 수 없습니다."
          }), {headers})
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: true, 
          status: false,
          message_en_US:"Database connection error",
          message_ko_KR: "데이터베이스 연결 오류"
        }), {headers})
      }
    }

	  if (pathname === '/api/update') {
      // 길이 검증
      const validation = validateAndRespond(params, ['device', 'authorization', 'lat', 'lng', 'iv']);
      if (validation) {
        return new Response(JSON.stringify(validation), { headers });
      }
      
      const device = params.get('device')!; 
      const authorization = params.get('authorization')!;
      const lat = decodeURIComponent(params.get('lat')!);
      const lng = decodeURIComponent(params.get('lng')!);  
      const iv = params.get("iv")!;
      const created_at = returnCreatedTime()
      var host = request.headers.get('CF-Connecting-IP')

      const { results } = await env.DB_LOCAL.prepare(
        `SELECT * FROM Devices WHERE id = ? and authorization = ?`
      ).bind(device, authorization).all();
      
      if (results?.length > 0) {
        const sql = `INSERT INTO Locations_${device}(DeviceId, lat, lng, created_at, iv, ip_addr) VALUES(?, ?, ?, ?, ?, ?)`;
        const boundValues = [device, lat, lng, created_at, iv, host];
        // 2. Run Location script
        const { results } = await env.DB_LOCAL.prepare(sql).bind(...boundValues).all();
        const actualSql = interpolateSQL(sql, [...boundValues]);
        // Audit purpose SQL Generate
        const auditSql = interpolateSQL(
          "INSERT INTO AuditLogs(query, created_at,device_id_v2) VALUES(?, ?, ?)",
          [actualSql, new Date().toISOString(), device]
        ); 
        // SQL Audit script Logging
        await env.DB_LOCAL.exec(auditSql);

        // 5. Response Process
        if (results?.length > 0) {
          return new Response("201"); 
        }
        return new Response("201"); // 성공 시 기본 응답
         
      } else {
        // not auth
        return new Response("not");
      }
    }

    if (pathname === '/api/sharestatus') {
      const device = params.get('device'); 
      const authorization = params.get('authorization') 

      const { results } = await env.DB_LOCAL.prepare(
        `SELECT * FROM Devices WHERE id = ? and authorization = ?`
      ).bind(device, authorization).all();
      
      if (results?.length > 0 ) {
        return new Response(JSON.stringify({
          success: true, 
          status: false,
          message_en_US: results[0].share_location,
          message_ko_KR: results[0].share_location
        }), {headers})

      } else {
        return new Response(JSON.stringify({
          success: true, 
          status: false,
          message_en_US:"Device auth code problem.",
          message_ko_KR: "디바이스 인증 코드가 잘못되었어요. "
        }), {headers})
      }
    }
    if (pathname === '/api/sharecontrol') {
      // 길이 검증
      const validation = validateAndRespond(params, ['device', 'authorization', 'shareControlKey']);
      if (validation) {
        return new Response(JSON.stringify(validation), { headers });
      }
      
      const device = params.get('device')!; 
      const authorization = params.get('authorization')!;
      const sharecontrol = params.get('share');
      const shareControlKey = params.get('shareControlKey')!;

      const { results } = await env.DB_LOCAL.prepare(
        `SELECT * FROM Devices WHERE id = ? and authorization = ? and shareControlKey = ?`
      ).bind(device, authorization, shareControlKey).all();
      
      if (results?.length > 0 ) {
        let setShareControl;
        if (sharecontrol === '1') {
          setShareControl = 1;
        } else if (sharecontrol === '0') {
          setShareControl = 0;
        } else {
          return new Response(JSON.stringify({
            success: false, 
            status: false,
            message_en_US:"invalid shareControl parameter. only 0 or 1.",
            message_ko_KR: "shareControl 제어 값이 잘못 되었어요."
          }), {headers})
        } 
        const sql = `UPDATE Devices set share_location = ? where id = ?`;
        const boundValues = [setShareControl, device];
        // 2. Run Location script
        const { results } = await env.DB_LOCAL.prepare(sql).bind(...boundValues).all();
        const actualSql = interpolateSQL(sql, [...boundValues]);
        // Audit purpose SQL Generate
        const auditSql = interpolateSQL(
          "INSERT INTO AuditLogs(query, created_at,device_id_v2) VALUES(?, ?, ?)",
          [actualSql, new Date().toISOString(), device]
        );

        // SQL Audit script Logging
        await env.DB_LOCAL.exec(auditSql); 
        return new Response(JSON.stringify({
            success: true, 
            status: true,
            message_en_US:"Success.",
            message_ko_KR: "shareControl 이 설정 되었어요."
          }), {headers})

      } else {
        return new Response(JSON.stringify({
          success: true, 
          status: false,
          message_en_US:"Device auth code problem.",
          message_ko_KR: "디바이스 인증 코드가 잘못되었어요. "
        }), {headers})
      }
    }
    if (pathname === '/api/view') {
      const device = params.get('device'); 
      const order = params.get("order")
      const authorization = params.get('authorization')
      const { results } = await env.DB_LOCAL.prepare(
        `SELECT * FROM Devices WHERE id = ? and authorization = ?`
      ).bind(device, authorization).all();
      
      if (results?.length > 0 ) {
        if (results[0].share_location == 1) {
        let timeInterval = "";  // default to all intervals
        let bindParams = [device]; // 기본 파라미터는 device만
        
        if (params.has("timeInterval")) {
          const minutes = parseInt(params.get("timeInterval") ?? '0');
          if (isNaN(minutes) || minutes < 0 || minutes > 10080) { // 1주일 제한
            return new Response(JSON.stringify({
              success: false,
              status: false,
              message_en_US: "Invalid timeInterval parameter",
              message_ko_KR: "잘못된 시간 간격 파라미터입니다."
            }), {headers})
          }
          timeInterval = `AND created_at > datetime('now', '-' || ? || ' minutes')`;
          bindParams.push(minutes);
        }
        
        if (params.has("startDate")) { 
          const startDate = adjustTime(params.get("startDate"), params.get("timezone"));
          const endDate = adjustTime(params.get("endDate"), params.get("timezone")); 
          console.log(startDate, endDate)
          timeInterval = `AND created_at BETWEEN ? AND ?`;
          bindParams.push(startDate, endDate);
          console.log(timeInterval)
        }
        let deviceExistQuery=`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ?` 
        const tableResults = await env.DB_LOCAL.prepare(deviceExistQuery).bind(`%${device}%`).all(); 
        if (tableResults.results.length > 0 ) {
          const { results } = await env.DB_LOCAL.prepare(
            `SELECT lat, lng, created_at, iv, ip_addr FROM Locations_${device} WHERE DeviceId = ? ${timeInterval} ORDER BY created_at DESC`
          ).bind(...bindParams).all();
          return new Response(JSON.stringify({
            success: true,
            status: true,
            message_en_US: "Service",
            message_ko_KR: "Service , this is new user",
            data: results
          }), { headers });
        } else {
            const {results } = await env.DB_LOCAL.prepare(
              `SELECT lat, lng, created_at, iv, ip_addr FROM Locations WHERE DeviceId = ? ${timeInterval} ORDER BY created_at DESC`
            ).bind(...bindParams).all();
            return new Response(JSON.stringify({
              success: true,
              status: true,
              message_en_US: "Service",
              message_ko_KR: "Service , this is old user", 
              data: results 
            }), { headers });
          } 
        } else {
            return new Response(JSON.stringify({
              success: false, 
              status: false,
              message_en_US:"Location Sharing is disabled by user.",
              message_ko_KR: "디바이스 사용자가 위치 공유 기능을 잠시 끈 상태입니다."
          }), {headers})
        }
        
        
        // return new Response(JSON.stringify(results), {headers})
      } else { 
        return new Response(JSON.stringify({
          success: true, 
          status: false,
          message_en_US:"Device auth code problem.",
          message_ko_KR: "디바이스 인증 코드가 잘못되었어요. "
        }), {headers})
      }

      
    }
  
	  return new Response(
		  `jayney-coffee${pathname}`
	  );
	},
  };
  
  
