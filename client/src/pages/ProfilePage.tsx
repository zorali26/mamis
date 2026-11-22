import { useEffect, useState } from "react";
import { useAuth, api } from "../lib/store";

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api("/auth/me");
        updateUser(r.user);
        const p = await api("/stocks/portfolio");
        const pred = await api("/stocks/predictions");
        const wins = pred.predictions.filter((x: any) => x.outcome === "win").length;
        setStats({ holdings: p.holdings.length, predictions: pred.predictions.length, wins });
      } catch (e) {}
    })();
  }, []);

  return (
    <div className="py-4 space-y-4">
      <div className="bg-card border border-slate-700 rounded-xl p-5 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-3xl font-bold text-bg mb-3">
          {user?.username?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="text-xl font-bold">{user?.username}</div>
        <div className="text-sm text-slate-400">{user?.email}</div>
        <div className="mt-3 text-2xl font-bold text-gold num">{(user?.balance ?? 0).toFixed(2)} <span className="text-sm text-slate-400">MC</span></div>
        <div className="mt-1 text-sm text-accent">Ev Ruhu: {user?.spirit ?? 0}</div>
      </div>
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{stats.holdings}</div>
            <div className="text-xs text-slate-400">Hisse</div>
          </div>
          <div className="bg-card border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{stats.predictions}</div>
            <div className="text-xs text-slate-400">Tahmin</div>
          </div>
          <div className="bg-card border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{stats.wins}</div>
            <div className="text-xs text-slate-400">Kazanç</div>
          </div>
        </div>
      )}
      <button onClick={logout} className="w-full bg-down/20 border border-down text-down font-bold py-2.5 rounded-lg hover:bg-down/30">Çıkış Yap</button>
    </div>
  );
}
