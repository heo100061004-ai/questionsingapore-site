# OpenAI API 연결 가이드

## 1) OpenAI API 키 넣는 방식

### 로컬 환경에서 테스트
1. OpenAI 계정에 로그인합니다.
2. API Keys 페이지에서 새 키를 생성합니다.
3. 프로젝트 루트에 다음 내용을 담은 `.env.local` 파일을 만듭니다.

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
LLM_FALLBACK_ENABLED=true
LLM_BUDGET_USD=5
```

4. 서버를 다시 실행하면 챗봇이 OpenAI를 사용합니다.

### 배포 환경(Vercel 등)
1. 대시보드의 Environment Variables에 추가합니다.
2. 키 이름은 다음과 같이 설정합니다.
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `LLM_FALLBACK_ENABLED`
   - `LLM_BUDGET_USD`
3. 배포를 재실행합니다.

## 2) 로컬에서 테스트하는 방법

### 1단계: 서버 실행
```bash
cd /Users/heokang/Question Singapore/QuestionSingapore_New
node serve-local.js
```

브라우저에서 아래 주소로 접속합니다.
- http://127.0.0.1:8000/

### 2단계: 챗봇 테스트
- 페이지 하단의 AI 스마트 안내에서 질문을 입력합니다.
- `/api/chatbot`가 응답하는지 확인합니다.

### 3단계: API 직접 테스트
```bash
curl -X POST http://127.0.0.1:8000/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{"question":"Employment Pass 준비는 어떻게 하나요?","language":"ko","category":"employment"}'
```

## 3) 비용 최소화 설정

현재 구조는 기본적으로 비용을 최소화하도록 되어 있습니다.

### 권장 설정
- `LLM_FALLBACK_ENABLED=true` : 필요할 때만 OpenAI 사용
- `LLM_BUDGET_USD=5` : 월 예산을 낮게 설정
- 기본 응답은 FAQ/문서 기반으로 먼저 처리
- OpenAI는 실패하거나 추가 맥락이 필요할 때만 호출

### 추가로 추천하는 것
- 자주 묻는 질문은 FAQ에 먼저 넣기
- 한 번 답변한 질문은 캐시 재사용
- 운영 초기에 `gpt-4o-mini` 사용
- 민감한 정보는 입력하지 않기

## 4) 현재 동작 방식

현재 흐름은 다음 순서입니다.
1. FAQ/문서 기반으로 먼저 답변
2. 필요 시 OpenAI로 보완
3. 예산이 초과되면 자동 차단
4. 문의 신청으로 자연스럽게 연결
