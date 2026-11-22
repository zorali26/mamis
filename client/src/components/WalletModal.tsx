import { useEffect, useState } from "react";
import { api } from "../lib/store";

interface Props {
  onClose: () => void;
  onBalance: (balance: number) => void;
}

export default function WalletModal({ onClose, onBalance }: Props) {
  const [data, setData] = useState<any>(null);
  const [tl, setTl] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api("/wallet/summary").then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const act = async (kind: "deposit" | "withdraw") => {
    setBusy(true); setMsg("");
    try {
      const r = await api(`/wallet/${kind}`, { method: "POST", body: JSON.stringify({ tl: Number(tl) }) });
      onBalance(r.balance);
      setMsg(kind === "deposit" ? `${r.added} MC hesabına eklendi.` : `${r.withdrawn} MC çekildi.`);
      setTl("");
      load();
    } catch (e: any) { setMsg(e.message); }
    setBusy(false);
  };

  const kindLabel: Record<string, string> = {
    deposit: "Yatırım", withdraw: "Çekim", admin_add: "Admin ekleme", admin_sub: "Admin azaltma",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-md rounded-2xl p-5 border border-slate-700 pop max-h-[88vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Cüzdan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="rounded-xl bg-panel border border-slate-700 p-4 mb-4">
          <div className="text-xs text-slate-400">MamiCoin bakiyesi</div>
          <div className="text-2xl font-bold num">{data ? Number(data.balance).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : "..."} <span className="text-sm text-slate-400">MC</span></div>
          <div className="text-sm text-accent num mt-1">{data ? Number(data.tl).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : "..."} TL karşılığı</div>
          <div className="text-xs text-slate-500 mt-2">Kur: 50 MC = 1 TL</div>
        </div>

        <div className="flex gap-2 mb-2">
          <input value={tl} onChange={(e) => setTl(e.target.value)} type="number" min="0" step="1" placeholder="Tutar (TL)" className="flex-1 bg-panel border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
          <button disabled={busy} onClick={() => act("deposit")} className="bg-up text-white font-bold px-4 rounded-lg text-sm disabled:opacity-50">Yatır</button>
          <button disabled={busy} onClick={() => act("withdraw")} className="bg-down text-white font-bold px-4 rounded-lg text-sm disabled:opacity-50">Çek</button>
        </div>
        <div className="text-xs text-slate-500 mb-4">Minimum yatırım 20 TL · Minimum çekim 50 TL</div>

        {msg && <div className="text-sm text-accent mb-3">{msg}</div>}

        <div className="text-sm font-semibold mb-2">İşlem geçmişi</div>
        <div className="space-y-1.5">
          {(data?.history || []).length === 0 && <div className="text-xs text-slate-500">Henüz işlem yok.</div>}
          {(data?.history || []).map((h: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-panel rounded-lg px-3 py-2 text-xs">
              <div>
                <div className="text-slate-200">{kindLabel[h.kind] || h.kind}</div>
                <div className="text-slate-500">{new Date(h.created_at).toLocaleString("tr-TR")}</div>
              </div>
              <div className="text-right">
                <div className={h.amount_mc >= 0 ? "text-up num" : "text-down num"}>{h.amount_mc > 0 ? "+" : ""}{Number(h.amount_mc).toLocaleString("tr-TR")} MC</div>
                <div className="text-slate-500 num">{Number(h.amount_tl).toLocaleString("tr-TR")} TL</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
