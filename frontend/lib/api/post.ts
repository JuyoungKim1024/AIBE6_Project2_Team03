import { API_BASE_URL } from "@/lib/api";
import {
  CommunityCategory,
  CommunityPostDetailDto,
  CommunityPostDto,
  JobPostDetailDto,
  JobPostDto,
  JobPostType,
} from "@/types/post";

export async function fetchJobPosts(
  postType: JobPostType,
): Promise<JobPostDto[]> {
  const res = await fetch(`${API_BASE_URL}/api/posts/job?postType=${postType}`);
  console.log("fetchJobPosts response:", res);
  if (!res.ok) throw new Error("구인구직 목록 조회 실패");
  return res.json();
}

export async function fetchJobPost(id: string): Promise<JobPostDetailDto> {
  const res = await fetch(`${API_BASE_URL}/api/posts/job/${id}`);
  if (!res.ok) throw new Error("구인구직 상세 조회 실패");
  return res.json();
}

export async function fetchCommunityPosts(
  category: CommunityCategory,
): Promise<CommunityPostDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/posts/community?category=${category}`,
  );
  if (!res.ok) throw new Error("커뮤니티 목록 조회 실패");
  return res.json();
}

export async function fetchCommunityPost(
  id: string,
): Promise<CommunityPostDetailDto> {
  const res = await fetch(`${API_BASE_URL}/api/posts/community/${id}`);
  if (!res.ok) throw new Error("커뮤니티 상세 조회 실패");
  return res.json();
}
