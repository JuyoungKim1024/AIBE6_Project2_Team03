export type PortfolioPreview = {
  url: string;
  type: 'image' | 'video';
};

export type BlindEditor = {
  id: string;
  portfolios: PortfolioPreview[];
  categories: string[];
  tools: string[];
  videoLengths: string[];
  matchPriceMin: number | null;
  matchPriceMax: number | null;
  matchPriceUnit: string;
};
