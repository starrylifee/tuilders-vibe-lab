import { decryptCourse } from './crypto.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const preview = new URLSearchParams(location.search).get('preview') === '1' && window.parent !== window;
const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
let catalog = [], course = null, payload = null, blocks = [], active = 0, routeVersion = 0, observer;
let realtime, realtimePromise, teacher = false, connected = false, following = false, live = {running:false,slide:1,practice:null};
let pendingCourse = null, passwordBusy = false, publishTimer, toastTimer, viewObserver, navigationUntil=0, scrollFrame;

function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2600); }
function safeURL(raw) { try { const u = new URL(raw, location.href); return ['http:','https:','mailto:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
function cleanHTML(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta,base,form,input,svg,math').forEach(el => el.remove());
  doc.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(a => { if (/^on/i.test(a.name) || ['style','srcdoc','id'].includes(a.name)) el.removeAttribute(a.name); });
    if (el.tagName === 'A') { const url = safeURL(el.getAttribute('href')); if (url) {el.href = url;el.target = '_blank';el.rel = 'noopener noreferrer';} else el.removeAttribute('href'); }
  });
  return doc.body.innerHTML;
}
function linkHTML(link) {
  const url = safeURL(link.url); if (!url) return '';
  return `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(link.label || new URL(url).hostname)} <span aria-hidden="true">↗</span></a>`;
}
async function getJSON(url) { const response = await fetch(url, {cache:'no-cache'}); if (!response.ok) throw new Error(`교안 파일을 불러오지 못했습니다 (${response.status}).`); return response.json(); }

function renderShelf() {
  const search = $('#courseSearch').value.trim().toLocaleLowerCase();
  const matches = catalog.filter(c => `${c.title} ${c.subtitle || ''} ${c.description || ''}`.toLocaleLowerCase().includes(search));
  $('#courseCount').textContent = `${catalog.length}`;
  $('.search-label').hidden = catalog.length < 4;
  $('#books').innerHTML = matches.map(c => `<article class="book-item"><button class="book ${['blue','clay'].includes(c.color) ? c.color : ''}" data-course="${escape(c.id)}" aria-label="${escape(c.title)} · ${c.access === 'private' ? '비밀번호로 열기' : '상시 공개 교안 열기'}"><span class="book-number">${String(catalog.indexOf(c) + 1).padStart(2,'0')}</span><span><span class="book-title">${escape(c.title)}</span><span class="book-subtitle">${escape(c.subtitle || '')}</span></span><span class="book-bottom"><span>${c.access === 'private' ? '비밀번호 입장' : '상시 공개'}</span><span class="book-arrow" aria-hidden="true">↗</span></span></button></article>`).join('');
  if (!matches.length) $('#books').innerHTML = '<p class="empty-result">찾는 교안이 없습니다. 다른 이름으로 검색해 보세요.</p>';
}
function shelf() {
  routeVersion++; observer?.disconnect(); viewObserver?.disconnect(); clearTimeout(publishTimer);
  realtime?.watch(null); $('#library').hidden = false; $('#reader').hidden = true;
  $('#connection').hidden = true; closePreview(); course = null; payload = null; blocks = [];
  $('#stream').replaceChildren(); $('#outline').replaceChildren(); $('#resourceDock').replaceChildren();$('#courseIntro').replaceChildren();$('#courseTitle').textContent='';dockChapter='';$('#coursePassword').value='';$('#passwordDialog').close();$('#zoomDialog').close();$('#zoomContent').replaceChildren(); pendingCourse = null;
  document.title = '실시간 강의 교안 | 강의 책장'; window.scrollTo(0,0);
}
function routeInfo() {
  const hash = location.hash.slice(1), parts = hash.split('/');
  if (parts[0] === 'course') return {id:parts[1],kind:parts[2],target:parts[3]};
  if (hash === 'deck') return {id:'tuilders',kind:'page',target:'1'};
  const old = ['ready','vibe','cases','c1','c2','c3','data','api','ai','cli'];
  if (old.includes(hash)) return {id:'tuilders',kind:'activity',target:hash};
  return null;
}
async function route() {
  if (preview) return;
  const info = routeInfo(); if (!info) {shelf();return;}
  const selected = catalog.find(c => c.id === info.id);
  if (!selected) {toast('이 교안을 찾을 수 없습니다.');location.hash = '';return;}
  if (course?.id === selected.id && payload) { jump(info.kind === 'activity' ? `activity-${info.target}` : `page-${Number(info.target) || 1}`, false);return; }
  const version = ++routeVersion;
  $('#reader').hidden = true; $('#library').hidden = false; $('#connection').hidden = true; closePreview();
  realtime?.watch(null); course = null; payload = null; clearTimeout(publishTimer);
  if (selected.access === 'private') {
    pendingCourse = {selected,info,version}; $('#passwordTitle').textContent = selected.title;
    $('#passwordDescription').textContent = '강의에서 안내받은 비밀번호를 입력해 주세요.';
    $('#passwordError').textContent = ''; $('#coursePassword').value = '';
    $('#passwordDialog').showModal(); $('#coursePassword').focus(); return;
  }
  toast('교안을 여는 중입니다.');
  try { const data = selected.module ? await (await import(`./${selected.module}`)).loadCourse() : await getJSON(selected.file); if (version === routeVersion) enter(selected,data,info); }
  catch (error) {if (version === routeVersion) {toast(error.message);location.hash = '';}}
}
function pageHTML(page) {
  const links = (page.links || []).filter(l => safeURL(l.url));
  const hotspots = links.filter(l => Array.isArray(l.rect) && l.rect.length === 4 && l.rect.every(n => Number.isFinite(n) && n >= 0 && n <= 1)).map(l => `<a class="slide-hotspot" style="left:${l.rect[0]*100}%;top:${l.rect[1]*100}%;width:${(l.rect[2]-l.rect[0])*100}%;height:${(l.rect[3]-l.rect[1])*100}%" href="${escape(safeURL(l.url))}" target="_blank" rel="noopener noreferrer" aria-label="${escape(l.label || l.url)} 새 창으로 열기"></a>`).join('');
  return `<article id="page-${page.n}" class="reading-block slide-block" data-page="${page.n}" data-chapter="${escape(page.chapter || '')}"><header class="page-heading"><span>${String(page.n).padStart(2,'0')} / ${payload.pages.length}</span><h2>${escape(page.title || `${page.n}장`)}</h2><button class="quiet zoom-page" data-zoom="${page.n}" aria-label="${page.n}장 크게 보기">확대</button></header><div class="slide-surface"><img src="${escape(page.image)}" alt="${escape(page.title || `${page.n}장 교안`)}" width="${page.width || 1600}" height="${page.height || 900}" loading="${page.n < 3 ? 'eager' : 'lazy'}" decoding="async">${hotspots}</div>${links.length ? `<div class="slide-links" aria-label="이 장의 링크">${links.map(linkHTML).join('')}</div>` : ''}</article>`;
}
function activityHTML(item) {
  const sites = (item.sites || []).map(([label,url]) => linkHTML({label,url})).join('');
  const clips = (item.clips || []).map(([label,text],i) => `<div class="clip"><div class="clip-header"><span>${escape(label)}</span><button class="copy" data-activity="${escape(item.id)}" data-clip="${i}" aria-label="${escape(label)} 복사">복사</button></div><pre>${escape(text)}</pre></div>`).join('');
  return `<section id="activity-${escape(item.id)}" class="reading-block practice-block" data-page="${item.afterPage}" data-activity="${escape(item.id)}" data-chapter="${escape(item.chapter || item.id)}" aria-labelledby="title-${escape(item.id)}"><header class="practice-heading"><h2 id="title-${escape(item.id)}">실습 · ${escape(item.title)}</h2></header><div class="activity-body">${cleanHTML(item.html.replace(/<h1[\s\S]*?<\/h1>/,''))}</div>${sites || clips ? `<div class="resources">${sites ? `<h3>바로 열기</h3><div class="resource-links">${sites}</div>` : ''}${clips ? '<h3>복사 자료</h3>' + clips : ''}</div>` : ''}</section>`;
}
function enter(selected, data, info = {}) {
  if (!Array.isArray(data.pages) || !data.pages.length) throw new Error('교안에 페이지가 없습니다.');
  course = selected; payload = data; following = false; live = {running:false,slide:1,practice:null};
  document.title = `${selected.title} | 실시간 강의 교안`;
  $('#passwordDialog').close(); pendingCourse = null;
  $('#library').hidden = true; $('#reader').hidden = false; $('#connection').hidden = preview;
  $('#courseTitle').textContent = selected.title;
  $('#courseIntro').replaceChildren();$('#courseIntro').hidden=true;dockChapter='';connected=false;
  const html = [];
  data.pages.forEach(page => {html.push(pageHTML(page));(data.activities || []).filter(a => a.afterPage === page.n).forEach(a => html.push(activityHTML(a)));});
  $('#stream').innerHTML = html.join('');
  blocks = [...document.querySelectorAll('.reading-block')];
  const chapters = data.chapters?.length ? data.chapters : data.pages.filter((_,i) => i%10 === 0).map(p => ({id:`part-${p.n}`,title:`${p.n}–${Math.min(p.n+9,data.pages.length)}장`,page:p.n}));
  $('#outline').innerHTML = '<h2>강의 순서</h2>' + chapters.map(c => `<a href="#course/${escape(selected.id)}/page/${c.page}" data-jump="page-${c.page}" data-chapter="${escape(c.id)}">${escape(c.title)}</a>`).join('');
  observer?.disconnect();markActive(0);refreshControls();
  if (!preview) ensureRealtime().then(api => {if(course?.id === selected.id) api.watch(selected.stateId || `course-${selected.id}`);}).catch(() => {});
  if (info.kind && info.target) requestAnimationFrame(() => jump(info.kind === 'activity' ? `activity-${info.target}` : `page-${Number(info.target) || 1}`, false));
  else window.scrollTo(0,0);
  if (preview) window.parent.postMessage({type:'lecture-preview-rendered'},location.origin);
}
function markActive(index) {
  if (!blocks.length || index < 0) return;
  const changed = active !== index; active = index;
  const el = blocks[index]; $('#previous').disabled = index === 0; $('#next').disabled = index === blocks.length-1;
  $('#position').textContent = el.dataset.activity ? `실습 · ${payload.activities.find(a => a.id === el.dataset.activity)?.title || ''}` : `${el.dataset.page} / ${payload.pages.length}장`;
  document.querySelectorAll('#outline a').forEach(a => a.setAttribute('aria-current',String(a.dataset.chapter === el.dataset.chapter)));
  renderDock(el);
  if (changed) {syncPreview(); if (teacher && live.running && !preview) schedulePublish();}
}
let dockChapter='';
function renderDock(el) {
  const chapter=payload.chapters?.find(c=>c.id===el.dataset.chapter);
  const key=`${course.id}:${chapter?.id || ''}`;
  if(dockChapter===key)return;dockChapter=key;
  const activity=payload.activities?.find(a=>a.chapter===chapter?.id);
  const sites=chapter?.sites || activity?.sites || [];
  const clips=activity?.clips || [];
  $('#resourceDock').innerHTML=`<p class="eyebrow">지금 필요한 자료</p><h2>${escape(chapter?.title || course.title)}</h2>${sites.length ? `<div class="dock-links">${sites.map(([label,url])=>linkHTML({label,url})).join('')}</div>` : '<p class="dock-empty">이 부분에는 별도 링크가 없습니다.</p>'}${clips.length ? `<h3>바로 복사</h3>${clips.map(([label,text],i)=>`<div class="dock-clip"><span>${escape(label)}</span><button data-activity="${escape(activity.id)}" data-clip="${i}" aria-label="${escape(label)} 복사">복사</button></div>`).join('')}` : ''}`;
}
function jump(id, smooth = true) {
  const el = blocks.find(b => b.id === id); if (!el) return;
  navigationUntil=Date.now()+(smooth?850:100);
  const offset=$('.reader-toolbar').getBoundingClientRect().height+24;
  window.scrollTo({top:Math.max(0,window.scrollY+el.getBoundingClientRect().top-offset),behavior:smooth ? motion() : 'auto'});markActive(blocks.indexOf(el));
}
function trackPosition(){if(!payload || Date.now()<navigationUntil)return;const edge=$('.reader-toolbar').getBoundingClientRect().height+45;let index=0;for(let i=0;i<blocks.length;i++){if(blocks[i].getBoundingClientRect().top<=edge)index=i;else break;}if(index!==active)markActive(index);}
window.addEventListener('scroll',()=>{cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(trackPosition);},{passive:true});
function navigate(delta) {following = false;refreshControls();jump(blocks[Math.max(0,Math.min(blocks.length-1,active+delta))]?.id);}
function livePosition() {const el = blocks[active];return {slide:Number(el?.dataset.page || 1),practice:el?.dataset.activity || null};}
function schedulePublish() {clearTimeout(publishTimer);publishTimer = setTimeout(async () => {if (!course || !teacher || !live.running) return;try {await realtime.publish(livePosition());} catch {toast('진행 위치 전송에 실패했습니다. 연결을 확인해 주세요.');}},350);}
function refreshControls() {
  $('#teacherControls').hidden = !teacher || preview || !course;
  $('#teacherLogin').textContent = teacher ? '강사 로그아웃' : '강사 로그인';
  $('#broadcastToggle').textContent = live.running ? '강의 끝내기' : '강의 시작';
  $('#broadcastToggle').disabled = !connected;
  $('#followBar').hidden = teacher || !live.running || !course;
  $('#followMessage').textContent = live.running ? (following ? '강사의 진행 위치를 함께 보고 있습니다.' : '강의가 진행 중입니다. 원하는 때 함께 따라갈 수 있어요.') : '';
  $('#followToggle').textContent = following ? '자유롭게 읽기' : '강사 따라가기';
  $('#readerStatus').textContent = teacher && live.running ? '강의 진행 중 · 현재 위치 전달' : following && live.running ? '강사 따라가는 중' : '자유롭게 읽기';
}
async function ensureRealtime() {
  if (preview) return null;
  if (realtime) return realtime;
  if (!realtimePromise) realtimePromise = import('./realtime.js').then(({createRealtime}) => {
    realtime = createRealtime({
      onAuth(value) {teacher = value;refreshControls();},
      onConnection(ok) {connected = ok;$('#connection').textContent = ok ? '실시간 연결됨' : '교안 읽기 · 실시간 연결 없음';$('#connection').classList.toggle('ok',ok);refreshControls();syncPreview();},
      onState(data,first) {const wasRunning = live.running;live = {running:false,slide:1,practice:null,...data};if(!teacher && !first && !wasRunning && live.running) following = true;if(!live.running) following = false;refreshControls();if(!teacher && following) jump(live.practice ? `activity-${live.practice}` : `page-${live.slide}`,false);syncPreview();}
    });return realtime;
  }).catch(error => {realtimePromise = null;$('#connection').textContent = '교안 읽기 · 실시간 연결 없음';throw error;});
  return realtimePromise;
}
function syncPreview(includeCourse = false) {
  if ($('#previewPanel').hidden || !payload) return;
  const currentBlock=blocks[active]?.id;
  const deliveredBlock=live.practice ? `activity-${live.practice}` : `page-${live.slide}`;
  const block=live.running ? deliveredBlock : currentBlock;
  $('#previewStatus').textContent=live.running ? (!connected ? '연결 끊김 · 마지막 전달 위치' : block===currentBlock ? '강사와 같은 위치 · 따라가기 기준' : teacher ? '진행 위치 전달 중…' : '현재 강의 위치 · 따라가기 기준') : '강의 시작 전 · 현재 위치 미리보기';
  $('#previewFrame').contentWindow?.postMessage({type:'lecture-preview',...(includeCourse ? {course,payload} : {}),block,state:live},location.origin);
}
function closePreview() {$('#previewPanel').hidden = true;$('#previewPanel').classList.remove('expanded');$('#previewExpand').setAttribute('aria-pressed','false');$('#previewExpand').textContent='크게';$('#previewToggle').setAttribute('aria-expanded','false');$('#previewFrame').removeAttribute('src');}
new ResizeObserver(entries=>{const width=entries[0]?.contentRect.width;if(width)$('#previewFrame').style.transform=`scale(${width/1280})`;}).observe($('#previewViewport'));
window.addEventListener('message',event => {
  if (event.origin !== location.origin) return;
  if (preview && event.source === window.parent && event.data?.type === 'lecture-preview') {
    if (event.data.payload && event.data.course) enter(event.data.course,event.data.payload);
    if (payload && event.data.block) requestAnimationFrame(() => {live={...event.data.state};following=!!live.running;refreshControls();jump(event.data.block,false);});
  } else if (!preview && event.source === $('#previewFrame').contentWindow && event.data?.type === 'lecture-preview-ready') syncPreview(true);
});

$('#courseSearch').addEventListener('input',renderShelf);
$('#books').addEventListener('click',e => {const button = e.target.closest('[data-course]');if(button) location.hash = `course/${button.dataset.course}`;});
$('#outline').addEventListener('click',e => {const a=e.target.closest('[data-jump]');if(!a) return;e.preventDefault();following=false;refreshControls();jump(a.dataset.jump);history.replaceState(null,'',a.href);$('#outline').classList.remove('open');$('#outlineToggle').setAttribute('aria-expanded','false');});
$('#outlineToggle').addEventListener('click',() => {const open=$('#outline').classList.toggle('open');$('#outlineToggle').setAttribute('aria-expanded',String(open));});
$('#previous').addEventListener('click',() => navigate(-1));$('#next').addEventListener('click',() => navigate(1));$('#toTop').addEventListener('click',() => {following=false;refreshControls();window.scrollTo({top:0,behavior:motion()});});
$('#previewToggle').addEventListener('click',() => {if(!$('#previewPanel').hidden){closePreview();return;}$('#previewPanel').hidden=false;$('#previewToggle').setAttribute('aria-expanded','true');$('#previewFrame').src = `${location.pathname}?preview=1`;});
$('#previewClose').addEventListener('click',() => {closePreview();$('#previewToggle').focus();});
$('#previewExpand').addEventListener('click',()=>{const expanded=$('#previewPanel').classList.toggle('expanded');$('#previewExpand').setAttribute('aria-pressed',String(expanded));$('#previewExpand').textContent=expanded?'작게':'크게';});
$('#zoomClose').addEventListener('click',()=>$('#zoomDialog').close());
document.addEventListener('click',e=>{const button=e.target.closest('[data-zoom]');if(!button || !payload)return;const page=payload.pages.find(p=>p.n===Number(button.dataset.zoom));if(!page)return;$('#zoomTitle').textContent=`${page.n}장 · ${page.title}`;$('#zoomContent').innerHTML=`<img src="${escape(page.image)}" alt="${escape(page.title)}">`;$('#zoomDialog').showModal();});
$('#passwordCancel').addEventListener('click',() => {$('#passwordDialog').close();location.hash='';});
$('#passwordDialog').addEventListener('cancel',() => {location.hash='';});
$('#passwordForm').addEventListener('submit',async e => {
  e.preventDefault();if(!pendingCourse || passwordBusy) return;
  const pending = pendingCourse; passwordBusy = true;$('#passwordSubmit').disabled=true;$('#passwordSubmit').textContent='교안 여는 중…';$('#passwordError').textContent='';
  try {
    const envelope=await getJSON(pending.selected.file);
    let data;try {data=await decryptCourse(envelope,$('#coursePassword').value);}catch(error){throw new Error(error.name === 'OperationError' ? '비밀번호가 맞지 않습니다. 다시 입력해 주세요.' : '교안을 열지 못했습니다. 비밀번호 또는 교안 파일을 확인해 주세요.');}
    if(pending.version===routeVersion) {$('#coursePassword').value='';enter(pending.selected,data,pending.info);}
  } catch(error) {if(pending.version===routeVersion){$('#passwordError').textContent=error.message;$('#coursePassword').focus();$('#coursePassword').select();}}
  finally {passwordBusy=false;$('#passwordSubmit').disabled=false;$('#passwordSubmit').textContent='교안 열기';}
});
$('#teacherLogin').addEventListener('click',async () => {const btn=$('#teacherLogin');btn.disabled=true;try{const api=await ensureRealtime();if(teacher){if(live.running && course) await api.publish({running:false,practice:null});await api.logout();}else await api.login();}catch(error){toast(error.message || '로그인할 수 없습니다. 잠시 후 다시 시도해 주세요.');}finally{btn.disabled=false;}});
$('#broadcastToggle').addEventListener('click',async () => {if(!teacher || !course || !realtime) return;$('#broadcastToggle').disabled=true;try{await realtime.publish({running:!live.running,...livePosition(),open:true,unlocked:99});}catch{toast('강의 상태를 저장하지 못했습니다.');}finally{refreshControls();}});
$('#followToggle').addEventListener('click',() => {following=!following;refreshControls();if(following) jump(live.practice ? `activity-${live.practice}` : `page-${live.slide}`,false);});
document.addEventListener('click',async e => {const button=e.target.closest('[data-clip]');if(!button || !payload) return;const text=payload.activities.find(a=>a.id===button.dataset.activity)?.clips?.[Number(button.dataset.clip)]?.[1];if(typeof text!=='string')return;try{await navigator.clipboard.writeText(text);button.textContent='복사됨';toast('복사했습니다. 실습 화면에 붙여넣으세요.');setTimeout(()=>button.textContent='복사',1800);}catch{toast('복사 권한이 없습니다. 아래 내용을 선택해서 복사해 주세요.');}});
document.addEventListener('keydown',e => {if(!course || e.target.closest('input,textarea,select,button,a') || $('#passwordDialog').open) return;if(e.key==='ArrowRight'){e.preventDefault();navigate(1);}if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1);}});
['wheel','touchstart'].forEach(type=>window.addEventListener(type,()=>{navigationUntil=0;if(following&&!teacher){following=false;refreshControls();}},{passive:true}));
window.addEventListener('hashchange',route);
if(preview){document.body.classList.add('preview-mode');$('#library').hidden=true;window.parent.postMessage({type:'lecture-preview-ready'},location.origin);}
else {
  try {const data=await getJSON('catalog.json');catalog=data.courses || [];renderShelf();await route();}
  catch(error){$('#books').innerHTML='<p class="error">책장을 불러오지 못했습니다. 새로고침해 주세요.</p>';toast(error.message);}
}
