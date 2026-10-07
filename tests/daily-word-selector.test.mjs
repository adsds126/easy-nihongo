import assert from "node:assert/strict";
import { selectDailyWords } from "../daily-word-selector.js";

const bank = Array.from({ length: 60 }, (_, index) => ({ jp: `word-${index + 1}` }));
const october7 = new Date(2026, 9, 7, 9);
const sameDayLater = new Date(2026, 9, 7, 23);
const october8 = new Date(2026, 9, 8, 9);

const firstSet = selectDailyWords(bank, october7, 10);
const repeatedSet = selectDailyWords(bank, sameDayLater, 10);
const nextSet = selectDailyWords(bank, october8, 10);

assert.equal(firstSet.length, 10);
assert.equal(new Set(firstSet.map(item => item.jp)).size, 10);
assert.deepEqual(firstSet, repeatedSet);
assert.notDeepEqual(firstSet, nextSet);
assert.equal(selectDailyWords(bank, october7, 20).length, 20);
assert.equal(selectDailyWords(bank, october7, 100).length, bank.length);

console.log("daily word selector: deterministic daily rotation passed");
