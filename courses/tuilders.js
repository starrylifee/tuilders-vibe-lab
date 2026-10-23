import { TABS, CASES } from '../app.js';

// 틸더스 전용 편집 순서. PDF를 자동으로 나열하는 규칙이 아니라 강의 흐름에 맞춘 배치다.
const practiceAfter = {ready:1,vibe:19,cases:44,c1:59,c2:65,c3:69,data:79,api:88,ai:94,cli:100};
const titles = {ready:'강의 전 준비',vibe:'아이의 말로 앱 만들기',cases:'수업 사례 직접 열어 보기',c1:'후보자 체크리스트 만들기',c2:'삼행시 웹앱 만들기',c3:'두 사람이 가위바위보 하기',data:'저장 위치와 보안 규칙 점검',api:'API 요청 설계하기',ai:'AI 연결과 비용 점검',cli:'내 프로젝트를 직접 맡겨 보기'};
const pageResources = {76:'data',77:'data',79:'data',83:'api',84:'api',86:'api',87:'api',90:'ai',94:'ai',98:'cli',99:'cli',101:'cli',102:'cli',104:'all'};
const links = tab => tab.sites.map(([label,url])=>({label,url}));

export async function loadCourse() {
  const [slideResponse,linkResponse] = await Promise.all([fetch('slides.json'),fetch('courses/tuilders-links.json')]);
  if(!slideResponse.ok || !linkResponse.ok) throw new Error('틸더스 교안을 불러오지 못했습니다.');
  const [slides,recovered] = await Promise.all([slideResponse.json(),linkResponse.json()]);
  const chapters = TABS.map(t=>({id:t.id,title:t.label,page:slides.find(s=>s.tab===t.id)?.n || 1,sites:t.sites,clips:t.clips}));
  const pages = slides.map(s=>{
    let resource = recovered[String(s.n)] || [];
    if(s.n>=34 && s.n<=44) resource=[{label:CASES[s.n-34][0],url:CASES[s.n-34][2]}];
    if(pageResources[s.n]) {
      const ts = pageResources[s.n]==='all' ? TABS : TABS.filter(t=>t.id===pageResources[s.n]);
      resource = [...resource,...ts.flatMap(links)];
    }
    resource=[...new Map(resource.map(l=>[l.url,l])).values()];
    return {n:s.n,title:s.title,chapter:s.tab,image:`slides/${String(s.n).padStart(3,'0')}.webp`,width:1600,height:900,links:resource};
  });
  const activities=TABS.map(t=>({id:t.id,chapter:t.id,afterPage:practiceAfter[t.id],title:titles[t.id],
    html:t.html.replaceAll('오른쪽 클립보드','복사 자료').replaceAll('오른쪽 ‘독립운동 게임’','‘독립운동 게임’').replaceAll('오른쪽 헬피코드','헬피코드').replaceAll('DATA 탭','DATA 부분').replace('<h2>오늘 순서</h2>','').replace('<div class="flow" id="flow"></div>',''),sites:t.sites,clips:t.clips}));
  return {pages,activities,chapters};
}
