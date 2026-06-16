import { API_BASE_URL } from '@/lib/api';

type AuthUser = {
  id: string;
};

type ChatRoomResponse = {
  roomId?: string;
  id?: string;
};

async function fetchMe(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('로그인이 필요합니다.');
  }

  return response.json() as Promise<AuthUser>;
}

export async function createDirectChatRoom(targetUserId: string) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const me = await fetchMe(accessToken);
  if (me.id === targetUserId) {
    throw new Error('본인에게는 DM을 보낼 수 없습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      roomType: 'DIRECT',
      participantUserIds: [me.id, targetUserId],
    }),
  });

  if (!response.ok) {
    throw new Error('채팅방을 만들지 못했습니다.');
  }

  const room = await response.json() as ChatRoomResponse;
  const roomId = room.roomId ?? room.id;
  if (!roomId) {
    throw new Error('채팅방 ID가 없습니다.');
  }

  return roomId;
}
