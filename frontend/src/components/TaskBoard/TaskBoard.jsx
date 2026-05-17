import React, { useState, useEffect, useContext } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar as CalendarIcon, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';

const TaskCard = ({ task, index, activeWorkspace }) => {
  const handleDeleteTask = async (e) => {
    e.stopPropagation();
    if (!activeWorkspace?._id || !task?.id) return;
    try {
      await deleteDoc(doc(db, 'workspaces', activeWorkspace._id, 'tasks', task.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 mb-3 rounded-xl border ${
            snapshot.isDragging ? 'bg-slate-700 border-indigo-500 shadow-xl shadow-indigo-500/20' : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
          } transition-colors group`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
              task.priority === 'High' ? 'bg-rose-500/20 text-rose-400' :
              task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {task.priority}
            </span>
            <button onClick={handleDeleteTask} className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-200 text-sm mb-4">{task.content}</p>
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{task.dueDate?.toDate ? format(task.dueDate.toDate(), 'MMM d') : 'Soon'}</span>
            </div>
            <img src={task.assigneeAvatar || `https://ui-avatars.com/api/?name=${task.assignee || 'User'}&background=6366f1&color=fff`} alt="Assignee" className="w-6 h-6 rounded-full border border-slate-700" />
          </div>
        </div>
      )}
    </Draggable>
  );
};

const TaskBoard = ({ activeWorkspace }) => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskColumn, setNewTaskColumn] = useState('To Do');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [showAddModal, setShowAddModal] = useState(false);

  const columns = [
    { id: 'To Do', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Review', title: 'Review' },
    { id: 'Completed', title: 'Completed' },
  ];

  useEffect(() => {
    if (!activeWorkspace?._id) return;

    const q = query(collection(db, 'workspaces', activeWorkspace._id, 'tasks'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tasksData = {};
      snapshot.docs.forEach(doc => {
        tasksData[doc.id] = { id: doc.id, ...doc.data() };
      });

      // Seed initial tasks if none exist
      if (snapshot.docs.length === 0 && activeWorkspace?._id) {
        try {
          const tasksRef = collection(db, 'workspaces', activeWorkspace._id, 'tasks');
          await addDoc(tasksRef, { content: 'Design login page', priority: 'High', columnId: 'To Do', dueDate: new Date(), assignee: 'Sarah', assigneeAvatar: 'https://ui-avatars.com/api/?name=Sarah&background=ec4899&color=fff', createdAt: serverTimestamp() });
          await addDoc(tasksRef, { content: 'Set up Express server', priority: 'Medium', columnId: 'To Do', dueDate: new Date(), assignee: 'John', assigneeAvatar: 'https://ui-avatars.com/api/?name=John&background=10b981&color=fff', createdAt: serverTimestamp() });
          await addDoc(tasksRef, { content: 'Integrate Socket.IO', priority: 'High', columnId: 'In Progress', dueDate: new Date(), assignee: 'Admin', assigneeAvatar: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff', createdAt: serverTimestamp() });
          await addDoc(tasksRef, { content: 'Create Database Schema', priority: 'Low', columnId: 'Completed', dueDate: new Date(), assignee: 'Tarun', assigneeAvatar: 'https://ui-avatars.com/api/?name=Tarun&background=f59e0b&color=fff', createdAt: serverTimestamp() });
        } catch (err) {
          console.error("Error seeding tasks", err);
        }
      } else {
        setTasks(tasksData);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [activeWorkspace]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistic local update
    const updatedTasks = { ...tasks };
    if (updatedTasks[draggableId]) {
      updatedTasks[draggableId].columnId = destination.droppableId;
      setTasks(updatedTasks);
    }

    // Persist to Firestore
    if (activeWorkspace?._id && draggableId) {
      try {
        const taskRef = doc(db, 'workspaces', activeWorkspace._id, 'tasks', draggableId);
        await updateDoc(taskRef, {
          columnId: destination.droppableId,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to update task column", err);
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!activeWorkspace?._id || !newTaskContent.trim()) return;

    try {
      await addDoc(collection(db, 'workspaces', activeWorkspace._id, 'tasks'), {
        content: newTaskContent.trim(),
        priority: newTaskPriority,
        columnId: newTaskColumn,
        dueDate: new Date(),
        assignee: user?.username || 'Unassigned',
        assigneeAvatar: user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=6366f1&color=fff`,
        createdAt: serverTimestamp()
      });
      setNewTaskContent('');
      setShowAddModal(false);
    } catch (err) {
      console.error("Error creating task", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-[#0f172a] h-full relative custom-scrollbar">
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Project Board
          </h2>
          <p className="text-slate-400 mt-1">Manage your team's tasks and sprints in real-time.</p>
        </div>
        <button 
          onClick={() => { setNewTaskColumn('To Do'); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 max-w-7xl mx-auto items-start">
          {columns.map((col) => {
            const colTasks = Object.values(tasks).filter(t => t.columnId === col.id);

            return (
              <div key={col.id} className="w-80 shrink-0 flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-xl">
                <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/40">
                  <h3 className="font-bold text-slate-200">{col.title}</h3>
                  <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-700">
                    {colTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} activeWorkspace={activeWorkspace} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="p-3 border-t border-slate-800 bg-slate-900/20">
                  <button 
                    onClick={() => { setNewTaskColumn(col.id); setShowAddModal(true); }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Card</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-bold text-white">Create New Task</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Task Description</label>
                <input 
                  type="text" 
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  placeholder="e.g. Implement OAuth login flow" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                  <select 
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Column</label>
                  <select 
                    value={newTaskColumn}
                    onChange={(e) => setNewTaskColumn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  >
                    {columns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
