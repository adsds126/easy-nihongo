import assert from "node:assert/strict";
import { dailySentences } from "../daily-sentences.js";

assert.equal(dailySentences.length, 45);
assert.equal(new Set(dailySentences.map(item => item.id)).size, dailySentences.length);
assert.equal(new Set(dailySentences.map(item => item.jp)).size, dailySentences.length);
dailySentences.forEach((item, index) => {
  assert.equal(item.id, `video-${String(index + 1).padStart(2, "0")}`);
  assert.equal(item.order, index + 1);
  assert.ok(item.category && item.jp && item.reading && item.ko);
});
assert.deepEqual(
  dailySentences.map(item => item.jp),
  [
    "あの", "えっと", "まあ", "なんか", "そうですね", "実は", "というか", "ところで", "そういえば", "ちなみに",
    "やっぱり", "一応", "とりあえず", "正直言うと", "すみませんが", "えー", "うーん", "つまり", "例えば", "もちろん",
    "確かに", "なるほど", "ちょっと待ってください", "よかったら", "お手数ですが", "せっかくなので", "どちらかというと", "とにかく", "なんていうか", "ぶっちゃけ",
    "じゃあ", "それで", "でも", "だから", "しかも", "ただ", "というより", "もしかして", "どうやら", "あ、そうだ",
    "一言で言うと", "悪いんだけど", "お願いがあるんですが", "さて", "なんとなく"
  ]
);

console.log("daily sentences: 45 video expressions passed");
