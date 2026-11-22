import { useEffect, useState } from "react";
import { useAuth, api } from "../lib/store";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await api("/leaderboard");
        setRows(r.leaderboard);
      } catch (e) {}
    })();
    const t = setInterval(async () => {
      try { const r = await api("/leaderboard"); setRows(r.leaderboard); } catch (e) {}
    }, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="py-4 space-y-2">
      <h2 className="text-lg font-bold px-1 mb-2">Liderlik Tablosu</h2>
      {rows.map((r) => {
        const isMe = r.username === user?.username;
        const rankColor = r.rank === 1 ? "text-gold" : r.rank === 2 ? "text-slate-300" : r.rank === 3 ? "text-amber-600" : "text-slate-500";
        return (
          <div key={r.rank} className={"flex items-center gap-3 bg-card border rounded-xl p-3 " + (isMe ? "border-accent" : "border-slate-700")}>
            <div className={"w-8 text-center font-bold " + rankColor}>{r.rank}</div>
            <div className="flex-1 font-semibold">{r.username}{isMe ? " (sen)" : ""}</div>
            <div className="text-right">
              <div className="font-bold text-gold num">{r.balance.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-accent">Ruh: {r.spirit}</div>
            </div>
          </div>
        );
      })}
      {rows.length === 0 && <div className="text-slate-400 text-sm px-1">Yükleniyor...</div>}
    </div>
  );
}
