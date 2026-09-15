export interface LotteryFormatConfig {
  digitCount: number;
  maxDigitsPerBox: number;
  isPyramid: boolean;
  pyramidRows?: number[];
  isSingleDigit: boolean;
  hasLetter: boolean;
  hasZodiac: boolean;
  label: string;
  boxPlaceholders: string[];
}

export function getLotteryConfig(lotteryName?: string): LotteryFormatConfig {
  if (!lotteryName) {
    return {
      digitCount: 5,
      maxDigitsPerBox: 2,
      isPyramid: false,
      isSingleDigit: false,
      hasLetter: true,
      hasZodiac: true,
      label: "Your Ticket Numbers",
      boxPlaceholders: ["00", "00", "00", "00", "00"],
    };
  }

  const name = lotteryName.toLowerCase();

  // 1. Pyramid 9-digit Lottery (Ada Sampatha)
  //    Pyramid structure: Row 1 (2 digits) → Row 2 (3 digits) → Row 3 (4 digits) + Letter
  if (
    name.includes("ada sampatha") ||
    (name.includes("sampatha") && !name.includes("mahajana") && !name.includes("supiri") && !name.includes("dhana") && !name.includes("jaya"))
  ) {
    return {
      digitCount: 9,
      maxDigitsPerBox: 1,
      isPyramid: true,
      pyramidRows: [2, 3, 4],
      isSingleDigit: true,
      hasLetter: true,
      hasZodiac: false,
      label: "Your Ticket Numbers (Pyramid Format)",
      boxPlaceholders: ["0", "0", "0", "0", "0", "0", "0", "0", "0"],
    };
  }

  // 2. 4 Single-Digit Lotteries (NLB Jaya, Jaya Sampatha)
  if (name.includes("nlb jaya") || name.includes("nlbjaya") || name.includes("jaya sampatha")) {
    return {
      digitCount: 4,
      maxDigitsPerBox: 1,
      isPyramid: false,
      isSingleDigit: true,
      hasLetter: true,
      hasZodiac: false,
      label: "Your Ticket Numbers (4 Digits + Letter)",
      boxPlaceholders: ["1", "2", "3", "4"],
    };
  }

  // 2. 6-digit Single-Digit Lotteries (Mahajana Sampatha, Supiri Dhana Sampatha)
  if (name.includes("mahajana sampatha") || name.includes("supiri dhana")) {
    return {
      digitCount: 6,
      maxDigitsPerBox: 1,
      isPyramid: false,
      isSingleDigit: true,
      hasLetter: true,
      hasZodiac: false,
      label: "Your Ticket Numbers (6 Single Digits)",
      boxPlaceholders: ["1", "2", "3", "4", "5", "6"],
    };
  }

  // 3. Suba Dawasak (3 Numbers + Zodiac)
  if (name.includes("suba dawasak")) {
    return {
      digitCount: 3,
      maxDigitsPerBox: 2,
      isPyramid: false,
      isSingleDigit: false,
      hasLetter: false,
      hasZodiac: true,
      label: "Your Ticket Numbers (3 Numbers + Zodiac)",
      boxPlaceholders: ["00", "00", "00"],
    };
  }

  // 4. Sasiri (3 Numbers only)
  if (name.includes("sasiri")) {
    return {
      digitCount: 3,
      maxDigitsPerBox: 2,
      isPyramid: false,
      isSingleDigit: false,
      hasLetter: false,
      hasZodiac: false,
      label: "Your Ticket Numbers (3 Numbers)",
      boxPlaceholders: ["00", "00", "00"],
    };
  }

  // 4. Lotteries with 4 Numbers + 1 Super Number + Letter (Mega Power, Kapruka)
  if (name.includes("mega power") || name.includes("megapower") || name.includes("kapruka")) {
    return {
      digitCount: 5,
      maxDigitsPerBox: 2,
      isPyramid: false,
      isSingleDigit: false,
      hasLetter: true,
      hasZodiac: false,
      label: "Your Ticket Numbers (4 Numbers + Super Number + Letter)",
      boxPlaceholders: ["00", "00", "00", "00", "Super"],
    };
  }

  // 5. Zodiac Lotteries with 4 2-digit numbers (Handahana, Lagna Wasanawa)
  if (name.includes("handahana") || name.includes("lagna wasanawa")) {
    return {
      digitCount: 4,
      maxDigitsPerBox: 2,
      isPyramid: false,
      isSingleDigit: false,
      hasLetter: false,
      hasZodiac: true,
      label: "Your Ticket Numbers (4 Numbers + Zodiac)",
      boxPlaceholders: ["00", "00", "00", "00"],
    };
  }

  // 5. Default 4 2-digit Lotteries (Govisetha, Ada Kotipathi, Shanida Wasanawa, Kapruka, Super Ball, Dhana Nidhanaya)
  return {
    digitCount: 4,
    maxDigitsPerBox: 2,
    isPyramid: false,
    isSingleDigit: false,
    hasLetter: true,
    hasZodiac: false,
    label: "Your Ticket Numbers (4 Numbers + Letter)",
    boxPlaceholders: ["00", "00", "00", "00"],
  };
}
