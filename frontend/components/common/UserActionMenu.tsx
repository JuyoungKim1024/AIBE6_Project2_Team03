"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, User } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type UserActionMenuProps = {
  userId?: string | null;
  nickname: string;
  profileImage?: string | null;
  size?: "sm" | "md";
};

export function UserActionMenu({ userId, nickname, profileImage, size = "md" }: UserActionMenuProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isStartingDm, setIsStartingDm] = useState(false);
  const avatarSize = size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";
  const iconSize = size === "sm" ? 13 : 16;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const stopLinkClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const startDm = async (event: React.MouseEvent) => {
    stopLinkClick(event);
    if (!userId || isStartingDm) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      router.push("/login");
      return;
    }

    setIsStartingDm(true);
    try {
      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const me = meResponse.ok ? await meResponse.json() : null;
      if (!me?.id) {
        router.push("/login");
        return;
      }
      if (me.id === userId) {
        router.push(`/profile/${userId}`);
        return;
      }

      const roomResponse = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          roomType: "DIRECT",
          participantUserIds: [me.id, userId],
        }),
      });
      if (!roomResponse.ok) throw new Error("채팅방 생성 실패");

      const room = await roomResponse.json();
      router.push(`/chat/${room.roomId}`);
    } catch {
      alert("DM을 시작하지 못했습니다.");
    } finally {
      setIsStartingDm(false);
      setOpen(false);
    }
  };

  const avatar = profileImage ? (
    <img src={profileImage} alt={nickname} className={`${avatarSize} rounded-full object-cover bg-surface-elevated`} />
  ) : (
    <div className={`${avatarSize} rounded-full bg-surface-elevated flex items-center justify-center text-text-muted font-bold`}>
      {nickname[0] ?? <User size={iconSize} />}
    </div>
  );

  if (!userId) {
    return avatar;
  }

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={(event) => {
          stopLinkClick(event);
          setOpen((value) => !value);
        }}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/60"
        aria-label={`${nickname} 사용자 메뉴`}
      >
        {avatar}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-40 rounded-xl border border-border bg-surface shadow-2xl p-1.5 z-50">
          <button
            type="button"
            onClick={(event) => {
              stopLinkClick(event);
              setOpen(false);
              router.push(`/profile/${userId}`);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
          >
            <User size={14} />
            공개 프로필
          </button>
          <button
            type="button"
            onClick={startDm}
            disabled={isStartingDm}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-50"
          >
            <MessageCircle size={14} />
            DM 보내기
          </button>
        </div>
      )}
    </div>
  );
}
