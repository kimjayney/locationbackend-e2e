
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

export default {
	async fetch(request: Request, env: Env) {
	  const { pathname } = new URL(request.url);
	  const url = new URL(request.url)
	  const params = new URLSearchParams(url.search)
	  const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    })
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
        `SELECT lat, lng, created_at, iv FROM Locations LIMIT 1,1`
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
      
      const { results } = await env.DB.prepare(
        `SELECT * FROM Devices WHERE id = ? and authorization = ?`
      ).bind(device, authorization).all();
      
      if (results?.length > 0) {
        const { results } = await env.DB.prepare(
          "INSERT INTO Locations(DeviceId, lat, lng, created_at, iv) VALUES(?, ?, ?, ?, ?)"
        )
        .bind(device, lat, lng, created_at, iv )
        .all();
        return new Response("201");
      } else {
        // not auth
        return new Response("not");
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
        let timeInterval = "";  // default to all intervals
        if (params.has("timeInterval")) {
          const minutes = parseInt(params.get("timeInterval") ?? '0');
          timeInterval = `AND created_at > datetime('now', '-${minutes} minutes')`;
        }
        if (params.has("dateRange")) {
          timeInterval = `AND created_at between ${params.get("startDate")} and ${params.get("endDate")}`
        }
        const { results } = await env.DB.prepare(
          `SELECT lat, lng, created_at, iv FROM Locations WHERE DeviceId = ? ${timeInterval} ORDER BY created_at DESC`
        ).bind(device).all();
        
        return new Response(JSON.stringify({
          success: true, 
          status: true,
          message_en_US:"Service",
          message_ko_KR: "Service ",
          data: results
        }), {headers})
        
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
  
  