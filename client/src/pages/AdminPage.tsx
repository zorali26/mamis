import { useEffect, useState } from "react";
import { useAuth, api } from "../lib/store";

type Tab = "overview" | "users" | "stocks" | "transactions";

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tx, setTx] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [hours, setHours] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<number, string>>({});

  const load = async () => {
    if (user?.role !== "admin") return;
    try {
      const [o, u, s, sc, t] = await Promise.all([
        api("/admin/overview"), api("/admin/users"), api("/admin/stocks"),
        api("/admin/schedules"), api("/admin/transactions"),
      ]);
      setOverview(o); setUsers(u.users); setStocks(s.stocks); setSchedules(sc.schedules); setTx(t.transactions);
    } catch (e: any) { setMsg(e.message); }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 2500); // canlı güncelleme
    return () => clearInterval(t);
  }, [user?.role]);

  if (user?.role !== "admin") return <div className="py-10 text-center text-down">Admin yetkisi gerekli.</div>;

  const act = async (path: string, body: any, method = "POST") => {
    setMsg("");
    try { await api(path, { method, body: JSON.stringify(body) }); await load(); setMsg("Tamam ✓"); }
    catch (e: any) { setMsg(e.message); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Genel" }, { id: "users", label: "Kullanıcılar" },
    { id: "stocks", label: "Borsalar" }, { id: "transactions", label: "İşlemler" },
  ];

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Admin Paneli <span className="text-xs text-accent">· canlı</span></h2>
        <button onClick={load} className="text-xs text-slate-400 hover:text-accent">Yenile</button>
      </div>
      <div className="flex gap-1 bg-panel rounded-lg p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={"flex-1 py-2 rounded-md text-xs font-semibold " + (tab === t.id ? "bg-accent text-bg" : "text-slate-300")}>{t.label}</button>
        ))}
      </div>
      {msg && <div className="text-xs text-accent">{msg}</div>}

      {tab === "overview" && overview && (
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Kullanıcı", overview.users], ["Toplam MC", Number(overview.balance).toFixed(0)],
            ["İşlem", overview.transactions], ["Bekleyen fiyat", overview.pendingSchedules],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-card border border-slate-700 rounded-xl p-3">
              <div className="text-xs text-slate-400">{label}</div>
              <div className="text-xl font-bold num">{String(value)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-card border border-slate-700 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{u.username} {u.role === "admin" && <span className="text-accent text-xs">ADMIN</span>}</div>
                  <div className="text-xs text-slate-500 truncate">{u.email} · {u.holdings} hisse · {u.tx_count} işlem</div>
                </div>
                <div className="text-right text-sm font-bold num text-gold">{Number(u.balance).toFixed(0)} MC</div>
              </div>
              <div className="flex gap-2">
                <input value={amounts[u.id] || ""} onChange={(e) => setAmounts({ ...amounts, [u.id]: e.target.value })} placeholder="± MC" type="number" className="flex-1 bg-panel border border-slate-700 rounded-lg px-2 py-1.5 text-xs" />
                <button onClick={() => act(`/admin/users/${u.id}/balance`, { amount: Number(amounts[u.id] || 0), note: "Admin paneli" })} className="text-xs bg-up text-white px-3 rounded-lg">Uygula</button>
                <button onClick={() => act(`/admin/users/${u.id}/role`, { role: u.role === "admin" ? "user" : "admin" })} className="text-xs bg-panel border border-slate-700 px-3 rounded-lg">{u.role === "admin" ? "Yetki al" : "Admin yap"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "stocks" && (
        <div className="space-y-2">
          {stocks.map((s) => (
            <div key={s.id} className="bg-card border border-slate-700 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{s.name} <span className="text-xs text-slate-500">{s.active ? "aktif" : "pasif"}</span></div>
                <div className="text-sm num text-accent">{Number(s.price).toFixed(2)} MC</div>
              </div>
              <div className="flex gap-2">
                <input value={prices[s.id] ?? String(s.price)} onChange={(e) => setPrices({ ...prices, [s.id]: e.target.value })} type="number" step="0.01" className="flex-1 bg-panel border border-slate-700 rounded-lg px-2 py-1.5 text-xs" />
                <button onClick={() => act(`/admin/stocks/${s.id}`, { price: Number(prices[s.id]), active: s.active })} className="text-xs bg-up text-white px-3 rounded-lg">Fiyatı ayarla</button>
                <button onClick={() => act(`/admin/stocks/${s.id}`, { active: !s.active, basePrice: 10 })} className="text-xs bg-panel border border-slate-700 px-3 rounded-lg">{s.active ? "Pasifle" : "Aktifle"}</button>
              </div>
              <div className="flex gap-2">
                <input value={hours[s.id] || "1"} onChange={(e) => setHours({ ...hours, [s.id]: e.target.value })} type="number" min="0.1" step="0.5" placeholder="saat" className="w-20 bg-panel border border-slate-700 rounded-lg px-2 py-1.5 text-xs" />
                <button onClick={() => act(`/admin/stocks/${s.id}/schedule`, { price: Number(prices[s.id] || s.price), hours: Number(hours[s.id] || 1) })} className="text-xs bg-accent text-bg px-3 rounded-lg">Sonra şu fiyata</button>
              </div>
            </div>
          ))}
          {schedules.length > 0 && (
            <div className="bg-card border border-slate-700 rounded-xl p-3">
              <div className="text-xs font-semibold mb-2">Bekleyen planlar</div>
              {schedules.map((sc) => (
                <div key={sc.id} className="flex items-center justify-between text-xs py-1">
                  <span>{sc.stock_id} → {sc.target_price} MC · {new Date(sc.apply_at).toLocaleString("tr-TR")}</span>
                  <button onClick={() => act(`/admin/schedules/${sc.id}`, {}, "DELETE")} className="text-down">sil</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-1">
          {tx.slice(0, 80).map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-card border border-slate-700 rounded-lg px-3 py-2 text-xs">
              <div><span className="text-slate-200">{t.username}</span> · {t.kind} · {new Date(t.created_at).toLocaleString("tr-TR")}</div>
              <div className={t.amount_mc >= 0 ? "text-up num" : "text-down num"}>{t.amount_mc > 0 ? "+" : ""}{Number(t.amount_mc).toFixed(0)} MC</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
