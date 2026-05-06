export type CardGrade = 1 | 2 | 3;

export interface Card {
  id: string;
  memberId: string;
  grade: CardGrade;
  title: string;
  message: string;
}

const GRADE_LABELS: Record<CardGrade, string> = {
  1: 'Normal',
  2: 'Rare',
  3: 'Special',
};

export { GRADE_LABELS };

function makeCards(memberId: string, memberKo: string): Card[] {
  const cards: Card[] = [];

  // Normal 12장 (grade 1)
  const normalTitles = [
    '봄날의 미소', '오늘도 화이팅', '반짝이는 순간', '따뜻한 하루',
    '설레는 아침', '함께해서 행복해', '작은 행복', '일상의 빛',
    '웃음 가득', '포근한 오후', '빛나는 너', '소중한 기억',
  ];
  const normalMessages = [
    `${memberKo}이(가) 환하게 웃어줬어요 ☀️`,
    `오늘도 ${memberKo}와 함께! 파이팅!`,
    `반짝반짝 빛나는 ${memberKo}의 하루`,
    `${memberKo}의 따뜻한 마음이 전해져요`,
    `새로운 아침, ${memberKo}와 시작해요`,
    `팬이어서 정말 다행이에요 💕`,
    `작은 행복들이 모여 큰 기쁨이 돼요`,
    `${memberKo}의 일상 한 장면`,
    `함박웃음 한 장 담았어요`,
    `포근한 오후의 ${memberKo}`,
    `빛나는 ${memberKo}를 담았어요 ✨`,
    `소중한 순간을 카드에 담았어요`,
  ];

  for (let i = 0; i < 12; i++) {
    cards.push({
      id: `${memberId}_${i + 1}`,
      memberId,
      grade: 1,
      title: normalTitles[i],
      message: normalMessages[i],
    });
  }

  // Rare 6장 (grade 2)
  const rareTitles = [
    '무대 위의 별', '꿈을 향해', '반짝이는 밤하늘', '특별한 순간',
    '스포트라이트', '별빛 아래서',
  ];
  const rareMessages = [
    `무대 위에서 빛나는 ${memberKo} ⭐`,
    `꿈을 향해 달려가는 ${memberKo}`,
    `밤하늘처럼 반짝이는 ${memberKo} 🌟`,
    `특별한 날, 특별한 ${memberKo}`,
    `스포트라이트 아래 ${memberKo}`,
    `별빛 아래 ${memberKo}와 함께 💫`,
  ];

  for (let i = 0; i < 6; i++) {
    cards.push({
      id: `${memberId}_${13 + i}`,
      memberId,
      grade: 2,
      title: rareTitles[i],
      message: rareMessages[i],
    });
  }

  // Special 2장 (grade 3)
  const specialTitles = ['황금빛 순간', '전설의 카드'];
  const specialMessages = [
    `✨ 황금빛으로 빛나는 ${memberKo}, 오직 당신만을 위해`,
    `💎 전설이 된 ${memberKo}의 가장 아름다운 순간`,
  ];

  for (let i = 0; i < 2; i++) {
    cards.push({
      id: `${memberId}_${19 + i}`,
      memberId,
      grade: 3,
      title: specialTitles[i],
      message: specialMessages[i],
    });
  }

  return cards;
}

export const ALL_CARDS: Card[] = [
  ...makeCards('jiyu', '지유'),
  ...makeCards('jiwoo', '지우'),
  ...makeCards('subin', '수빈'),
  ...makeCards('sumin', '수민'),
  ...makeCards('haeum', '하음'),
];

export function getCardsByMember(memberId: string): Card[] {
  return ALL_CARDS.filter((c) => c.memberId === memberId);
}

export function getCardById(id: string): Card | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

/** Weighted random draw: Normal 60%, Rare 30%, Special 10% */
export function drawRandomCard(memberId: string): Card {
  const memberCards = getCardsByMember(memberId);
  const rand = Math.random();
  let grade: CardGrade;
  if (rand < 0.6) grade = 1;
  else if (rand < 0.9) grade = 2;
  else grade = 3;

  const pool = memberCards.filter((c) => c.grade === grade);
  return pool[Math.floor(Math.random() * pool.length)];
}
