const COMMON_FORMS = [
  [/珈琲/g, "コーヒー"],
  [/下さい/g, "ください"],
  [/御願いします/g, "お願いします"],
  [/お願いいたします/g, "お願いします"],
  [/有難う/g, "ありがとう"],
  [/大丈夫/g, "だいじょうぶ"]
];

const REQUIRED_EXPRESSIONS = ["ください", "お願いします", "ありがとう", "だいじょうぶ"];

function katakanaToHiragana(text) {
  return [...text].map(character => {
    const code = character.charCodeAt(0);
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : character;
  }).join("");
}

export function normalizeJapanese(text = "") {
  let normalized = String(text).normalize("NFKC").toLowerCase();
  COMMON_FORMS.forEach(([pattern, replacement]) => { normalized = normalized.replace(pattern, replacement); });
  return katakanaToHiragana(normalized).replace(/[^\p{Script=Hiragana}\p{Script=Han}a-z0-9]/gu, "");
}

function editDistance(left, right) {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
  for (let column = 0; column <= right.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
  }
  return rows[left.length][right.length];
}

export function evaluateSpeech(expected, transcript, confidence = 1) {
  const normalizedExpected = normalizeJapanese(expected);
  const normalizedTranscript = normalizeJapanese(transcript);
  const longestLength = Math.max(normalizedExpected.length, normalizedTranscript.length, 1);
  const similarity = 1 - editDistance(normalizedExpected, normalizedTranscript) / longestLength;
  const requiredExpression = REQUIRED_EXPRESSIONS.find(expression =>
    normalizedExpected.includes(normalizeJapanese(expression)) && !normalizedTranscript.includes(normalizeJapanese(expression))
  );
  const lowConfidence = Number.isFinite(confidence) && confidence > 0 && confidence < 0.25 && similarity < 0.95;
  const passed = !requiredExpression && !lowConfidence && similarity >= 0.8;

  let feedback = "목표 문장과 자연스럽게 일치했어요.";
  if (requiredExpression) feedback = `끝부분이 달라요. 「${requiredExpression}」라고 말해 보세요.`;
  else if (lowConfidence) feedback = "소리가 또렷하지 않았어요. 조금 더 천천히 다시 말해 보세요.";
  else if (!passed && similarity >= 0.6) feedback = "거의 맞았어요. 빠진 소리가 없는지 확인하고 다시 말해 보세요.";
  else if (!passed) feedback = "목표 문장과 다르게 들렸어요. 정답을 다시 듣고 천천히 말해 보세요.";

  return { passed, similarity, feedback, transcript };
}

export function evaluateRecognitionAlternatives(expected, alternatives) {
  const primary = alternatives[0] || { transcript: "", confidence: 0 };
  return evaluateSpeech(expected, primary.transcript, primary.confidence);
}
