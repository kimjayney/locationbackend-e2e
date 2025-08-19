# Location Backend - 코드 구조

이 프로젝트는 위치 기반 서비스를 위한 Cloudflare Workers 백엔드입니다.

## 📁 파일 구조

```
src/
├── index.ts              # 메인 엔트리포인트
├── types.ts              # 타입 정의
├── constants.ts          # 상수 및 설정
├── utils.ts              # 유틸리티 함수들
├── handlers/             # API 핸들러들
│   ├── index.ts         # 핸들러 export
│   ├── device.ts        # 기기 등록 관련
│   ├── health.ts        # 헬스체크
│   ├── location.ts      # 위치 업데이트
│   ├── view.ts          # 위치 조회
│   └── share.ts         # 공유 관련 기능
└── README.md            # 이 파일
```

## 🔧 각 파일의 역할

### `types.ts`
- `Env`: 환경 변수 및 데이터베이스 바인딩 타입
- `ApiResponse`: API 응답 표준 형식
- `ValidationError`: 검증 오류 응답 형식

### `constants.ts`
- `LENGTH_LIMITS`: 입력 데이터 길이 제한
- `ALLOWED_ORIGINS`: CORS 허용 오리진
- `API_ROUTES`: API 엔드포인트 경로

### `utils.ts`
- `jsonResponse`: JSON 응답 생성
- `createHeaders`: CORS 헤더 생성
- `validateLength`: 입력 길이 검증
- `validateAndRespond`: 파라미터 검증
- `returnCreatedTime`: 생성 시간 생성
- `adjustTime`: 타임존 조정
- `interpolateSQL`: SQL 보간

### `handlers/`
각 API 엔드포인트별로 분리된 핸들러들:
- **device.ts**: 기기 등록 (`/api/device/register`)
- **health.ts**: 헬스체크 (`/api/healthcheck`)
- **location.ts**: 위치 업데이트 (`/api/update`)
- **view.ts**: 위치 조회 (`/api/view`)
- **share.ts**: 공유 상태/제어 (`/api/sharestatus`, `/api/sharecontrol`)

## 🚀 사용법

메인 파일에서 각 핸들러를 import하여 사용:

```typescript
import { handleRegister } from './handlers';

// API 라우팅
switch (pathname) {
  case "/api/device/register":
    return await handleRegister(params, db, headers);
  // ... 기타 라우트
}
```

## ✨ 장점

1. **모듈화**: 각 기능별로 파일이 분리되어 관리가 용이
2. **재사용성**: 유틸리티 함수들을 다른 핸들러에서 재사용 가능
3. **타입 안전성**: TypeScript를 활용한 강력한 타입 체크
4. **가독성**: 코드가 명확하게 구조화되어 이해하기 쉬움
5. **유지보수성**: 특정 기능 수정 시 해당 파일만 수정하면 됨
