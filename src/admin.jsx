import { useState, useEffect } from "react";
import {
  Lock as LockIcon, Download, ArrowLeft, Users, Wallet, MessageSquare, Send, RefreshCw, Megaphone, UserPlus
} from "lucide-react";
import { api, supabase, ADMIN_UUID } from "./app";

const ADMIN_UUIDS = [
  "a95d9e9b-00dd-473f-a13b-0ee77eb9ae31",
  "e644805d-5c81-4402-8e28-f64828a9814e",
];

export function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [vault, setVault] = useState([]);
  
  // Chat states
  const [allMessages, setAllMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Announcement states
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [directUser, setDirectUser] = useState("");
  const [directMsg, setDirectMsg] = useState("");

  const [stats, setStats] = useState({ usersCount: 0, totalWithdrawn: 0, pendingWithdrawals: 0 });
  const [processing, setProcessing] = useState(null);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => { setLoading(false); }, []);

  async function loadData() {
    setDataLoading(true);
    try {
      const [w, u, v, s, messageResult, announcementResult] = await Promise.all([
        api.getAdminWithdrawals(),
        api.getAllUsers(),
        api.getAdminVault(),
        api.getAdminStats(),
        supabase.from("admin_messages").select("*").order("created_at", { ascending: true }),
        supabase.from("global_announcements").select("*").eq("id", 1).single()
      ]);

      if (messageResult.error) setError("Messages error: " + messageResult.error.message);
      else if (u?.error) setError("User profiles error: " + u.error.message);
      else setError("");

      setWithdrawals(w?.data || []);
      setUsers(u?.data || []);
      setVault(v?.data || []);
      setAllMessages(messageResult.data || []);

      const unread = (messageResult.data || []).filter(m => m.receiver_id === ADMIN_UUID && !m.read).length;
      setUnreadCount(unread);

      if (announcementResult.data) {
        setAnnouncementText(announcementResult.data.message || "");
        setAnnouncementActive(announcementResult.data.active || false);
      }

      setStats(s || { usersCount: 0, totalWithdrawn: 0, pendingWithdrawals: 0 });
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (!authed) return;
    const channel = supabase.channel('admin-messages-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, (payload) => {
        setAllMessages(prev => [...prev, payload.new]);
        if (payload.new.receiver_id === ADMIN_UUID && !payload.new.read) setUnreadCount(prev => prev + 1);
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [authed]);

  async function login(e) {
    e.preventDefault();
    if (password !== "2468") return setError("Incorrect password.");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !ADMIN_UUIDS.includes(user.id)) return setError("Unauthorized admin.");
    setAuthed(true);
    await loadData();
  }

  async function approve(w) {
    if (!confirm(`Approve ₦${Number(w.amount).toLocaleString()}?`)) return;
    setProcessing(w.id);
    try {
      const result = await api.approveWithdrawal(w.id, w.user_id, w.amount);
      if (result?.error) alert("Approval failed: " + result.error.message);
      else { alert("Withdrawal approved."); await loadData(); }
    } catch (err) { alert("Approval failed: " + err.message); } 
    finally { setProcessing(null); }
  }

  async function reject(w) {
    if (!confirm(`Reject ₦${Number(w.amount).toLocaleString()}?`)) return;
    setProcessing(w.id);
    try {
      const result = await api.rejectWithdrawal(w.id, w.user_id, w.amount);
      if (result?.error) alert("Rejection failed: " + result.error.message);
      else { alert("Withdrawal rejected."); await loadData(); }
    } catch (err) { alert("Rejection failed: " + err.message); } 
    finally { setProcessing(null); }
  }

  async function freeze(u) {
    if (!confirm(`Toggle freeze for ${u.name || u.email || "this user"}?`)) return;
    try {
      const result = await api.toggleUserFreeze(u.id, u.account_status);
      if (result?.error) alert("User update failed: " + result.error.message);
      else await loadData();
    } catch (err) { alert("User update failed: " + err.message); }
  }

  async function sendAdminMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    const msg = { sender_id: ADMIN_UUID, receiver_id: selectedUser.id, message: newMessage.trim(), read: false };
    const { data, error } = await supabase.from('admin_messages').insert(msg).select().single();
    if (error) alert("Failed to send: " + error.message);
    else {
      setAllMessages(prev => [...prev, data]);
      setNewMessage("");
    }
  }

  async function openChat(user) {
    setSelectedUser(user);
    setTab("messages");
    await supabase.from('admin_messages').update({ read: true }).eq('sender_id', user.id).eq('receiver_id', ADMIN_UUID).eq('read', false);
    await loadData();
  }

  // 🚨 ANNOUNCEMENT FUNCTIONS
  async function saveGlobalAnnouncement() {
    await supabase.from('global_announcements').update({ message: announcementText, active: announcementActive }).eq('id', 1);
    alert("Global announcement updated!");
  }

  async function sendDirectAnnouncement(e) {
    e.preventDefault();
    if (!directUser || !directMsg.trim()) return alert("Select a user and type a message.");
    const msg = { sender_id: ADMIN_UUID, receiver_id: directUser, message: directMsg.trim(), read: false };
    const { error } = await supabase.from('admin_messages').insert(msg);
    if (error) alert("Failed to send: " + error.message);
    else {
      alert("Direct message sent!");
      setDirectMsg("");
      setDirectUser("");
      await loadData();
    }
  }

  if (loading) return <div className="min-h-screen bg-[#070D1A] text-white flex items-center justify-center">Loading...</div>;

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#070D1A] flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D1526] p-8 text-center">
          <LockIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter Password" autoFocus className="w-full rounded-xl bg-slate-950 px-4 py-3 text-white outline-none mb-4" />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-amber-600 py-3 font-bold text-black">Login</button>
        </form>
      </div>
    );
  }

  const getUserDetails = (userId) => {
    if (ADMIN_UUIDS.includes(userId)) return { id: userId, name: "Support Admin", email: "admin@primevest.com" };
    const foundUser = users.find((profile) => profile.id === userId);
    if (foundUser) {
      const username = foundUser.username ? String(foundUser.username).replace(/^@/, "") : "";
      return { id: userId, name: username ? `@${username}` : foundUser.name || foundUser.email || "Unnamed User", email: foundUser.email || "Email unavailable" };
    }
    return { id: userId, name: "User", email: "Profile loading..." };
  };

  const currentChatMessages = allMessages.filter(
    (m) => (m.sender_id === ADMIN_UUID && m.receiver_id === selectedUser?.id) || (m.sender_id === selectedUser?.id && m.receiver_id === ADMIN_UUID)
  );

  const userToUserMessages = allMessages.filter((m) => !ADMIN_UUIDS.includes(m.sender_id) && !ADMIN_UUIDS.includes(m.receiver_id));
  const uniqueConversations = {};
  userToUserMessages.forEach((m) => {
    const [user1Id, user2Id] = [m.sender_id, m.receiver_id].sort();
    const pair = `${user1Id}_${user2Id}`;
    if (!uniqueConversations[pair]) uniqueConversations[pair] = { user1Id, user2Id, user1: getUserDetails(user1Id), user2: getUserDetails(user2Id), messages: [] };
    uniqueConversations[pair].messages.push(m);
  });
  const userToUserConversations = Object.values(uniqueConversations);

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white font-sans">
      <aside className="w-64 bg-[#0D1526] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-amber-500">PrimeVest Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "dashboard" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Wallet size={18} /> Dashboard</button>
          <button onClick={() => setTab("users")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "users" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Users size={18} /> Manage Users</button>
          <button onClick={() => setTab("announcements")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "announcements" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Megaphone size={18} /> Announcements</button>
          <button onClick={() => setTab("messages")} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "messages" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}>
            <div className="flex items-center gap-3"><MessageSquare size={18} /> Admin Inbox</div>
            {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
          </button>
          <button onClick={() => setTab("user_chats")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "user_chats" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Users size={18} /> User-to-User</button>
          <button onClick={() => setTab("vault")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "vault" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><LockIcon size={18} /> Security Vault</button>
        </nav>
        <div className="p-4 border-t border-white/5"><a href="/home" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white"><ArrowLeft size={18} /> Back to App</a></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden p-4 bg-[#0D1526] border-b border-white/5 flex justify-between items-center">
          <h1 className="font-bold text-amber-500">Admin Panel</h1>
          <select onChange={(e) => setTab(e.target.value)} value={tab} className="bg-slate-900 text-white text-sm rounded-lg px-2 py-1 outline-none">
            <option value="dashboard">Dashboard</option>
            <option value="users">Users</option>
            <option value="announcements">Announcements</option>
            <option value="messages">Inbox ({unreadCount})</option>
            <option value="user_chats">User Chats</option>
            <option value="vault">Vault</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {error && <div className="max-w-5xl mx-auto mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          {dataLoading && <p className="text-center text-xs text-slate-500 mb-4">Refreshing...</p>}

          {tab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-3xl border border-blue-500/20 bg-[#0D1526] p-6"><p className="text-sm font-semibold text-slate-400 mb-2">Users</p><p className="text-4xl font-bold">{stats.usersCount}</p></div>
                <div className="rounded-3xl border border-emerald-500/20 bg-[#0D1526] p-6"><p className="text-sm font-semibold text-slate-400 mb-2">Withdrawn</p><p className="text-4xl font-bold text-emerald-400">₦{Number(stats.totalWithdrawn).toLocaleString()}</p></div>
                <div className="rounded-3xl border border-amber-500/20 bg-[#0D1526] p-6"><p className="text-sm font-semibold text-slate-400 mb-2">Pending</p><p className="text-4xl font-bold text-amber-400">₦{Number(stats.pendingWithdrawals).toLocaleString()}</p></div>
              </div>
            </div>
          )}

          {/* 🚨 NEW ANNOUNCEMENTS TAB */}
          {tab === "announcements" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Megaphone /> Announcements & Direct Messages</h2>
              
              {/* Global Announcement */}
              <div className="rounded-2xl border border-amber-500/30 bg-[#0D1526] p-6 space-y-4 shadow-lg shadow-amber-500/5">
                <h3 className="text-lg font-bold text-amber-400">Global Announcement (All Users)</h3>
                <p className="text-sm text-slate-400">This message will appear in a gold banner at the top of every user's dashboard until you turn it off.</p>
                <textarea 
                  value={announcementText} 
                  onChange={(e) => setAnnouncementText(e.target.value)} 
                  placeholder="Type your global message here..." 
                  className="w-full h-32 bg-slate-950 p-4 rounded-xl text-white outline-none border border-white/10 focus:border-amber-500"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                    <input type="checkbox" checked={announcementActive} onChange={(e) => setAnnouncementActive(e.target.checked)} className="w-5 h-5 accent-amber-500" /> 
                    Activate Banner (Visible to all)
                  </label>
                  <button onClick={saveGlobalAnnouncement} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-xl font-bold text-black">Publish Banner</button>
                </div>
              </div>

              {/* Direct Message */}
              <div className="rounded-2xl border border-blue-500/30 bg-[#0D1526] p-6 space-y-4 shadow-lg shadow-blue-500/5">
                <h3 className="text-lg font-bold text-blue-400">Direct Message (Specific User)</h3>
                <p className="text-sm text-slate-400">Send a private message directly to a user's Admin Inbox.</p>
                <form onSubmit={sendDirectAnnouncement} className="flex flex-col gap-4">
                  <select 
                    value={directUser} 
                    onChange={(e) => setDirectUser(e.target.value)} 
                    className="w-full bg-slate-950 p-4 rounded-xl text-white outline-none border border-white/10 focus:border-blue-500"
                  >
                    <option value="">-- Select a user --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username ? `@${u.username}` : u.name || u.email} ({u.email})</option>
                    ))}
                  </select>
                  <textarea 
                    value={directMsg} 
                    onChange={(e) => setDirectMsg(e.target.value)} 
                    placeholder="Type your direct message here..." 
                    className="w-full h-24 bg-slate-950 p-4 rounded-xl text-white outline-none border border-white/10 focus:border-blue-500"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2">
                    <Send size={18} /> Send Direct Message
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === "users" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">Manage Users</h2>
              <div className="space-y-4">
                {users.map((u) => (
                  <div key={u.id} className="rounded-2xl border border-white/5 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-lg">{u.username ? `@${u.username}` : u.name || "Unnamed"}</p>
                      <p className="text-sm text-slate-400">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openChat(u)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-500"><MessageSquare size={16} /> Message</button>
                      <button onClick={() => freeze(u)} className={`rounded-xl px-6 py-2 text-sm font-bold ${u.account_status === "frozen" ? "bg-emerald-600" : "bg-red-600"}`}>{u.account_status === "frozen" ? "Unfreeze" : "Freeze"}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "messages" && (
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[75vh]">
              <div className="w-full md:w-1/3 border border-white/10 rounded-2xl bg-[#0D1526] overflow-y-auto">
                <div className="p-4 border-b border-white/10 font-bold text-lg bg-[#0D1526] sticky top-0 flex justify-between items-center">
                  Users <button onClick={loadData} className="text-xs bg-slate-800 p-2 rounded-lg hover:bg-slate-700"><RefreshCw size={14} /></button>
                </div>
                {users.map((u) => (
                  <button key={u.id} onClick={() => openChat(u)} className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 flex justify-between items-center ${selectedUser?.id === u.id ? 'bg-white/10' : ''}`}>
                    <div>
                      <p className="font-bold">@{u.username || u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="w-full md:w-2/3 border border-white/10 rounded-2xl bg-[#070D1A] flex flex-col">
                {selectedUser ? (
                  <>
                    <div className="p-4 border-b border-white/10 bg-[#0D1526] rounded-t-2xl flex justify-between">
                      <h2 className="font-bold text-lg text-amber-400">@{selectedUser.username || selectedUser.name}</h2>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                      {currentChatMessages.map((m, i) => (
                        <div key={i} className={`max-w-[70%] p-3 rounded-xl ${m.sender_id === ADMIN_UUID ? 'bg-blue-600 self-end rounded-tr-sm' : 'bg-slate-800 self-start rounded-tl-sm'}`}>{m.message}</div>
                      ))}
                      {currentChatMessages.length === 0 && <p className="text-center text-slate-500 text-sm my-auto">No messages yet.</p>}
                    </div>
                    <form onSubmit={sendAdminMessage} className="p-4 border-t border-white/10 bg-[#0D1526] rounded-b-2xl flex gap-2">
                      <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type your reply..." className="flex-1 bg-[#070D1A] p-3 rounded-xl outline-none text-white border border-white/10" />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-6 rounded-xl font-bold flex items-center gap-2"><Send size={18} /> Send</button>
                    </form>
                  </>
                ) : <div className="flex-1 flex items-center justify-center text-slate-500">Select a user</div>}
              </div>
            </div>
          )}

          {tab === "user_chats" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">User-to-User Chats</h2>
                <button onClick={loadData} className="rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700 flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
              </div>
              {userToUserConversations.length === 0 ? (
                <p className="text-slate-400">No user-to-user chats found.</p>
              ) : (
                userToUserConversations.map((conv) => (
                  <div key={`${conv.user1Id}_${conv.user2Id}`} className="rounded-2xl border border-white/10 bg-[#0D1526] overflow-hidden">
                    <div className="bg-white/5 p-4 flex justify-between items-center border-b border-white/10">
                      <h3 className="font-bold text-lg text-amber-400">{conv.user1.name} ↔ {conv.user2.name}</h3>
                    </div>
                    <div className="p-4 max-h-72 overflow-y-auto space-y-3 bg-[#070D1A]">
                      {conv.messages.map((m) => {
                        const isUser1 = m.sender_id === conv.user1Id;
                        return (
                          <div key={m.id} className={`flex ${isUser1 ? "justify-start" : "justify-end"}`}>
                            <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${isUser1 ? "bg-slate-800 text-slate-200 rounded-tl-sm" : "bg-blue-600 text-white rounded-tr-sm"}`}>
                              <p>{m.message}</p>
                              <p className="text-[10px] opacity-60 mt-1">{isUser1 ? conv.user1.name : conv.user2.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}