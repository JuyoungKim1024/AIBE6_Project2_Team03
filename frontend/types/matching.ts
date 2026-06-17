export type BlindEditor = {
  id: string;
  thumbnails: string[];
  categories: string[];
  tools: string[];
  videoLengths: string[];
  matchPriceMin: number | null;
  matchPriceMax: number | null;
  matchPriceUnit: string;
};
