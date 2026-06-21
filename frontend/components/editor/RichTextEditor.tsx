"use client";

import React, { useEffect, useRef, useState } from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import { useEditor, EditorContent, Editor, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import ResizableImage from "tiptap-extension-resize-image";
import Placeholder from "@tiptap/extension-placeholder";
import { API_BASE_URL } from "@/lib/api";
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter,
  AlignRight, Link as LinkIcon, Image as ImageIcon, ChevronDown, Loader2, FileIcon, CheckCircle2,
} from "lucide-react";

const ResizableImageWithAlign = ResizableImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      dataAlign: {
        default: "left",
        parseHTML: (element) => element.getAttribute("data-align") ?? "left",
        renderHTML: () => ({}),
      },
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderHTML({ node, HTMLAttributes }: { node: any; HTMLAttributes: Record<string, any> }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, { "data-align": node.attrs.dataAlign ?? "left" }),
    ];
  },
});

function LinkCardView({ node, deleteNode }: { node: { attrs: { url: string; title: string | null; description: string | null; image: string | null; hostname: string | null } }; deleteNode: () => void }) {
  const { url, title, description, image, hostname } = node.attrs;
  return (
    <NodeViewWrapper>
      <div className="relative inline-flex my-1.5 group/card max-w-sm">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          contentEditable={false}
          className="flex items-stretch border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors no-underline w-full"
        >
          {image && (
            <div className="w-20 flex-shrink-0 bg-surface-elevated overflow-hidden">
              <img src={image} alt={title ?? ""} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="px-3 py-2 flex flex-col justify-center min-w-0">
            {title && <div className="font-bold text-text-primary text-xs mb-0.5 line-clamp-1">{title}</div>}
            {description && <div className="text-xs text-text-muted mb-0.5 line-clamp-1">{description}</div>}
            <div className="text-xs text-primary">{hostname ?? url}</div>
          </div>
        </a>
        <button
          type="button"
          contentEditable={false}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode(); }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-surface-elevated border border-border text-text-muted hover:text-text-primary hover:bg-surface hover:border-accent flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
        >
          <span className="text-[9px] leading-none">✕</span>
        </button>
      </div>
    </NodeViewWrapper>
  );
}

const LinkCard = Node.create({
  name: "linkCard",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      url: { default: null },
      title: { default: null },
      description: { default: null },
      image: { default: null },
      hostname: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-link-card]" }];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderHTML({ HTMLAttributes }): any {
    const { url, title, description, image, hostname } = HTMLAttributes;
    return [
      "a",
      { "data-link-card": "", href: url ?? "#", target: "_blank", rel: "noopener noreferrer" },
      ...(image ? [["img", { src: image, alt: title ?? "" }]] : []),
      ["div", { class: "lc-body" },
        ...(title ? [["div", { class: "lc-title" }, title]] : []),
        ...(description ? [["div", { class: "lc-desc" }, description]] : []),
        ["div", { class: "lc-host" }, hostname ?? url ?? ""],
      ],
    ];
  },
  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(LinkCardView as any);
  },
});

function FileCardView({ node, deleteNode }: { node: { attrs: { url: string; name: string } }; deleteNode: () => void }) {
  const { url, name } = node.attrs;
  return (
    <NodeViewWrapper>
      <div className="relative inline-flex my-1.5 group/fcard max-w-sm w-full">
        <a
          href={url}
          download={name}
          target="_blank"
          rel="noopener noreferrer"
          contentEditable={false}
          className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 hover:border-primary/50 transition-colors no-underline w-full bg-surface"
        >
          <FileIcon size={18} className="text-text-muted flex-shrink-0" />
          <span className="text-sm text-text-primary font-medium flex-1 truncate">{name}</span>
          <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
        </a>
        <button
          type="button"
          contentEditable={false}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode(); }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-surface-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent flex items-center justify-center opacity-0 group-hover/fcard:opacity-100 transition-opacity z-10"
        >
          <span className="text-[9px] leading-none">✕</span>
        </button>
      </div>
    </NodeViewWrapper>
  );
}

const FileCard = Node.create({
  name: "fileCard",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      url: { default: null },
      name: { default: "파일" },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-file-card]" }];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderHTML({ HTMLAttributes }): any {
    const { url, name } = HTMLAttributes;
    return [
      "a",
      { "data-file-card": "", href: url ?? "#", download: name, target: "_blank", rel: "noopener noreferrer" },
      ["span", { class: "fc-icon" }, "📄"],
      ["span", { class: "fc-name" }, name ?? "파일"],
      ["span", { class: "fc-check" }, "✓"],
    ];
  },
  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(FileCardView as any);
  },
});

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

function Toolbar({
  editor,
  selectedImagePosRef,
  selectedImageAlign,
  setSelectedImageAlign,
}: {
  editor: Editor;
  selectedImagePosRef: React.RefObject<number | null>;
  selectedImageAlign: string | null;
  setSelectedImageAlign: (align: string | null) => void;
}) {
  const [showColors, setShowColors] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkFetching, setLinkFetching] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
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
    const existing = editor.getAttributes("link").href ?? "";
    setLinkUrl(existing);
    setLinkOpen((v) => !v);
    setShowColors(false);
    setShowBlockMenu(false);
  };

  const confirmLink = async () => {
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      setLinkUrl("");
      return;
    }
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    if (hasSelection) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
      setLinkOpen(false);
      setLinkUrl("");
      return;
    }
    // 선택 없으면 OG 카드 삽입
    setLinkFetching(true);
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      editor.chain().focus().insertContent({
        type: "linkCard",
        attrs: { url: data.url, title: data.title, description: data.description, image: data.image, hostname: data.hostname },
      }).run();
    } catch {
      // OG fetch 실패 시 일반 링크 텍스트 삽입
      editor.chain().focus().insertContent(`<a href="${url}" target="_blank">${url}</a>`).run();
    } finally {
      setLinkFetching(false);
    }
    setLinkOpen(false);
    setLinkUrl("");
  };

  const setAlignment = (align: "left" | "center" | "right") => {
    const imagePos = selectedImagePosRef.current;
    if (imagePos !== null) {
      const marginMap = { left: "0 auto 0 0", center: "0 auto", right: "0 0 0 auto" };
      const node = editor.state.doc.nodeAt(imagePos);
      const base = (node?.attrs.containerStyle ?? "").replace(/margin:\s*[^;]+(;|$)/g, "").trim();
      const newContainerStyle = `${base}${base ? "; " : ""}margin: ${marginMap[align]};`;
      editor.chain()
        .setNodeSelection(imagePos)
        .updateAttributes("imageResize", { dataAlign: align, containerStyle: newContainerStyle })
        .run();
      setSelectedImageAlign(align);
      return;
    }
    editor.chain().focus().setTextAlign(align).run();
  };

  const isAlignActive = (align: "left" | "center" | "right") => {
    if (selectedImagePosRef.current !== null && selectedImageAlign !== null) {
      return selectedImageAlign === align;
    }
    return editor.isActive({ textAlign: align });
  };

  const uploadFile = async (file: File): Promise<string> => {
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
    return data.url;
  };

  const insertImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileKey((k) => k + 1);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      editor.chain().focus("end").setImage({ src: url }).createParagraphNear().run();
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const insertAnyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileKey((k) => k + 1);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (file.type.startsWith("image/")) {
        editor.chain().focus("end").setImage({ src: url }).createParagraphNear().run();
      } else {
        editor.chain().focus().insertContent({ type: "fileCard", attrs: { url, name: file.name } }).run();
      }
    } catch {
      alert("파일 업로드에 실패했습니다.");
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
                  onMouseDown={(e) => { e.preventDefault(); editor.commands.setColor(color); setShowColors(false); }}
                  className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.commands.unsetColor(); setShowColors(false); }}
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
      <div className="relative">
        <ToolbarButton onClick={insertLink} active={editor.isActive("link")} title="링크">
          <LinkIcon size={15} />
        </ToolbarButton>
        {linkOpen && (
          <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-20 p-2 flex items-center gap-1.5 w-64">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmLink(); } if (e.key === "Escape") { setLinkOpen(false); } }}
              placeholder="https://"
              autoFocus
              className="flex-1 bg-surface-elevated border border-border rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={confirmLink}
              disabled={linkFetching}
              className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-1"
            >
              {linkFetching ? <Loader2 size={11} className="animate-spin" /> : "확인"}
            </button>
          </div>
        )}
      </div>

      {/* 이미지 + 파일 */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton onClick={() => imageFileRef.current?.click()} title="이미지 첨부" active={false}>
          <ImageIcon size={15} />
        </ToolbarButton>
        <button
          type="button"
          disabled={uploading}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          title="파일 첨부"
          className="text-xs px-1.5 py-1 rounded text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : "파일"}
        </button>
        <input key={`img-${fileKey}`} ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={insertImageFile} />
        <input key={`file-${fileKey}`} ref={fileRef} type="file" className="hidden" onChange={insertAnyFile} />
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
  const selectedImagePosRef = useRef<number | null>(null);
  const [selectedImageAlign, setSelectedImageAlign] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({ link: false }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      ResizableImageWithAlign,
      LinkCard,
      FileCard,
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

  // 캡처 단계 클릭으로 이미지 선택 감지 (NodeView가 이벤트를 가로채도 동작)
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        let foundPos: number | null = null;
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === "imageResize" && foundPos === null) {
            const nodeDom = editor.view.nodeDOM(pos);
            if (nodeDom instanceof Element && nodeDom.contains(target)) {
              foundPos = pos;
            }
          }
        });
        if (foundPos !== null) {
          selectedImagePosRef.current = foundPos;
          const node = editor.state.doc.nodeAt(foundPos);
          setSelectedImageAlign(node?.attrs.dataAlign ?? "left");
        }
      } else {
        selectedImagePosRef.current = null;
        setSelectedImageAlign(null);
      }
    };

    dom.addEventListener("click", handleClick, true);
    return () => dom.removeEventListener("click", handleClick, true);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden focus-within:border-primary transition-colors">
      <Toolbar
        editor={editor}
        selectedImagePosRef={selectedImagePosRef}
        selectedImageAlign={selectedImageAlign}
        setSelectedImageAlign={setSelectedImageAlign}
      />
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="[&_.ProseMirror]:min-h-[300px] [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:inline-block [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:first-child::before]:text-text-muted [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
