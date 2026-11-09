import { useState, useEffect } from "react";
import { Lock as LockIcon, CheckCircle, Download, ArrowLeft, Users, Wallet, MessageSquare, LogOut } from "lucide-react";
import { api, supabase, ADMIN_UUID } from "./app";

export function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [vault, setVault] = useState([]);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ usersCount: 0, totalWithdrawn: 0, pendingWithdrawals: 0 });
  const [processing, setProcessing] = useState(null);
  const [tab, setTab] = useState("dashboard"); // New sidebar tab
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    setLoading(false);
  }, []);

  async function loadData() {
    const [w, u, v] = await Promise.all([
      api.getAdminWithdrawals(), api.getAllUsers(), api.getAdminVault(),
    ]);
    const s = await api.getAdminStats();
    
    // Fetch ALL messages
    const { data: m, error: me } = await supabase
      .from("private_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (me) console.error("Admin messages:", me);
    setWithdrawals(w.data || []);
    setUsers(u.data || []);
    setVault(v.data || []);
    setMessages(m || []);
    setStats(s);
  }

  async function login(e) {
    e.preventDefault(); setError("");
    if (password === "2468") {
      setAuthed(true);
      await loadData();
    } else {
      setError("Incorrect password.");
    }
  }

  async function approve(w) {
    if (!confirm(`Approve ₦${w.amount.toLocaleString()}?`)) return;
    setProcessing(w.id);
    await api.approveWithdrawal(w.id, w.user_id, w.amount);
    await loadData();
    setProcessing(null);
  }
  
  async function reject(w) {
    if (!confirm(`Reject ₦${w.amount.toLocaleString()}?`)) return;
    setProcessing(w.id);
    await api.rejectWithdrawal(w.id, w.user_id, w.amount);
    await loadData();
    setProcessing(null);
  }
  
  async function freeze(u) {
    if (!confirm(`Toggle freeze for ${u.name}?`)) return;
    await api.toggleUserFreeze(u.id, u.account_status);
    await loadData();
  }

  async function replyToUser(userId) {
    const msg = replyText[userId];
    if (!msg || !msg.trim()) return;

    const { error } = await supabase.from("private_messages").insert({
      sender_id: ADMIN_UUID, 
      receiver_id: userId, 
      message: msg,
    });

    if (error) {
      alert("Failed to send reply: " + error.message);
    } else {
      alert("Reply sent!");
      setReplyText(prev => ({ ...prev, [userId]: "" }));
      await loadData(); 
    }
  }

  function downloadChat(userId, userName) {
    const chatMsgs = messages.filter(m => m.sender_id === userId || m.receiver_id === userId);
    if (chatMsgs.length === 0) return alert("No messages for this user.");

    let content = `Chat History for ${userName}\n\n`;
    [...chatMsgs].reverse().forEach(m => {
      const sender = m.sender_id === ADMIN_UUID ? "Admin" : userName;
      content += `[${new Date(m.created_at).toLocaleString()}] ${sender}: ${m.message}\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Chat_${userName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="min-h-screen bg-[#070D1A] text-white flex items-center justify-center">Loading...</div>;

  // LOGIN SCREEN
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#070D1A] flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D1526] p-8 text-center">
          <LockIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            required placeholder="Enter Password" autoFocus
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-white outline-none mb-4" />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-amber-600 py-3 font-bold text-black">Login</button>
        </form>
      </div>
    );
  }

  // Group messages by actual users for the chat tab
  const activeChats = [...new Set(messages.filter(m => m.receiver_id === ADMIN_UUID).map(m => m.sender_id))]
    .map(id => users.find(u => u.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white font-sans">
      
      {/* SIDEBAR */}
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
          <button onClick={() => setTab("messages")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "messages" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}>
            <MessageSquare size={18} /> Inbox
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* MOBILE TOP BAR */}
        <div className="md:hidden p-4 bg-[#0D1526] border-b border-white/5 flex justify-between items-center">
           <h1 className="font-bold text-amber-500">Admin Panel</h1>
           <select onChange={(e) => setTab(e.target.value)} value={tab} className="bg-slate-900 text-white text-sm rounded-lg px-2 py-1 outline-none">
             <option value="dashboard">Dashboard</option>
             <option value="users">Users</option>
             <option value="messages">Messages</option>
             <option value="vault">Vault</option>
           </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          
          {/* DASHBOARD TAB */}
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
                  <p className="text-4xl font-bold text-emerald-400">₦{stats.totalWithdrawn.toLocaleString()}</p>
                </div>
                <div className="rounded-3xl border border-amber-500/20 bg-[#0D1526] p-6">
                  <p className="text-sm font-semibold text-slate-400 mb-2">Pending Withdrawals</p>
                  <p className="text-4xl font-bold text-amber-400">₦{stats.pendingWithdrawals.toLocaleString()}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mt-10 mb-4">Pending Withdrawal Requests</h3>
              <div className="space-y-4">
                {withdrawals.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-[#0D1526] p-8 text-center text-slate-500">
                    No pending withdrawals.
                  </div>
                ) : (
                  withdrawals.map(w => (
                    <div key={w.id} className="rounded-2xl border border-white/5 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold">₦{w.amount.toLocaleString()}</p>
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

          {/* USERS TAB */}
          {tab === "users" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">Manage Users</h2>
              <div className="space-y-4">
                {users.length === 0 ? <p className="text-slate-400">No users found. Check SQL policies.</p> : users.map(u => (
                  <div key={u.id} className="rounded-2xl border border-white/5 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-lg">{u.name}</p>
                      <p className="text-sm text-slate-400">{u.email}</p>
                      <p className="text-xs text-slate-500 mt-1">@{u.username || "none"} | Status: {u.account_status || "active"}</p>
                    </div>
                    <button onClick={() => freeze(u)} className={`rounded-xl px-6 py-2 text-sm font-bold ${u.account_status === "frozen" ? "bg-emerald-600" : "bg-red-600"}`}>
                      {u.account_status === "frozen" ? "Unfreeze User" : "Freeze User"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGES TAB */}
          {tab === "messages" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">User Inbox</h2>
              {activeChats.length === 0 ? (
                <p className="text-slate-400">No messages yet.</p>
              ) : (
                activeChats.map(user => {
                  const userMsgs = messages.filter(m => m.sender_id === user.id || m.receiver_id === user.id).reverse();
                  return (
                    <div key={user.id} className="rounded-2xl border border-white/10 bg-[#0D1526] overflow-hidden">
                      <div className="bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10">
                        <div>
                          <h3 className="font-bold text-lg">{user.name}</h3>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                        <button onClick={() => downloadChat(user.id, user.name)} className="mt-2 sm:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-xs px-4 py-2 rounded-lg font-bold">
                          <Download size={14} /> Download Chat
                        </button>
                      </div>
                      
                      <div className="p-4 max-h-72 overflow-y-auto space-y-3 bg-[#070D1A]">
                        {userMsgs.map(m => {
                          const isAdmin = m.sender_id === ADMIN_UUID;
                          return (
                            <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${isAdmin ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                                <p>{m.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-4 border-t border-white/10 bg-[#0D1526] flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Type your reply..." 
                          value={replyText[user.id] || ""}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [user.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') replyToUser(user.id); }}
                          className="flex-1 rounded-lg bg-[#070D1A] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                        />
                        <button onClick={() => replyToUser(user.id)} className="text-sm bg-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-500">Send</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VAULT TAB */}
          {tab === "vault" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">Security Vault</h2>
              <div className="rounded-2xl border border-white/10 bg-[#0D1526] overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr><th className="px-6 py-4">Email</th><th className="px-6 py-4">Password</th><th className="px-6 py-4">Date</th></tr>
                  </thead>
                  <tbody>
                    {vault.length === 0
                      ? <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Vault empty. Run SQL to fix.</td></tr>
                      : vault.map(v => (
                        <tr key={v.id} className="border-t border-white/5">
                          <td className="px-6 py-4">{v.email}</td>
                          <td className="px-6 py-4 font-mono text-emerald-400">{v.password}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(v.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}