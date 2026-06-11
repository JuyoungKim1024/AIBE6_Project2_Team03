# AGENTS.md

## Common

- 답변은 한국어로 짧고 명확하게 작성한다.
- 요청한 범위만 수정한다.
- 대규모 리팩토링은 먼저 제안만 하고 바로 진행하지 않는다.
- 기존 폴더 구조와 코드 스타일을 유지한다.
- 필요한 파일만 수정한다.
- 새 라이브러리는 꼭 필요할 때만 추가한다.
- 민감정보, API 키, 토큰, 비밀번호는 코드에 직접 작성하지 않는다.
- 추측으로 수정하지 말고 관련 파일을 먼저 확인한다.
- 작업 결과는 수정 파일, 핵심 변경사항, 실행 방법 순서로 짧게 요약한다.

## Repository Structure

- `frontend/`: Next.js frontend
- `backend/`: Spring Boot backend

## Frontend Rules

- frontend는 `frontend/` 폴더 기준으로 작업한다.
- Next.js 기준으로 작성한다.
- TypeScript 사용을 우선한다.
- 기존 컴포넌트 구조를 유지한다.
- UI 변경 시 기존 디자인 흐름을 최대한 유지한다.
- 불필요한 상태 관리 라이브러리는 추가하지 않는다.
- API 호출 로직은 중복을 줄이고 재사용 가능하게 작성한다.
- 환경변수는 `.env.local` 또는 프로젝트의 기존 환경변수 방식을 따른다.

## Backend Rules

- backend는 `backend/` 폴더 기준으로 작업한다.
- Spring Boot 4.0.6 기준으로 작성한다.
- JDK 21 기준으로 작성한다.
- Gradle 설정은 기존 방식을 유지한다.
- Controller, Service, Repository 역할을 분리한다.
- Entity와 DTO를 무분별하게 섞지 않는다.
- API 응답 구조는 일관성 있게 유지한다.
- DB 변경이 필요하면 SQL 또는 migration 변경사항을 함께 제안한다.
- 환경변수와 민감정보는 application 설정 파일에 직접 하드코딩하지 않는다.

## Full-stack Rules

- frontend와 backend를 함께 수정할 때는 API 요청/응답 형식을 먼저 맞춘다.
- API 경로, request body, response body가 서로 일치하는지 확인한다.
- 한쪽만 수정해서 다른 쪽이 깨지지 않도록 관련 파일을 함께 확인한다.
- CORS, 인증, 토큰 관련 변경은 영향 범위를 짧게 설명한다.

## Code Style

- 코드는 간결하게 작성한다.
- 주석은 복잡한 로직에만 최소한으로 작성한다.
- 사용하지 않는 import, 변수, 함수는 제거한다.
- 예외 처리는 숨기지 말고 명확하게 처리한다.
- 테스트가 있으면 관련 테스트 실행 방법을 적는다.

## Output Format

- 수정한 파일 목록
- 핵심 변경사항
- 실행 또는 테스트 방법
