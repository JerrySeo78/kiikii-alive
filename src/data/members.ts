export interface Member {
  id: string;
  name: string;
  nameKo: string;
  role: string;
  color: string;
  image: string;
  description: string;
  dailyMessage: { ko: string; ja: string; en: string };
}

export const MEMBERS: Member[] = [
  {
    id: 'jiyu',
    name: 'JIYU',
    nameKo: '지유',
    role: 'Leader · Vocal · Dancer',
    color: '#B57BCC',
    image: 'char_jiyu.png',
    description: 'Bright energy that lights up the stage',
    dailyMessage: {
      ko: '오늘도 와줘서 고마워! 💜',
      ja: '今日も来てくれてありがとう！💜',
      en: 'So glad you showed up today! 💜',
    },
  },
  {
    id: 'jiwoo',
    name: 'JIWOO',
    nameKo: '지우',
    role: 'Main Vocal',
    color: '#5B7FA6',
    image: 'char_jiwoo.png',
    description: 'Cool and captivating vocals',
    dailyMessage: {
      ko: '오늘 하루도 같이 달려봐요 🌊',
      ja: '今日も一緒に頑張りましょう🌊',
      en: "Let's make today great together 🌊",
    },
  },
  {
    id: 'subin',
    name: 'SUBIN',
    nameKo: '수빈',
    role: 'Main Rapper · Dancer',
    color: '#C8384A',
    image: 'char_subin.png',
    description: 'Bold charisma and fierce presence',
    dailyMessage: {
      ko: '오늘도 최고야, 진짜로! 🔥',
      ja: '今日も最高だよ、マジで！🔥',
      en: "You're the best today, for real! 🔥",
    },
  },
  {
    id: 'sumin',
    name: 'SUMIN',
    nameKo: '수민',
    role: 'Vocal · Rapper',
    color: '#F07850',
    image: 'char_sumin.png',
    description: 'Vibrant and full of energy',
    dailyMessage: {
      ko: '매일 이렇게 응원해줘서 힘이 나! 🍑',
      ja: '毎日応援してくれて元気が出るよ！🍑',
      en: 'Your cheer gives me so much energy! 🍑',
    },
  },
  {
    id: 'haeum',
    name: 'HAEUM',
    nameKo: '하음',
    role: 'Vocal · Visual',
    color: '#8B6355',
    image: 'char_haeum.png',
    description: 'Warm charm and mature grace',
    dailyMessage: {
      ko: '오늘도 함께해줘서 따뜻해 ☕',
      ja: '今日も一緒にいてくれて温かい気持ちだよ☕',
      en: "Your presence today warms my heart ☕",
    },
  },
];

export function getMemberById(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}
