import {
  isCloudConfigured, signUp, signIn, signOut, resendSignupEmail, getSession, onAuthChange,
  loadLearningData, flushPendingActions, saveProfile, saveChapterProgress,
  saveWordProgress, saveReviewProgress, saveStudySession
} from "./data-service.js";

const state = {
  page: "home",
  wordGoal: Number(localStorage.getItem("easyNihongo.wordGoal") || 10),
  wordIndex: 0,
  lessonStep: 0,
  reviewStep: 0,
  kanaType: "hira",
  session: null,
  authMode: "login",
  authRequired: false,
  pendingSignupEmail: "",
  speakingSentenceCount: 0,
  wordProgress: {},
  reviewProgress: {},
  studySessions: [],
  weeklyGoalDays: 5
};

const words = [
  { jp: "コーヒー", reading: "こーひー · 코오히이", ko: "커피", type: "명사", example: "コーヒーをください。", exampleKo: "커피를 주세요." },
  { jp: "ください", reading: "ください · 쿠다사이", ko: "주세요", type: "표현", example: "これをください。", exampleKo: "이것을 주세요." },
  { jp: "水", reading: "みず · 미즈", ko: "물", type: "명사", example: "水をお願いします。", exampleKo: "물을 부탁합니다." },
  { jp: "冷たい", reading: "つめたい · 츠메타이", ko: "차갑다", type: "형용사", example: "冷たい水です。", exampleKo: "차가운 물이에요." },
  { jp: "温かい", reading: "あたたかい · 아타타카이", ko: "따뜻하다", type: "형용사", example: "温かいお茶です。", exampleKo: "따뜻한 차예요." },
  { jp: "一つ", reading: "ひとつ · 히토츠", ko: "한 개", type: "수량", example: "一つください。", exampleKo: "한 개 주세요." },
  { jp: "メニュー", reading: "めにゅー · 메뉴우", ko: "메뉴", type: "명사", example: "メニューを見せてください。", exampleKo: "메뉴를 보여주세요." },
  { jp: "お願いします", reading: "おねがいします · 오네가이시마스", ko: "부탁합니다", type: "표현", example: "アイスでお願いします。", exampleKo: "아이스로 부탁합니다." },
  { jp: "店員", reading: "てんいん · 텐인", ko: "점원", type: "명사", example: "店員さんを呼びます。", exampleKo: "점원을 부릅니다." },
  { jp: "注文", reading: "ちゅうもん · 추우몬", ko: "주문", type: "명사", example: "注文をお願いします。", exampleKo: "주문할게요." },
  { jp: "甘い", reading: "あまい · 아마이", ko: "달다", type: "형용사", example: "これは甘いです。", exampleKo: "이것은 달아요." },
  { jp: "お会計", reading: "おかいけい · 오카이케이", ko: "계산", type: "명사", example: "お会計をお願いします。", exampleKo: "계산 부탁합니다." },
  { jp: "持ち帰り", reading: "もちかえり · 모치카에리", ko: "포장", type: "명사", example: "持ち帰りでお願いします。", exampleKo: "포장으로 부탁합니다." },
  { jp: "ここ", reading: "ここ · 코코", ko: "여기", type: "대명사", example: "ここで食べます。", exampleKo: "여기서 먹을게요." },
  { jp: "ありがとう", reading: "ありがとう · 아리가토오", ko: "고마워", type: "표현", example: "どうもありがとう。", exampleKo: "정말 고마워요." },
  { jp: "すみません", reading: "すみません · 스미마센", ko: "실례합니다", type: "표현", example: "すみません、注文いいですか。", exampleKo: "실례합니다, 주문해도 될까요?" },
  { jp: "大丈夫", reading: "だいじょうぶ · 다이조오부", ko: "괜찮다", type: "형용사", example: "はい、大丈夫です。", exampleKo: "네, 괜찮아요." },
  { jp: "おいしい", reading: "おいしい · 오이시이", ko: "맛있다", type: "형용사", example: "とてもおいしいです。", exampleKo: "정말 맛있어요." },
  { jp: "今日", reading: "きょう · 쿄오", ko: "오늘", type: "명사", example: "今日は暑いです。", exampleKo: "오늘은 더워요." },
  { jp: "友達", reading: "ともだち · 토모다치", ko: "친구", type: "명사", example: "友達と来ました。", exampleKo: "친구와 왔어요." }
];

const chapters = [
  { icon: "👋", color: "#eef5dc", n: "CHAPTER 01", title: "인사하고 감사하기", desc: "첫 만남에서 자연스럽게 인사해요.", done: true },
  { icon: "☺", color: "#fff0e9", n: "CHAPTER 02", title: "나를 소개하기", desc: "이름과 출신을 간단히 말해요.", done: true },
  { icon: "↺", color: "#e8f3f5", n: "CHAPTER 03", title: "다시 물어보기", desc: "놓친 말을 정중하게 다시 물어요.", done: true },
  { icon: "🛍", color: "#f6eddd", n: "CHAPTER 04", title: "편의점에서 계산하기", desc: "봉투와 결제 방법을 말해요.", done: true },
  { icon: "☕", color: "#f1e0c7", n: "CHAPTER 05", title: "카페에서 주문하기", desc: "원하는 음료를 자연스럽게 주문해요.", current: true },
  { icon: "🍜", color: "#fff0dd", n: "CHAPTER 06", title: "식당에서 주문하기", desc: "인원과 메뉴를 정확히 말해요." },
  { icon: "¥", color: "#e9f4e3", n: "CHAPTER 07", title: "가격과 수량 묻기", desc: "가격을 듣고 필요한 수량을 말해요.", locked: true },
  { icon: "⌖", color: "#e8eff7", n: "CHAPTER 08", title: "길과 장소 묻기", desc: "목적지까지 가는 길을 물어봐요.", locked: true },
  { icon: "🚃", color: "#edf0f5", n: "CHAPTER 09", title: "교통수단 이용하기", desc: "표를 사고 목적지를 확인해요.", locked: true },
  { icon: "＋", color: "#fff0ed", n: "CHAPTER 10", title: "도움 요청하기", desc: "곤란한 상황에서 도움을 요청해요.", locked: true }
];

const kana = {
  hira: [["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"],["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"],["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"],["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],["や","ya"],["ゆ","yu"],["よ","yo"],["ら","ra"],["り","ri"]],
  kata: [["ア","a"],["イ","i"],["ウ","u"],["エ","e"],["オ","o"],["カ","ka"],["キ","ki"],["ク","ku"],["ケ","ke"],["コ","ko"],["サ","sa"],["シ","shi"],["ス","su"],["セ","se"],["ソ","so"],["タ","ta"],["チ","chi"],["ツ","tsu"],["テ","te"],["ト","to"],["ナ","na"],["ニ","ni"],["ヌ","nu"],["ネ","ne"],["ノ","no"],["ハ","ha"],["ヒ","hi"],["フ","fu"],["ヘ","he"],["ホ","ho"],["マ","ma"],["ミ","mi"],["ム","mu"],["メ","me"],["モ","mo"],["ヤ","ya"],["ユ","yu"],["ヨ","yo"],["ラ","ra"],["リ","ri"]],
  mix: [["シ","shi"],["ツ","tsu"],["ソ","so"],["ン","n"],["さ","sa"],["ち","chi"],["ぬ","nu"],["め","me"],["れ","re"],["わ","wa"]]
};

const reviewItems = [
  { prompt: "“커피를 한 잔 주문해 보세요.”", hint: "コーヒーを ___。", answer: "コーヒーをください。" },
  { prompt: "“물로 부탁한다고 말해보세요.”", hint: "水で ______。", answer: "水でお願いします。" },
  { prompt: "“다시 한번 부탁한다고 말해보세요.”", hint: "もう一度 ______。", answer: "もう一度お願いします。" },
  { prompt: "“이것을 달라고 말해보세요.”", hint: "これを ___。", answer: "これをください。" },
  { prompt: "“아이스로 부탁한다고 말해보세요.”", hint: "アイスで ______。", answer: "アイスでお願いします。" },
  { prompt: "“계산을 부탁해보세요.”", hint: "お会計を ______。", answer: "お会計をお願いします。" },
  { prompt: "“괜찮다고 답해보세요.”", hint: "はい、____ です。", answer: "はい、大丈夫です。" },
  { prompt: "“고맙다고 말해보세요.”", hint: "どうも ______。", answer: "どうもありがとう。" }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function persist(task, successMessage = "") {
  document.body.classList.add("syncing");
  try {
    const result = await task;
    if (successMessage && result?.synced) showToast(successMessage);
    return result;
  } catch (error) {
    console.error(error);
    showToast("인터넷 연결을 확인해 주세요. 기록은 기기에 임시 저장했어요.");
    return null;
  } finally {
    document.body.classList.remove("syncing");
  }
}

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekDates(today = new Date()) {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function renderWeeklyGoal() {
  const today = new Date();
  const todayKey = localDateKey(today);
  const weekDates = getWeekDates(today);
  const completedDates = new Set(state.studySessions
    .filter(session => Number(session.words_reviewed) + Number(session.sentences_spoken) + Number(session.chapters_completed) > 0)
    .map(session => session.study_date));
  const completed = weekDates.filter(date => completedDates.has(localDateKey(date))).length;
  const goal = state.weeklyGoalDays;
  const remaining = Math.max(goal - completed, 0);
  const progress = Math.min(Math.round((completed / goal) * 100), 100);
  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];

  $("#home-date").textContent = new Intl.DateTimeFormat("ko-KR", {
    month: "long", day: "numeric", weekday: "long"
  }).format(today);
  $("#week-range").textContent = `${weekDates[0].getMonth() + 1}월 ${weekDates[0].getDate()}일 – ${weekDates[6].getMonth() + 1}월 ${weekDates[6].getDate()}일 · 주 5일 목표`;
  $("#week-days").innerHTML = weekDates.map((date, index) => {
    const key = localDateKey(date);
    const done = completedDates.has(key);
    const isToday = key === todayKey;
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const classes = [done ? "done" : "", isToday ? "today" : "", isPast && !done ? "missed" : ""].filter(Boolean).join(" ");
    return `<div class="${classes}" aria-label="${date.getMonth() + 1}월 ${date.getDate()}일 ${done ? "학습 완료" : isToday ? "오늘, 아직 학습 전" : "학습 기록 없음"}"><span>${dayLabels[index]}</span><b>${done ? "✓" : isPast ? "–" : date.getDate()}</b><small>${done ? "완료" : isToday ? "오늘" : ""}</small></div>`;
  }).join("");
  $("#weekly-goal-count").textContent = `${completed} / ${goal}일`;
  $("#weekly-progress-percent").textContent = `${progress}%`;
  $("#weekly-progress-ring").style.setProperty("--progress", progress);

  if (completed >= goal) {
    $("#weekly-goal-message").textContent = "이번 주 목표를 달성했어요!";
    $("#weekly-goal-detail").textContent = `${completed}일 동안 꾸준히 일본어를 말했어요.`;
  } else if (completed === 0) {
    $("#weekly-goal-message").textContent = "이번 주 첫 학습을 시작해 보세요";
    $("#weekly-goal-detail").textContent = "단어·회화·말하기 중 하나를 학습하면 하루가 기록돼요.";
  } else {
    $("#weekly-goal-message").textContent = `목표까지 ${remaining}일 남았어요`;
    $("#weekly-goal-detail").textContent = `이번 주 ${completed}일 학습했어요. 하루 한 번만 기록해도 충분해요.`;
  }
}

function recordStudyActivity(payload) {
  const session = { ...payload, study_date: localDateKey() };
  state.studySessions.push(session);
  renderWeeklyGoal();
  return persist(saveStudySession(session));
}

function updateAccountUI(session) {
  state.session = session;
  const email = session?.user?.email || "";
  const initial = email ? email[0].toUpperCase() : "민";
  $$('[data-user-avatar]').forEach(el => el.textContent = initial);
  $('[data-user-name]').textContent = email ? email.split("@")[0] : "학습자님";
  $("#profile-status").textContent = !isCloudConfigured ? "클라우드 설정 필요" : email ? "기록 동기화됨" : "로그인이 필요해요";
  $("#account-email").textContent = email || (isCloudConfigured ? "로그인되지 않음" : "Supabase 설정 필요");
  $("#account-action").textContent = email ? "로그아웃" : "로그인";
  $("#account-panel").classList.toggle("connected", Boolean(email));
}

async function hydrateLearningData() {
  document.body.classList.add("syncing");
  try {
    const weekDates = getWeekDates();
    const data = await loadLearningData({ weekStart: localDateKey(weekDates[0]), weekEnd: localDateKey(weekDates[6]) });
    if (data.profile?.daily_word_goal) state.wordGoal = data.profile.daily_word_goal;
    state.speakingSentenceCount = data.profile?.speaking_sentence_count || 0;
    if (data.profile?.full_name) $('[data-user-name]').textContent = data.profile.full_name;
    $$('[data-streak]').forEach(el => el.textContent = data.profile?.streak || 0);
    state.wordProgress = Object.fromEntries(data.words.map(item => [item.word_id, item]));
    state.reviewProgress = Object.fromEntries(data.reviews.map(item => [item.review_id, item]));
    state.studySessions = data.sessions;
    data.chapters.forEach(item => {
      const index = Number(item.chapter_id.replace("chapter-", "")) - 1;
      if (chapters[index]) chapters[index].done = item.completed;
    });
    localStorage.setItem("easyNihongo.wordGoal", String(state.wordGoal));
    updateGoalUI();
    renderWord();
    renderChapters();
    renderWeeklyGoal();
    const synced = await flushPendingActions();
    if (synced) showToast(`기기에 저장된 기록 ${synced}개를 동기화했어요.`);
  } catch (error) {
    console.error(error);
    showToast("클라우드 기록을 불러오지 못해 기기 기록으로 시작해요.");
  } finally {
    document.body.classList.remove("syncing");
  }
}

function speak(text, rate = 0.88) {
  if (!("speechSynthesis" in window)) return showToast("이 브라우저에서는 음성 재생을 지원하지 않아요.");
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = rate;
  const voice = speechSynthesis.getVoices().find(v => v.lang?.toLowerCase().startsWith("ja"));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

function navigate(page) {
  state.page = page;
  $$(".page").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  $$('[data-page-link]').forEach(el => el.classList.toggle("active", el.dataset.pageLink === page));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderChapters() {
  $("#chapter-list").innerHTML = chapters.map((chapter, i) => `
    <button class="chapter-card ${chapter.current ? "current" : ""} ${chapter.locked ? "locked" : ""}" data-chapter="${i}" ${chapter.locked ? "aria-disabled=\"true\"" : ""}>
      <span class="chapter-icon" style="background:${chapter.color}">${chapter.icon}</span>
      <span><small>${chapter.n}</small><h3>${chapter.title}</h3><p>${chapter.desc}</p></span>
      <span class="status">${chapter.done ? "✓" : chapter.locked ? "⌕" : "▶"}</span>
    </button>`).join("");
}

function renderKana() {
  $("#kana-grid").innerHTML = kana[state.kanaType].map(([symbol, roman]) => `<button class="kana-item" data-speak="${symbol}"><b>${symbol}</b><small>${roman}</small></button>`).join("");
}

function renderWord() {
  const item = words[state.wordIndex % Math.min(state.wordGoal, words.length)];
  const progress = state.wordProgress[item.jp];
  $("#word-index").textContent = state.wordIndex + 1;
  $("#word-total").textContent = state.wordGoal;
  $("#word-jp").textContent = item.jp;
  $("#word-reading").textContent = item.reading;
  $("#word-ko").textContent = item.ko;
  $(".word-type").textContent = item.type;
  $("#word-example").innerHTML = `${item.example} <em>${item.exampleKo}</em>`;
  $("#flashcard").classList.remove("hidden-meaning");
  $("#bookmark-word").classList.toggle("saved", progress?.status === "hard");
  $("#bookmark-word").textContent = progress?.status === "hard" ? "♥" : "♡";
}

function updateGoalUI() {
  $("#word-goal-label").textContent = `${state.wordGoal}개`;
  $("#word-total").textContent = state.wordGoal;
  $$("[data-goal]").forEach(btn => btn.classList.toggle("selected", Number(btn.dataset.goal) === state.wordGoal));
}

function openModal(id) {
  const modal = $(id);
  modal.removeAttribute("inert");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  if (id === "#auth-modal" && state.authRequired && !state.session) return;
  const modal = $(id);
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("inert", "");
  document.body.style.overflow = "";
  speechSynthesis?.cancel();
}

const lessonStages = [
  { label: "1단계 · 먼저 들어보세요", coach: "먼저 자연스러운 속도로 들어보세요. 뜻을 완벽히 몰라도 괜찮아요!", interaction: '<p class="listen-note">▶ 버튼을 누르면 원어민 발음으로 들을 수 있어요.</p>', button: "들었어요" },
  { label: "2단계 · 천천히 따라 해보세요", coach: "문장을 두 덩어리로 나누어 천천히 따라 말해볼까요?", interaction: '<button class="repeat-button" id="practice-mic">● 누르고 따라 말하기</button>', button: "말해봤어요" },
  { label: "3단계 · 단어를 바꿔보세요", coach: "이번에는 커피 대신 물을 주문해 보세요.", interaction: '<div class="choice-row"><button data-choice="水をください。">水 · 물</button><button data-choice="お茶をください。">お茶 · 차</button><button data-choice="これをください。">これ · 이것</button></div>', button: "응용했어요" },
  { label: "4단계 · 실전처럼 대답하세요", coach: "점원이 주문을 물었어요. 힌트 없이 직접 대답해 보세요!", interaction: '<button class="repeat-button" id="practice-mic">● 눌러서 대답하기</button>', button: "챕터 완료" }
];

function renderLessonStage() {
  const stage = lessonStages[state.lessonStep];
  $("#lesson-stage-label").textContent = stage.label;
  $("#lesson-stage-count").textContent = `${state.lessonStep + 1} / ${lessonStages.length}`;
  $("#lesson-progress-bar").style.width = `${(state.lessonStep + 1) / lessonStages.length * 100}%`;
  $("#coach-text").textContent = stage.coach;
  $("#lesson-interaction").innerHTML = stage.interaction;
  $("#next-lesson-step").innerHTML = `${stage.button} <span>→</span>`;
}

function openLesson() {
  state.lessonStep = 0;
  renderLessonStage();
  openModal("#lesson-modal");
}

function speechPractice(button, expected, onDone) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  button.classList.add("listening");
  button.textContent = "듣고 있어요…";
  if (!Recognition) {
    setTimeout(() => {
      button.classList.remove("listening");
      button.textContent = "✓ 잘 들렸어요!";
      onDone?.(expected);
    }, 1400);
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "ja-JP";
  recognition.interimResults = false;
  recognition.onresult = event => onDone?.(event.results[0][0].transcript);
  recognition.onerror = () => showToast("잘 들리지 않았어요. 조용한 곳에서 다시 말해보세요.");
  recognition.onend = () => {
    button.classList.remove("listening");
    button.textContent = "● 다시 말하기";
  };
  recognition.start();
}

function renderReview() {
  const item = reviewItems[state.reviewStep];
  $("#review-step").textContent = `${state.reviewStep + 1} / ${reviewItems.length}`;
  $("#review-prompt").textContent = item.prompt;
  $("#hint-text").textContent = item.hint;
  $("#hint-text").classList.remove("show");
  $("#review-result").textContent = "";
  $("#review-mic small").textContent = item.answer;
}

document.addEventListener("click", event => {
  const pageLink = event.target.closest("[data-page-link]");
  if (pageLink) navigate(pageLink.dataset.pageLink);

  const speakButton = event.target.closest("[data-speak]");
  if (speakButton) {
    speak(speakButton.dataset.speak);
    speakButton.classList.add("playing");
    setTimeout(() => speakButton.classList.remove("playing"), 500);
  }

  if (event.target.closest("[data-lesson]")) openLesson();

  const chapter = event.target.closest("[data-chapter]");
  if (chapter) {
    const data = chapters[Number(chapter.dataset.chapter)];
    if (data.locked) showToast("앞 챕터를 완료하면 열려요.");
    else if (data.title.includes("카페")) openLesson();
    else showToast(data.done ? "복습 모드로 다시 시작할 수 있어요." : "다음 학습으로 곧 만나요!");
  }

  const kanaTab = event.target.closest("[data-kana-type]");
  if (kanaTab) {
    state.kanaType = kanaTab.dataset.kanaType;
    $$("[data-kana-type]").forEach(tab => tab.classList.toggle("active", tab === kanaTab));
    renderKana();
  }

  const choice = event.target.closest("[data-choice]");
  if (choice) {
    $$("[data-choice]").forEach(btn => btn.style.background = "");
    choice.style.background = "var(--lime-pale)";
    speak(choice.dataset.choice);
  }

  if (event.target.closest("#practice-mic")) {
    const button = event.target.closest("#practice-mic");
    speechPractice(button, "コーヒーをください。", () => showToast("좋아요! 문장이 또렷하게 들렸어요."));
  }
});

$("#start-daily").addEventListener("click", openLesson);
$("#phrase-sound").addEventListener("click", () => speak("コーヒーをください。", state.lessonStep === 1 ? .7 : .88));
$("#close-lesson").addEventListener("click", () => closeModal("#lesson-modal"));
$("#next-lesson-step").addEventListener("click", async () => {
  if (state.lessonStep < lessonStages.length - 1) {
    state.lessonStep += 1;
    renderLessonStage();
    await persist(saveChapterProgress({ chapter_id: "chapter-05", current_step: state.lessonStep, completed: false }));
  } else {
    state.speakingSentenceCount += 1;
    await Promise.all([
      persist(saveChapterProgress({ chapter_id: "chapter-05", current_step: lessonStages.length, completed: true, completed_at: new Date().toISOString() })),
      persist(saveProfile({ speaking_sentence_count: state.speakingSentenceCount, last_study_date: new Date().toISOString().slice(0, 10) })),
      recordStudyActivity({ words_reviewed: 0, sentences_spoken: 1, chapters_completed: 1 })
    ]);
    closeModal("#lesson-modal");
    showToast("축하해요! 말할 수 있는 문장이 1개 늘었어요. 🎉");
  }
});

$("#word-sound").addEventListener("click", () => speak(words[state.wordIndex % words.length].jp));
$("#flashcard").addEventListener("click", event => {
  if (!event.target.closest("button")) $("#flashcard").classList.toggle("hidden-meaning");
});
$("#bookmark-word").addEventListener("click", async event => {
  event.currentTarget.classList.toggle("saved");
  event.currentTarget.textContent = event.currentTarget.classList.contains("saved") ? "♥" : "♡";
  const item = words[state.wordIndex % words.length];
  const saved = event.currentTarget.classList.contains("saved");
  state.wordProgress[item.jp] = { ...(state.wordProgress[item.jp] || {}), status: saved ? "hard" : "learning" };
  await persist(saveWordProgress({
    word_id: item.jp,
    status: saved ? "hard" : "learning",
    correct_count: state.wordProgress[item.jp].correct_count || 0,
    wrong_count: state.wordProgress[item.jp].wrong_count || 0,
    last_reviewed_at: new Date().toISOString(),
    next_review_at: dateAfter(saved ? 1 : 2)
  }));
  showToast(event.currentTarget.classList.contains("saved") ? "복습 목록에 담았어요." : "복습 목록에서 뺐어요.");
});
async function nextWord(hard = false) {
  const item = words[state.wordIndex % words.length];
  const previous = state.wordProgress[item.jp] || {};
  const progress = {
    word_id: item.jp,
    status: hard ? "hard" : "known",
    correct_count: (previous.correct_count || 0) + (hard ? 0 : 1),
    wrong_count: (previous.wrong_count || 0) + (hard ? 1 : 0),
    last_reviewed_at: new Date().toISOString(),
    next_review_at: dateAfter(hard ? 1 : 3)
  };
  state.wordProgress[item.jp] = progress;
  await Promise.all([
    persist(saveWordProgress(progress)),
    recordStudyActivity({ words_reviewed: 1, sentences_spoken: 0, chapters_completed: 0 })
  ]);
  if (state.wordIndex + 1 >= state.wordGoal) {
    state.wordIndex = 0;
    showToast(hard ? "어려운 단어는 복습에 다시 나와요." : `오늘의 단어 ${state.wordGoal}개를 모두 봤어요!`);
  } else state.wordIndex += 1;
  renderWord();
}
$("#word-hard").addEventListener("click", () => nextWord(true));
$("#word-know").addEventListener("click", () => nextWord(false));

function openSettings() { updateGoalUI(); openModal("#settings-modal"); }
function openProfile() { state.session ? openSettings() : openAuth(); }
$("#open-settings").addEventListener("click", openProfile);
$("#mobile-settings").addEventListener("click", openProfile);
$("#change-goal").addEventListener("click", openSettings);
$("#close-settings").addEventListener("click", () => closeModal("#settings-modal"));
$$("[data-goal]").forEach(btn => btn.addEventListener("click", () => {
  state.wordGoal = Number(btn.dataset.goal);
  updateGoalUI();
}));
$("#save-settings").addEventListener("click", async () => {
  localStorage.setItem("easyNihongo.wordGoal", String(state.wordGoal));
  state.wordIndex = 0;
  await persist(saveProfile({ daily_word_goal: state.wordGoal }), state.session ? "클라우드에도 저장했어요." : "");
  updateGoalUI(); renderWord(); closeModal("#settings-modal");
  if (!state.session) showToast(`하루 ${state.wordGoal}개 학습으로 기기에 저장했어요.`);
});

$("#review-hint").addEventListener("click", () => $("#hint-text").classList.toggle("show"));
$("#review-mic").addEventListener("click", event => {
  const button = event.currentTarget;
  const item = reviewItems[state.reviewStep];
  speechPractice(button, item.answer, transcript => {
    $("#review-result").textContent = `✓ “${transcript}” 잘 전달됐어요!`;
    speak(item.answer);
    const previous = state.reviewProgress[`review-${state.reviewStep + 1}`] || {};
    const progress = {
      review_id: `review-${state.reviewStep + 1}`,
      repetitions: (previous.repetitions || 0) + 1,
      ease_factor: previous.ease_factor || 2.5,
      interval_days: Math.min((previous.interval_days || 1) * 2, 30),
      next_review_at: dateAfter(Math.min((previous.interval_days || 1) * 2, 30)),
      last_result: "good"
    };
    state.reviewProgress[progress.review_id] = progress;
    persist(saveReviewProgress(progress));
    recordStudyActivity({ words_reviewed: 0, sentences_spoken: 1, chapters_completed: 0 });
    setTimeout(() => {
      state.reviewStep = (state.reviewStep + 1) % reviewItems.length;
      renderReview();
    }, 2300);
  });
});

function setAuthMode(mode) {
  state.authMode = mode;
  $$('[data-auth-mode]').forEach(button => button.classList.toggle("active", button.dataset.authMode === mode));
  $("#auth-submit").textContent = mode === "login" ? "로그인" : "회원가입 하기";
  $("#auth-password").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("#signup-fields").hidden = mode !== "signup";
  $("#auth-name").required = mode === "signup";
  $("#auth-birth-date").required = mode === "signup";
  $("#auth-message").textContent = "";
  $("#auth-message").classList.remove("success");
}

function showCredentialsStep() {
  $("#auth-credentials-step").hidden = false;
  $("#email-verification-step").hidden = true;
  $("#verification-message").textContent = "";
}

function showVerificationStep(email) {
  $("#auth-credentials-step").hidden = true;
  $("#email-verification-step").hidden = false;
  $("#verification-email-label").textContent = email;
  $("#verification-message").textContent = "";
  $("#verification-message").classList.remove("success");
}

function openAuth(required = false) {
  if ($("#settings-modal").classList.contains("open")) closeModal("#settings-modal");
  state.authRequired = required;
  document.body.classList.toggle("auth-locked", required);
  setAuthMode("login");
  showCredentialsStep();
  $("#auth-form").reset();
  if (!isCloudConfigured) $("#auth-message").textContent = "Supabase 프로젝트 연결을 마치면 로그인할 수 있어요.";
  openModal("#auth-modal");
}

$$('[data-auth-mode]').forEach(button => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
$("#close-auth").addEventListener("click", () => closeModal("#auth-modal"));
$("#auth-form").addEventListener("submit", async event => {
  event.preventDefault();
  const email = $("#auth-email").value.trim();
  const password = $("#auth-password").value;
  const fullName = $("#auth-name").value.trim();
  const birthDate = $("#auth-birth-date").value;
  const submit = $("#auth-submit");
  const message = $("#auth-message");
  submit.disabled = true;
  submit.textContent = state.authMode === "login" ? "로그인 중…" : "계정 만드는 중…";
  message.textContent = "";
  try {
    const { data, error } = state.authMode === "login"
      ? await signIn(email, password)
      : await signUp(email, password, { fullName, birthDate, dailyWordGoal: state.wordGoal });
    if (error) throw error;
    if (state.authMode === "signup" && !data.session) {
      state.pendingSignupEmail = email;
      showVerificationStep(email);
      return;
    }
    state.authRequired = false;
    document.body.classList.remove("auth-locked");
    updateAccountUI(data.session);
    await persist(saveProfile({ daily_word_goal: state.wordGoal, last_study_date: new Date().toISOString().slice(0, 10) }));
    await hydrateLearningData();
    closeModal("#auth-modal");
    showToast(state.authMode === "login" ? "다시 만나서 반가워요! 기록을 불러왔어요." : "가입 완료! 이제 학습 기록이 안전하게 저장돼요.");
  } catch (error) {
    console.error(error);
    message.textContent = error.message?.includes("Invalid login")
      ? "이메일 또는 비밀번호를 확인해 주세요."
      : error.message?.includes("Database error")
        ? "동일한 이름과 생년월일로 가입된 계정이 있어요."
      : error.message || "잠시 후 다시 시도해 주세요.";
  } finally {
    submit.disabled = false;
    submit.textContent = state.authMode === "login" ? "로그인" : "회원가입 하기";
  }
});

$("#resend-verification-email").addEventListener("click", async () => {
  if (!state.pendingSignupEmail) return;
  const { error } = await resendSignupEmail(state.pendingSignupEmail);
  $("#verification-message").textContent = error ? "잠시 후 다시 시도해 주세요." : "인증 메일을 다시 보냈어요.";
  $("#verification-message").classList.toggle("success", !error);
});
$("#back-to-signup").addEventListener("click", () => {
  showCredentialsStep();
  setAuthMode("signup");
});
$("#back-to-login").addEventListener("click", () => {
  const email = state.pendingSignupEmail;
  showCredentialsStep();
  setAuthMode("login");
  $("#auth-email").value = email;
});

$("#account-action").addEventListener("click", async () => {
  if (!state.session) return openAuth();
  await signOut();
  closeModal("#settings-modal");
  updateAccountUI(null);
  openAuth(true);
});

$$(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", event => {
  if (event.target === backdrop) closeModal(`#${backdrop.id}`);
}));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") $$(".modal-backdrop.open").forEach(modal => closeModal(`#${modal.id}`));
});

renderChapters();
renderKana();
renderWord();
renderReview();
updateGoalUI();
renderWeeklyGoal();

async function initializeCloud() {
  if (!isCloudConfigured) {
    updateAccountUI(null);
    document.body.classList.remove("auth-pending");
    openAuth(true);
    return;
  }
  const session = await getSession();
  updateAccountUI(session);
  document.body.classList.remove("auth-pending");
  if (session) {
    state.authRequired = false;
    document.body.classList.remove("auth-locked");
    await hydrateLearningData();
  } else {
    openAuth(true);
  }
  onAuthChange(async nextSession => {
    const changedUser = nextSession?.user?.id !== state.session?.user?.id;
    updateAccountUI(nextSession);
    if (nextSession && changedUser) {
      state.authRequired = false;
      document.body.classList.remove("auth-locked");
      await hydrateLearningData();
      if ($("#auth-modal").classList.contains("open")) {
        state.pendingSignupEmail = "";
        closeModal("#auth-modal");
        showToast("이메일 인증 완료! 학습 기록 저장을 시작해요.");
      }
    } else if (!nextSession) {
      openAuth(true);
    }
  });
}

initializeCloud();
