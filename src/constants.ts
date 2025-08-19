// 길이 제한 상수 (AES-CBC-256 암호화 데이터 고려)
export const LENGTH_LIMITS = {
  DEVICE_ID: 40,           // 기기 ID 최대 길이
  AUTHORIZATION: 40,        // 인증 코드 최대 길이
  SHARE_CONTROL_KEY: 100,  // 공유 제어 키 최대 길이
  LAT: 120,                // 위도 (AES-CBC-256 암호화 + Base64)
  LNG: 120,                // 경도 (AES-CBC-256 암호화 + Base64)
  IV: 24,                  // 초기화 벡터 (16바이트 = Base64 24자)
  IP_ADDR: 45              // IP 주소 (IPv6 최대)
};

// 허용된 오리진 목록
export const ALLOWED_ORIGINS = [
  "https://jayneycoffee.location.rainclab.net",
  "http://localhost:8000"
];

// API 엔드포인트 경로
export const API_ROUTES = {
  DEVICE_REGISTER: "/api/device/register",
  HEALTH_CHECK: "/api/healthcheck",
  UPDATE: "/api/update",
  VIEW: "/api/view",
  SHARE_STATUS: "/api/sharestatus",
  SHARE_CONTROL: "/api/sharecontrol"
} as const;
