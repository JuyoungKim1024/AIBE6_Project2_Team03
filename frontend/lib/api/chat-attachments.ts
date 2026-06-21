import { API_BASE_URL } from '@/lib/api';
import type { ChatAttachment } from '@/types/chat';

export const CHAT_ATTACHMENT_ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov';

export async function uploadChatAttachment(roomId: string, file: File): Promise<ChatAttachment> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) throw new Error('로그인이 필요합니다.');
  if (file.size > 50 * 1024 * 1024) throw new Error('첨부파일은 50MB 이하만 업로드할 수 있습니다.');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? '첨부파일을 업로드하지 못했습니다.');
  }
  return response.json() as Promise<ChatAttachment>;
}
