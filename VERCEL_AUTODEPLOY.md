# Vercel 자동 배포 설정

이 저장소는 `.github/workflows/vercel-production.yml` 기준으로 `main` 브랜치 push 시 자동 배포되도록 구성되어 있습니다.

GitHub Secrets에 아래 3개 값을 등록해야 실제 자동 배포가 동작합니다.

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

현재 로컬 링크 기준 정보

- `VERCEL_ORG_ID`: `team_UvBnoVxkYpMHKpKzkFu5KRdx`
- `VERCEL_PROJECT_ID`: `prj_JcrVX9sDZWLdGvrDsKTe5rtpQ6KU`

설정 방법

1. GitHub 저장소의 Settings로 이동합니다.
2. Secrets and variables > Actions를 엽니다.
3. 위 3개 시크릿을 추가합니다.
4. 이후 `main`에 push 하면 GitHub Actions가 자동으로 Vercel Production 배포를 실행합니다.

주의

- `VERCEL_TOKEN`은 Vercel 계정 토큰이므로 절대 코드에 저장하지 않습니다.
- `.vercel` 폴더는 Git에 공유하지 않는 것이 원칙입니다.
- 시크릿이 없으면 워크플로우 파일은 존재해도 자동 배포는 실패합니다.
