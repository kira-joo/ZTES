"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, Link2, Link2Off, List, ListOrdered } from "lucide-react";
import { useEffect } from "react";

interface ToolbarButtonProps {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({ active, disabled, label, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export interface RichTextEditorProps {
  /** Sanitised HTML — the server re-sanitises on write regardless, this is upload/display only. */
  value: string;
  onChange: (html: string) => void;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * A small Tiptap-based rich text editor for descriptions, pages, posts and
 * FAQ answers — bold/italic/headings/lists/links, output as HTML. No toolkit
 * equivalent exists (see `docs/implementation-plan.md`'s dependency table),
 * so this is app-local rather than a shared abstraction: it has no reuse
 * beyond this one admin.
 */
export function RichTextEditor({
  value,
  onChange,
  dir = "ltr",
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: "noopener noreferrer" } } })],
    content: value || "<p></p>",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        dir,
        role: "textbox",
        "aria-label": ariaLabel ?? "Rich text content",
        class:
          "rich-text min-h-40 rounded-b-md border border-t-0 border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none",
      },
    },
  });

  // Keep the editor in sync with external value changes (form reset, locale
  // switch) without fighting the user mid-keystroke.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "<p></p>";
    if (next !== current) editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  const setLink = () => {
    const previousHref = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("Link URL", previousHref || "https://");
    if (url === null) return;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (url === "") chain.unsetLink().run();
    else chain.setLink({ href: url }).run();
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-slate-300 bg-slate-50 p-1" role="toolbar" aria-label="Formatting">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Add link" active={editor.isActive("link")} disabled={disabled} onClick={setLink}>
          <Link2 className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Remove link"
          disabled={disabled || !editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Link2Off className="size-4" aria-hidden="true" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
