import { useState, useEffect } from "react";
import { Lock as LockIcon, CheckCircle, Download, ArrowLeft } from "lucide-react";
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
  const [tab, setTab] = useState("withdrawals");
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    setLoading(false);
  }, []);

  async function loadData() {
    const [w, u, v] = await Promise.all([
      api.getAdminWithdrawals(), api.getAllUsers(), api.getAdminVault(),
    ]);
    const s = await api.getAdminStats();
    
    // Get ALL messages
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
      await loadData(); // This will refresh the admin's view instantly
    }
  }

  function downloadChat(userId, userName) {
    const chatMsgs = messages.filter(m => m.sender_id === userId || m.receiver_id === userId);
    if (chatMsgs.length === 0) return alert("No messages for this user.");

    let content = `Chat History for ${userName} (${userId})\n\n`;
    [...chatMsgs].reverse().forEach(m => {
      const sender = m.sender_id === ADMIN_UUID ? "Admin" : userName;
      const date = new Date(m.created_at).toLocaleString();
      content += `[${date}] ${sender}: ${m.message}\n`;
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

  // Group messages by actual users
  const activeChats = [...new Set(messages.filter(m => m.receiver_id === ADMIN_UUID).map(m => m.sender_id))]
    .map(id => users.find(u => u.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">Admin Panel</h1>
            <p className="text-slate-400">Manage platform and users</p>
          </div>
          <a href="/home" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 flex items-center gap-2">
            <ArrowLeft size={16} /> Back to App
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-blue-500/20 bg-[#0D1526] p-5">
            <p className="text-slate-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold mt-2">{stats.usersCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#0D1526] p-5">
            <p className="text-slate-400 text-sm">Total Withdrawn</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">₦{stats.totalWithdrawn.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-[#0D1526] p-5">
            <p className="text-slate-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-amber-400 mt-2">₦{stats.pendingWithdrawals.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-4 border-b border-white/10 mb-6 overflow-x-auto">
          {["withdrawals", "users", "vault", "messages"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2 text-sm font-semibold capitalize whitespace-nowrap ${tab === t ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "withdrawals" && (
          <div className="space-y-4">
            {withdrawals.length === 0
              ? <div className="rounded-2xl border border-white/10 bg-[#0D1526] p-10 text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold">All caught up</h2>
                </div>
              : withdrawals.map(w => (
                <div key={w.id} className="rounded-2xl border border-white/10 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-amber-400 mb-1">PENDING — {new Date(w.created_at).toLocaleString()}</p>
                    <p className="text-lg font-bold">₦{w.amount.toLocaleString()}</p>
                    <p className="text-sm text-slate-300">{w.account_name} - {w.account_number} ({w.bank_name})</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approve(w)} disabled={processing === w.id}
                      className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-sm">Approve</button>
                    <button onClick={() => reject(w)} disabled={processing === w.id}
                      className="rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 px-6 py-3 font-semibold text-sm">Reject</button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-4">
            {users.length === 0
              ? <p className="text-slate-400">No users found. Check RLS on profiles (SELECT true required).</p>
              : users.map(u => (
                <div key={u.id} className="rounded-2xl border border-white/10 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold">{u.name}</p>
                    <p className="text-sm text-slate-400">{u.email}</p>
                    <p className="text-xs text-slate-500 mt-1">@{u.username || "none"} | {u.account_status || "active"}</p>
                  </div>
                  <button onClick={() => freeze(u)}
                    className={`rounded-xl px-6 py-3 font-semibold text-sm ${u.account_status === "frozen" ? "bg-emerald-600" : "bg-red-600"}`}>
                    {u.account_status === "frozen" ? "Unfreeze" : "Freeze"}
                  </button>
                </div>
              ))}
          </div>
        )}

        {tab === "vault" && (
          <div className="rounded-2xl border border-white/10 bg-[#0D1526] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Password</th><th className="px-4 py-3">Date</th></tr>
              </thead>
              <tbody>
                {vault.length === 0
                  ? <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Vault empty or RLS blocking.</td></tr>
                  : vault.map(v => (
                    <tr key={v.id} className="border-t border-white/5">
                      <td className="px-4 py-3">{v.email}</td>
                      <td className="px-4 py-3 text-emerald-400">{v.password}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(v.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-4">
            {activeChats.length === 0 ? (
              <p className="text-slate-400 text-sm">No active chats with Admin.</p>
            ) : (
              activeChats.map(user => {
                const userMsgs = messages
                  .filter(m => m.sender_id === user.id || m.receiver_id === user.id)
                  .reverse(); 

                return (
                  <div key={user.id} className="rounded-2xl border border-white/10 bg-[#0D1526] overflow-hidden">
                    <div className="bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10">
                      <div>
                        <h3 className="font-bold text-amber-400">{user.name}</h3>
                        <p className="text-xs text-slate-400">@{user.username || user.email}</p>
                      </div>
                      <button 
                        onClick={() => downloadChat(user.id, user.name)}
                        className="mt-2 sm:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-xs px-3 py-2 rounded-lg font-bold"
                      >
                        <Download size={14} /> Download TXT
                      </button>
                    </div>
                    
                    <div className="p-4 max-h-64 overflow-y-auto space-y-3 bg-[#0D1526]">
                      {userMsgs.map(m => {
                        const isAdmin = m.sender_id === ADMIN_UUID;
                        return (
                          <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${isAdmin ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                              <p>{m.message}</p>
                              <p className="text-[10px] opacity-60 mt-1 text-right">{new Date(m.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-slate-950 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type your reply..." 
                        value={replyText[user.id] || ""}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [user.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') replyToUser(user.id); }}
                        className="flex-1 rounded-lg bg-[#0D1526] border border-white/10 px-3 py-2 text-sm text-white outline-none"
                      />
                      <button 
                        onClick={() => replyToUser(user.id)} 
                        className="text-sm bg-blue-600 px-4 py-2 rounded-lg font-bold"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}