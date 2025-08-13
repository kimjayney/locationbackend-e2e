# locationbackend-e2e

- 암호화 된 값이 디비에 들어올것이며, 디바이스의 Authorization 코드와 일치하면 암호화된 위치를 Return 해주는 Wrangler 코드.

# Web frontend

- https://jayneycoffee.location.rainclab.net/

# iOS

- https://github.com/kimjayney/e2e-location-client-ios

# Android

- https://github.com/kimjayney/e2e-location-client-android
- 직접 본인이 Android studio 통해 컴파일 해서 사용 필요

# CI/CD

- Cloudflare Pages
- Cloudflare Wrangler

# Tail

```
wrangler tail
```

# Deploy

```
wrangler deploy
```

# Local Debug

```
wrangler dev --local
```

# Release Log
## 2025-06-22
- Add AuditLog Feature.
- This feature will be available via Cloudflare API calls. 
- It stores raw SQL in the AuditLogs table. Of course, location data is encrypted, so it’s safe.

## 2025-08-03
- Add location table each user when registered.

## 2025-08-13 
- Add feature for control share location by user. (Completed)
