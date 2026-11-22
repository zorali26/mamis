import { useEffect, useState } from "react";
import { useAuth, api } from "../lib/store";
import { STOCKS } from "../data/stocks";
import { StockIcon } from "../icons";
import Sparkline from "../components/Sparkline";
import StockModal from "../components/StockModal";

interface StockRow {
  id: string; name: string; price: number; level: number; basePrice: number;
  volatility: number; history: number[]; active: boolean;
}

export default function MarketsPage() {
  const { updateUser } = useAuth();
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [pnl, setPnl] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<StockRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await api("/stocks");
      setStocks(r.stocks);
      const p = await api("/stocks/portfolio");
      const map: Record<string, number> = {};
      const pnlMap: Record<string, number> = {};
      p.holdings.forEach((h: any) => { map[h.stockId] = h.quantity; pnlMap[h.stockId] = h.pnl; });
      setHoldings(map);
      setPnl(pnlMap);
      updateUser({ balance: p.balance });
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="py-10 text-center text-slate-400 shimmer h-32 rounded-xl" />;

  return (
    <div className="py-4 space-y-3">
      <h2 className="text-lg font-bold px-1">Borsalar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stocks.map((s) => {
          const def = STOCKS.find((d) => d.id === s.id)!;
          const prev = s.history.length > 1 ? s.history[s.history.length - 2] : s.price;
          const up = s.price >= prev;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="card bg-card border border-slate-700 rounded-xl p-3 text-left hover:border-accent/60"
            >
              <div className="flex items-center gap-3">
                <StockIcon seed={def.seed} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.name}</div>
                  <div className="text-xs text-slate-400">{holdings[s.id] ? holdings[s.id].toFixed(2) + " adet" : "Yok"}</div>
                  {holdings[s.id] ? (
                    <div className={"text-xs num " + ((pnl[s.id] || 0) >= 0 ? "text-up" : "text-down")}>
                      K/Z: {pnl[s.id] >= 0 ? "+" : ""}{(pnl[s.id] || 0).toFixed(2)} MC
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="font-bold num">{s.price.toFixed(2)}</div>
                  <div className={"text-xs " + (up ? "text-up" : "text-down")}>{s.active ? `${up ? "▲" : "▼"} ${(Math.abs(s.price - prev) / (prev || 1) * 100).toFixed(2)}%` : "Pasif"}</div>
                </div>
              </div>
              <div className="mt-2">
                <Sparkline data={s.history} color={up ? "#22c55e" : "#ef4444"} />
              </div>
            </button>
          );
        })}
      </div>
      {selected && (
        <StockModal stock={selected} onClose={() => setSelected(null)} onDone={load} holdings={holdings[selected.id] || 0} />
      )}
    </div>
  );
}
