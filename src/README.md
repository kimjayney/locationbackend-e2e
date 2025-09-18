# Location Backend - 코드 구조
 
### `handlers/`
각 API 엔드포인트별로 분리된 핸들러들:
- **device.ts**: 기기 등록 (`/api/device/register`)
- **health.ts**: 헬스체크 (`/api/healthcheck`)
- **location.ts**: 위치 업데이트 (`/api/update`)
- **view.ts**: 위치 조회 (`/api/view`)
- **share.ts**: 공유 상태/제어 (`/api/sharestatus`, `/api/sharecontrol`)
 
