import assert from "node:assert/strict";
import { evaluateRecognitionAlternatives, evaluateSpeech, normalizeJapanese } from "../speech-evaluator.js";

assert.equal(evaluateSpeech("コーヒーをください。", "コーヒーをください").passed, true);
assert.equal(evaluateSpeech("コーヒーをください。", "コーヒーをお願いします").passed, false);
assert.match(evaluateSpeech("コーヒーをください。", "コーヒーをお願いします").feedback, /ください/);
assert.equal(evaluateSpeech("水でお願いします。", "水でお願いします").passed, true);
assert.equal(evaluateSpeech("水でお願いします。", "水でください").passed, false);
assert.equal(normalizeJapanese("珈琲を下さい"), normalizeJapanese("コーヒーをください"));
assert.equal(evaluateRecognitionAlternatives("コーヒーをください。", [
  { transcript: "コーヒーをお願いします", confidence: 0.9 },
  { transcript: "コーヒーをください", confidence: 0.8 }
]).passed, false);
assert.equal(normalizeJapanese("私は民です"), normalizeJapanese("わたしはミンです"));
assert.equal(evaluateSpeech("わたしはミンです。", "私は民です").passed, true);
assert.equal(evaluateSpeech("わたしはミンです。", "私はみんです").passed, true);
assert.equal(evaluateSpeech("わたしはミンです。", "私はリンです").passed, false);
assert.match(evaluateSpeech("わたしはミンです。", "私はリンです").feedback, /ミン/);
assert.equal(evaluateSpeech("何時に起きますか。", "なんじにおきますか").passed, true);
assert.equal(evaluateSpeech("日本に行きたいです。", "にほんにいきたいです").passed, true);
assert.equal(evaluateSpeech("日本に行きたいです。", "日本に行きます").passed, false);
assert.equal(evaluateSpeech("日本語が少しできます。", "にほんごがすこしできます").passed, true);
assert.equal(evaluateSpeech("日本語を勉強しています。", "日本語をべんきょうしています").passed, true);

console.log("speech evaluator: 17 assertions passed");
