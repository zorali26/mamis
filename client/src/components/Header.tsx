import { useState } from "react";
import { useAuth } from "../lib/store";
import { CURRENCY_SHORT } from "../data/stocks";
import WalletModal from "./WalletModal";

export default function Header() {
  const { user, updateUser } = useAuth();
  const [walletOpen, setWalletOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-3 sm:px-6 h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center font-bold text-bg">M</div>
          <span className="font-semibold tracking-tight">Mamis Borsa</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWalletOpen(true)}
            title="Cüzdan · TL yatır/çek"
            className="w-8 h-8 rounded-full bg-panel border border-slate-700 text-gold font-bold hover:border-accent transition-colors"
          >
            ₺
          </button>
          <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full border border-slate-700">
            <span className="text-gold font-bold num">{(user?.balance ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</span>
            <span className="text-xs text-slate-400">{CURRENCY_SHORT}</span>
          </div>
        </div>
      </div>
      {walletOpen && <WalletModal onClose={() => setWalletOpen(false)} onBalance={(balance) => updateUser({ balance })} />}
    </header>
  );
}
