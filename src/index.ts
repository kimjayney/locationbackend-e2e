
export interface Env {
	DB: D1Database;
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
    return env.DB.prepare("SELECT * FROM Devices WHERE id = ? and authorization = ?").bind(deviceId, authCode).all().then(
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
    
    
    if (pathname === "/api/device/register") {
      const device = params.get('device'); 
      const authorization = params.get("authorization")
      const { results } = await env.DB.prepare(
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
        const { results } = await env.DB.prepare(
          "INSERT INTO Devices(id, is_enabled, created_at, expired_at, authorization) VALUES(?, ?, ?, ?, ?)"
        )
        .bind(device, 'true', created_at, expired_at, authorization)
        .all()
        const { resultsTableCreate } = await env.DB.prepare(
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
      const { results } = await env.DB.prepare(
        `SELECT lat, lng, created_at, iv FROM Locations LIMIT 0,1`
      ).all();
     
      // const ip = await getIP()
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
          message_en_US:"unavailable",
          message_ko_KR: "DB 서버에 문제가 생겼습니다. 관리자에게 문의 주세요. "
        }), {headers})
      }
      
    }

	  if (pathname === "/api/update") {
      const device = params.get('device'); 
      const authorization = params.get('authorization')

      const lat = decodeURIComponent(params.get('lat') ?? '' );
      const lng = decodeURIComponent(params.get('lng') ?? '');  
      const iv = params.get("iv")
      const created_at = returnCreatedTime()
      let a = '';  
      var host = request.headers.get('CF-Connecting-IP')

      const { results } = await env.DB.prepare(
        `SELECT * FROM Devices WHERE id = ? and authorization = ?`
      ).bind(device, authorization).all();
      
      if (results?.length > 0) {
        const sql = `INSERT INTO Locations_${device}(DeviceId, lat, lng, created_at, iv, ip_addr) VALUES(?, ?, ?, ?, ?, ?)`;
        const boundValues = [device, lat, lng, created_at, iv, host];
        // 2. Run Location script
        const { results } = await env.DB.prepare(sql).bind(...boundValues).all();
        const actualSql = interpolateSQL(sql, [...boundValues]);
        // Audit purpose SQL Generate
        const auditSql = interpolateSQL(
          "INSERT INTO AuditLogs(query, created_at,device_id_v2) VALUES(?, ?, ?)",
          [actualSql, new Date().toISOString(), device]
        ); 
        // SQL Audit script Logging
        await env.DB.exec(auditSql);

        // 5. Response Process
        if (results?.length > 0) {
          return new Response("201"); 
        }
         
      } else {
        // not auth
        return new Response("not");
      }
	  }
    if (pathname === '/api/sharecontrol') {
      const device = params.get('device'); 
      const authorization = params.get('authorization')
      const sharecontrol = params.get('share')

      const { results } = await env.DB.prepare(
        `SELECT * FROM Devices WHERE id = ? and authorization = ?`
      ).bind(device, authorization).all();
      
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
        const { results } = await env.DB.prepare(sql).bind(...boundValues).all();
        const actualSql = interpolateSQL(sql, [...boundValues]);
        // Audit purpose SQL Generate
        const auditSql = interpolateSQL(
          "INSERT INTO AuditLogs(query, created_at,device_id_v2) VALUES(?, ?, ?)",
          [actualSql, new Date().toISOString(), device]
        );

        // SQL Audit script Logging
        await env.DB.exec(auditSql); 
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
      const { results } = await env.DB.prepare(
        `SELECT * FROM Devices WHERE id = ? and authorization = ?`
      ).bind(device, authorization).all();
      
      if (results?.length > 0 ) {
        if (results[0].share_location == 1) {
        let timeInterval = "";  // default to all intervals
        if (params.has("timeInterval")) {
          const minutes = parseInt(params.get("timeInterval") ?? '0');
          timeInterval = `AND created_at > datetime('now', '-${minutes} minutes')`;
        }
        if (params.has("startDate")) { 
          const startDate = adjustTime(params.get("startDate"), params.get("timezone"));
          const endDate = adjustTime(params.get("endDate"), params.get("timezone")); 
          console.log(startDate, endDate)
          timeInterval = `AND created_at between '${startDate }' and '${endDate}'`
          console.log(timeInterval)
        }
        const { results } = await env.DB.prepare(
          `SELECT lat, lng, created_at, iv, ip_addr FROM Locations_${device} WHERE DeviceId = ? ${timeInterval} ORDER BY created_at DESC`
        ).bind(device).all();
        
        return new Response(JSON.stringify({
          success: true, 
          status: true,
          message_en_US:"Service",
          message_ko_KR: "Service ",
          data: results
        }), {headers})
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
		  "jayney-coffee"
	  );
	},
  };
  
  
