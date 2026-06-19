import { API_BASE_URL } from '@/lib/api';

type AuthUser = {
  id: string;
};

type ChatRoomResponse = {
  roomId?: string;
  id?: string;
};

const DEFAULT_MESSAGE_USED_KEY = 'chat-default-message-used';

function getDefaultMessageUsedIds() {
  try {
    return JSON.parse(localStorage.getItem(DEFAULT_MESSAGE_USED_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function getInitialChatRequestMessage(receiverId: string, message: string) {
  return getDefaultMessageUsedIds().includes(receiverId) ? '' : message;
}

export function markInitialChatRequestMessageUsed(receiverId: string) {
  const ids = getDefaultMessageUsedIds();
  if (ids.includes(receiverId)) return;
  localStorage.setItem(DEFAULT_MESSAGE_USED_KEY, JSON.stringify([...ids, receiverId]));
}

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

export const createChatRequest = createDirectChatRoom;

export async function createPostChatRequest(
  receiverId: string,
  postId: string,
  message: string,
) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const me = await fetchMe(accessToken);
  if (me.id === receiverId) {
    throw new Error('본인에게는 문의할 수 없습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/chat/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      roomType: 'POST',
      receiverId,
      postId,
      message,
    }),
  });

  if (!response.ok) {
    throw new Error('채팅 요청을 보내지 못했습니다.');
  }
}

export async function createDirectChatRequest(receiverId: string, message: string) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const me = await fetchMe(accessToken);
  if (me.id === receiverId) {
    throw new Error('본인에게는 DM을 보낼 수 없습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/chat/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      roomType: 'DIRECT',
      receiverId,
      message,
    }),
  });

  if (!response.ok) {
    throw new Error('DM 요청을 보내지 못했습니다.');
  }
}
