'use client';

import { Download, FileText } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

function formatFileSize(size?: number | null) {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

export function ChatMessageContent({ message, isMine }: { message: ChatMessage; isMine: boolean }) {
  if (message.messageType === 'IMAGE' && message.fileUrl) {
    return (
      <a href={message.fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
        <img src={message.fileUrl} alt={message.fileName ?? '첨부 이미지'} className="max-h-64 w-full object-contain" />
        <span className={`mt-1 block truncate text-xs ${isMine ? 'text-white/80' : 'text-text-secondary'}`}>
          {message.fileName ?? message.content}
        </span>
      </a>
    );
  }

  if (message.messageType === 'FILE' && message.fileUrl) {
    return (
      <a
        href={message.fileUrl}
        target="_blank"
        rel="noreferrer"
        download={message.fileName ?? undefined}
        className={`flex min-w-48 items-center gap-2 rounded-lg p-2 ${isMine ? 'bg-white/10' : 'bg-surface-elevated'}`}
      >
        <FileText size={22} className="flex-shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold">{message.fileName ?? message.content}</span>
          <span className={`block text-[10px] ${isMine ? 'text-white/70' : 'text-text-muted'}`}>{formatFileSize(message.fileSize)}</span>
        </span>
        <Download size={16} className="flex-shrink-0" />
      </a>
    );
  }

  return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
}
