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

console.log("speech evaluator: 7 assertions passed");
