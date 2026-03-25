# Phase snapshots

- `phase1`: 최소 제출본(기본 기능)
- `phase2`: 안정화/테스트 보완본
- `phase3`: 심화본(현재 작업)

사용법:
- `npm run phase:load -- phase1`
- `npm run phase:load -- phase2`
- `npm run phase:load -- phase3`

위 명령은 지정한 단계의 폴더 내용을 현재 프로젝트 루트(`src`, `tests`, `index.html`, `style.css`,
`package.json`, `README.md`)에 반영합니다.
