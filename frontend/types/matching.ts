export type BlindEditor = {
  id: string;
  thumbnails: string[];
  categories: string[];
  tools: string[];
  matchPriceMin: number | null;
  matchPriceMax: number | null;
  matchPriceUnit: string;
};
