// The year overview's look for each month (WBS 7.2), January first. Adjust the
// colours here; the colours follow the reference design's 12 months.
//   background: the tile's paper colour
//   colors:     the shapes' colours, main one first
//   pattern:    how the circles and half-circles are arranged (YearView.tsx)

export type MonthPattern = 'moon' | 'split' | 'rise' | 'orbit';

export interface MonthStyle {
  background: string;
  colors: [string, string, string];
  pattern: MonthPattern;
}

export const MONTH_STYLES: MonthStyle[] = [
  { background: '#EEEAF1', colors: ['#4F63A0', '#B3ACD6', '#C8925A'], pattern: 'moon' }, // 1月 indigo, lavender
  { background: '#E9EEF1', colors: ['#2F6188', '#8DB3CC', '#D2A65E'], pattern: 'orbit' }, // 2月 deep teal, sky blue
  { background: '#F6EEDF', colors: ['#E7AE55', '#F2D49C', '#B78A52'], pattern: 'rise' }, // 3月 warm yellow
  { background: '#F6E9EA', colors: ['#D9828F', '#EDB7BE', '#A86B7C'], pattern: 'split' }, // 4月 rose pink
  { background: '#EEEDEA', colors: ['#2D5283', '#B8C6D6', '#D9A866'], pattern: 'moon' }, // 5月 navy, mist
  { background: '#EAF0EA', colors: ['#4F8F72', '#A9CDB8', '#C79A5B'], pattern: 'orbit' }, // 6月 green
  { background: '#EFEDF5', colors: ['#8079B8', '#C4BFE2', '#9AA7C8'], pattern: 'rise' }, // 7月 violet
  { background: '#F5ECE0', colors: ['#E6A157', '#2F2E33', '#C98A4B'], pattern: 'split' }, // 8月 orange, black
  { background: '#EDECEA', colors: ['#8E9197', '#2C2C30', '#C4BFB6'], pattern: 'moon' }, // 9月 grey, black
  { background: '#F6E8E1', colors: ['#E57E5C', '#F2B596', '#B8B2A8'], pattern: 'orbit' }, // 10月 coral
  { background: '#F3EFE6', colors: ['#E8AF4F', '#7DB395', '#E3AFBC'], pattern: 'rise' }, // 11月 orange, green, pink
  { background: '#EFECE6', colors: ['#2B2B30', '#BDB7AE', '#C99A5E'], pattern: 'split' }, // 12月 black, stone
];
