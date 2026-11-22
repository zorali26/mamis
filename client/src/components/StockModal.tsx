import { useState } from "react";
import { useAuth, api } from "../lib/store";
import { CURRENCY_SHORT } from "../data/stocks";

interface Props {
  stock: any;
  holdings: number;
  onClose: () => void;
  onDone: () => void;
}

export default function StockModal({ stock, holdings, onClose, onDone }: Props) {
  const { updateUser } = useAuth();
  const [tab, setTab] = useState<"buy" | "sell" | "predict">("buy");
  const [qty, setQty] = useState("1");
  const [bet, setBet] = useState("100");
  const [kind, setKind] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [duration, setDuration] = useState("14400");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const doBuy = async () => {
    setLoading(true); setMsg("");
    try {
      const r = await api("/stocks/buy", { method: "POST", body: JSON.stringify({ stockId: stock.id, quantity: Number(qty) }) });
      updateUser({ balance: r.balance });
      setMsg("Alındı!");
      onDone();
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  const doSell = async () => {
    setLoading(true); setMsg("");
    try {
      const r = await api("/stocks/sell", { method: "POST", body: JSON.stringify({ stockId: stock.id, quantity: Number(qty) }) });
      updateUser({ balance: r.balance });
      setMsg("Satıldı!");
      onDone();
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  const doPredict = async () => {
    setLoading(true); setMsg("");
    try {
      const body: any = { stockId: stock.id, kind, target: Number(target), bet: Number(bet), duration: Number(duration) };
      const r = await api("/stocks/predict", { method: "POST", body: JSON.stringify(body) });
      updateUser({ balance: r.balance });
      setMsg(`Tahmin açıldı! Çarpan ${r.multiplier}x`);
      onDone();
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 border border-slate-700 pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-lg">{stock.name}</div>
            <div className="text-sm text-slate-400">Fiyat: <span className="text-slate-100 font-semibold num">{stock.price.toFixed(2)}</span></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="flex bg-panel rounded-lg p-1 mb-4">
          {(["buy", "sell", "predict"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={"flex-1 py-2 rounded-md text-sm font-medium transition " + (tab === t ? "bg-accent text-bg" : "text-slate-300")}>
              {t === "buy" ? "Al" : t === "sell" ? "Sat" : "Tahmin"}
            </button>
          ))}
        </div>

        {tab === "buy" && (
          <div className="space-y-3">
            <label className="text-xs text-slate-400">Miktar</label>
            <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min="0.01" step="0.01" className="w-full bg-panel border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
            <div className="text-sm text-slate-400">Maliyet: <span className="text-slate-100 num">{(Number(qty || 0) * stock.price).toFixed(2)}</span> {CURRENCY_SHORT}</div>
            <button onClick={doBuy} disabled={loading} className="w-full bg-up text-white font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">Satın Al</button>
          </div>
        )}

        {tab === "sell" && (
          <div className="space-y-3">
            <label className="text-xs text-slate-400">Miktar (sahipsin: {holdings})</label>
            <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min="0.01" step="0.01" className="w-full bg-panel border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
            <div className="text-sm text-slate-400">Gelir: <span className="text-slate-100 num">{(Number(qty || 0) * stock.price).toFixed(2)}</span> {CURRENCY_SHORT}</div>
            <button onClick={doSell} disabled={loading} className="w-full bg-down text-white font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">Sat</button>
          </div>
        )}

        {tab === "predict" && (
          <div className="space-y-3">
            <div className="flex bg-panel rounded-lg p-1">
              <button onClick={() => setKind("above")} className={"flex-1 py-1.5 rounded-md text-xs font-medium " + (kind === "above" ? "bg-up text-white" : "text-slate-300")}>Yukarı Aşar ▲</button>
              <button onClick={() => setKind("below")} className={"flex-1 py-1.5 rounded-md text-xs font-medium " + (kind === "below" ? "bg-down text-white" : "text-slate-300")}>Aşağı Düşer ▼</button>
            </div>
            <div>
              <label className="text-xs text-slate-400">Hedef fiyat ({CURRENCY_SHORT})</label>
              <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" min="0" step="0.01" placeholder={String(stock.price)} className="w-full bg-panel border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
              <div className="text-xs text-slate-500 mt-1">Şu an: {stock.price.toFixed(2)} · {kind === "above" ? "hedefe ulaşacak" : "hedefin altına düşecek"}</div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Süre</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-panel border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent">
                <option value="300">5 dakika</option>
                <option value="14400">4 saat</option>
                <option value="86400">1 gün</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Bahis miktarı</label>
              <input value={bet} onChange={(e) => setBet(e.target.value)} type="number" min="10" className="w-full bg-panel border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
            </div>
            <button onClick={doPredict} disabled={loading} className="w-full bg-accent text-bg font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">Tahmin Yap</button>
          </div>
        )}

        {msg && <div className="mt-3 text-sm text-center text-accent">{msg}</div>}
      </div>
    </div>
  );
}
