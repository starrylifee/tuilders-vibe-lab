// 6강 실습 페이지: 왼쪽 교안, 오른쪽 실습 사이트 + 복사 클립보드
// 내용은 합본 슬라이드(숨참고 Code Dive + 6강) 순서를 따른다.

const steps = (items) => `<ol class="steps">${items.map((t) => `<li>${t}</li>`).join("")}</ol>`;
const callout = (kind, html) => `<div class="callout ${kind}">${html}</div>`;
const code = (t) => `<pre class="code">${esc(t)}</pre>`;
function esc(t) { return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

const CASES = [
  ["전교 임원 후보자가 많나요? 공약 체크리스트!", "창의적체험활동", "https://gemini.google.com/share/8fee2fe8b6db"],
  ["오늘 늦잠 잔 사람 접어! 손가락접기 게임!", "모든 교과", "https://gemini.google.com/share/1a685f29e5a5"],
  ["교과서에 있는 활동을 온라인. 알뜰살뜰 경제왕 게임!", "사회", "https://gemini.google.com/share/9a5a0b6fa585"],
  ["Round 1. Action! 이모티콘 타자대결", "창의적체험활동", "https://gemini.google.com/share/048e021f676e"],
  ["강낭콩을 키우는데 뭐가 필요하더라? 민감한 강낭콩 키우기!", "과학", "https://gemini.google.com/share/8844234b9e60"],
  ["대한의 독립은 당신에게 달렸소. 달려라 독립군!", "사회, 창의적체험활동", "https://gemini.google.com/share/4d688a327baa"],
  ["우주 탐험대!", "과학", "https://gemini.google.com/share/b389c5d658bc"],
  ["AI 받아쓰기 연습!", "창의적체험활동, 국어", "https://gemini.google.com/share/c25710b49801"],
  ["3D 민주시민 시뮬레이션", "창의적체험활동, 사회, 국어", "https://gemini.google.com/share/4e09b01c1ff8"],
  ["키오스크 장단점 글쓰기 도우미", "국어", "https://gemini.google.com/share/89eacfa8e995"],
  ["AI Fitter - 나만의 스타일 시뮬레이터", "실과, 미술", "https://gemini.google.com/share/b15b4f0ab509"],
];

const P_CHECKLIST = `'학생회장 선거 후보자 체크리스트' 프로그램을 생성해 주세요.
메인 화면: "학생회장 선거 후보자 체크리스트" 제목 아래 '후보자 이름' 입력란, '메모' 입력란, '전체 결과 보기', '이전', '다음' 버튼을 포함합니다.
결과 화면: "전체 평가 결과" 제목과 "각 후보자의 평가 결과를 확인하고 최종 선택을 해보세요." 부제목을 표시하며, 저장된 후보자 정보 목록과 '체크리스트로 돌아가기' 버튼을 포함합니다.
알림: 필수 입력 누락 시 "입력이 필요합니다!" 팝업과 '확인' 버튼을 표시합니다.
각 체크리스트의 질문과 점수는 다음과 같습니다. : 7단계 점수, 실현 가능한 공약인가요?, 우리 학교에 필요한 공약인가요?, 자신감 있고 분명한 목소리로 말하나요?, 진심으로 학교를 위해 봉사하려는 마음이 느껴지나요?, 전교생을 하나로 모을 수 있는 리더십이 있나요?, 책임감과 사명감을 가지고 있나요?`;
const P_SAMHAENG = `학생이 3글자를 넣으면 인공지능을 이용해 삼행시를 만들어 주는 웹앱을 만들어 주세요.

초등학생에 어울리지 않는 글자는 받아 주지 말고, 생성하지도 마세요.`;
const P_RPS = `가상 DB를 이용한 가위바위보 게임
A가 게임방을 만들고 (제목, 비번)
B가 게임방에 들어와서 (비번 적고)
가위바위보를 하면서 그 승패를 누적하는 게임 7전 4선승제`;
const P_CHILD = `독립운동 게임인데 일본군들이 많이 나와서 쫓아가는 건데, 독립군 역할을 하고 만세나 도망가기도 해서 미션을 수행하는 거야. 빨리 못 하면 잡혀서 처음으로.`;

const SITE = {
  gemini: ["Gemini", "https://gemini.google.com"],
  aistudio: ["Google AI Studio", "https://aistudio.google.com"],
  setup: ["CLI 설치 안내", "https://tuilders-cli-setup.vercel.app"],
  apptteul: ["앱뜰", "https://apptteul.vercel.app"],
};

const TABS = [
  {
    id: "ready", label: "준비",
    html: `
      <h1>강의 전 준비</h1>
      <p class="lead">아래 세 가지가 되면 준비 끝입니다.</p>
      <div class="cards three">
        <div class="card"><span class="tag">1</span><h3>Node.js</h3><p>모두 설치합니다. <code>node --version</code>이 v22 이상이면 정상.</p></div>
        <div class="card"><span class="tag">2</span><h3>AI 코딩 도구 하나</h3><p>유료로 구독 중인 서비스의 도구를 고릅니다. Claude → Claude Code, ChatGPT → Codex, Google·구독 없음 → agy.</p></div>
        <div class="card"><span class="tag">3</span><h3>로그인까지</h3><p>연습 폴더에서 한 번 실행해 브라우저 로그인을 마칩니다.</p></div>
      </div>
      <p class="note">cmd는 시작 메뉴에서 그냥 <b>열기</b>로 엽니다(관리자 권한 필요 없음). 윈도우 노트북 기준이며, 크롬북은 이번 연수에서 다루지 않습니다.</p>
      <a class="big-link" href="https://tuilders-cli-setup.vercel.app" target="_blank" rel="noopener">CLI 설치 안내 페이지 열기 ↗</a>
      <h2>오늘 순서</h2>
      <div class="flow" id="flow"></div>`,
    sites: [SITE.setup, SITE.gemini, SITE.aistudio],
    clips: [
      ["Node.js 버전 확인", "node --version"],
      ["Claude Code 버전 확인", "claude --version"],
      ["Codex 버전 확인", "codex --version"],
      ["agy 버전 확인", "agy --version"],
      ["내 폴더로 이동", "cd %USERPROFILE%"],
    ],
  },
  {
    id: "vibe", label: "바이브코딩",
    html: `
      <h1>바이브코딩은 그럼 뭔가?</h1>
      <div class="split">
        <div class="card dark"><p class="big">코드를 짜는 방법일 뿐</p><p class="sub">Text로 짜는데 인공지능을 이용해서. Vibe대로, Feel대로, 아이디어만 가지고.</p>
          <p class="quote">‘AI가 코드 문법은 짜 주겠지, 내 아이디어로 만들어 봐’ 하는 것</p></div>
        <div>
          <h3>코딩이 쉬워진 이유</h3>
          ${steps(["문법이 존재하지만 <b class=\"g\">인공지능이 해결할 수 있다.</b>", "공유가 어려웠지만 <b class=\"g\">빅테크 기업들이 공유 방법을 쉽게 해 주고 있다.</b>", "오류 수정이 어렵지만 <b class=\"g\">인공지능 시키면 된다.</b>"])}
          <h3>AI 리터러시</h3>
          <p>내가 AI를 통해 ① 원하는 일을 ② <b>안전하고 윤리적으로</b> 수행하고 ③ 그 과정과 결과를 판단하고 책임질 수 있는 능력</p>
        </div>
      </div>
      ${callout("tip", `<b>직접 해 보기</b> 오른쪽 클립보드의 ‘6세 어린이가 한 말’을 Canvas에 그대로 넣어 보세요. 이 말로 실제로 만든 앱은 오른쪽 ‘독립운동 게임’ 링크에 있습니다.`)}`,
    sites: [["독립운동 게임 (6세 어린이 말로 만든 앱)", "https://gemini.google.com/share/021ec43d944d"], SITE.gemini, SITE.apptteul],
    clips: [["6세 어린이가 한 말", P_CHILD]],
  },
  {
    id: "cases", label: "Canvas 사례",
    html: `
      <h1>Gemini Canvas로 만든 수업 사례</h1>
      <p class="lead">카드를 누르면 Gemini에서 바로 실행됩니다.</p>
      <div class="cases">${CASES.map(([t, a, u], i) => `
        <a class="case" href="${u}" target="_blank" rel="noopener"><span class="case-no">사례 ${String(i + 1).padStart(2, "0")}</span>
          <span class="case-t">${esc(t)}</span><span class="case-a">${esc(a)}</span><span class="case-go">열기 ↗</span></a>`).join("")}
      </div>`,
    sites: [SITE.gemini, SITE.apptteul],
    clips: [],
  },
  {
    id: "c1", label: "Canvas 1",
    html: `
      <h1><span class="badge">1단계</span>DB·API 없이 Canvas로 만들기</h1>
      <p class="lead">오늘 만들 앱: <b>학생회장 선거 후보자 체크리스트</b></p>
      ${steps([
        "<a href=\"https://gemini.google.com\" target=\"_blank\" rel=\"noopener\">gemini.google.com</a>에 개인 Gmail 계정으로 들어갑니다.",
        "모델을 고릅니다. 무료 사용자는 <b>빠른 모드</b>로 작업하세요. (메뉴는 ‘빠른 모드 · 사고 · Pro’, 슬라이드 캡처는 예전 화면)",
        "입력창의 <b>도구</b>를 누르고 <b>Canvas</b>를 켭니다.",
        "오른쪽 클립보드의 <b>후보자 체크리스트 프롬프트</b>를 복사해 붙여넣고 보냅니다.",
        "빙빙 돌아가는 동안은 코드를 쓰는 중입니다. 끝나면 <b>미리보기</b>로 눌러 봅니다.",
        "고치고 싶은 점은 입력창에 이어서 말로 적습니다.",
        "<b>공유</b>를 누르면 링크로 나눠 줄 수 있습니다.",
      ])}
      ${callout("warn", "<b>공유는 개인 계정(Gmail)만</b> 됩니다. 워크스페이스(학교) 계정은 공유가 안 됩니다.")}
      ${callout("tip", "저장된 것처럼 보여도 실제로는 브라우저 안에 저장되는 경우가 많습니다. 진짜 DB는 3단계와 DATA 탭에서 다룹니다.")}`,
    sites: [SITE.gemini],
    clips: [["후보자 체크리스트 프롬프트", P_CHECKLIST]],
  },
  {
    id: "c2", label: "Canvas 2",
    html: `
      <h1><span class="badge">2단계</span>Gemini API 연결: 삼행시 웹앱</h1>
      ${steps([
        "Gemini에서 Canvas를 켜고 <b>삼행시 프롬프트</b>를 붙여넣습니다.",
        "완성된 앱에 세 글자를 넣어 봅니다.",
        "코드를 누르고 <kbd>Ctrl</kbd> + <kbd>F</kbd>로 <code>API</code>를 찾아봅니다.",
      ])}
      <div class="cards two">
        <div class="card"><h3>Canvas가 대신 해 주는 것</h3><p>Canvas 안에서는 API 키를 따로 받지 않아도 AI가 자동으로 연결됩니다. 어떤 프롬프트가 들어 있는지 코드에서 보고 고칠 수 있습니다.</p></div>
        <div class="card"><h3>Canvas 밖에서 쓰려면</h3><p>내 사이트·내 앱에서 Gemini를 부르려면 <a href="https://aistudio.google.com" target="_blank" rel="noopener">Google AI Studio</a>에서 API 키를 받습니다. 코드에 키를 직접 넣으면(하드코딩) 유출되면 곤란합니다. 나노바나나(이미지 생성) API 하드코딩은 유료 티어만 됩니다.</p></div>
      </div>
      ${callout("danger", "<b>API 키는 유출 금지.</b> 다른 사람에게 보여 주거나 공개 저장소에 올리지 마세요. 통장에서 돈이 빠져나갈 수도 있습니다.")}`,
    sites: [SITE.aistudio, SITE.gemini],
    clips: [["삼행시 웹앱 프롬프트", P_SAMHAENG]],
  },
  {
    id: "c3", label: "Canvas 3",
    html: `
      <h1><span class="badge">3단계</span>가상 DB 연결: 가위바위보 게임</h1>
      ${steps([
        "Canvas를 켜고 <b>가위바위보 프롬프트</b>를 붙여넣습니다.",
        "A가 게임방을 만듭니다 (제목, 비번).",
        "B가 <b>다른 컴퓨터</b>에서 같은 링크로 들어와 비번을 적습니다.",
        "7전 4선승으로 겨루고, 두 화면에 같은 승패가 보이는지 확인합니다.",
        "코드에서 <kbd>Ctrl</kbd> + <kbd>F</kbd>로 <code>firestore</code>를 찾아봅니다.",
      ])}
      ${callout("tip", "가상 DB의 정체는 <b>Firebase Firestore</b>입니다. 실제 DB가 아니어서 많은 사용자가 동시에 쓰기는 어렵고, 프로토타입으로 생각하면 좋습니다. 많은 사용자를 대상으로 운영하려면 돈이 드는 부분입니다.")}
      <h3>Gemini Canvas 바이브코딩의 약점</h3>
      <div class="cards two">
        <div class="card"><span class="tag">규모</span><p>거대한 프로젝트를 만들기 어렵다 · 디버깅이 오래 걸린다 · 폴더 구조가 아니다</p></div>
        <div class="card"><span class="tag">공개</span><p>코드가 공개된다 · API 하드코딩이 어렵다 · DB 하드코딩이 어렵다</p></div>
      </div>
      <p class="next">폴더째 다루고, 키를 숨기고, 진짜 DB를 붙이는 방법 → <b>DATA · API · AI · CLI</b></p>`,
    sites: [SITE.gemini],
    clips: [["가위바위보 게임 프롬프트", P_RPS]],
  },
  {
    id: "data", label: "DATA",
    html: `
      <h1><span class="badge">01 DATA</span>어디에 저장할까</h1>
      <p class="lead">이 정보가 정말 학교 밖으로 나가야 하나요? 왼쪽 칸에서 충분하면 거기서 멈춥니다.</p>
      <div class="ladder">
        <div><b>① 브라우저 안</b><span>localStorage·IndexedDB. 한 학생이 한 기기로 이어 쓰기</span></div>
        <div><b>② 교사 PC 폴더</b><span>File System Access. 사진·파일도 교실 밖으로 안 나감</span></div>
        <div><b>③ 클라우드</b><span>Firebase·Supabase. 여러 기기 공유, 교사가 모아 보기</span></div>
        <div><b>④ 직접 운영 서버</b><span>VPS·학교 서버. 보안 업데이트와 백업까지 내 책임</span></div>
      </div>
      <h3>연결은 세 단계, 반복 작업은 CLI로</h3>
      ${steps(["콘솔에서 프로젝트 만들기", "설정값을 앱에 넣기 (Firebase config, Supabase URL·anon key는 화면에 보여도 되는 값)", "규칙을 쓰고 CLI로 배포. <b>배포 전에 규칙부터 사람이 읽고 확인</b>"])}
      <div class="cards two">
        <div class="card bad"><h3>위험</h3>${code("match /scoreLogs/{logId} {\n  allow read: if true;\n  allow write: if true;\n}")}<p>주소만 알면 누구나 점수를 읽고 고칠 수 있음</p></div>
        <div class="card good"><h3>안전</h3>${code("match /teachers/{uid} {\n  allow read, write:\n    if request.auth != null\n    && request.auth.uid == uid;\n}")}<p>로그인한 본인만 읽고 씀</p></div>
      </div>
      ${callout("warn", "Supabase도 같습니다. RLS를 켜지 않으면 anon key로 표 전체가 열립니다. service_role 키는 절대 화면 코드에 넣지 마세요.")}`,
    sites: [["Firebase 콘솔", "https://console.firebase.google.com"], ["Supabase 대시보드", "https://supabase.com/dashboard"],
      ["Firestore 보안 규칙", "https://firebase.google.com/docs/firestore/security/get-started"], ["Supabase RLS", "https://supabase.com/docs/guides/database/postgres/row-level-security"], ["Firebase 요금제", "https://firebase.google.com/pricing"]],
    clips: [
      ["CLI 에이전트에게", "Firebase CLI로 Firestore를 연결하고, 규칙 파일은 배포하기 전에 나에게 먼저 보여 줘."],
      ["Firebase CLI 설치", "npm install -g firebase-tools"],
      ["Firebase 로그인 (브라우저가 열림)", "firebase login"],
      ["Firestore 연결 (질문에 답하며 진행)", "firebase init firestore"],
      ["보안 규칙만 배포", "firebase deploy --only firestore:rules"],
      ["Supabase 로그인", "npx supabase login"],
      ["Supabase 프로젝트 연결 (프로젝트ID는 내 것으로 바꾸기)", "npx supabase link --project-ref 프로젝트ID"],
      ["Supabase DB 반영", "npx supabase db push"],
    ],
  },
  {
    id: "api", label: "API",
    html: `
      <h1><span class="badge">02 API</span>프로그램끼리의 약속</h1>
      <div class="cards two">
        <div class="card"><span class="tag">1</span><h3>받아 쓰기</h3><p>남이 열어 둔 API를 내 앱이 부른다. 급식 알림판(나이스), 끝말잇기 낱말 판정(표준국어대사전), 날씨·미세먼지</p></div>
        <div class="card"><span class="tag">2</span><h3>열어 주기</h3><p>내 서비스를 API로 열어 남의 앱을 받는다. Grownd 포인트 API, 앱스 스크립트로 배포한 웹앱 주소</p></div>
      </div>
      <h3>API 요청서는 네 칸</h3>
      <div class="four">
        <div><b>Method</b><span>무엇을 할까 (POST 보내기 · GET 가져오기)</span></div>
        <div><b>Endpoint</b><span>어디로 (도착지 주소)</span></div>
        <div><b>Header</b><span>누가 (신분증 = API 키)</span></div>
        <div><b>Body</b><span>무슨 내용 (JSON)</span></div>
      </div>
      <h3>연결하기 전에 정해 둘 것</h3>
      ${steps(["<b>필요한 것만 보내기</b>: 학생 이름·답안처럼 필요 없는 정보는 보내지 않는다.", "<b>권한 범위 확인</b>: 구글 시트 API 권한이 다른 시트까지 열 수 있다.", "<b>받아 둔 값 다시 쓰기</b>: 급식처럼 하루 한 번 바뀌는 정보는 한 번만 불러 둔다.", "<b>실패했을 때 문구</b>: 못 불러왔을 때 보여 줄 말을 정해 둔다."])}`,
    sites: [["나이스 교육정보 개방 포털", "https://open.neis.go.kr"], ["공공데이터포털", "https://www.data.go.kr"], ["표준국어대사전 오픈 API", "https://stdict.korean.go.kr/openapi/openApiInfo.do"],
      ["카카오 지도 API", "https://apis.map.kakao.com"], ["도서관 정보나루", "https://www.data4library.kr"], ["Grownd API 문서", "https://slashpage.com/grownd/api"], ["grownd-minigame (GitHub)", "https://github.com/starrylifee/grownd-minigame"]],
    clips: [
      ["Grownd 포인트 요청 예시 (참고용, cmd 명령 아님)","POST https://growndcard.com/api/v1/classes/{학급ID}/students/{번호}/points\nX-API-Key: (내 키)\n\n{\n  \"type\": \"reward\",\n  \"points\": 10,\n  \"description\": \"퀴즈 정답\",\n  \"source\": \"MyApp\"\n}"],
      ["CLI 에이전트에게", "나이스 교육정보 개방 포털 급식 API로 이번 주 급식을 보여 주는 화면을 만들어 줘. 인증키는 코드에 넣지 말고 어디에 둘지 먼저 알려 줘."],
    ],
  },
  {
    id: "ai", label: "AI",
    html: `
      <h1><span class="badge">03 AI</span>AI API도 API다</h1>
      <div class="cards two">
        <div class="card"><h3>요청과 응답</h3><p>엔드포인트에 글을 보내고 JSON을 받는 보통 API와 같은 구조입니다. 앱은 응답에서 <code>content</code>만 꺼내 말풍선으로 보여 줍니다.</p></div>
        <div class="card"><h3>앞의 대화를 기억하지 못한다</h3><p>질문할 때마다 앞의 대화를 통째로 다시 보냅니다. 대화 횟수에 상한을 두고, 오래된 대화는 요약하거나 잘라 냅니다.</p></div>
      </div>
      <h3>‘AI를 넣을 수 있나?’보다 ‘AI가 꼭 필요한가?’</h3>
      <div class="cards two">
        <div class="card"><span class="tag">규칙과 코드</span><p>2 + 3 계산, 출석 저장, 포인트 5점 주기, 낱말이 사전에 있는지 확인. 늘 같은 답이 나와야 하는 일</p></div>
        <div class="card"><span class="tag">AI</span><p>글에서 주장 찾기, 풀이 이유 되묻기, 쉬운 말로 바꿔 쓰기. 해석·생성·언어 이해가 필요한 일</p></div>
      </div>
      ${callout("danger", "<b>API 키를 코드에 넣는 순간</b> F12 개발자도구와 공개 저장소로 새고, 끝없이 불려 요금이 쌓입니다. 키는 서버에서만 부르고, .env에 두고 .gitignore에 추가하고, 사용 한도를 정하고 자동 충전을 끕니다.")}
      ${callout("warn", "학생이 쓰는 앱이면 연령 기준과 비용부터 확인합니다. 30명 × 10번 = 300번 호출. 약관은 바뀔 수 있으니 원문을 다시 확인하세요.")}`,
    sites: [
      ["OpenAI API 문서", "https://developers.openai.com/api/docs"],
      ["OpenAI 모델 안내", "https://developers.openai.com/api/docs/models"],
      ["OpenAI API 레퍼런스 (Chat)", "https://developers.openai.com/api/reference/resources/chat"],
      ["Gemini API 문서", "https://ai.google.dev/gemini-api/docs"],
      ["Gemini 모델 안내", "https://ai.google.dev/gemini-api/docs/models"],
      ["Claude 모델 안내", "https://platform.claude.com/docs/en/models/overview"],
      SITE.aistudio,
      ["OpenAI 18세 미만 안내", "https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance"],
      ["Anthropic 이용 정책", "https://www.anthropic.com/policy"],
      ["Gemini API 추가 약관", "https://ai.google.dev/gemini-api/terms"],
    ],
    clips: [
      ["CLI 에이전트에게: 키 숨기기", "이 앱에서 API 키가 화면 코드에 들어간 곳을 찾아서, 서버(백엔드)에서만 부르도록 바꿔 줘. 키는 .env에 두고 .gitignore에 추가해 줘. 고치기 전에 계획부터 보여 줘."],
      ["CLI 에이전트에게: 대화 길이 제한", "AI와 주고받는 대화가 10번을 넘으면 오래된 대화는 요약해서 보내도록 바꿔 줘."],
    ],
  },
  {
    id: "cli", label: "CLI·MCP",
    html: `
      <h1><span class="badge">04 CLI</span>폴더를 통째로 맡기기</h1>
      <div class="cards two">
        <div class="card dark"><h3>CLI <small>Command Line Interface</small></h3><p>글자로 명령을 입력해 컴퓨터를 다루는 방식. AI 코딩 CLI는 이 창 안에서 내 폴더를 읽고, 고치고, 명령을 실행합니다.</p>
          <p class="sub">채팅창 AI가 <b>전화 상담</b>이라면, CLI 에이전트는 교실에 와서 직접 고치고 켜 보는 <b>출장 기사</b>입니다.</p></div>
        <div class="card dark"><h3>MCP <small>Model Context Protocol</small></h3><p>AI가 바깥 도구와 데이터(드라이브, 캘린더, 디자인 도구, DB 등)에 연결되는 방법을 하나로 맞춘 공통 규격.</p>
          <p class="sub">흔히 <b>AI용 USB-C</b>라고 부릅니다. 도구마다 달랐던 연결 방식을 하나로 맞춥니다.</p></div>
      </div>
      <h3>시연: 폴더를 통째로 맡겨 보기</h3>
      ${steps(["<b>폴더 열기</b>: 프로젝트 폴더에서 터미널을 열고 에이전트 실행", "<b>구조 파악</b>: 오른쪽 클립보드의 질문 1", "<b>점검</b>: 질문 2", "<b>고치고 기록</b>: 질문 3"])}
      <h3>써 보면 좋은 MCP와 CLI</h3>
      <div class="cards two">
        <div class="card"><span class="tag">MCP</span><p>미리캔버스(발표 자료) · Google Stitch(화면 시안) · Canva · Drive·Gmail·캘린더 · 법령 MCP · Chrome 브라우저</p></div>
        <div class="card"><span class="tag">CLI</span><p>git · gh(GitHub) · vercel(배포) · firebase · claude·codex·agy · node·npm</p></div>
      </div>
      ${callout("tip", "<b>헬피코드</b>: 엘리스의 프라이빗 AI 코딩 에이전트. 외부 코딩 에이전트를 막아 둔 환경에서도 쓸 수 있습니다. 이번 연수에서는 설치하지 않아도 되며, 안내는 오른쪽 헬피코드 링크에서 봅니다. 수상 팀에게는 JUST VUILD 2026 팀계정 크레딧을 드립니다.")}`,
    sites: [["헬피코드 안내", "https://helpy.sh"], ["JUST VUILD 2026", "https://just-vuild.onpod.ai/"], ["MCP 공식 사이트", "https://modelcontextprotocol.io"],
      ["미리캔버스 AI 프레젠테이션 MCP", "https://www.miricanvas.com/ko/features/ai-presentation-mcp"], ["Firebase CLI", "https://firebase.google.com/docs/cli"], SITE.setup],
    clips: [
      ["질문 1 · 구조 파악", "이 앱이 어떤 파일로 이루어져 있고, 데이터는 어디에 저장되는지 설명해 줘."],
      ["질문 2 · 점검", "API 키가 화면 코드나 공개 저장소에 드러난 곳이 있는지 찾아 줘."],
      ["질문 3 · 고치고 기록", "고친 내용을 먼저 보여 주고, 내가 확인하면 커밋해 줘."],
      ["폴더 이동 (폴더이름은 내 것으로)", "cd 폴더이름"],
      ["파일 목록 보기", "dir"],
      ["개발 서버 켜기", "npm run dev"],
      ["바뀐 파일 보기", "git status"],
      ["올리기·배포 (확인한 뒤에)", "git push"],
      ["미리캔버스 MCP 연결 (Claude Code)", "claude mcp add --transport http miricanvas https://mcp.miricanvas.com/mcp"],
    ],
  },
];

// 렌더링과 실시간 진행은 live.js(모듈)에서 한다. 위 TABS·esc를 그대로 쓴다.
