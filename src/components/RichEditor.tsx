// components/RichEditor.tsx
// Éditeur rich text basé sur Tiptap
'use client'
import React, { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'

const COLORS = [
  '#111827', '#800020', '#1877F2', '#10B981',
  '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#06B6D4', '#F97316',
]

const HIGHLIGHT_COLORS = [
  '#FEF08A', '#BBF7D0', '#BAE6FD', '#FCA5A5',
  '#DDD6FE', '#FBCFE8', '#fed7aa',
]

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const highlightInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'min-h-[280px] outline-none px-4 py-3 text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none',
      },
    },
  })

  if (!editor) return null

  const ToolBtn = ({
    onClick, active = false, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all
        ${active
          ? 'bg-gray-900 text-white shadow-inner'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden focus-within:border-amber-400 transition-colors">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">

        {/* Format */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras">
          <b>B</b>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique">
          <i>I</i>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné">
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
          <span className="line-through">S</span>
        </ToolBtn>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Titres */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Titre 1">
          H1
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre 2">
          H2
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre 3">
          H3
        </ToolBtn>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Listes */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">
          ≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
          1≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">
          ❝
        </ToolBtn>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Couleur texte */}
        <div className="flex items-center gap-0.5">
          {COLORS.map(color => (
            <button
              key={color}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(color).run() }}
              title={`Couleur ${color}`}
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform"
              style={{ backgroundColor: color }}
            />
          ))}
          {/* Couleur personnalisée */}
          <div className="relative w-4 h-4 rounded-full overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform"
            title="Couleur personnalisée">
            <input
              ref={colorInputRef}
              type="color"
              defaultValue="#000000"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              style={{ transform: 'scale(2)' }}
            />
            <div className="w-full h-full pointer-events-none"
              style={{ background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }} />
          </div>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Surlignage */}
        <div className="flex items-center gap-0.5">
          {HIGHLIGHT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                if (editor.isActive('highlight', { color })) {
                  editor.chain().focus().unsetHighlight().run()
                } else {
                  editor.chain().focus().setHighlight({ color }).run()
                }
              }}
              title={`Surlignage`}
              className="w-4 h-4 rounded border border-gray-200 hover:scale-125 transition-transform"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Lien */}
        <ToolBtn
          onClick={() => {
            const url = window.prompt('URL du lien :')
            if (url) editor.chain().focus().setLink({ href: url }).run()
            else editor.chain().focus().unsetLink().run()
          }}
          active={editor.isActive('link')}
          title="Insérer un lien"
        >
          🔗
        </ToolBtn>

        {/* Effacer formatage */}
        <ToolBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Effacer le formatage">
          ✕
        </ToolBtn>
      </div>

      {/* Zone d'édition */}
      <div className="bg-white min-h-[280px] relative">
        {editor.isEmpty && placeholder && (
          <p className="absolute top-3 left-4 text-sm text-gray-300 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
