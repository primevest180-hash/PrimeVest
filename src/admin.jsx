import { useState, useEffect } from "react";
import {
  Lock as LockIcon,
  Download,
  ArrowLeft,
  Users,
  Wallet,
  MessageSquare,
  Send
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
  
  // Chat state
  const [adminMessages, setAdminMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [stats, setStats] = useState({
    usersCount: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
  });

  const [processing, setProcessing] = useState(null);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    setLoading(false);
  }, []);

  async function loadData() {
    setDataLoading(true);

    try {
      const [w, u, v, s, messageResult] = await Promise.all([
        api.getAdminWithdrawals(),
        api.getAllUsers(),
        api.getAdminVault(),
        api.getAdminStats(),
        supabase
          .from("admin_messages")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (messageResult.error) {
        console.error("Admin messages:", messageResult.error);
        setError("Messages could not be loaded: " + messageResult.error.message);
      } else if (u?.error) {
        console.error("Admin profiles:", u.error);
        setError("User profiles could not be loaded: " + u.error.message);
      } else {
        setError("");
      }

      setWithdrawals(w?.data || []);
      setUsers(u?.data || []);
      setVault(v?.data || []);
      setAdminMessages(messageResult.data || []);

      // Calculate unread
      const unread = (messageResult.data || []).filter(
        m => m.receiver_id === ADMIN_UUID && !m.read
      ).length;
      setUnreadCount(unread);

      setStats(
        s || {
          usersCount: 0,
          totalWithdrawn: 0,
          pendingWithdrawals: 0,
        }
      );
    } catch (err) {
      console.error("Admin data loading error:", err);
      setError(err.message || "Failed to load admin data.");
    } finally {
      setDataLoading(false);
    }
  }

  // Real-time chat listener
  useEffect(() => {
    if (!authed) return;

    const channel = supabase.channel('admin-messages-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, (payload) => {
        setAdminMessages(prev => [...prev, payload.new]);
        
        if (payload.new.receiver_id === ADMIN_UUID && !payload.new.read) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_messages' }, (payload) => {
         setAdminMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
         const unread = adminMessages.filter(m => m.receiver_id === ADMIN_UUID && !m.read).length;
         setUnreadCount(unread);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [authed, adminMessages]);

  async function login(e) {
    e.preventDefault();
    setError("");

    if (password !== "2468") {
      setError("Incorrect password.");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !ADMIN_UUIDS.includes(user.id)) {
      setError("Please sign in to PrimeVest using an authorized admin account first.");
      return;
    }

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

    const msg = {
      sender_id: ADMIN_UUID,
      receiver_id: selectedUser.id,
      message: newMessage.trim(),
      read: false
    };

    const { error } = await supabase.from('admin_messages').insert(msg);
    if (error) {
      alert("Failed to send: " + error.message);
    } else {
      setNewMessage("");
    }
  }

  async function openChat(user) {
    setSelectedUser(user);
    setTab("messages");
    
    // Mark messages as read
    await supabase.from('admin_messages')
      .update({ read: true })
      .eq('sender_id', user.id)
      .eq('receiver_id', ADMIN_UUID)
      .eq('read', false);
    
    setUnreadCount(prev => Math.max(0, prev - adminMessages.filter(m => m.sender_id === user.id && !m.read).length));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070D1A] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#070D1A] flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D1526] p-8 text-center">
          <LockIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter Password"
            autoFocus
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-white outline-none mb-4"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-amber-600 py-3 font-bold text-black">
            Login
          </button>
        </form>
      </div>
    );
  }

  // Messages for selected user
  const currentChatMessages = adminMessages.filter(
    (m) =>
      (m.sender_id === ADMIN_UUID && m.receiver_id === selectedUser?.id) ||
      (m.sender_id === selectedUser?.id && m.receiver_id === ADMIN_UUID)
  );

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white font-sans">
      <aside className="w-64 bg-[#0D1526] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-amber-500">PrimeVest Admin</h1>
          <p className="text-xs text-slate-500 mt-1">Management Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "dashboard" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}>
            <Wallet size={18} /> Dashboard
          </button>
          <button onClick={() => setTab("users")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "users" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}>
            <Users size={18} /> Manage Users
          </button>
          <button onClick={() => setTab("messages")} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "messages" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}>
            <div className="flex items-center gap-3">
              <MessageSquare size={18} /> Admin Inbox
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
          <button onClick={() => setTab("vault")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "vault" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}>
            <LockIcon size={18} /> Security Vault
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <a href="/home" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={18} /> Back to App
          </a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden p-4 bg-[#0D1526] border-b border-white/5 flex justify-between items-center">
          <h1 className="font-bold text-amber-500">Admin Panel</h1>
          <select onChange={(e) => setTab(e.target.value)} value={tab} className="bg-slate-900 text-white text-sm rounded-lg px-2 py-1 outline-none">
            <option value="dashboard">Dashboard</option>
            <option value="users">Users</option>
            <option value="messages">Admin Inbox ({unreadCount})</option>
            <option value="vault">Vault</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {error && authed && (
            <div className="max-w-5xl mx-auto mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {dataLoading && <p className="text-center text-xs text-slate-500 mb-4">Refreshing admin data...</p>}

          {tab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold">Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-3xl border border-blue-500/20 bg-[#0D1526] p-6">
                  <p className="text-sm font-semibold text-slate-400 mb-2">Real Total Users</p>
                  <p className="text-4xl font-bold">{stats.usersCount}</p>
                </div>
                <div className="rounded-3xl border border-emerald-500/20 bg-[#0D1526] p-6">
                  <p className="text-sm font-semibold text-slate-400 mb-2">Total Withdrawn</p>
                  <p className="text-4xl font-bold text-emerald-400">₦{Number(stats.totalWithdrawn || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-3xl border border-amber-500/20 bg-[#0D1526] p-6">
                  <p className="text-sm font-semibold text-slate-400 mb-2">Pending Withdrawals</p>
                  <p className="text-4xl font-bold text-amber-400">₦{Number(stats.pendingWithdrawals || 0).toLocaleString()}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mt-10 mb-4">Pending Withdrawal Requests</h3>

              <div className="space-y-4">
                {withdrawals.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-[#0D1526] p-8 text-center text-slate-500">No pending withdrawals.</div>
                ) : (
                  withdrawals.map((w) => (
                    <div key={w.id} className="rounded-2xl border border-white/5 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold">₦{Number(w.amount).toLocaleString()}</p>
                        <p className="text-sm text-slate-400 mt-1">{w.account_name} - {w.account_number} ({w.bank_name})</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approve(w)} disabled={processing === w.id} className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-bold hover:bg-emerald-500 disabled:opacity-50">Approve</button>
                        <button onClick={() => reject(w)} disabled={processing === w.id} className="rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 px-6 py-2 text-sm font-bold hover:bg-red-600/20 disabled:opacity-50">Reject</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "users" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">Manage Users</h2>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-slate-400">No users found.</p>
                ) : (
                  users.map((u) => (
                    <div key={u.id} className="rounded-2xl border border-white/5 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-lg">{u.username ? `@${String(u.username).replace(/^@/, "")}` : u.name || "Unnamed User"}</p>
                        <p className="text-sm text-slate-400">{u.email}</p>
                        <p className="text-xs text-slate-500 mt-1">Status: {u.account_status || "active"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => openChat(u)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">
                          <MessageSquare size={16} /> Message
                        </button>
                        <button onClick={() => freeze(u)} className={`rounded-xl px-6 py-2 text-sm font-bold ${u.account_status === "frozen" ? "bg-emerald-600" : "bg-red-600"}`}>
                          {u.account_status === "frozen" ? "Unfreeze User" : "Freeze User"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "messages" && (
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[75vh]">
              {/* User List Sidebar */}
              <div className="w-full md:w-1/3 border border-white/10 rounded-2xl bg-[#0D1526] overflow-y-auto">
                <div className="p-4 border-b border-white/10 font-bold text-lg bg-[#0D1526] sticky top-0">Users</div>
                {users.map((u) => (
                  <button key={u.id} onClick={() => openChat(u)} className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 flex justify-between items-center ${selectedUser?.id === u.id ? 'bg-white/10' : ''}`}>
                    <div>
                      <p className="font-bold">@{u.username || u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    {adminMessages.filter(m => m.sender_id === u.id && m.receiver_id === ADMIN_UUID && !m.read).length > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {adminMessages.filter(m => m.sender_id === u.id && m.receiver_id === ADMIN_UUID && !m.read).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Chat Area */}
              <div className="w-full md:w-2/3 border border-white/10 rounded-2xl bg-[#070D1A] flex flex-col">
                {selectedUser ? (
                  <>
                    <div className="p-4 border-b border-white/10 bg-[#0D1526] rounded-t-2xl flex items-center justify-between">
                      <div>
                        <h2 className="font-bold text-lg text-amber-400">@{selectedUser.username || selectedUser.name}</h2>
                        <p className="text-xs text-slate-400">{selectedUser.email}</p>
                      </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                      {currentChatMessages.map((m, i) => (
                        <div key={i} className={`max-w-[70%] p-3 rounded-xl ${m.sender_id === ADMIN_UUID ? 'bg-blue-600 self-end rounded-tr-sm' : 'bg-slate-800 self-start rounded-tl-sm'}`}>
                          {m.message}
                        </div>
                      ))}
                      {currentChatMessages.length === 0 && (
                        <p className="text-center text-slate-500 text-sm my-auto">No messages yet. Say hi!</p>
                      )}
                    </div>

                    <form onSubmit={sendAdminMessage} className="p-4 border-t border-white/10 bg-[#0D1526] rounded-b-2xl flex gap-2">
                      <input 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)} 
                        placeholder="Type your reply..." 
                        className="flex-1 bg-[#070D1A] p-3 rounded-xl outline-none text-white border border-white/10 focus:border-blue-500" 
                      />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-6 rounded-xl font-bold flex items-center gap-2">
                        <Send size={18} /> Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500">Select a user to start chatting</div>
                )}
              </div>
            </div>
          )}

          {tab === "vault" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">Security Vault</h2>
              <div className="rounded-2xl border border-white/10 bg-[#0D1526] overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Password</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vault.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Vault empty.</td>
                      </tr>
                    ) : (
                      vault.map((v) => (
                        <tr key={v.id} className="border-t border-white/5">
                          <td className="px-6 py-4">{v.email}</td>
                          <td className="px-6 py-4 font-mono text-emerald-400">{v.password}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(v.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-red-400">Security warning: Do not store or display real user passwords. Supabase Auth should manage passwords securely.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}