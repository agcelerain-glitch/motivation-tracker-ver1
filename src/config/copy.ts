export const REFLECTION_COPY = {
  insight: {
    label: '今日の気づき',
    placeholder: '今日気づいたこと、発見したこと',
    hint: 'よく眠れた？寝不足だった？　体調・天気・場所のことも書いておくと、後から見返したときに効いてきます',
  },
  challenge: {
    label: '今日の挑戦',
    placeholder: '今日、少しでも新しくやってみたこと',
    hint: 'うまくいかなかった挑戦でも構いません',
  },
} as const;

export const CARRYOVER_NUDGE = {
  title: (count: number) => `このやること、${count}日つづけて明日に送っていますね。`,
  body: '続けるのもいいと思います。\nもし詰まっているなら、小さく分けてみるのも手です。',
  actions: {
    continue:  'このまま続ける',
    breakdown: '小さく分ける',
    switch:    '別のことにする',
  },
} as const;
