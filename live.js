// 교안 보기 + 실습 탭 + 강사 진행 맞추기(Firebase Firestore 실시간)
// 학생: 강사가 넘긴 장까지 볼 수 있고, 강사가 연 실습 탭만 열린다. 준비(0번) 탭은 늘 열려 있다.
// 강사: 구글 로그인으로 정해 둔 계정이면 넘기기·실습 시작/끝·전체 공개를 할 수 있다. 실제 권한은 Firestore 보안 규칙이 막는다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const fb = initializeApp({
  apiKey: "AIzaSyDS0TtlZDHDDZFPSiBN0KP5Ie4Erjk_ijI",
  authDomain: "tuilders-vibe-lab-2026.firebaseapp.com",
  projectId: "tuilders-vibe-lab-2026",
  storageBucket: "tuilders-vibe-lab-2026.firebasestorage.app",
  messagingSenderId: "722668167448",
  appId: "1:722668167448:web:f2650818e0803d2a187e6d",
});
const db = getFirestore(fb);
const auth = getAuth(fb);
// 강사 계정 메일 주소의 SHA-256 (주소 자체는 화면 코드에 두지 않는다)
const TEACHER_HASHES = [
  "b26a4d53e65ad4d6bc943a406a7a4dad06afc8bc71e99d24179256ba39e03bf2",
  "7b360e5e3e2011124fb6ef2c6f2324d8d9d36de308d47232a9421b7beeeadd3a",
];
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const isTeacherUser = async (user) => !!user && !!user.email && TEACHER_HASHES.includes(await sha256(user.email.toLowerCase()));
const stateRef = doc(db, "live", "state");

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const TAB_IDX = Object.fromEntries(TABS.map((t, i) => [t.id, i]));
const LOCK = `<svg class="lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;

let SLIDES = [];
let live = { slide: 1, practice: null, unlocked: 0, open: false };
let isTeacher = false;
let view = "lab";          // "deck" 교안 · "lab" 실습
let mySlide = 1;
let following = true;      // 학생이 강사 화면을 따라가는 중인가
let current = 0;           // 실습 탭
let endedNotice = false;   // 실습이 끝났는데 아직 실습 화면에 있는 학생에게 보여 줄 안내
let connected = null;

const total = () => SLIDES.length || 1;
const maxSlide = () => (isTeacher || live.open ? total() : Math.max(1, Math.min(total(), live.slide || 1)));
const maxTab = () => (isTeacher || live.open ? TABS.length - 1 : Math.max(0, live.unlocked || 0));
const tabOfSlide = (n) => (SLIDES[n - 1] ? SLIDES[n - 1].tab : "ready");

// ── 실습 화면 ──────────────────────────────────────
function renderTabs() {
  $("#tabs").innerHTML = TABS.map((t, i) => {
    const locked = i > maxTab();
    return `<button role="tab" data-i="${i}" aria-selected="${i === current}" tabindex="${i === current ? 0 : -1}" class="${locked ? "locked" : ""}">` +
      `<span class="n">${i}</span>${esc(t.label)}${locked ? LOCK : ""}</button>`;
  }).join("");
}
function dockHTML(t) {
  const sites = t.sites.length ? `<section><h2>실습 사이트</h2>${t.sites.map(([n, u]) => `
    <a class="site" href="${u}" target="_blank" rel="noopener"><span class="site-n">${esc(n)}</span><span class="site-u">${esc(u.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</span><span class="site-go">열기 ↗</span></a>`).join("")}</section>` : "";
  const clips = t.clips.length ? `<section><h2>복사 클립보드</h2>${t.clips.map(([label, text], i) => `
    <div class="clip"><div class="clip-h"><span>${esc(label)}</span><button class="copy" data-c="${i}" type="button">복사</button></div><pre class="clip-t">${esc(text)}</pre></div>`).join("")}</section>` : "";
  return sites + clips;
}
function showTab(i, push = true) {
  if (i > maxTab()) {
    if ($("#lesson").innerHTML.trim()) { toast("강사가 이 부분을 시작하면 열립니다"); return; }
    i = 0;
  }
  current = Math.max(0, Math.min(TABS.length - 1, i));
  const t = TABS[current];
  renderTabs();
  const prev = TABS[current - 1], next = TABS[current + 1];
  const nextOpen = next && current + 1 <= maxTab();
  $("#lesson").innerHTML = t.html + `<div class="pager">
    ${prev ? `<button class="nav-btn" data-go="${current - 1}">← ${esc(prev.label)}</button>` : "<span></span>"}
    ${nextOpen ? `<button class="nav-btn primary" data-go="${current + 1}">${esc(next.label)} →</button>` : "<span></span>"}</div>`;
  $("#dock").innerHTML = dockHTML(t);
  const flow = $("#flow");
  if (flow) flow.innerHTML = TABS.slice(1).map((x, k) => `<button class="flow-card${k + 1 > maxTab() ? " locked" : ""}" data-go="${k + 1}"><span class="n">${k + 1}</span>${esc(x.label)}${k + 1 > maxTab() ? LOCK : ""}</button>`).join("");
  $("#lesson").scrollTop = 0; $("#dock").scrollTop = 0;
  if (push && window.matchMedia("(max-width: 820px)").matches) window.scrollTo({ top: 0 });
  const tb = $(`#tabs [data-i="${current}"]`);
  if (tb) tb.scrollIntoView({ block: "nearest", inline: "nearest" });
  if (push) history.replaceState(null, "", "#" + t.id);
}

// ── 교안 화면 ──────────────────────────────────────
function renderDeck() {
  const n = mySlide, s = SLIDES[n - 1];
  const img = $("#slideImg");
  const src = `slides/${String(n).padStart(3, "0")}.webp`;
  if (img.getAttribute("src") !== src) { img.src = src; img.alt = s ? `${n}장: ${s.title}` : `${n}장`; }
  // 다음 장 미리 받아 두기
  if (n < maxSlide()) { const pre = new Image(); pre.src = `slides/${String(n + 1).padStart(3, "0")}.webp`; }
  $("#slideNo").textContent = `${n} / ${total()}`;
  $("#prevSlide").disabled = n <= 1;
  $("#nextSlide").disabled = n >= maxSlide();
  const st = $("#followState");
  if (isTeacher) st.innerHTML = `<b class="g">강사 화면</b> · 넘기면 수강자 화면도 넘어갑니다`;
  else if (live.open) st.innerHTML = "전체 공개 중 · 자유롭게 넘겨 보세요";
  else if (following) st.innerHTML = `<span class="dot"></span>강사 화면을 따라가는 중`;
  else st.innerHTML = `따로 보는 중 · <button class="link" id="refollow">강사 화면(${live.slide}장)으로</button>`;
  renderTeacherBar();
}
function goSlide(n) {
  n = Math.max(1, Math.min(maxSlide(), n));
  mySlide = n;
  if (isTeacher) {
    const idx = TAB_IDX[tabOfSlide(n)] ?? 0;
    const unlocked = Math.max(live.unlocked || 0, idx);
    live = { ...live, slide: n, unlocked };
    push({ slide: n, unlocked });
  } else {
    following = n === live.slide;
  }
  renderDeck();
}

// ── 강사 도구 ──────────────────────────────────────
function renderTeacherBar() {
  const bar = $("#teacherBar");
  bar.hidden = !isTeacher;
  if (!isTeacher) return;
  const tabNow = tabOfSlide(mySlide);
  $("#practiceSel").innerHTML = TABS.slice(1).map((t, k) => `<option value="${t.id}" ${t.id === (live.practice || tabNow) ? "selected" : ""}>${k + 1}. ${esc(t.label)}</option>`).join("");
  $("#startPractice").textContent = live.practice ? "실습 바꾸기" : "실습 시작";
  $("#endPractice").disabled = !live.practice;
  $("#openAll").textContent = live.open ? "전체 공개 끄기" : "전체 공개";
  $("#teacherInfo").textContent = live.practice ? `지금 실습: ${TABS[TAB_IDX[live.practice]].label}` : "실습 없음";
}
async function push(data) {
  try {
    await setDoc(stateRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    toast("저장하지 못했습니다. 다시 로그인해 보세요");
    console.error(e);
  }
}

// ── 실습 알림 ──────────────────────────────────────
let blinkTimer = null;
function renderAlarm() {
  const el = $("#alarm");
  let html = "", kind = "";
  const p = live.practice && TABS[TAB_IDX[live.practice]];
  if (!isTeacher && p && view === "deck") {
    kind = "flash";
    html = `<b>실습 시간입니다</b><span>${esc(p.label)} · 이론을 마치고 실습하세요</span><button class="alarm-btn" data-practice="${p.id}">실습하러 가기 →</button>`;
  } else if (!isTeacher && p && view === "lab") {
    kind = "calm";
    html = `<b>실습 중</b><span>${esc(p.label)} · 강사는 지금 ${live.slide}장</span><button class="alarm-btn ghost" data-view="deck">교안 보기</button>`;
  } else if (!isTeacher && !p && endedNotice && view === "lab") {
    kind = "flash";
    html = `<b>실습 끝!</b><span>교안으로 돌아오세요 · 강사는 지금 ${live.slide}장</span><button class="alarm-btn" data-view="deck">교안으로 →</button>`;
  }
  el.className = "alarm " + kind;
  el.innerHTML = html;
  el.hidden = !html;
  // 다른 탭(Gemini 등)에 가 있어도 알아보게 탭 제목을 깜빡인다
  clearInterval(blinkTimer);
  document.title = BASE_TITLE;
  if (kind === "flash") {
    let on = false;
    blinkTimer = setInterval(() => { on = !on; document.title = on ? (p ? "● 실습 시간" : "● 교안으로") : BASE_TITLE; }, 1000);
  }
}
const BASE_TITLE = document.title;

// ── 화면 전환 ──────────────────────────────────────
function setView(v, push = true) {
  view = v;
  $("#deck").hidden = v !== "deck";
  $("#lab").hidden = v !== "lab";
  $$(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
  if (v === "deck") { endedNotice = false; renderDeck(); if (push) history.replaceState(null, "", "#deck"); }
  else showTab(current, push);
  renderAlarm();
}

// ── 실시간 상태 받기 ──────────────────────────────────
function applyLive(d) {
  const prevPractice = live.practice;
  live = { slide: 1, practice: null, unlocked: 0, open: false, ...d };
  if (!isTeacher && following) mySlide = Math.min(live.slide || 1, total());
  if (!isTeacher && mySlide > maxSlide()) mySlide = maxSlide();
  if (prevPractice && !live.practice && view === "lab") endedNotice = true;
  if (live.practice) endedNotice = false;
  if (!isTeacher && current > maxTab()) current = 0;
  if (view === "deck") renderDeck(); else showTab(current, false);
  renderAlarm();
}
function setConn(ok, msg) {
  connected = ok;
  const el = $("#conn");
  el.className = "conn " + (ok ? "ok" : "bad");
  el.textContent = msg;
}
onSnapshot(stateRef, (snap) => { setConn(true, "실시간 연결됨"); applyLive(snap.exists() ? snap.data() : {}); },
  (err) => { console.error(err); setConn(false, "연결 안 됨"); });

onAuthStateChanged(auth, async (user) => {
  isTeacher = await isTeacherUser(user);
  document.body.classList.toggle("is-teacher", isTeacher);
  $("#teacherBtn").textContent = isTeacher ? "강사 로그아웃" : "강사";
  if (isTeacher) mySlide = Math.max(1, live.slide || 1);
  if (view === "deck") renderDeck(); else showTab(current, false);
  renderAlarm();
});

// ── 강사 로그인 (구글) ─────────────────────────────────
$("#teacherBtn").addEventListener("click", async () => {
  if (auth.currentUser) { await signOut(auth); toast("강사 화면에서 나왔습니다"); return; }
  try {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    if (await isTeacherUser(user)) { setView("deck"); toast("강사 화면입니다. ← → 로 넘기세요"); }
    else { await signOut(auth); toast("강사 계정이 아닙니다"); }
  } catch (err) {
    console.error(err);
    if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") toast("구글 로그인을 하지 못했습니다");
  }
});

// ── 클릭·키보드 ────────────────────────────────────
document.addEventListener("click", async (e) => {
  const t = e.target;
  const vbtn = t.closest("[data-view]");
  if (vbtn) { setView(vbtn.dataset.view); return; }
  const pr = t.closest("[data-practice]");
  if (pr) { current = TAB_IDX[pr.dataset.practice]; setView("lab"); return; }
  const go = t.closest("[data-go]");
  if (go) { showTab(+go.dataset.go); return; }
  const tab = t.closest("#tabs [role=tab]");
  if (tab) { showTab(+tab.dataset.i); return; }
  if (t.id === "refollow") { following = true; mySlide = live.slide; renderDeck(); return; }
  if (t.closest("#prevSlide")) { goSlide(mySlide - 1); return; }
  if (t.closest("#nextSlide")) { goSlide(mySlide + 1); return; }
  if (t.closest("#startPractice")) {
    const id = $("#practiceSel").value, idx = TAB_IDX[id];
    live = { ...live, practice: id, unlocked: Math.max(live.unlocked || 0, idx) };
    push({ practice: id, unlocked: live.unlocked }); renderDeck(); toast("수강자 화면에 실습 알림을 띄웠습니다"); return;
  }
  if (t.closest("#endPractice")) { live = { ...live, practice: null }; push({ practice: null }); renderDeck(); toast("실습을 끝냈습니다"); return; }
  if (t.closest("#openAll")) { const open = !live.open; live = { ...live, open }; push({ open }); renderDeck(); toast(open ? "모든 장과 실습을 열었습니다" : "전체 공개를 껐습니다"); return; }
  if (t.closest("#fullBtn")) { const el = $("#stage"); if (!document.fullscreenElement) el.requestFullscreen?.(); else document.exitFullscreen?.(); return; }
  const btn = t.closest(".copy");
  if (btn) {
    const [, text] = TABS[current].clips[+btn.dataset.c];
    const ok = await copyText(text);
    btn.textContent = ok ? "복사됨 ✓" : "직접 복사"; btn.classList.toggle("done", ok);
    toast(ok ? "복사했어요. 붙여넣기(Ctrl+V) 하세요" : "복사가 막혀 있어요. 글자를 드래그해서 복사하세요");
    setTimeout(() => { btn.textContent = "복사"; btn.classList.remove("done"); }, 1800);
  }
});
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select")) return;
  const next = ["ArrowRight", "PageDown", " "].includes(e.key), prev = ["ArrowLeft", "PageUp"].includes(e.key);
  if (!next && !prev) return;
  if (view === "deck") { e.preventDefault(); goSlide(mySlide + (next ? 1 : -1)); }
  else if (e.key !== " ") { const k = current + (next ? 1 : -1); if (k >= 0 && k < TABS.length) showTab(k); }
});

// ── 복사 ───────────────────────────────────────────
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch { ok = false; } ta.remove(); return ok;
  }
}
let toastTimer;
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2000); }

// ── 시작 ───────────────────────────────────────────
fetch("slides.json").then((r) => r.json()).then((list) => {
  SLIDES = list;
  const h = location.hash.slice(1);
  if (h === "deck") setView("deck", false);
  else { const k = TAB_IDX[h]; current = k >= 0 ? k : 0; setView("lab", false); }
});
