# 실시간 강의 교안

강의마다 직접 만든 웹 교안을 한 책장에 모은 사이트입니다. PDF 업로드·자동 변환 플랫폼이 아닙니다.

- 대표 주소: https://live-lesson-book.vercel.app
- 기존 주소: https://tuilders-vibe-lab.vercel.app (계속 사용 가능)
- 두 주소는 같은 Vercel 프로젝트의 운영 배포에 연결되어, 푸시하면 함께 갱신됩니다. Firebase 강사 로그인 허용 주소에도 둘 다 등록되어 있습니다.
- 정적 HTML/CSS/JS, 빌드 없음. `npm run dev`로 미리보기.
- 틸더스는 상시 공개. 교안과 실습을 순서대로 읽고, 오른쪽에서 필요한 사이트와 복사 자료를 사용합니다.
- 구글 강사 로그인 / Firestore 진행 전달은 기존 권한을 사용합니다. 새 교안은 `live/course-교안ID`로 진행 상태를 분리합니다.
- 연수자 화면은 1280×720(16:9) 화면을 축소한 확인 창입니다. 목차와 링크 배치는 실제 연수자 화면과 같으며, 강의 중에는 Firestore에서 전달이 확인된 위치를 보여 줍니다. 현재 강사 위치와 전달 위치가 같은지 표시합니다. 참여자 개별 화면이나 외부 사이트 탭을 수집하는 기능은 아닙니다.

## 새 강의를 만들 때

1. PDF/PPT를 참고해서 **그 강의의 설명·실습·사이트 링크·프롬프트를 직접 작성**합니다. 원본 슬라이드만 자동으로 넘기는 교안을 만들지 않습니다.
2. `courses/<교안ID>.js`에 강의별 내용과 순서를 작성합니다. 틸더스의 예는 `courses/tuilders.js`와 `app.js`입니다. `loadCourse()`가 반환하는 내용은 아래 형식입니다.
3. `catalog.json`에 표지 제목·부제·소개·공개 여부와 강의 파일을 추가합니다. 책장에는 실제 완성된 강의만 등록합니다.
4. 링크·복사·실습 순서·모바일·연수자 예상 화면을 확인한 뒤 커밋하고 푸시합니다.

```js
export async function loadCourse() {
  return {
    chapters: [{id:'intro',title:'시작하기',page:1,sites:[['실습 사이트','https://example.com']],clips:[]}],
    pages: [{n:1,title:'교안 제목',chapter:'intro',image:'courses/sample/001.webp',width:1600,height:900,
      links:[{label:'실습 열기',url:'https://example.com'}]}],
    activities: [{id:'practice-1',chapter:'intro',afterPage:1,title:'직접 만들어 보기',
      html:'<p>이 강의에 맞게 직접 작성한 실습 설명</p>',sites:[['실습 사이트','https://example.com']],
      clips:[['복사할 프롬프트','이 강의에서 사용할 프롬프트']]}]
  };
}
```

상시 공개 항목은 `access: "public"`, `module: "courses/<교안ID>.js"`로 연결합니다. 표지에는 `title`, `subtitle`, `description`, `label`, `pages`, `color`(forest/blue/clay)를 사용합니다.

## 비밀번호 교안

비밀번호 창만 씌우고 본문 파일을 공개하지 않습니다. 작성한 교안의 JSON(이미지는 base64 data URL 포함)을 배포 폴더 **밖**에서 준비하고 `python tools/encrypt-course.py <원본JSON> courses/<교안ID>.locked.json`으로 암호화합니다. 비밀번호는 터미널에 보이지 않게 입력하며 저장하지 않습니다. Python `cryptography`가 필요합니다.

책장 항목에 `access: "private"`, `file: "courses/<교안ID>.locked.json"`을 지정하고 `module`은 넣지 않습니다. 브라우저에서 PBKDF2-SHA256 600,000회와 AES-256-GCM으로 본문을 엽니다. 틀린 비밀번호와 변조된 파일은 열리지 않습니다. 비밀번호나 복호화 내용은 localStorage에 저장하지 않으며 책장으로 돌아가면 해제합니다. 강사 계정도 비밀번호를 거쳐 입장합니다.

원본 JSON·이미지·PDF/PPT를 공개 저장소나 배포 폴더에 넣지 않습니다. 원본은 `private-source/`처럼 제외된 폴더 또는 사이트 바깥에 둡니다. 암호화는 공유 비밀번호 방식이므로 이미 내용을 열어 본 사람의 복사를 막거나 개인별 접근을 회수하는 기능은 아닙니다.

## 틸더스 교안 편집

- 104장: `slides.json`와 `slides/*.webp`
- 직접 작성한 설명·실습·링크·프롬프트: `app.js`
- 실습 삽입 위치와 강의 흐름: `courses/tuilders.js`의 `practiceAfter`
- 복원한 원본 링크: `courses/tuilders-links.json`. 원본 이미지의 링크와 함께, 각 장 아래 실제 링크와 오른쪽 관련 자료를 제공합니다.
- 기존 `#deck`, `#c1` 등의 주소도 틸더스의 해당 위치로 연결됩니다.

실습 색상과 같은 공통 모양은 `style.css`, 책장·읽기·예상 화면은 `reader.js`, 기존 강사 인증과 진행 전달은 `realtime.js`에 있습니다. 새 강의의 내용이 늘어나도 기존 강의를 고치지 않습니다.

## 강사 사용

책장에서 강의를 열고 강사 로그인 → 강의 시작. 강사가 읽는 교안·실습 위치가 이 강의의 참여자에게 전달됩니다. 연수자는 '자유롭게 읽기'와 '강사 따라가기'를 고를 수 있습니다. 강의 종료 후에도 공개 교안은 계속 읽을 수 있습니다. 책장으로 돌아가거나 예상 화면을 켜고 끄는 동작은 다른 사람의 화면을 변경하지 않습니다.

현재 온라인 강사 로그인과 Firestore 쓰기 검증은 실제 강의를 시작하므로 자동 UI 검증에서 수행하지 않습니다. 변경된 화면과 인증 실패·암호화·읽기·복사·목차·예상 화면은 별도로 확인합니다.
