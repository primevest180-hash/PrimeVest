function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [vault, setVault] = useState([]);
  const [messages, setMessages] = useState([]); // NEW
  const [stats, setStats] = useState({ usersCount: 0, totalWithdrawn: 0, pendingWithdrawals: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState("withdrawals"); // withdrawals | users | vault | messages
  const [replyMsg, setReplyMsg] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "2468") {
      setIsAuthenticated(true);
      loadData();
    } else {
      setError("Incorrect password");
    }
  };

  const loadData = async () => {
    const { data: w } = await api.getAdminWithdrawals();
    const { data: u } = await api.getAllUsers();
    const { data: v } = await api.getAdminVault();
    const s = await api.getAdminStats();
    
    // Load messages sent to admin
    const { data: m } = await supabase.from("private_messages").select("*, profiles!private_messages_sender_id_fkey(name, email)").eq("receiver_id", "00000000-0000-0000-0000-000000000000");
    
    setWithdrawals(w || []);
    setUsers(u || []);
    setVault(v || []);
    setMessages(m || []);
    setStats(s);
    setLoading(false);
  };

  // ... (handleApprove, handleReject, handleFreeze, handleExportCSV remain the same) ...

  return (
    // ... (UI structure remains the same until the TABS section) ...
    <div className="flex gap-4 border-b border-white/10 mb-6 overflow-x-auto">
      <button onClick={() => setActiveTab("withdrawals")} className={`pb-2 text-sm font-semibold whitespace-nowrap ${activeTab === "withdrawals" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>Withdrawals</button>
      <button onClick={() => setActiveTab("users")} className={`pb-2 text-sm font-semibold whitespace-nowrap ${activeTab === "users" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>Manage Users</button>
      <button onClick={() => setActiveTab("vault")} className={`pb-2 text-sm font-semibold whitespace-nowrap ${activeTab === "vault" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>Security Vault</button>
      <button onClick={() => setActiveTab("messages")} className={`pb-2 text-sm font-semibold whitespace-nowrap ${activeTab === "messages" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>Messages</button>
    </div>
    
    // ... (Keep the existing tabs) ...
    
    {activeTab === "messages" && (
      <div className="rounded-2xl border border-white/10 bg-[#0D1526] p-5">
        <h3 className="font-bold mb-4">User Messages</h3>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {messages.map(m => (
            <div key={m.id} className="bg-slate-950 p-4 rounded-xl">
              <p className="text-xs text-blue-400 mb-1">{m.profiles?.name} ({m.profiles?.email})</p>
              <p className="text-sm">{m.message}</p>
              <p className="text-[10px] text-slate-500 mt-2">{new Date(m.created_at).toLocaleString()}</p>
              <button onClick={() => {
                // Send reply to this user
                supabase.from("private_messages").insert({ sender_id: "00000000-0000-0000-0000-000000000000", receiver_id: m.sender_id, message: prompt("Reply:") });
              }} className="text-xs bg-blue-600 px-2 py-1 rounded mt-2">Reply</button>
            </div>
          ))}
        </div>
      </div>
    )}
    // ...
  );
}