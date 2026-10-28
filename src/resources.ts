// The related-resources page (WBS 8.1): edit the names, descriptions and links
// here. The descriptions follow the reference design. The links haven't been
// supplied yet: while url is '', tapping the card shows 「連結尚未提供」.
//   icon:  shown in a circle of `color` at the start of the card

export interface Resource {
  title: string;
  description: string;
  url: string;
  icon: string;
  color: string;
}

export const RESOURCES: Resource[] = [
  { title: 'Podcast 七更', description: '收聽每日節目', url: '', icon: '🎧', color: '#DFE5EE' },
  { title: '主題文章', description: '每月與每週文章', url: '', icon: '📖', color: '#E3EDE5' },
  { title: '自主 PTP', description: '相關資源與練功場', url: '', icon: '🌱', color: '#E3EDE5' },
  { title: 'A 次元小旅行', description: '與好朋友同行', url: '', icon: '🧭', color: '#DFE5EE' },
];
