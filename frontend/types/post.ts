export type BoardType = "JOB" | "COMMUNITY";
export type JobPostType = "RECRUITING" | "JOB_SEARCH";
export type CommunityCategory = "INFO" | "FREE";
export type PostType = "hiring" | "looking" | "info" | "rate" | "portfolio" | "free";

export interface AuthorDto {
  id: string;
  nickname: string;
  profileImage: string | null;
  rank?: string;
  isDeleted?: boolean;
}

export type PriceUnit = "PER_MINUTE" | "PER_PROJECT";

export interface JobPostDto {
  id: string;
  author: AuthorDto;
  title: string;
  minPrice: number | null;
  maxPrice: number | null;
  priceVisible: boolean;
  priceUnit: PriceUnit;
  postType: JobPostType;
  fieldTags: string[];
  toolTags: string[];
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  chatCount: number;
  commentCount: number;
  createdAt: string;
}

export interface AttachedPortfolioItem {
  id: string;
  title: string;
  url: string;
  type: "image" | "video";
}

export interface AttachedPortfolioGroup {
  id: string;
  name: string;
  items: AttachedPortfolioItem[];
}

export interface CompletedDeal {
  createdAt: string | null;
  field: string | null;
  videoLength: number | null;
  price: number | null;
}

export interface JobPostDetailDto extends JobPostDto {
  content: string;
  portfolioGroups: AttachedPortfolioGroup[];
  revisionCount: number | null;
  updatedAt: string;
  completedDeals: CompletedDeal[];
}


export interface CommunityPostDto {
  id: string;
  author: AuthorDto;
  title: string;
  category: CommunityCategory;
  tags: string[];
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  chatCount: number;
  commentCount: number;
  createdAt: string;
}

export interface CommunityPostDetailDto extends CommunityPostDto {
  content: string;
  tags: string[];
  updatedAt: string;
}


export interface CommentDto {
  id: string;
  author: AuthorDto;
  content: string;
  createdAt: string;
  replies: CommentDto[];
}
