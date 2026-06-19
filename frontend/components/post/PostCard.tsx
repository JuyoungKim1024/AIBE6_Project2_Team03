"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Eye } from "lucide-react";
import { PriceChip } from "@/components/common/PriceChip";
import { UserActionMenu } from "@/components/common/UserActionMenu";
import { togglePostLike } from "@/lib/api/post";

export type PostType = "hiring" | "looking" | "info" | "free";

export interface PostCardProps {
  id: string;
  linkTo: string;
  type: PostType;
  title: string;
  preview?: string;
  author: { id?: string; name: string; avatar?: string };
  categoryTags: string[];
  toolTags: string[];
  minPrice?: number;
  maxPrice?: number;
  priceHidden?: boolean;
  likes: number;
  comments: number;
  views: number;
  timeAgo: string;
  thumbnail?: string;
  onUnlike?: (id: string) => void;
  initialLiked?: boolean;
  isOwn?: boolean;
}

const typeConfig: Record<
  PostType,
  { label: string; color: string; bg: string }
> = {
  hiring: { label: "구인", color: "text-accent", bg: "bg-accent/10" },
  looking: { label: "구직", color: "text-primary", bg: "bg-primary/10" },
  info: { label: "정보공유", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  free: {
    label: "자유게시판",
    color: "text-text-secondary",
    bg: "bg-surface-elevated",
  },
};

export function PostCard({
  id,
  linkTo,
  type,
  title,
  preview,
  author,
  categoryTags,
  toolTags,
  minPrice,
  maxPrice,
  priceHidden,
  likes: initialLikes,
  comments,
  views,
  timeAgo,
  thumbnail,
  onUnlike,
  initialLiked = false,
  isOwn = false,
}: PostCardProps) {
  const router = useRouter();
  const config = typeConfig[type];
  const isJobPost = type === "hiring" || type === "looking";
  const hasPrice = isJobPost && (minPrice !== undefined || priceHidden);
  const isDeprioritized = isJobPost && priceHidden;
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localStorage.getItem("accessToken")) {
      router.push("/login");
      return;
    }
    try {
      const result = await togglePostLike(id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      if (!result.liked && onUnlike) onUnlike(id);
    } catch {
      // 비로그인 fallback
      if (liked) {
        setLikeCount((prev) => prev - 1);
        setLiked(false);
        if (onUnlike) onUnlike(id);
      } else {
        setLikeCount((prev) => prev + 1);
        setLiked(true);
      }
    }
  };

  return (
    <Link
      href={linkTo}
      className={`block rounded-xl border p-5 transition-all hover:border-primary/50 ${isOwn ? "bg-primary/[0.04] border-primary/25" : "bg-surface " + (isDeprioritized ? "border-border/40 opacity-75 hover:opacity-100" : "border-border")}`}
    >
      <div className="flex justify-between items-start mb-3 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${config.bg} ${config.color}`}
          >
            {config.label}
          </span>
          {isOwn && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-primary/15 text-primary border border-primary/30">
              내 글
            </span>
          )}
          <div className="flex items-center gap-2 text-sm">
            <UserActionMenu
              userId={author.id}
              nickname={author.name}
              profileImage={author.avatar}
              size="sm"
            />
            <span className="font-medium text-text-primary">{author.name}</span>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-text-muted text-xs">{timeAgo}</span>
          </div>
        </div>
        {hasPrice && (
          <PriceChip
            minPrice={minPrice}
            maxPrice={maxPrice}
            hidden={priceHidden}
            display="list"
            variant={
              !priceHidden
                ? type === "hiring"
                  ? "highlighted"
                  : "default"
                : "muted"
            }
          />
        )}
      </div>
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className={`text-lg font-bold mb-2 line-clamp-2 ${isDeprioritized ? "text-text-secondary" : "text-text-primary"}`}
          >
            {title}
          </h3>
          {preview && (
            <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
              {preview}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categoryTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-surface-elevated text-xs text-text-secondary border border-border/50"
              >
                {tag}
              </span>
            ))}
            {toolTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-surface-elevated text-xs text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {thumbnail && (
          <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-24 rounded-lg overflow-hidden bg-surface-elevated border border-border">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 pt-4 border-t border-border/50 text-xs font-medium text-text-muted">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors ${liked ? "text-accent" : "hover:text-accent"}`}
        >
          <Heart size={14} fill={liked ? "currentColor" : "none"} /> {likeCount}
        </button>
        <span className="flex items-center gap-1.5">
          <MessageCircle size={14} /> {comments}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye size={14} /> {views}
        </span>
      </div>
    </Link>
  );
}
