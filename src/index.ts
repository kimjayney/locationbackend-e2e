import type { Env } from './types';
import { API_ROUTES } from './constants';
import { createHeaders } from './utils';
import {
  handleRegister,
  handleHealthCheck,
  handleUpdate,
  handleView,
  handleShareStatus,
  handleShareControl,
  handleRecaptha,
  handleInsights
} from './handlers';

export default {
  async fetch(request: Request, env: Env) {
    const db = env.DB_CI || env.DB_LOCAL || env.DB_PROD;
    const url = new URL(request.url);
    const pathname = url.pathname;
    const params = new URLSearchParams(url.search);
    const origin = request.headers.get("Origin");
    const headers = createHeaders(origin);

    // API 라우팅
    switch (pathname) {
      case API_ROUTES.DEVICE_REGISTER:
        return await handleRegister(params, db, headers);
        
      case API_ROUTES.HEALTH_CHECK:
        return await handleHealthCheck(db, headers);
        
      case API_ROUTES.UPDATE:
        return await handleUpdate(params, db, headers, request);
        
      case API_ROUTES.SHARE_STATUS:
        return await handleShareStatus(params, db, headers);
        
      case API_ROUTES.SHARE_CONTROL:
        return await handleShareControl(params, db, headers);
        
      case API_ROUTES.VIEW:
        return await handleView(params, db, headers);

      case API_ROUTES.VERIFY:
        return await handleRecaptha(params, db, headers, env.RECAPTCHA_SECRET) 
      case API_ROUTES.INSIGHTS:
        return await handleInsights(params, db, headers)
      default:
        return new Response(`jayney-coffee${pathname}`, { headers });
    }
  },
};
