import { API_BASE_URL } from "@/lib/api";
import {
  CommunityCategory,
  CommunityPostDetailDto,
  CommunityPostDto,
  CommentDto,
  JobPostDetailDto,
  JobPostDto,
  JobPostType,
} from "@/types/post";

export async function fetchJobPosts(
  postType: JobPostType,
): Promise<JobPostDto[]> {
  const res = await fetch(`${API_BASE_URL}/api/posts/job?postType=${postType}`);
  if (!res.ok) throw new Error("구인구직 목록 조회 실패");
  const data = await res.json();
  console.log("fetchJobPosts data[0]:", data[0]);
  return data;
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

export async function fetchComments(postId: string): Promise<CommentDto[]> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`);
  if (!res.ok) throw new Error("댓글 조회 실패");
  return res.json();
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string,
): Promise<CommentDto> {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, parentId: parentId ?? null }),
  });
  if (!res.ok) throw new Error("댓글 등록 실패");
  return res.json();
}

export async function updateComment(
  commentId: string,
  content: string,
): Promise<CommentDto> {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("댓글 수정 실패");
  return res.json();
}

export async function deleteComment(commentId: string): Promise<void> {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("댓글 삭제 실패");
}

export async function incrementPostView(postId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/posts/${postId}/view`, { method: "POST" });
}

export async function togglePostLike(
  postId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  if (!res.ok) throw new Error("좋아요 실패");
  return res.json();
}

export async function getPostLikedStatus(
  postId: string,
): Promise<{ liked: boolean }> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
    headers,
  });
  if (!res.ok) return { liked: false };
  return res.json();
}

export async function getLikedPostIds(): Promise<string[]> {
  const token = localStorage.getItem("accessToken");
  if (!token) return [];
  const res = await fetch(`${API_BASE_URL}/api/posts/liked`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}
