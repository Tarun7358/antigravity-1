import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Video, Users, Plus, Trash2, Loader2 } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const CalendarView = ({ activeWorkspace }) => {
  const [value, onChange] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('10:00 AM - 11:00 AM');
  const [newEventType, setNewEventType] = useState('meeting');

  useEffect(() => {
    if (!activeWorkspace?._id) return;

    const q = query(collection(db, 'workspaces', activeWorkspace._id, 'events'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date()
      }));

      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeWorkspace]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!activeWorkspace?._id || !newEventTitle.trim()) return;

    try {
      await addDoc(collection(db, 'workspaces', activeWorkspace._id, 'events'), {
        title: newEventTitle.trim(),
        time: newEventTime,
        type: newEventType,
        date: value,
        createdAt: serverTimestamp()
      });
      setNewEventTitle('');
      setShowAddModal(false);
    } catch (err) {
      console.error("Error creating event", err);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!activeWorkspace?._id || !id) return;
    try {
      await deleteDoc(doc(db, 'workspaces', activeWorkspace._id, 'events', id));
    } catch (err) {
      console.error("Error deleting event", err);
    }
  };

  const selectedDateEvents = events.filter(
    (e) => e.date.toDateString() === value.toDateString()
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-[#0f172a] overflow-hidden relative custom-scrollbar">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">Workspace Schedule</h2>
            <p className="text-xs text-slate-400">Manage team meetings, sprint reviews, and deployment deadlines</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* Calendar Widget */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl shadow-indigo-500/5">
              <style>{`
                .react-calendar { width: 100%; background: transparent; border: none; font-family: inherit; }
                .react-calendar button { color: #cbd5e1; border-radius: 8px; padding: 10px; transition: all 0.2s; }
                .react-calendar button:hover { background: #334155; }
                .react-calendar__navigation button { font-weight: bold; font-size: 1.1rem; }
                .react-calendar__month-view__weekdays { font-size: 0.8rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; abbr { text-decoration: none; } }
                .react-calendar__tile--now { background: #1e293b; color: #6366f1; font-weight: bold; }
                .react-calendar__tile--active { background: #6366f1 !important; color: white !important; font-weight: bold; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39); }
                .react-calendar__month-view__days__day--neighboringMonth { color: #475569; }
              `}</style>
              <Calendar onChange={onChange} value={value} />
            </div>
          </div>

          {/* Agenda */}
          <div className="flex-1">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 min-h-[400px] shadow-xl">
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-white">
                  Agenda for {format(value, 'MMMM d, yyyy')}
                </h3>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedDateEvents.length} Events</span>
              </div>

              {selectedDateEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="flex gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:border-indigo-500/50 transition-colors group relative">
                      <div className={`w-2 rounded-full ${event.type === 'meeting' ? 'bg-purple-500' : event.type === 'review' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-white font-semibold text-lg truncate">{event.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                              {event.time}
                            </span>
                            <button onClick={() => handleDeleteEvent(event.id)} className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-3">
                          {event.type === 'meeting' && (
                            <div className="flex items-center gap-1.5 text-indigo-400">
                              <Video className="w-4 h-4" />
                              <span>Voice Lounge Active</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span className="capitalize">{event.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p>No events scheduled for this day. Click 'New Event' to add one!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateEvent} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-bold text-white">Create Schedule Event</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Title</label>
                <input 
                  type="text" 
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Sprint Planning" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time Window</label>
                  <input 
                    type="text" 
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="e.g. 2:00 PM - 3:00 PM" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Type</label>
                  <select 
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  >
                    <option value="meeting">Meeting (Voice)</option>
                    <option value="review">Code Review</option>
                    <option value="task">Deployment / Task</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Scheduling for: <strong className="text-white">{format(value, 'MMMM d, yyyy')}</strong></span>
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
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
