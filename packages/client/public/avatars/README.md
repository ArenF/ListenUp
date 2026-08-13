# 기본 아바타 이미지

회원가입 시 랜덤으로 배정되고, 프로필 페이지에서 선택할 수 있는 기본 아바타입니다.
아래 파일명으로 이미지를 이 폴더에 넣어주세요. (Vite가 `/avatars/<파일명>`으로 서빙)

| 파일명 | 내용 |
|--------|------|
| `avatar-1.png` | 악어 |
| `avatar-2.png` | 치킨 (MC Chicken) |
| `avatar-3.png` | 늑대 |

기본 아바타 목록은 `packages/client/src/lib/avatars.ts`와
`packages/server/src/services/auth.ts`의 `DEFAULT_AVATARS`에 정의되어 있습니다.
파일명을 바꾸려면 두 곳을 함께 수정하세요.
