import { lazy, Suspense, useEffect, useState } from "react";
import { useAuth, api } from "../lib/store";
import { APPLIANCES } from "../data/appliances";

const House3DView = lazy(() => import("../components/House3D/House3DView"));

export default function AssetsPage() {
  const { user, updateUser } = useAuth();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [balance, setBalance] = useState(user?.balance ?? 0);
  const [spirit, setSpirit] = useState(user?.spirit ?? 0);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const p = await api("/stocks/portfolio");
      setHoldings(p.holdings);
      setBalance(p.balance);
      updateUser({ balance: p.balance });
      const a = await api("/appliances");
      setApps(a.appliances);
      setBalance(a.balance);
      setSpirit(a.spirit);
      updateUser({ balance: a.balance, spirit: a.spirit });
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const collect = async () => {
    try {
      const r = await api("/appliances/collect", { method: "POST" });
      setBalance(r.balance);
      updateUser({ balance: r.balance });
      load();
    } catch (e) {}
  };

  const buyApp = async (id: string) => {
    try {
      const r = await api("/appliances/buy", { method: "POST", body: JSON.stringify({ id }) });
      setBalance(r.balance);
      updateUser({ balance: r.balance });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const upgradeApp = async (id: string) => {
    try {
      const r = await api("/appliances/upgrade", { method: "POST", body: JSON.stringify({ id }) });
      setBalance(r.balance);
      updateUser({ balance: r.balance });
      load();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="py-10 text-center text-slate-400">Yükleniyor...</div>;

  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  const hasHouse = apps.some((a) => a.id === "house" && a.owned);

  return (
    <div className="py-4 space-y-6">
      <div className="bg-card border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Toplam Portföy</div>
            <div className="text-2xl font-bold num">{(balance + totalValue).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} <span className="text-sm text-slate-400">MC</span></div>
            <div className="text-xs text-slate-400 mt-1">Nakit: {balance.toFixed(2)} · Hisse: {totalValue.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Ev Ruhu</div>
            <div className="text-2xl font-bold text-accent num">{spirit}</div>
          </div>
        </div>
        <button onClick={collect} className="mt-3 text-xs bg-panel border border-slate-700 px-3 py-1.5 rounded-lg hover:border-accent">Pasif Gelir Topla</button>
      </div>

      <section>
        <h3 className="font-bold mb-2 px-1">Hisselerim</h3>
        {holdings.length === 0 && <div className="text-slate-400 text-sm px-1">Henüz hisse yok.</div>}
        <div className="space-y-2">
          {holdings.map((h) => (
            <div key={h.stockId} className="bg-card border border-slate-700 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{h.name}</div>
                <div className="text-xs text-slate-400">{h.quantity.toFixed(2)} adet · ort. {h.avgPrice.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold num">{h.value.toFixed(2)}</div>
                <div className={"text-xs " + (h.pnl >= 0 ? "text-up" : "text-down")}>{h.pnl >= 0 ? "+" : ""}{h.pnl.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        {!hasHouse ? (
          <div className="bg-card border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-slate-400 text-sm mb-3">Henüz bir evin yok. Ev satın alarak pasif gelir ve ev ruhu kazan.</div>
            {APPLIANCES.filter((a) => a.id === "house").map((def) => (
              <button key={def.id} data-tutorial="buy-house" onClick={() => buyApp(def.id)} className="bg-accent text-bg font-bold py-2 px-4 rounded-lg text-sm hover:opacity-90">
                Ev Satın Al ({def.baseCost} MC)
              </button>
            ))}
          </div>
        ) : (
          <Suspense fallback={
            <div className="h-[420px] rounded-2xl border border-slate-700 bg-[#0b1020] flex flex-col items-center justify-center gap-3">
              <div className="spinner" />
              <div className="text-sm text-slate-400">3D model yükleniyor...</div>
            </div>
          }>
            <House3DView apps={apps} balance={balance} spirit={spirit} onBuy={buyApp} onUpgrade={upgradeApp} />
          </Suspense>
        )}
      </section>

    </div>
  );
}
