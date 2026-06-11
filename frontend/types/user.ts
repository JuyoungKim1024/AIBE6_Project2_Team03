export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface User {
  id: string;
  name: string;
  avatar: string;
  rank: RankTier;
}
