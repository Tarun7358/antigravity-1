import React, { useState, useEffect, useContext } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AuthContext } from '../../context/AuthContext';
import { MessageSquare, ThumbsUp, Plus, Pin, Clock, User, X, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ForumView = ({ activeWorkspace, activeChannel }) => {
  const { user } = useContext(AuthContext);
  const [threads, setThreads] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Fetch Threads
  useEffect(() => {
    if (!activeWorkspace?._id || !activeChannel?._id) return;

    const q = query(
      collection(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'threads'),
      orderBy('pinned', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setThreads(threadData);
    });

    return () => unsubscribe();
  }, [activeWorkspace, activeChannel]);

  // Fetch Comments for Active Thread
  useEffect(() => {
    if (!activeWorkspace?._id || !activeChannel?._id || !activeThread?.id) {
      setComments([]);
      return;
    }

    const q = query(
      collection(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'threads', activeThread.id, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentData);
    });

    return () => unsubscribe();
  }, [activeWorkspace, activeChannel, activeThread]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    try {
      await addDoc(collection(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'threads'), {
        title: newThreadTitle,
        content: newThreadContent,
        authorId: user.uid,
        authorName: user.username || user.displayName || 'User',
        authorAvatar: user.avatar || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: 0,
        upvotedBy: [],
        commentCount: 0,
        pinned: false,
      });
      setNewThreadTitle('');
      setNewThreadContent('');
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeThread) return;

    try {
      const threadRef = doc(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'threads', activeThread.id);
      
      await addDoc(collection(threadRef, 'comments'), {
        content: newComment,
        authorId: user.uid,
        authorName: user.username || user.displayName || 'User',
        authorAvatar: user.avatar || '',
        createdAt: serverTimestamp(),
      });

      await updateDoc(threadRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp()
      });

      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleToggleUpvote = async (thread) => {
    if (!user) return;
    const threadRef = doc(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'threads', thread.id);
    const hasUpvoted = (thread.upvotedBy || []).includes(user.uid);

    try {
      if (hasUpvoted) {
        await updateDoc(threadRef, {
          upvotes: increment(-1),
          upvotedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(threadRef, {
          upvotes: increment(1),
          upvotedBy: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Error toggling upvote:", error);
    }
  };

  const handleTogglePin = async (thread, e) => {
    e.stopPropagation();
    // Assuming user is owner/admin - in a real app, check permissions
    const threadRef = doc(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'threads', thread.id);
    try {
      await updateDoc(threadRef, {
        pinned: !thread.pinned
      });
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  if (!activeChannel || activeChannel.type !== 'forum') return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h2 className="text-white font-bold text-lg">{activeChannel.name}</h2>
        </div>
        {!activeThread && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        )}
      </div>

      {activeThread ? (
        // Thread View
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <button 
              onClick={() => setActiveThread(null)}
              className="text-slate-400 hover:text-white flex items-center gap-2 mb-6 text-sm font-bold transition-colors"
            >
              ← Back to Posts
            </button>
            
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => handleToggleUpvote(activeThread)}
                    className={`p-2 rounded-lg transition-colors ${(activeThread.upvotedBy || []).includes(user?.uid) ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <span className="text-white font-bold">{activeThread.upvotes || 0}</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-2">{activeThread.title}</h1>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-6">
                    <div className="flex items-center gap-1">
                      <img src={activeThread.authorAvatar || `https://ui-avatars.com/api/?name=${activeThread.authorName}`} className="w-4 h-4 rounded-full" alt="author" />
                      <span className="font-medium text-slate-400">{activeThread.authorName}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeThread.createdAt ? formatDistanceToNow(activeThread.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                    </div>
                  </div>
                  <div className="text-slate-300 whitespace-pre-wrap">{activeThread.content}</div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
              {comments.length} Comments
            </h3>

            <div className="space-y-4 mb-6">
              {comments.map(comment => (
                <div key={comment.id} className="bg-slate-950/30 border border-slate-800/50 rounded-2xl p-4 flex gap-4">
                  <img src={comment.authorAvatar || `https://ui-avatars.com/api/?name=${comment.authorName}`} className="w-8 h-8 rounded-full" alt="author" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-200 text-sm">{comment.authorName}</span>
                      <span className="text-xs text-slate-500">
                        {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                      </span>
                    </div>
                    <div className="text-slate-300 text-sm whitespace-pre-wrap">{comment.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-950/50 border-t border-slate-800">
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="submit"
                disabled={!newComment.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold transition-colors"
              >
                Reply
              </button>
            </form>
          </div>
        </div>
      ) : isCreating ? (
        // Create Thread View
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create a New Post</h2>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Content</label>
                <textarea
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  placeholder="Add more details..."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 min-h-[200px]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 text-slate-300 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newThreadTitle.trim() || !newThreadContent.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold transition-colors"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // Thread List View
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-4">
            {threads.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">No posts yet</h3>
                <p className="text-slate-500 mb-6">Be the first to start a discussion in this channel.</p>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                  Create Post
                </button>
              </div>
            ) : (
              threads.map(thread => (
                <div 
                  key={thread.id} 
                  onClick={() => setActiveThread(thread)}
                  className={`bg-slate-950/50 border rounded-2xl p-4 flex gap-4 cursor-pointer transition-all hover:bg-slate-800/50 ${thread.pinned ? 'border-indigo-500/50' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex flex-col items-center gap-1 min-w-[40px]">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleUpvote(thread);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${(thread.upvotedBy || []).includes(user?.uid) ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <span className={`text-sm font-bold ${(thread.upvotedBy || []).includes(user?.uid) ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {thread.upvotes || 0}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-lg font-bold text-white truncate flex items-center gap-2">
                        {thread.pinned && <Pin className="w-4 h-4 text-indigo-400 shrink-0" />}
                        {thread.title}
                      </h3>
                      <button 
                        onClick={(e) => handleTogglePin(thread, e)}
                        className={`shrink-0 p-1 rounded transition-colors ${thread.pinned ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                      {thread.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <img src={thread.authorAvatar || `https://ui-avatars.com/api/?name=${thread.authorName}`} className="w-4 h-4 rounded-full" alt="author" />
                        <span className="text-slate-300">{thread.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {thread.commentCount || 0} comments
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {thread.createdAt ? formatDistanceToNow(thread.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumView;
