const config = window.EASY_NIHONGO_SUPABASE || {};
const sdk = window.supabase;
const PENDING_KEY = "easyNihongo.pendingSync";
const LOCAL_PROFILE_KEY = "easyNihongo.localProfile";

export const isCloudConfigured = Boolean(
  sdk && config.url?.startsWith("https://") && config.publishableKey
);

export const db = isCloudConfigured
  ? sdk.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;

function localProfile() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLocalProfile(patch) {
  const next = { ...localProfile(), ...patch, updated_at: new Date().toISOString() };
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next));
  return next;
}

function pendingActions() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY)) || [];
  } catch {
    return [];
  }
}

function queueAction(type, payload) {
  const queue = pendingActions();
  queue.push({ type, payload, queuedAt: new Date().toISOString() });
  localStorage.setItem(PENDING_KEY, JSON.stringify(queue.slice(-100)));
}

async function currentUser() {
  if (!db) return null;
  const { data } = await db.auth.getUser();
  return data.user || null;
}

async function execute(type, payload, allowQueue = true) {
  const user = await currentUser();
  if (!user) {
    if (allowQueue) queueAction(type, payload);
    return { queued: true };
  }

  let result;
  const userPayload = { ...payload, user_id: user.id, updated_at: new Date().toISOString() };
  if (type === "profile") {
    result = await db.from("profiles").upsert(userPayload, { onConflict: "user_id" });
  } else if (type === "chapter") {
    result = await db.from("chapter_progress").upsert(userPayload, { onConflict: "user_id,chapter_id" });
  } else if (type === "word") {
    result = await db.from("word_progress").upsert(userPayload, { onConflict: "user_id,word_id" });
  } else if (type === "review") {
    result = await db.from("review_progress").upsert(userPayload, { onConflict: "user_id,review_id" });
  } else if (type === "session") {
    result = await db.from("study_sessions").insert({ ...userPayload, created_at: new Date().toISOString() });
  }

  if (result?.error) {
    if (allowQueue) queueAction(type, payload);
    throw result.error;
  }
  return { synced: true };
}

export async function signUp(email, password) {
  if (!db) throw new Error("Supabase 연결 정보가 아직 설정되지 않았어요.");
  return db.auth.signUp({ email, password });
}

export async function signIn(email, password) {
  if (!db) throw new Error("Supabase 연결 정보가 아직 설정되지 않았어요.");
  return db.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!db) return;
  return db.auth.signOut();
}

export async function getSession() {
  if (!db) return null;
  const { data } = await db.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  if (!db) return { unsubscribe() {} };
  const { data } = db.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}

export async function loadLearningData() {
  const user = await currentUser();
  if (!user) return { profile: localProfile(), chapters: [], words: [], reviews: [] };

  const [profile, chapters, words, reviews] = await Promise.all([
    db.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    db.from("chapter_progress").select("*").eq("user_id", user.id),
    db.from("word_progress").select("*").eq("user_id", user.id),
    db.from("review_progress").select("*").eq("user_id", user.id)
  ]);
  const error = [profile, chapters, words, reviews].find(result => result.error)?.error;
  if (error) throw error;
  return {
    profile: profile.data || localProfile(),
    chapters: chapters.data || [],
    words: words.data || [],
    reviews: reviews.data || []
  };
}

export async function flushPendingActions() {
  if (!db || !(await currentUser())) return 0;
  const queue = pendingActions();
  if (!queue.length) return 0;
  const remaining = [];
  let synced = 0;
  for (const action of queue) {
    try {
      await execute(action.type, action.payload, false);
      synced += 1;
    } catch {
      remaining.push(action);
    }
  }
  localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
  return synced;
}

export async function saveProfile(patch) {
  saveLocalProfile(patch);
  return execute("profile", patch);
}

export const saveChapterProgress = payload => execute("chapter", payload);
export const saveWordProgress = payload => execute("word", payload);
export const saveReviewProgress = payload => execute("review", payload);
export const saveStudySession = payload => execute("session", payload);
