import { useCallback, useEffect, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TiptapContent } from "@/types"

interface RichTextEditorProps {
  content: TiptapContent | null
  onSave?: (content: TiptapContent) => void
  onChange?: (content: TiptapContent) => void
  placeholder?: string
  editable?: boolean
  className?: string
  autofocus?: boolean
}

export function RichTextEditor({
  content,
  onSave,
  onChange,
  placeholder = "Write something...",
  editable = true,
  className,
  autofocus = false,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || undefined,
    editable,
    autofocus,
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false)
      if (hasChanges && onSave) {
        const json = editor?.getJSON() as TiptapContent
        onSave(json)
        setHasChanges(false)
      }
    },
    onUpdate: ({ editor }) => {
      setHasChanges(true)
      if (onChange) {
        onChange(editor.getJSON() as TiptapContent)
      }
    },
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content && !isFocused) {
      const currentContent = JSON.stringify(editor.getJSON())
      const newContent = JSON.stringify(content)
      if (currentContent !== newContent) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor, isFocused])

  if (!editor) return null

  return (
    <div
      className={cn(
        "rounded-lg border bg-background transition-colors",
        isFocused && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        className
      )}
    >
      {/* Toolbar */}
      {editable && isFocused && (
        <div className="flex items-center gap-0.5 p-1 border-b">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive("bold") && "bg-muted")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive("italic") && "bg-muted")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(editor.isActive("code") && "bg-muted")}
          >
            <Code className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive("bulletList") && "bg-muted")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive("orderedList") && "bg-muted")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(editor.isActive("blockquote") && "bg-muted")}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none p-3" />
    </div>
  )
}

// Simple text-only version for comments
interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSubmit?: () => void
  className?: string
}

export function SimpleEditor({
  value,
  onChange,
  placeholder,
  onSubmit,
  className,
}: SimpleEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn(
        "w-full min-h-[80px] p-3 rounded-lg border bg-background resize-none",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    />
  )
}
