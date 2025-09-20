import { jsonResponse } from '../utils';

export async function handleRecaptha(
  params: URLSearchParams,
  db: D1Database, // DB는 사용 안 하지만 시그니처 맞춤
  headers: Headers,
  secret: string
) {
  try {
    const token = params.get("g-recaptcha-response");
    
    const device = params.get('deviceId')!;
    const authorization = params.get("authorization")!;
    if (!token) {
      return jsonResponse({
        success: false,
        status: false,
        message_en_US: "Missing reCAPTCHA token",
        message_ko_KR: "reCAPTCHA 토큰이 없습니다."
      }, headers, 400);
    }
    const { results } = await db.prepare(
      `SELECT * FROM Devices WHERE id = ? and authorization = ?`
    ).bind(device, authorization).all();

      if (results?.length > 0) {
        
    // 구글 reCAPTCHA 검증
    const verifyURL = "https://www.google.com/recaptcha/api/siteverify";
    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);

    const googleRes = await fetch(verifyURL, {
      method: "POST",
      body: formData
    });

    const result = await googleRes.json<any>();

    if (result.success) {
      return jsonResponse({
        success: true,
        status: true,
        message_en_US: "reCAPTCHA verification success",
        message_ko_KR: "reCAPTCHA 인증 성공",
        data: result
      }, headers);
    } else {
      return jsonResponse({
        success: false,
        status: false,
        message_en_US: "reCAPTCHA verification failed",
        message_ko_KR: "reCAPTCHA 인증 실패",
        data: result
      }, headers, 400);
    }
      } else {
        return jsonResponse({
      success: false,
      status: false,
      message_en_US: "Invalid device id",
      message_ko_KR: "디바이스 인증키가 잘못되었어요.", 
    }, headers, 500);
      }

  } catch (err: any) {
    return jsonResponse({
      success: false,
      status: false,
      message_en_US: "Server error",
      message_ko_KR: "서버 에러가 발생했습니다.",
      error: err.message
    }, headers, 500);


    
  }
}
