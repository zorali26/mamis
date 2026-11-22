import { useState } from "react";
import { useAuth, api } from "../lib/store";

export default function AuthPage() {
  const { setAuth } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body: any = { email, password };
      if (mode === "register") { body.username = username; }
      const res = await api(path, { method: "POST", body: JSON.stringify(body) });
      setAuth(res.token, res.user);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-slate-700 rounded-2xl p-6 shadow-glow pop">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-2xl font-bold text-bg mb-3">M</div>
          <h1 className="text-2xl font-bold">Mamis Borsa</h1>
          <p className="text-slate-400 text-sm mt-1">Kendi dünyanın borsasında zengin ol</p>
        </div>
        <div className="flex bg-panel rounded-lg p-1 mb-4">
          <button onClick={() => setMode("login")} className={"flex-1 py-2 rounded-md text-sm font-medium transition " + (mode === "login" ? "bg-accent text-bg" : "text-slate-300")}>Giriş</button>
          <button onClick={() => setMode("register")} className={"flex-1 py-2 rounded-md text-sm font-medium transition " + (mode === "register" ? "bg-accent text-bg" : "text-slate-300")}>Kayıt</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Kullanıcı adı" className="w-full bg-panel border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta" type="email" className="w-full bg-panel border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" type="password" className="w-full bg-panel border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
          {err && <div className="text-down text-sm">{err}</div>}
          <button disabled={loading} className="w-full bg-accent text-bg font-bold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50">
            {loading ? "..." : mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-4 text-center">İlk kayıtta 1000 MamiCoin hediye!</p>
      </div>
    </div>
  );
}
