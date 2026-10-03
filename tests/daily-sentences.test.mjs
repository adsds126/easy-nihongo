import assert from "node:assert/strict";
import { dailySentences } from "../daily-sentences.js";

assert.equal(dailySentences.length, 40);
assert.equal(new Set(dailySentences.map(item => item.source)).size, dailySentences.length);
assert.equal(new Set(dailySentences.map(item => item.jp)).size, dailySentences.length);
dailySentences.forEach(item => {
  assert.equal(typeof item.source, "number");
  assert.ok(item.category && item.jp && item.reading && item.ko);
  assert.match(item.jp, /[。？?]$/);
});
assert.deepEqual(
  dailySentences.filter(item => [6, 22, 131, 168, 194, 271].includes(item.source)),
  []
);

console.log("daily sentences: 40 curated entries passed");
