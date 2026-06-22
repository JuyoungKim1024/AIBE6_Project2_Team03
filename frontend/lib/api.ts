const configuredApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;

if (!configuredApiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.");
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");
