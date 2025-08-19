import { validateAndRespond, returnCreatedTime, interpolateSQL } from '../utils';

export async function handleUpdate(params: URLSearchParams, db: D1Database, headers: Headers, request: Request) {
  const validation = validateAndRespond(params, ['device', 'authorization', 'lat', 'lng', 'iv']);
  if (validation) return new Response(JSON.stringify(validation), { headers });

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
      "INSERT INTO AuditLogs(query, created_at, device_id_v2) VALUES(?, ?, ?)",
      [actualSql, new Date().toISOString(), device]
    );
    await db.exec(auditSql);
    
    return new Response("201");
  } else {
    return new Response("not");
  }
}
