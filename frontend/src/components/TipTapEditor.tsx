import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Mark, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, Code, List, ListOrdered, Quote, Heading2, ImagePlus, Loader2, Underline } from 'lucide-react';

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  uploadImage?: (file: File) => Promise<{ url: string }>;
}

const UnderlineMark = Mark.create({
  name: 'underline',

  parseHTML() {
    return [{ tag: 'u' }];
  },

  renderHTML() {
    return ['u', 0];
  },
});

const ImageNode = Node.create({
  name: 'image',
  inline: true,
  group: 'inline',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{
      tag: 'img[src]',
      getAttrs: (element) => ({
        src: element.getAttribute('src'),
        alt: element.getAttribute('alt') || '',
        title: element.getAttribute('title'),
      }),
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const alt = String(node.attrs.alt || '').replace(/([\\[\]])/g, '\\$1');
          const src = String(node.attrs.src || '').replace(/[()]/g, '\\$&');
          const title = node.attrs.title ? ` "${String(node.attrs.title).replace(/"/g, '\\"')}"` : '';
          state.write(`![${alt}](${src}${title})`);
        },
        parse: {},
      },
    };
  },
});

export function TipTapEditor({ value, onChange, placeholder, uploadImage }: TipTapEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineMark,
      ImageNode,
      Markdown,
      Placeholder.configure({
        placeholder: placeholder || 'Type your content here...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const storage = editor.storage as any;
      const md = typeof storage.markdown?.getMarkdown === 'function' 
        ? storage.markdown.getMarkdown() 
        : editor.getText();
      onChange(md);
    },
  });

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !uploadImage) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Only image files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageUploadError('Images must be 10MB or smaller.');
      return;
    }

    setImageUploadError('');
    setIsUploadingImage(true);
    try {
      const result = await uploadImage(file);
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: { src: result.url, alt: file.name.replace(/\.[^.]+$/, '') },
      }).run();
    } catch (uploadError) {
      setImageUploadError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

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
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleMark('underline').run() }}
          disabled={!editor.can().chain().focus().toggleMark('underline').run()}
          style={btnStyle(editor.isActive('underline'))}
          title="Underline"
        >
          <Underline size={16} />
        </button>
        {uploadImage && (
          <>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); imageInputRef.current?.click(); }}
              disabled={isUploadingImage}
              style={btnStyle(false)}
              title="Upload image"
              aria-busy={isUploadingImage}
            >
              {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </>
        )}
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

      {imageUploadError && (
        <div role="alert" style={{ padding: '0 16px 10px', color: '#b91c1c', fontSize: '12px' }}>
          {imageUploadError}
        </div>
      )}

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
