export type BoardType = "JOB" | "COMMUNITY";
export type JobPostType = "RECRUITING" | "JOB_SEARCH";
export type CommunityCategory = "INFO" | "FREE";

export interface AuthorDto {
  id: string;
  nickname: string;
  profileImage: string | null;
}

export interface JobPostDto {
  id: string;
  author: AuthorDto;
  title: string;
  minPrice: number | null;
  maxPrice: number | null;
  priceVisible: boolean;
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

export interface AttachedPortfolio {
  id: string;
  title: string;
  url: string;
  type: "image" | "video";
}

export interface JobPostDetailDto extends JobPostDto {
  content: string;
  portfolios: AttachedPortfolio[];
  revisionCount: number | null;
  updatedAt: string;
}


export interface CommunityPostDto {
  id: string;
  author: AuthorDto;
  title: string;
  category: CommunityCategory;
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
