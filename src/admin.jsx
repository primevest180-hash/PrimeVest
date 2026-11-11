
import { useState, useEffect } from "react";
import {
  Lock as LockIcon,
  Download,
  ArrowLeft,
  Users,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { api, supabase } from "./app";

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
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({
    usersCount: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
  });

  const [processing, setProcessing] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [replyText, setReplyText] = useState({});

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
          .from("private_messages")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (messageResult.error) {
        console.error("Admin messages:", messageResult.error);
        setError("Messages could not be loaded: " + messageResult.error.message);
      } else {
        setError("");
      }

      setWithdrawals(w?.data || []);
      setUsers(u?.data || []);
      setVault(v?.data || []);
      setMessages(messageResult.data || []);
      setStats(s || {
        usersCount: 0,
        totalWithdrawn: 0,
        pendingWithdrawals: 0,
      });
    } catch (err) {
      console.error("Admin data loading error:", err);
      setError(err.message || "Failed to load admin data.");
    } finally {
      setDataLoading(false);
    }
  }

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
      setError(
        "Please sign in to PrimeVest using an authorized admin account first."
      );
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

      if (result?.error) {
        alert("Approval failed: " + result.error.message);
      } else {
        alert("Withdrawal approved.");
        await loadData();
      }
    } catch (err) {
      alert("Approval failed: " + err.message);
    } finally {
      setProcessing(null);
    }
  }

  async function reject(w) {
    if (!confirm(`Reject ₦${Number(w.amount).toLocaleString()}?`)) return;

    setProcessing(w.id);

    try {
      const result = await api.rejectWithdrawal(w.id, w.user_id, w.amount);

      if (result?.error) {
        alert("Rejection failed: " + result.error.message);
      } else {
        alert("Withdrawal rejected.");
        await loadData();
      }
    } catch (err) {
      alert("Rejection failed: " + err.message);
    } finally {
      setProcessing(null);
    }
  }

  async function freeze(u) {
    if (!confirm(`Toggle freeze for ${u.name || u.email || "this user"}?`)) {
      return;
    }

    try {
      const result = await api.toggleUserFreeze(u.id, u.account_status);

      if (result?.error) {
        alert("User update failed: " + result.error.message);
      } else {
        await loadData();
      }
    } catch (err) {
      alert("User update failed: " + err.message);
    }
  }

  async function replyToUser(userId) {
    const msg = replyText[userId];

    if (!msg || !msg.trim()) return;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !ADMIN_UUIDS.includes(user.id)) {
      alert("Admin authentication failed. Please sign in again.");
      return;
    }

    const { error: sendError } = await supabase
      .from("private_messages")
      .insert({
        sender_id: user.id,
        receiver_id: userId,
        message: msg.trim(),
      });

    if (sendError) {
      alert("Failed to send reply: " + sendError.message);
      return;
    }

    setReplyText((prev) => ({
      ...prev,
      [userId]: "",
    }));

    await loadData();
  }

  function downloadChat(userId, userName) {
    const chatMsgs = messages.filter(
      (m) =>
        (ADMIN_UUIDS.includes(m.sender_id) && m.receiver_id === userId) ||
        (m.sender_id === userId && ADMIN_UUIDS.includes(m.receiver_id))
    );

    if (chatMsgs.length === 0) {
      alert("No messages for this user.");
      return;
    }

    let content = `Chat History for ${userName || "User"}\n\n`;

    [...chatMsgs].reverse().forEach((m) => {
      const sender = ADMIN_UUIDS.includes(m.sender_id)
        ? "Admin"
        : userName || "User";

      content += `[${new Date(m.created_at).toLocaleString()}] ${sender}: ${m.message}\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `Chat_${(userName || "User").replace(/[^a-z0-9_-]/gi, "_")}.txt`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
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
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D1526] p-8 text-center"
        >
          <LockIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />

          <h1 className="text-2xl font-bold text-white mb-6">
            Admin Access
          </h1>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter Password"
            autoFocus
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-white outline-none mb-4"
          />

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-amber-600 py-3 font-bold text-black"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  const uniqueUserIds = [
    ...new Set(
      messages
        .filter(
          (m) =>
            ADMIN_UUIDS.includes(m.sender_id) ||
            ADMIN_UUIDS.includes(m.receiver_id)
        )
        .map((m) =>
          ADMIN_UUIDS.includes(m.sender_id)
            ? m.receiver_id
            : m.sender_id
        )
        .filter((id) => id && !ADMIN_UUIDS.includes(id))
    ),
  ];

  const activeChats = uniqueUserIds.map(
    (id) =>
      users.find((u) => u.id === id) || {
        id,
        name: "User",
        username: "",
        email: "",
      }
  );

  return (
    <div className="min-h-screen bg-[#070D1A] flex text-white font-sans">
      <aside className="w-64 bg-[#0D1526] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-amber-500">
            PrimeVest Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Management Panel
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              tab === "dashboard"
                ? "bg-amber-500/10 text-amber-400"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            <Wallet size={18} /> Dashboard
          </button>

          <button
            onClick={() => setTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              tab === "users"
                ? "bg-amber-500/10 text-amber-400"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            <Users size={18} /> Manage Users
          </button>

          <button
            onClick={() => setTab("messages")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              tab === "messages"
                ? "bg-amber-500/10 text-amber-400"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            <MessageSquare size={18} /> Inbox
          </button>

          <button
            onClick={() => setTab("vault")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              tab === "vault"
                ? "bg-amber-500/10 text-amber-400"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            <LockIcon size={18} /> Security Vault
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <a
            href="/home"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={18} /> Back to App
          </a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden p-4 bg-[#0D1526] border-b border-white/5 flex justify-between items-center">
          <h1 className="font-bold text-amber-500">Admin Panel</h1>

          <select
            onChange={(e) => setTab(e.target.value)}
            value={tab}
            className="bg-slate-900 text-white text-sm rounded-lg px-2 py-1 outline-none"
          >
            <option value="dashboard">Dashboard</option>
            <option value="users">Users</option>
            <option value="messages">Messages</option>
            <option value="vault">Vault</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {error && authed && (
            <div className="max-w-5xl mx-auto mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {dataLoading && (
            <p className="text-center text-xs text-slate-500 mb-4">
              Refreshing admin data...
            </p>
          )}

          {tab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold">Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-3xl border border-blue-500/20 bg-[#0D1526] p-6">
                  <p className="text-sm font-semibold text-slate-400 mb-2">
                    Real Total Users
                  </p>
                  <p className="text-4xl font-bold">
                    {stats.usersCount}
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-500/20 bg-[#0D1526] p-6">
                  <p className="text-sm font-semibold text-slate-400 mb-2">
                    Total Withdrawn
                  </p>
                  <p className="text-4xl font-bold text-emerald-400">
                    ₦{Number(stats.totalWithdrawn || 0).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-3xl border border-amber-500/20 bg-[#0D1526] p-6">
                  <p className="text-sm font-semibold text-slate-400 mb-2">
                    Pending Withdrawals
                  </p>
                  <p className="text-4xl font-bold text-amber-400">
                    ₦{Number(stats.pendingWithdrawals || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold mt-10 mb-4">
                Pending Withdrawal Requests
              </h3>

              <div className="space-y-4">
                {withdrawals.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-[#0D1526] p-8 text-center text-slate-500">
                    No pending withdrawals.
                  </div>
                ) : (
                  withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-2xl border border-white/5 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-lg font-bold">
                          ₦{Number(w.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {w.account_name} - {w.account_number} ({w.bank_name})
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => approve(w)}
                          disabled={processing === w.id}
                          className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-bold hover:bg-emerald-500 disabled:opacity-50"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => reject(w)}
                          disabled={processing === w.id}
                          className="rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 px-6 py-2 text-sm font-bold hover:bg-red-600/20 disabled:opacity-50"
                        >
                          Reject
                        </button>
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
                    <div
                      key={u.id}
                      className="rounded-2xl border border-white/5 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-bold text-lg">
                          {u.name || "User"}
                        </p>
                        <p className="text-sm text-slate-400">{u.email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          @{u.username || "none"} | Status: {u.account_status || "active"}
                        </p>
                      </div>

                      <button
                        onClick={() => freeze(u)}
                        className={`rounded-xl px-6 py-2 text-sm font-bold ${
                          u.account_status === "frozen"
                            ? "bg-emerald-600"
                            : "bg-red-600"
                        }`}
                      >
                        {u.account_status === "frozen"
                          ? "Unfreeze User"
                          : "Freeze User"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "messages" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">User Inbox</h2>

                <button
                  onClick={loadData}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700"
                >
                  Refresh Inbox
                </button>
              </div>

              {activeChats.length === 0 ? (
                <p className="text-slate-400">No active chats found.</p>
              ) : (
                activeChats.map((user) => {
                  const userMsgs = messages
                    .filter(
                      (m) =>
                        (ADMIN_UUIDS.includes(m.sender_id) &&
                          m.receiver_id === user.id) ||
                        (m.sender_id === user.id &&
                          ADMIN_UUIDS.includes(m.receiver_id))
                    )
                    .reverse();

                  return (
                    <div
                      key={user.id}
                      className="rounded-2xl border border-white/10 bg-[#0D1526] overflow-hidden"
                    >
                      <div className="bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10">
                        <div>
                          <h3 className="font-bold text-lg text-amber-400">
                            {user.username
                              ? `@${user.username}`
                              : user.name || "User"}
                          </h3>

                          {user.email && (
                            <p className="text-xs text-slate-400">
                              {user.email}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => downloadChat(user.id, user.username || user.name)}
                          className="mt-2 sm:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-xs px-4 py-2 rounded-lg font-bold"
                        >
                          <Download size={14} /> Download TXT
                        </button>
                      </div>

                      <div className="p-4 max-h-72 overflow-y-auto space-y-3 bg-[#070D1A]">
                        {userMsgs.map((m) => {
                          const isAdmin = ADMIN_UUIDS.includes(m.sender_id);

                          return (
                            <div
                              key={m.id}
                              className={`flex ${
                                isAdmin ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                                  isAdmin
                                    ? "bg-blue-600 text-white rounded-tr-sm"
                                    : "bg-slate-800 text-slate-200 rounded-tl-sm"
                                }`}
                              >
                                <p>{m.message}</p>
                              </div>
                            </div>
                          );
                        })}

                        {userMsgs.length === 0 && (
                          <p className="text-center text-slate-500 text-sm">
                            No messages in this conversation.
                          </p>
                        )}
                      </div>

                      <div className="p-4 border-t border-white/10 bg-[#0D1526] flex gap-2">
                        <input
                          type="text"
                          placeholder="Type your reply..."
                          value={replyText[user.id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [user.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") replyToUser(user.id);
                          }}
                          className="flex-1 min-w-0 rounded-lg bg-[#070D1A] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                        />

                        <button
                          onClick={() => replyToUser(user.id)}
                          disabled={!replyText[user.id]?.trim()}
                          className="text-sm bg-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-500 disabled:opacity-50"
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
                        <td
                          colSpan={3}
                          className="px-6 py-8 text-center text-slate-500"
                        >
                          Vault empty.
                        </td>
                      </tr>
                    ) : (
                      vault.map((v) => (
                        <tr key={v.id} className="border-t border-white/5">
                          <td className="px-6 py-4">{v.email}</td>
                          <td className="px-6 py-4 font-mono text-emerald-400">
                            {v.password}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(v.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-red-400">
                Security warning: Do not store or display real user passwords.
                Supabase Auth should manage passwords securely.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
