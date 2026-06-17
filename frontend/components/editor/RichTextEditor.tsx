"use client";

import React, { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import ResizableImage from "tiptap-extension-resize-image";
import Placeholder from "@tiptap/extension-placeholder";
import { API_BASE_URL } from "@/lib/api";
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter,
  AlignRight, Link as LinkIcon, Image as ImageIcon, ChevronDown, Loader2,
} from "lucide-react";

const COLORS = [
  "#ffffff", "#e2e8f0", "#94a3b8", "#475569", "#1e293b",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#f59e0b",
];

function ToolbarButton({
  onClick, active, children, title,
}: {
  onClick: () => void; active?: boolean; children: React.ReactNode; title?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${active ? "bg-primary/20 text-primary" : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [showColors, setShowColors] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const setHeading = (level: 0 | 1 | 2 | 3) => {
    if (level === 0) editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level }).run();
  };

  const getCurrentBlock = () => {
    if (editor.isActive("heading", { level: 1 })) return "제목 1";
    if (editor.isActive("heading", { level: 2 })) return "제목 2";
    if (editor.isActive("heading", { level: 3 })) return "제목 3";
    return "본문";
  };

  const insertLink = () => {
    const url = window.prompt("링크 URL을 입력하세요");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
  };

  const insertImageUrl = () => {
    const url = window.prompt("이미지 URL을 입력하세요");
    if (url) editor.chain().focus().setImage({ src: url, wrapperStyle: imgWrapperStyle("left") }).createParagraphNear().run();
  };

  const imgWrapperStyle = (align: "left" | "center" | "right") => {
    return `display: block; width: 100%; text-align: ${align}; margin: 12px 0;`;
  };

  const setAlignment = (align: "left" | "center" | "right") => {
    if (editor.isActive("image")) {
      editor.chain().updateAttributes("image", { wrapperStyle: imgWrapperStyle(align) }).run();
    } else {
      editor.chain().focus().setTextAlign(align).run();
    }
  };

  const isAlignActive = (align: "left" | "center" | "right") => {
    if (editor.isActive("image")) {
      const style: string = editor.getAttributes("image").wrapperStyle ?? "";
      return style.includes(`text-align: ${align}`);
    }
    return editor.isActive({ textAlign: align });
  };

  const insertImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileKey((k) => k + 1);
    setUploading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("upload failed");
      const data = await res.json();
      editor.chain().focus("end").setImage({ src: data.url, wrapperStyle: imgWrapperStyle("left") }).createParagraphNear().run();
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-surface-elevated border-b border-border px-3 py-2 flex flex-wrap items-center gap-1">
      {/* 텍스트 타입 */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { setShowBlockMenu(!showBlockMenu); setShowColors(false); }}
          className="flex items-center gap-1 px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors min-w-[72px]"
        >
          <span className="text-xs font-medium">{getCurrentBlock()}</span>
          <ChevronDown size={12} />
        </button>
        {showBlockMenu && (
          <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden w-28">
            {[
              { label: "본문", level: 0 as const },
              { label: "제목 1", level: 1 as const },
              { label: "제목 2", level: 2 as const },
              { label: "제목 3", level: 3 as const },
            ].map(({ label, level }) => (
              <button
                key={label}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setHeading(level); setShowBlockMenu(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-elevated transition-colors ${editor.isActive(level === 0 ? "paragraph" : "heading", level === 0 ? {} : { level }) ? "text-primary" : "text-text-secondary"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* 스타일 */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="굵게">
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="기울임">
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="밑줄">
        <UnderlineIcon size={15} />
      </ToolbarButton>

      <div className="w-px h-5 bg-border mx-1" />

      {/* 색상 */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowColors(!showColors)}
          title="글자 색상"
          className="flex items-center gap-1 p-1.5 rounded text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
        >
          <span className="text-xs font-bold" style={{ color: editor.getAttributes("textStyle").color || "currentColor" }}>A</span>
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: editor.getAttributes("textStyle").color || "#e2e8f0" }} />
          <ChevronDown size={10} />
        </button>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 p-2 w-40">
            <div className="grid grid-cols-5 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(color).run(); setShowColors(false); }}
                  className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColors(false); }}
              className="mt-2 w-full text-xs text-text-muted hover:text-text-primary text-center"
            >
              색상 초기화
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* 정렬 */}
      <ToolbarButton onClick={() => setAlignment("left")} active={isAlignActive("left")} title="왼쪽 정렬">
        <AlignLeft size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => setAlignment("center")} active={isAlignActive("center")} title="가운데 정렬">
        <AlignCenter size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => setAlignment("right")} active={isAlignActive("right")} title="오른쪽 정렬">
        <AlignRight size={15} />
      </ToolbarButton>

      <div className="w-px h-5 bg-border mx-1" />

      {/* 링크 */}
      <ToolbarButton onClick={insertLink} active={editor.isActive("link")} title="링크">
        <LinkIcon size={15} />
      </ToolbarButton>

      {/* 이미지 */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton onClick={insertImageUrl} title="이미지 URL">
          <ImageIcon size={15} />
        </ToolbarButton>
        <button
          type="button"
          disabled={uploading}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          title="이미지 파일"
          className="text-xs px-1.5 py-1 rounded text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : "파일"}
        </button>
        <input key={fileKey} ref={fileRef} type="file" accept="image/*" className="hidden" onChange={insertImageFile} />
      </div>
    </div>
  );
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요.",
  minHeight = "300px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      ResizableImage,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none p-4 text-text-primary",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden focus-within:border-primary transition-colors">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="[&_.ProseMirror]:min-h-[300px] [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:inline-block [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:first-child::before]:text-text-muted [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
