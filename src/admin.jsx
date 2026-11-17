import { useState, useEffect } from "react";
import {
  Lock as LockIcon, ArrowLeft, Users, Wallet, MessageSquare, Send, RefreshCw, Megaphone, UserPlus, X
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
  const [affiliateSubmissions, setAffiliateSubmissions] = useState([]);
  const [pendingStakes, setPendingStakes] = useState([]);
  
  // Chat states
  const [allMessages, setAllMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  
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
      const [w, u, s, adminMsg, privateMsg, announcementResult, affiliateResult, stakeResult] = await Promise.all([
        api.getAdminWithdrawals(),
        api.getAllUsers(),
        api.getAdminStats(),
        supabase.from("admin_messages").select("*").order("created_at", { ascending: true }),
        supabase.from("private_messages").select("*").order("created_at", { ascending: true }),
        supabase.from("global_announcements").select("*").eq("id", 1).single(),
        api.getAdminAffiliateSubmissions(),
        api.getAdminPendingStakes()
      ]);

      setWithdrawals(w?.data || []);
      setUsers(u?.data || []);
      if (stakeResult?.error) throw new Error(stakeResult.error);
      setPendingStakes(stakeResult?.data || []);
      setAllMessages(adminMsg.data || []);
      setPrivateMessages(privateMsg.data || []);

      if (affiliateResult?.error) throw affiliateResult.error;
      const affiliateRows = affiliateResult?.data || [];
      const enrichedAffiliateRows = await Promise.all(affiliateRows.map(async (item) => {
        const [{ data: profile }, { data: signed }] = await Promise.all([
          supabase.from("profiles").select("name,email,username").eq("id", item.user_id).maybeSingle(),
          supabase.storage.from("affiliate-proofs").createSignedUrl(item.proof_path, 300),
        ]);
        return { ...item, profile, proof_url: signed?.signedUrl || null };
      }));
      setAffiliateSubmissions(enrichedAffiliateRows);

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

  // 🚨 REALTIME LISTENERS
  useEffect(() => {
    if (!authed) return;

    const profileChannel = supabase.channel('admin-profiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        setUsers(prev => [payload.new, ...prev]);
        setStats(prev => ({ ...prev, usersCount: prev.usersCount + 1 }));
      }).subscribe();

    const adminMsgChannel = supabase.channel('admin-messages-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, (payload) => {
        setAllMessages(prev => [...prev, payload.new]);
      }).subscribe();

    const privateMsgChannel = supabase.channel('private-messages-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        setPrivateMessages(prev => [...prev, payload.new]);
      }).subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(adminMsgChannel);
      supabase.removeChannel(privateMsgChannel);
    };
  }, [authed]);

  async function login(e) {
    e.preventDefault();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return setError("Please sign in first.");
    const { data: adminProfile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!ADMIN_UUIDS.includes(user.id) && !adminProfile?.is_admin) return setError("Unauthorized admin.");
    setAuthed(true);
    await loadData();
  }

  async function reviewStake(item, decision) {
    const reason = decision === "rejected" ? (window.prompt("Reason for declining this stake:", "") || "") : "";
    if (!window.confirm(`${decision === "approved" ? "Approve" : "Decline"} this ₦${Number(item.amount).toLocaleString()} stake?`)) return;
    setProcessing(item.id);
    try {
      const result = await api.reviewStake(item.id, decision, reason);
      if (!result?.success) throw new Error(result?.error || "Stake review failed");
      alert(`Stake ${decision}.`);
      await loadData();
    } catch (err) { alert(`Stake review failed: ${err.message}`); }
    finally { setProcessing(null); }
  }

  async function reviewAffiliate(item, decision) {
    let reward = 0;
    let note = "";
    if (decision === "approved") {
      const entered = window.prompt("Enter the verified reward amount in NGN (enter 0 if no reward):", "0");
      if (entered === null) return;
      reward = Number(entered);
      if (!Number.isFinite(reward) || reward < 0) return alert("Enter a valid reward amount.");
    }
    note = window.prompt("Optional note for the user:", "") || "";
    if (!window.confirm(`${decision === "approved" ? "Approve" : "Reject"} this affiliate proof?`)) return;
    setProcessing(item.id);
    try {
      const result = await api.reviewAffiliateSubmission(item.id, decision, reward, note);
      if (!result.success) throw new Error(result.error || "Review failed.");
      alert(`Affiliate proof ${decision}.`);
      await loadData();
    } catch (err) { alert(`Review failed: ${err.message}`); }
    finally { setProcessing(null); }
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

  async function saveGlobalAnnouncement() {
    await supabase.from('global_announcements').update({ message: announcementText, active: announcementActive }).eq('id', 1);
    alert("Global announcement updated!");
  }

  async function clearGlobalAnnouncement() {
    setAnnouncementText("");
    setAnnouncementActive(false);
    await supabase.from('global_announcements').update({ message: "", active: false }).eq('id', 1);
    alert("Global announcement removed.");
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
          <p className="text-sm text-slate-400 mb-4">Administrator access is checked against your authenticated Supabase account.</p>
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

  // 🚨 WHATSAPP LOGIC: Group Admin Messages by User & Count Unread
  const adminChats = {};
  allMessages.forEach(m => {
    if (m.sender_id === ADMIN_UUID) {
      if (!adminChats[m.receiver_id]) adminChats[m.receiver_id] = { user: getUserDetails(m.receiver_id), unread: 0, lastMsg: m };
      adminChats[m.receiver_id].lastMsg = m;
    } else if (m.receiver_id === ADMIN_UUID) {
      if (!adminChats[m.sender_id]) adminChats[m.sender_id] = { user: getUserDetails(m.sender_id), unread: 0, lastMsg: m };
      adminChats[m.sender_id].lastMsg = m;
      if (!m.read) adminChats[m.sender_id].unread += 1;
    }
  });
  const adminChatList = Object.values(adminChats).sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at));

  // 🚨 WHATSAPP LOGIC: Group User-to-User Messages
  const userToUserMessages = privateMessages.filter((m) => !ADMIN_UUIDS.includes(m.sender_id) && !ADMIN_UUIDS.includes(m.receiver_id));
  const uniqueConversations = {};
  userToUserMessages.forEach((m) => {
    const [user1Id, user2Id] = [m.sender_id, m.receiver_id].sort();
    const pair = `${user1Id}_${user2Id}`;
    if (!uniqueConversations[pair]) uniqueConversations[pair] = { user1Id, user2Id, user1: getUserDetails(user1Id), user2: getUserDetails(user2Id), messages: [] };
    uniqueConversations[pair].messages.push(m);
  });
  const userToUserConversations = Object.values(uniqueConversations).sort((a, b) => new Date(b.messages[b.messages.length-1].created_at) - new Date(a.messages[a.messages.length-1].created_at));

  const currentChatMessages = allMessages.filter(
    (m) => (m.sender_id === ADMIN_UUID && m.receiver_id === selectedUser?.id) || (m.sender_id === selectedUser?.id && m.receiver_id === ADMIN_UUID)
  );

  const totalUnreadAdmin = adminChatList.reduce((sum, chat) => sum + chat.unread, 0);

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white font-sans">
      <aside className="w-64 bg-[#0D1526] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-amber-500">PrimeVest Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "dashboard" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Wallet size={18} /> Dashboard</button>
          <button onClick={() => setTab("users")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "users" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Users size={18} /> Manage Users</button>
          <button onClick={() => setTab("stakes")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "stakes" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Wallet size={18} /> Stake Requests ({pendingStakes.length})</button>
          <button onClick={() => setTab("affiliate")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "affiliate" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Wallet size={18} /> Affiliate Proofs ({affiliateSubmissions.length})</button>
          <button onClick={() => setTab("referrals")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "referrals" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><UserPlus size={18} /> Refer Clicks</button>
          <button onClick={() => setTab("announcements")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "announcements" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Megaphone size={18} /> Announcements</button>
          <button onClick={() => setTab("messages")} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "messages" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}>
            <div className="flex items-center gap-3"><MessageSquare size={18} /> Admin Inbox</div>
            {totalUnreadAdmin > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalUnreadAdmin}</span>}
          </button>
          <button onClick={() => setTab("user_chats")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "user_chats" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}><Users size={18} /> User-to-User</button>
        </nav>
        <div className="p-4 border-t border-white/5"><a href="/home" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white"><ArrowLeft size={18} /> Back to App</a></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden p-4 bg-[#0D1526] border-b border-white/5 flex justify-between items-center">
          <h1 className="font-bold text-amber-500">Admin Panel</h1>
          <select onChange={(e) => setTab(e.target.value)} value={tab} className="bg-slate-900 text-white text-sm rounded-lg px-2 py-1 outline-none">
            <option value="dashboard">Dashboard</option>
            <option value="users">Users</option>
            <option value="stakes">Stake Requests ({pendingStakes.length})</option>
            <option value="affiliate">Affiliate Proofs ({affiliateSubmissions.length})</option>
            <option value="referrals">Referrals</option>
            <option value="announcements">Announcements</option>
            <option value="messages">Inbox ({totalUnreadAdmin})</option>
            <option value="user_chats">User Chats</option>
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
              
              <h3 className="text-xl font-bold mt-10 mb-4">Pending Withdrawals</h3>
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

          {tab === "referrals" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">Refer Button Clicks</h2>
              <div className="space-y-4">
                {users.filter(u => u.last_refer_click).map((u) => (
                  <div key={u.id} className="rounded-2xl border border-white/5 bg-[#0D1526] p-5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg">{u.username ? `@${u.username}` : u.name || "Unnamed"}</p>
                      <p className="text-sm text-slate-400">{u.email}</p>
                    </div>
                    <p className="text-xs text-amber-400 font-bold">Clicked: {new Date(u.last_refer_click).toLocaleString()}</p>
                  </div>
                ))}
                {users.filter(u => u.last_refer_click).length === 0 && <p className="text-slate-400">No refer clicks yet.</p>}
              </div>
            </div>
          )}

          {tab === "stakes" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Pending Stake Requests</h2><button onClick={loadData} className="rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700 flex items-center gap-2"><RefreshCw size={14} /> Refresh</button></div>
              <p className="text-sm text-slate-400">Review requests before activation. Approval starts the maturity clock; rejection returns reserved funds to the user's available wallet.</p>
              {pendingStakes.length === 0 ? <div className="rounded-2xl border border-white/5 bg-[#0D1526] p-8 text-center text-slate-500">No pending stake requests.</div> : pendingStakes.map(item => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0D1526] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div><p className="font-bold">{item.plans?.name || "Staking plan"} — ₦{Number(item.amount).toLocaleString()}</p><p className="text-sm text-slate-400">{item.profile?.name || item.profile?.username || "User"} · {item.profile?.email || item.user_id}</p><p className="text-xs text-slate-500 mt-1">Submitted: {item.requested_at ? new Date(item.requested_at).toLocaleString() : "Pending approval"} · Duration: {item.duration_days || "Not set"} days · Expected return: {Number(item.expected_return_snapshot || 0)}%</p></div>
                  <div className="flex gap-2"><button onClick={() => reviewStake(item, "approved")} disabled={processing === item.id} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold disabled:opacity-50">Approve</button><button onClick={() => reviewStake(item, "rejected")} disabled={processing === item.id} className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2 text-sm font-bold text-red-300 disabled:opacity-50">Decline</button></div>
                </div>
              ))}
            </div>
          )}

          {tab === "affiliate" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">Affiliate Proof Review</h2>
                <button onClick={loadData} className="rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700 flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
              </div>
              <p className="text-sm text-slate-400">Review each uploaded image before approving or rejecting it. A reward is credited only by the database review function after approval.</p>
              {affiliateSubmissions.length === 0 ? <div className="rounded-2xl border border-white/5 bg-[#0D1526] p-8 text-center text-slate-500">No pending affiliate proofs.</div> : affiliateSubmissions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0D1526] p-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)]">
                  <div>
                    {item.proof_url ? <a href={item.proof_url} target="_blank" rel="noreferrer"><img src={item.proof_url} alt="Affiliate proof submitted by user" className="w-full max-h-80 rounded-xl object-contain bg-slate-950" /></a> : <div className="rounded-xl bg-slate-950 p-8 text-sm text-red-300">Image unavailable. Check storage access and the proof path.</div>}
                  </div>
                  <div className="space-y-3">
                    <div><p className="font-bold">{item.profile?.name || item.profile?.username || "User"}</p><p className="text-sm text-slate-400">{item.profile?.email || item.user_id}</p></div>
                    <p className="text-xs text-slate-500">Submitted: {new Date(item.created_at).toLocaleString()}</p>
                    <p className="text-sm">Status: <span className="font-bold text-amber-300">{item.status}</span></p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button onClick={() => reviewAffiliate(item, "approved")} disabled={processing === item.id} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold disabled:opacity-50">Approve & Set Reward</button>
                      <button onClick={() => reviewAffiliate(item, "rejected")} disabled={processing === item.id} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 disabled:opacity-50">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "announcements" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Megaphone /> Announcements</h2>
              
              <div className="rounded-2xl border border-amber-500/30 bg-[#0D1526] p-6 space-y-4 shadow-lg shadow-amber-500/5">
                <h3 className="text-lg font-bold text-amber-400">Global Announcement (All Users)</h3>
                <textarea value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Type your global message here..." className="w-full h-32 bg-slate-950 p-4 rounded-xl text-white outline-none border border-white/10 focus:border-amber-500" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                    <input type="checkbox" checked={announcementActive} onChange={(e) => setAnnouncementActive(e.target.checked)} className="w-5 h-5 accent-amber-500" /> 
                    Activate Banner
                  </label>
                  <div className="flex gap-2">
                    <button onClick={clearGlobalAnnouncement} className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl font-bold hover:bg-red-500/20">Remove</button>
                    <button onClick={saveGlobalAnnouncement} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-xl font-bold text-black">Publish</button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-500/30 bg-[#0D1526] p-6 space-y-4 shadow-lg shadow-blue-500/5">
                <h3 className="text-lg font-bold text-blue-400">Direct Message (Specific User)</h3>
                <form onSubmit={sendDirectAnnouncement} className="flex flex-col gap-4">
                  <select value={directUser} onChange={(e) => setDirectUser(e.target.value)} className="w-full bg-slate-950 p-4 rounded-xl text-white outline-none border border-white/10 focus:border-blue-500">
                    <option value="">-- Select a user --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username ? `@${u.username}` : u.name || u.email} ({u.email})</option>
                    ))}
                  </select>
                  <textarea value={directMsg} onChange={(e) => setDirectMsg(e.target.value)} placeholder="Type your direct message here..." className="w-full h-24 bg-slate-950 p-4 rounded-xl text-white outline-none border border-white/10 focus:border-blue-500" />
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
                  Chats <button onClick={loadData} className="text-xs bg-slate-800 p-2 rounded-lg hover:bg-slate-700"><RefreshCw size={14} /></button>
                </div>
                {adminChatList.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-500">No chats yet.</p>
                ) : (
                  adminChatList.map((chat) => (
                    <button key={chat.user.id} onClick={() => openChat(chat.user)} className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 flex justify-between items-center ${selectedUser?.id === chat.user.id ? 'bg-white/10' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{chat.user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{chat.lastMsg.message}</p>
                      </div>
                      <div className="flex flex-col items-end ml-2">
                        <span className="text-[10px] text-slate-500">{new Date(chat.lastMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {chat.unread > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mt-1">{chat.unread}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="w-full md:w-2/3 border border-white/10 rounded-2xl bg-[#070D1A] flex flex-col">
                {selectedUser ? (
                  <>
                    <div className="p-4 border-b border-white/10 bg-[#0D1526] rounded-t-2xl flex justify-between">
                      <h2 className="font-bold text-lg text-amber-400">{selectedUser.name}</h2>
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
                ) : <div className="flex-1 flex items-center justify-center text-slate-500">Select a chat to view messages</div>}
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