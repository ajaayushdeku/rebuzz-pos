export interface HeatmapData {
  day: string;
  time: string;
  profit: number;
}

export const heatmapMock: HeatmapData[] = [
  // Monday
  { day: "Mon", time: "7a", profit: 85 },
  { day: "Mon", time: "9a", profit: 145 },
  { day: "Mon", time: "11a", profit: 110 },
  { day: "Mon", time: "1p", profit: 95 },
  { day: "Mon", time: "3p", profit: 125 },
  { day: "Mon", time: "5p", profit: 140 },
  { day: "Mon", time: "7p", profit: 130 },

  // Tuesday
  { day: "Tue", time: "7a", profit: 75 },
  { day: "Tue", time: "9a", profit: 160 },
  { day: "Tue", time: "11a", profit: 120 },
  { day: "Tue", time: "1p", profit: 100 },
  { day: "Tue", time: "3p", profit: 135 },
  { day: "Tue", time: "5p", profit: 150 },
  { day: "Tue", time: "7p", profit: 125 },

  // Wednesday
  { day: "Wed", time: "7a", profit: 90 },
  { day: "Wed", time: "9a", profit: 155 },
  { day: "Wed", time: "11a", profit: 115 },
  { day: "Wed", time: "1p", profit: 105 },
  { day: "Wed", time: "3p", profit: 140 },
  { day: "Wed", time: "5p", profit: 145 },
  { day: "Wed", time: "7p", profit: 135 },

  // Thursday
  { day: "Thu", time: "7a", profit: 80 },
  { day: "Thu", time: "9a", profit: 150 },
  { day: "Thu", time: "11a", profit: 125 },
  { day: "Thu", time: "1p", profit: 110 },
  { day: "Thu", time: "3p", profit: 130 },
  { day: "Thu", time: "5p", profit: 155 },
  { day: "Thu", time: "7p", profit: 140 },

  // Friday
  { day: "Fri", time: "7a", profit: 95 },
  { day: "Fri", time: "9a", profit: 165 },
  { day: "Fri", time: "11a", profit: 130 },
  { day: "Fri", time: "1p", profit: 115 },
  { day: "Fri", time: "3p", profit: 145 },
  { day: "Fri", time: "5p", profit: 160 },
  { day: "Fri", time: "7p", profit: 150 },

  // Saturday
  { day: "Sat", time: "7a", profit: 100 },
  { day: "Sat", time: "9a", profit: 170 },
  { day: "Sat", time: "11a", profit: 140 },
  { day: "Sat", time: "1p", profit: 125 },
  { day: "Sat", time: "3p", profit: 155 },
  { day: "Sat", time: "5p", profit: 165 },
  { day: "Sat", time: "7p", profit: 145 },

  // Sunday
  { day: "Sun", time: "7a", profit: 85 },
  { day: "Sun", time: "9a", profit: 140 },
  { day: "Sun", time: "11a", profit: 115 },
  { day: "Sun", time: "1p", profit: 100 },
  { day: "Sun", time: "3p", profit: 130 },
  { day: "Sun", time: "5p", profit: 135 },
  { day: "Sun", time: "7p", profit: 120 },
];
