import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Menu, Send, ShieldCheck, User } from "lucide-react";
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

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // 1. Load Profile and Friends
  useEffect(() => {
    api.profile().then(({ data }) => data && setProfile(data));
    api.getFriends().then(({ data }) => setFriends(data || []));
  }, []);

  // 2. Update target name if friend
  useEffect(() => {
    if (chatMode === "friend" && targetId !== "admin") {
      const f = friends.find(x => x.friend_id === targetId);
      if (f?.profiles?.name) setTargetName(f.profiles.name);
    }
  }, [friends, targetId, chatMode]);

  // 3. Load Messages for the active chat
  const loadMessages = async (target) => {
    if (!target) return;
    setLoading(true);
    
    try {
      if (target === "admin") {
        // Fetch Admin messages
        const { data } = await supabase.from("admin_messages").select("*")
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${ADMIN_UUID}),and(sender_id.eq.${ADMIN_UUID},receiver_id.eq.${profile.id})`)
          .order("created_at", { ascending: true });
        setMessages(data || []);
        
        // Mark as read
        await supabase.from("admin_messages").update({ read: true }).eq("receiver_id", profile.id).eq("sender_id", ADMIN_UUID).eq("read", false);
      } else {
        // Fetch Friend messages
        const { data } = await supabase.from("private_messages").select("*")
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${target}),and(sender_id.eq.${target},receiver_id.eq.${profile.id})`)
          .order("created_at", { ascending: true });
        setMessages(data || []);

        // Mark as read
        await supabase.from("private_messages").update({ read: true }).eq("receiver_id", profile.id).eq("sender_id", target).eq("read", false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Real-time listeners & initial load
  useEffect(() => {
    if (!profile.id) return;
    
    loadMessages(targetId);
    setUnreadCounts(prev => ({ ...prev, [targetId]: 0 }));

    // Listen for Admin Messages
    const adminChannel = supabase.channel('chat-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, (payload) => {
        const m = payload.new;
        const isCurrentChat = targetId === "admin";
        const isForMe = m.sender_id === ADMIN_UUID || m.receiver_id === ADMIN_UUID;

        if (isForMe) {
          if (isCurrentChat) {
            setMessages(prev => [...prev, m]);
            if (m.receiver_id === profile.id) {
              supabase.from("admin_messages").update({ read: true }).eq("id", m.id);
            }
          } else {
            if (m.receiver_id === profile.id) {
              setUnreadCounts(prev => ({ ...prev, admin: (prev.admin || 0) + 1 }));
            }
          }
        }
      }).subscribe();

    // Listen for Private Messages
    const privateChannel = supabase.channel('chat-private')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const m = payload.new;
        const isCurrentChat = (m.sender_id === targetId || m.receiver_id === targetId);
        
        if (isCurrentChat) {
          setMessages(prev => [...prev, m]);
          if (m.receiver_id === profile.id) {
            supabase.from("private_messages").update({ read: true }).eq("id", m.id);
          }
        } else {
          if (m.receiver_id === profile.id) {
            const sender = m.sender_id;
            setUnreadCounts(prev => ({ ...prev, [sender]: (prev[sender] || 0) + 1 }));
          }
        }
      }).subscribe();

    return () => { 
      supabase.removeChannel(adminChannel); 
      supabase.removeChannel(privateChannel);
    };
  }, [targetId, profile.id]);

  async function send(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSending(true);
    
    try {
      if (targetId === "admin") {
        const { error } = await supabase.from("admin_messages").insert({
          sender_id: profile.id,
          receiver_id: ADMIN_UUID,
          message: newMsg.trim(),
          read: false
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("private_messages").insert({
          sender_id: profile.id,
          receiver_id: targetId,
          message: newMsg.trim(),
          read: false
        });
        if (error) throw error;
      }
      setNewMsg("");
    } catch (err) {
      alert("Send failed: " + err.message);
    } finally {
      setSending(false);
    }
  }

  const selectChat = (mode, id, name) => {
    setChatMode(mode);
    setTargetId(id);
    setTargetName(name);
    setShowSidebar(false);
    setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
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
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                        {f.profiles?.avatar_url ? <img src={f.profiles.avatar_url} className="h-full w-full object-cover" /> : (f.profiles?.name || "?")[0]}
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