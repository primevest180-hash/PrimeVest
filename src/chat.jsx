import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Menu, Send, ShieldCheck } from "lucide-react";
import { api, supabase, ADMIN_UUID } from "./app";

export function Chat() {
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get("id");
  const pathId = window.location.pathname.split("/chat/")[1];
  const startWith = paramId || pathId || "admin";

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [profile, setProfile] = useState({});
  const [chatMode, setChatMode] = useState(startWith === "admin" ? "admin" : "friend");
  const [targetId, setTargetId] = useState(startWith === "admin" ? "admin" : startWith);
  const [targetName, setTargetName] = useState(startWith === "admin" ? "Admin Support" : "Friend");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    api.profile().then(({ data }) => data && setProfile(data));
    api.getFriends().then(({ data }) => setFriends(data || []));
  }, []);

  useEffect(() => {
    if (chatMode === "friend" && targetId !== "admin") {
      const f = friends.find(x => x.friend_id === targetId);
      if (f?.profiles?.name) setTargetName(f.profiles.name);
    }
  }, [friends, targetId, chatMode]);

  const getActualTargetId = async (target) => {
    if (target === "admin") {
      const { data } = await supabase.from("profiles").select("id").eq("id", ADMIN_UUID).single();
      return data?.id || ADMIN_UUID;
    }
    return target;
  };

  const load = async (target) => {
    if (!target) return;
    setLoading(true);
    const actualTarget = await getActualTargetId(target);
    const { data, error } = await api.getMessages(actualTarget);
    if (error) console.error("Load messages:", error);
    setMessages(data || []);
    setLoading(false);
  };

  // REAL-TIME CHAT LISTENER
  useEffect(() => {
    if (!profile.id) return;
    
    load(targetId);

    // Mark messages as read when opening
    setUnreadCounts(prev => ({ ...prev, [targetId]: 0 }));

    const channel = supabase.channel('realtime_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const newMessage = payload.new;
        
        // If message is for the currently open chat, append it
        if (
          (newMessage.sender_id === profile.id && newMessage.receiver_id === (targetId === "admin" ? ADMIN_UUID : targetId)) ||
          (newMessage.receiver_id === profile.id && newMessage.sender_id === (targetId === "admin" ? ADMIN_UUID : targetId))
        ) {
          setMessages(prev => [...prev, newMessage]);
        } else if (newMessage.receiver_id === profile.id) {
          // Message is for another chat - increase unread badge
          const sender = newMessage.sender_id === ADMIN_UUID ? "admin" : newMessage.sender_id;
          setUnreadCounts(prev => ({ ...prev, [sender]: (prev[sender] || 0) + 1 }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [targetId, profile.id]);

  async function send(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSending(true);
    
    const actualTarget = await getActualTargetId(targetId);
    const r = await api.sendMessage(actualTarget, newMsg.trim());
    setSending(false);
    
    if (r?.error) return alert("Send failed: " + r.error);
    setNewMsg("");
    // Note: The real-time listener above will automatically catch this and add it to the UI!
  }

  const selectChat = (mode, id, name) => {
    setChatMode(mode);
    setTargetId(id);
    setTargetName(name);
    setShowSidebar(false);
    setUnreadCounts(prev => ({ ...prev, [id]: 0 })); // clear badge
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col">
      <header className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0D1526]">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSidebar(!showSidebar)} className="text-white md:hidden">
            <Menu size={24} />
          </button>
          <a href="/home" className="hidden md:flex items-center gap-2 text-white">
            <ArrowLeft size={20} /> Back
          </a>
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold text-white">{targetName}</h1>
          <p className="text-xs text-slate-400">{chatMode === "admin" ? "Support" : "Friend"}</p>
        </div>
        <div className="w-8 md:hidden" />
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`absolute md:relative z-20 w-64 h-full border-r border-white/10 bg-[#0D1526] flex flex-col transition-transform duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <button
            onClick={() => selectChat("admin", "admin", "Admin Support")}
            className={`p-4 flex items-center justify-between ${chatMode === "admin" ? "bg-blue-600/20 border-l-4 border-blue-500" : "hover:bg-white/5"}`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <div className="text-left text-white">
                <p className="font-bold text-sm">Admin</p>
                <p className="text-xs text-slate-400">Support</p>
              </div>
            </div>
            {unreadCounts["admin"] > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCounts["admin"]}</span>
            )}
          </button>

          <div className="p-4 border-t border-white/10 flex-1 overflow-y-auto">
            <p className="text-xs font-bold text-slate-400 mb-3 uppercase">Friends ({friends.length})</p>
            {friends.length === 0
              ? <p className="text-xs text-slate-500">No friends yet. Add in Settings.</p>
              : friends.map(f => (
                  <button key={f.id}
                    onClick={() => selectChat("friend", f.friend_id, f.profiles?.name || "Friend")}
                    className={`w-full flex items-center justify-between p-2 rounded-lg mb-1 ${targetId === f.friend_id ? "bg-slate-800" : "hover:bg-white/5"}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {(f.profiles?.name || "?")[0]}
                      </div>
                      <p className="text-sm text-white truncate">{f.profiles?.name || "Unknown"}</p>
                    </div>
                    {unreadCounts[f.friend_id] > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCounts[f.friend_id]}</span>
                    )}
                  </button>
                ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#070D1A] w-full">
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {loading
              ? <p className="text-center text-slate-500 text-sm">Loading...</p>
              : messages.length === 0
                ? <p className="text-center text-slate-500 text-sm mt-10">No messages yet. Say hi 👋</p>
                : messages.map(m => {
                    const isMe = m.sender_id === profile.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`p-3 rounded-2xl max-w-[85%] md:max-w-[80%] ${isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-[#0D1526] border border-white/10 text-slate-200 rounded-tl-sm"}`}>
                          <p className="text-sm break-words">{m.message}</p>
                          <p className="text-[10px] opacity-60 mt-1 text-right">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={send} className="p-4 border-t border-white/10 bg-[#0D1526] flex gap-2">
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
              placeholder={`Message ${targetName}...`}
              className="flex-1 bg-[#070D1A] text-white rounded-xl px-4 py-3 outline-none border border-white/10" />
            <button disabled={sending}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 disabled:opacity-50">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}