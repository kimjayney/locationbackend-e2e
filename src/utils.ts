import { ALLOWED_ORIGINS, LENGTH_LIMITS } from './constants';
import type { ApiResponse, ValidationError } from './types';

// ===== 보안 유틸리티 함수 =====
export function sanitizeDeviceId(deviceId: string): string {
  // 영문자와 숫자만 허용, 특수문자 제거
  return deviceId.replace(/[^a-zA-Z0-9]/g, '');
}

export function validateDeviceId(deviceId: string): boolean {
  // 영문자와 숫자만 허용, 길이 제한
  return /^[a-zA-Z0-9]{1,20}$/.test(deviceId);
}

// ===== 유틸리티 함수 =====
export function jsonResponse(obj: any, headers: Headers, status = 200) {
  return new Response(JSON.stringify(obj), { headers, status });
}

export function createHeaders(origin: string | null) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

export function validateLength(value: string | null, maxLength: number, fieldName: string): string | null {
  if (!value) return null;
  if (value.length > maxLength) {
    throw new Error(`${fieldName} 길이가 너무 깁니다. 최대 ${maxLength}자까지 허용됩니다.`);
  }
  return value;
}

export function validateAndRespond(params: URLSearchParams, requiredFields: string[]): ValidationError | null {
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
      message_en_US: 'Validation error',
      message_ko_KR: '데이터 검증 오류가 발생했습니다.'
    };
  }
}

export function returnCreatedTime(expire_year = 0) {
  const today = new Date();
  const year = today.getFullYear() + expire_year;
  const month = ('0' + (today.getMonth() + 1)).slice(-2);
  const day = ('0' + today.getDate()).slice(-2);
  const hours = ('0' + today.getHours()).slice(-2);
  const minutes = ('0' + today.getMinutes()).slice(-2);
  const seconds = ('0' + today.getSeconds()).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function adjustTime(inputTime: string, timezone: string) {
  const inputDate = new Date(inputTime);
  const timeZoneOffsetHours = Number(timezone) || 0;
  const timeAdjustment = timeZoneOffsetHours * 60 * 60 * 1000;
  const adjustedTime = new Date(inputDate.getTime() - timeAdjustment);
  return adjustedTime.toISOString().slice(0, 19).replace('T', ' ');
}

export function interpolateSQL(sql: string, values: any[]) {
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
