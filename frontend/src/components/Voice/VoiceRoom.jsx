import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Users, Volume2, Bot, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';

const VoiceRoom = ({ activeChannel, activeWorkspace, setActiveView, setActiveChannel }) => {
  const { user } = useContext(AuthContext);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showActionItems, setShowActionItems] = useState(false);
  
  const localVideoRef = useRef(null);

  // Initialize Local Stream
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        setLocalStream(stream);
      })
      .catch(err => console.error("Failed to get local stream", err));

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOn, isScreenSharing]);

  // Handle Real-Time Presence in Firestore
  useEffect(() => {
    if (!user?.uid || !activeWorkspace?._id || !activeChannel?._id) return;

    const participantRef = doc(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'participants', user.uid);

    const joinVoice = async () => {
      try {
        await setDoc(participantRef, {
          id: user.uid,
          name: user.username,
          avatar: user.avatar,
          speaking: !isMuted,
          joinedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error joining voice presence", err);
      }
    };

    joinVoice();

    // Listen to all participants in this voice channel
    const q = query(collection(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'participants'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parts = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.id !== user.uid); // Exclude local user from remote list
      setRemoteParticipants(parts);
    });

    return () => {
      unsubscribe();
      deleteDoc(participantRef).catch(err => console.error("Error leaving voice presence", err));
    };
  }, [user, activeWorkspace, activeChannel, isMuted]);

  const toggleVideo = async () => {
    if (isVideoOn) {
      const videoTrack = localStream?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStream.removeTrack(videoTrack);
      }
      setIsVideoOn(false);
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        if (localStream) {
          localStream.addTrack(videoTrack);
        } else {
          setLocalStream(stream);
        }
        setIsVideoOn(true);
      } catch (err) {
        console.error("Could not get video", err);
      }
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      const videoTrack = localStream?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStream.removeTrack(videoTrack);
      }
      setIsScreenSharing(false);
      setIsVideoOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];
        
        const oldVideoTrack = localStream?.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          localStream.removeTrack(oldVideoTrack);
        }

        if (localStream) {
          localStream.addTrack(screenTrack);
        } else {
          setLocalStream(stream);
        }
        
        setIsScreenSharing(true);
        setIsVideoOn(true);

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          setIsVideoOn(false);
          localStream.removeTrack(screenTrack);
        };
      } catch (err) {
        console.error("Could not share screen", err);
      }
    }
  };

  const handleDisconnect = async () => {
    if (user?.uid && activeWorkspace?._id && activeChannel?._id) {
      const participantRef = doc(db, 'workspaces', activeWorkspace._id, 'channels', activeChannel._id, 'participants', user.uid);
      await deleteDoc(participantRef);
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (setActiveChannel) setActiveChannel(null);
    if (setActiveView) setActiveView('dashboard');
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setShowActionItems(true); // Mock generating action items when stopped
    } else {
      setIsRecording(true);
      setShowActionItems(false);
    }
  };

  const allParticipants = [
    { id: 'local', name: `${user?.username || 'You'} (You)`, avatar: user?.avatar, isLocal: true, speaking: !isMuted },
    ...remoteParticipants
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1c] overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
            <Volume2 className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">{activeChannel?.name || 'Voice Lounge'}</h2>
            <p className="text-xs text-slate-400">Real-Time Voice • {allParticipants.length} Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg shadow-inner">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">{allParticipants.length} / 25</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto h-full auto-rows-[280px]">
          {allParticipants.map((participant) => (
            <motion.div 
              key={participant.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`relative bg-slate-900 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-colors shadow-xl ${
                participant.speaking ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-slate-800'
              }`}
            >
              {participant.isLocal && isVideoOn ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
                />
              ) : (
                <div className="flex flex-col items-center">
                  <div className={`relative ${participant.speaking ? 'animate-pulse' : ''}`}>
                    <img src={participant.avatar || `https://ui-avatars.com/api/?name=${participant.name}`} alt={participant.name} className="w-24 h-24 rounded-full border-4 border-slate-800 bg-slate-800 object-cover shadow-2xl" />
                    {participant.speaking && (
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-25"></div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Name Plate */}
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2 shadow-lg z-20">
                {participant.speaking ? <Mic className="w-3.5 h-3.5 text-indigo-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                <span className="text-sm font-medium text-white">{participant.name}</span>
              </div>
              
              {/* Go Live Indicator */}
              {isScreenSharing && participant.isLocal && (
                <div className="absolute top-4 left-4 bg-rose-600 px-3 py-1 rounded-full flex items-center gap-2 shadow-lg shadow-rose-600/30 z-20 border border-rose-500 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span className="text-xs font-bold text-white tracking-widest uppercase">LIVE</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Action Items Panel */}
      {showActionItems && (
        <div className="absolute right-6 top-24 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              AI Action Items
            </h4>
            <button onClick={() => setShowActionItems(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-slate-400 mb-3">Generated from your recent recording:</p>
          <ul className="space-y-2 mb-4">
            <li className="text-sm text-slate-300 flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>Fix the routing bug in Dashboard.jsx</span>
            </li>
            <li className="text-sm text-slate-300 flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>Deploy the new AI Bot feature to staging</span>
            </li>
            <li className="text-sm text-slate-300 flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>Review audit logs UI with the team</span>
            </li>
          </ul>
          <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors">
            Create Tasks
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="h-24 bg-slate-900 border-t border-slate-800 shrink-0 flex items-center justify-center gap-6 px-6 z-10 shadow-2xl">
        <button 
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button 
          onClick={toggleVideo}
          disabled={isScreenSharing}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            !isVideoOn || isScreenSharing ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
          } ${isScreenSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
        >
          {isVideoOn && !isScreenSharing ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        <button 
          onClick={toggleScreenShare}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isScreenSharing ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
        >
          <MonitorUp className="w-6 h-6" />
        </button>

        <div className="w-px h-8 bg-slate-700" />

        <button 
          onClick={toggleRecording}
          className={`px-4 h-14 rounded-full flex items-center justify-center gap-2 transition-all border border-slate-700 ${
            isRecording ? 'bg-rose-500/10 text-rose-500 border-rose-500/50 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={isRecording ? "Stop AI Recording" : "Start AI Recording"}
        >
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-rose-500' : 'bg-slate-500'}`} />
          <span className="font-bold">{isRecording ? 'Recording...' : 'Record'}</span>
        </button>

        <button 
          onClick={handleDisconnect}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 transition-all hover:scale-105"
          title="Disconnect"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default VoiceRoom;
