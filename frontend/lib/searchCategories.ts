export type SearchCategory = 'jobs' | 'community';

export const searchCategoryOptions: { value: SearchCategory; label: string }[] = [
  { value: 'jobs', label: '구인구직' },
  { value: 'community', label: '커뮤니티' },
];
