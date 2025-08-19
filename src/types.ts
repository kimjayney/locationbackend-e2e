export interface Env {
  DB_LOCAL: D1Database;
  DB_CI: D1Database;
  DB_PROD: D1Database;
}

export interface ApiResponse {
  success: boolean;
  status: boolean;
  message_en_US: string;
  message_ko_KR: string;
  data?: any;
}

export interface ValidationError {
  success: false;
  message_en_US: string;
  message_ko_KR: string;
}
