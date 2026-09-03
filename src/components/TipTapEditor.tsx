import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, Code, List, ListOrdered, Quote, Heading2 } from 'lucide-react';

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TipTapEditor({ value, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({
        placeholder: placeholder || 'Type your content here...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  if (!editor) {
    return null;
  }

  const btnStyle = (isActive: boolean) => ({
    background: isActive ? '#e5e7eb' : 'transparent',
    border: 'none',
    padding: '6px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive ? 'var(--portal-purple)' : 'var(--portal-ink)',
  });

  return (
    <div style={{ border: '1px solid #dcd7e0', borderRadius: '8px', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid #dcd7e0', background: '#fbfafc', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          style={btnStyle(editor.isActive('bold'))}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          style={btnStyle(editor.isActive('italic'))}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div style={{ width: '1px', background: '#dcd7e0', margin: '0 4px' }} />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
          style={btnStyle(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run() }}
          style={btnStyle(editor.isActive('blockquote'))}
          title="Quote"
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run() }}
          style={btnStyle(editor.isActive('codeBlock'))}
          title="Code Block"
        >
          <Code size={16} />
        </button>
        <div style={{ width: '1px', background: '#dcd7e0', margin: '0 4px' }} />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
          style={btnStyle(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
          style={btnStyle(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      {/* Editor Content */}
      <div 
        style={{ 
          padding: '16px', 
          minHeight: '250px', 
          maxHeight: '400px', 
          overflowY: 'auto',
          cursor: 'text'
        }} 
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} className="tiptap-editor-content" />
      </div>
    </div>
  );
}
