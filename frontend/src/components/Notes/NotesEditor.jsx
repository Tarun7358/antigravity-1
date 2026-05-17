import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, List, ListOrdered, Quote, Save, Users as UsersIcon } from 'lucide-react';
import { db } from '../../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const getButtonClass = (isActive) =>
    `p-2 rounded-lg transition-colors ${
      isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={getButtonClass(editor.isActive('bold'))}>
        <Bold className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={getButtonClass(editor.isActive('italic'))}>
        <Italic className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={getButtonClass(editor.isActive('strike'))}>
        <Strikethrough className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleCode().run()} className={getButtonClass(editor.isActive('code'))}>
        <Code className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-slate-700 mx-2" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={getButtonClass(editor.isActive('heading', { level: 1 }))}>
        <Heading1 className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={getButtonClass(editor.isActive('heading', { level: 2 }))}>
        <Heading2 className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={getButtonClass(editor.isActive('bulletList'))}>
        <List className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={getButtonClass(editor.isActive('orderedList'))}>
        <ListOrdered className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={getButtonClass(editor.isActive('blockquote'))}>
        <Quote className="w-4 h-4" />
      </button>
    </div>
  );
};

const NotesEditor = ({ activeWorkspace }) => {
  const [title, setTitle] = useState('Workspace Documentation');
  const [isSaved, setIsSaved] = useState(true);
  const [collabUsers, setCollabUsers] = useState(1);
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);

  const colors = ['#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];
  const names = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomName = names[Math.floor(Math.random() * names.length)];

  // Fetch initial title & setup Yjs WebRTC Provider per workspace
  useEffect(() => {
    if (!activeWorkspace?._id) return;

    const docRef = doc(db, 'workspaces', activeWorkspace._id, 'documentation', 'main');
    getDoc(docRef).then(snapshot => {
      if (snapshot.exists() && snapshot.data().title) {
        setTitle(snapshot.data().title);
      } else {
        setDoc(docRef, { title: 'Workspace Documentation', updatedAt: new Date() }, { merge: true });
      }
    });

    const newYdoc = new Y.Doc();
    const roomName = `antigravity-docs-room-${activeWorkspace._id}`;
    const newProvider = new WebrtcProvider(roomName, newYdoc);

    newProvider.on('awarenessUpdate', () => {
      const states = newProvider.awareness.getStates();
      setCollabUsers(states.size);
    });

    newProvider.awareness.setLocalStateField('user', {
      name: randomName,
      color: randomColor,
    });

    setYdoc(newYdoc);
    setProvider(newProvider);

    return () => {
      newProvider.destroy();
      newYdoc.destroy();
    };
  }, [activeWorkspace]);

  const handleTitleChange = async (newTitle) => {
    setTitle(newTitle);
    setIsSaved(false);
    if (activeWorkspace?._id) {
      const docRef = doc(db, 'workspaces', activeWorkspace._id, 'documentation', 'main');
      await updateDoc(docRef, { title: newTitle, updatedAt: new Date() });
      setIsSaved(true);
    }
  };

  const editor = useEditor({
    extensions: ydoc && provider ? [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider: provider,
        user: { name: randomName, color: randomColor },
      }),
    ] : [],
    onUpdate: () => {
      setIsSaved(false);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-indigo focus:outline-none max-w-none min-h-[500px]',
      },
    },
  }, [ydoc, provider]);

  const handleSave = () => {
    setIsSaved(true);
  };

  if (!ydoc || !provider) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
        <div className="text-slate-500 text-sm animate-pulse">Initializing Collaborative Document...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-[#0f172a] overflow-hidden">
      {/* Header */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md shrink-0">
        <input 
          type="text" 
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none focus:outline-none text-white w-1/2"
        />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20">
            <UsersIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{collabUsers} Active</span>
          </div>
          <span className={`text-sm ${isSaved ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isSaved ? 'All changes saved' : 'Unsaved changes'}
          </span>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium shadow-lg shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto my-8 bg-slate-900 border border-slate-800 shadow-2xl shadow-indigo-500/5 rounded-xl overflow-hidden">
          <MenuBar editor={editor} />
          <div className="p-8">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .prose h1, .prose h2, .prose h3 { color: white; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; }
        .prose h1 { font-size: 2.25rem; }
        .prose h2 { font-size: 1.875rem; }
        .prose p { color: #cbd5e1; margin-bottom: 1em; line-height: 1.75; }
        .prose ul, .prose ol { color: #cbd5e1; margin-left: 1.5em; margin-bottom: 1em; }
        .prose ul { list-style-type: disc; }
        .prose ol { list-style-type: decimal; }
        .prose blockquote { border-left: 4px solid #6366f1; padding-left: 1em; color: #94a3b8; font-style: italic; }
        .prose code { background: #1e293b; padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; color: #a855f7; }
        .prose pre code { background: transparent; padding: 0; color: #cbd5e1; }
      `}} />
    </div>
  );
};

export default NotesEditor;
