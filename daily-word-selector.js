function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function seedFromDate(date) {
  return [...localDateKey(date)].reduce((seed, character) => {
    seed ^= character.charCodeAt(0);
    return Math.imul(seed, 16777619) >>> 0;
  }, 2166136261);
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function selectDailyWords(wordBank, date = new Date(), count = 10) {
  const shuffled = [...wordBank];
  const random = seededRandom(seedFromDate(date));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, Math.min(Math.max(count, 0), shuffled.length));
}
