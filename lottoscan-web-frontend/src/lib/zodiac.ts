export interface ZodiacSign {
  id: string;
  symbol: string;
  nameEn: string;
  nameSi: string;
  transliteration: string;
  svgPath: string;
}

export const ZODIAC_SIGNS: Record<string, ZodiacSign> = {
  mesha: {
    id: "mesha",
    symbol: "♈",
    nameEn: "Aries",
    nameSi: "මේෂ",
    transliteration: "Mesha",
    svgPath: "M12 21v-12M12 9C10.5 6.5 8 5 5 5c-1.66 0-3 1.34-3 3s1.34 3 3 3c2 0 3.5 1.5 4 3M12 9c1.5-2.5 4-4 7-4 1.66 0 3 1.34 3 3s-1.34 3-3 3c-2 0-3.5 1.5-4 3"
  },
  vrushabha: {
    id: "vrushabha",
    symbol: "♉",
    nameEn: "Taurus",
    nameSi: "වෘෂභ",
    transliteration: "Vrushabha",
    svgPath: "M12 11a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-7-4c0 3 3 5 7 5s7-2 7-5"
  },
  mithuna: {
    id: "mithuna",
    symbol: "♊",
    nameEn: "Gemini",
    nameSi: "මිථුන",
    transliteration: "Mithuna",
    svgPath: "M5 4h14M5 20h14M9 4v16M15 4v16"
  },
  kataka: {
    id: "kataka",
    symbol: "♋",
    nameEn: "Cancer",
    nameSi: "කටක",
    transliteration: "Kataka",
    svgPath: "M6 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0c6 0 12-4 12-8M18 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 0c-6 0-12 4-12 8"
  },
  simha: {
    id: "simha",
    symbol: "♌",
    nameEn: "Leo",
    nameSi: "සිංහ",
    transliteration: "Simha",
    svgPath: "M7 15a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm0 0c2-5 6-8 10-8s4 3 4 5-2 4-4 4-3-2-3-4"
  },
  kanya: {
    id: "kanya",
    symbol: "♍",
    nameEn: "Virgo",
    nameSi: "කන්‍යා",
    transliteration: "Kanya",
    svgPath: "M4 4v12a2 2 0 0 0 4 0V4M8 4v12a2 2 0 0 0 4 0V4M12 4v12a2 2 0 0 0 4 0V4c0 4 4 4 4 8v2a3 3 0 0 1-6 0"
  },
  thula: {
    id: "thula",
    symbol: "♎",
    nameEn: "Libra",
    nameSi: "තුලා",
    transliteration: "Thula",
    svgPath: "M4 20h16M4 16h3a5 5 0 0 1 10 0h3"
  },
  vrischika: {
    id: "vrischika",
    symbol: "♏",
    nameEn: "Scorpio",
    nameSi: "වෘශ්චික",
    transliteration: "Vrischika",
    svgPath: "M4 4v12a2 2 0 0 0 4 0V4M8 4v12a2 2 0 0 0 4 0V4M12 4v12a2 2 0 0 0 4 0v4l3-3m-3 3l-3-3"
  },
  dhanu: {
    id: "dhanu",
    symbol: "♐",
    nameEn: "Sagittarius",
    nameSi: "ධනු",
    transliteration: "Dhanu",
    svgPath: "M19 5L5 19M19 5h-7M19 5v7M9 9l6 6"
  },
  makara: {
    id: "makara",
    symbol: "♑",
    nameEn: "Capricorn",
    nameSi: "මකර",
    transliteration: "Makara",
    svgPath: "M4 6l4 12M8 18l4-12M12 6c3 0 5 2 5 5s-2 5-5 5c0 3 2 5 5 5a2.5 2.5 0 0 0 2.5-2.5"
  },
  kumbha: {
    id: "kumbha",
    symbol: "♒",
    nameEn: "Aquarius",
    nameSi: "කුම්භ",
    transliteration: "Kumbha",
    svgPath: "M3 9l3-3 3 3 3-3 3 3 3-3 3 3M3 15l3-3 3 3 3-3 3 3 3-3 3 3"
  },
  meena: {
    id: "meena",
    symbol: "♓",
    nameEn: "Pisces",
    nameSi: "මීන",
    transliteration: "Meena",
    svgPath: "M5 12h14M8 4c-3 4-3 12 0 16M16 4c3 4 3 12 0 16"
  }
};

export const ZODIAC_LIST = Object.values(ZODIAC_SIGNS);

export function getZodiacInfo(val?: string): ZodiacSign | null {
  if (!val) return null;
  const clean = val.trim().toLowerCase();

  for (const sign of ZODIAC_LIST) {
    if (
      sign.id === clean ||
      sign.symbol === val.trim() ||
      sign.nameEn.toLowerCase() === clean ||
      sign.transliteration.toLowerCase() === clean ||
      sign.nameSi === val.trim()
    ) {
      return sign;
    }
  }

  // Partial search fallback (e.g. "capricorn", "makara", "mesha")
  for (const sign of ZODIAC_LIST) {
    if (clean.includes(sign.id) || clean.includes(sign.nameEn.toLowerCase()) || clean.includes(sign.transliteration.toLowerCase())) {
      return sign;
    }
  }

  return null;
}
