import { useAuth } from "../lib/store";
import { useState } from "react";

export default function SettingsPage() {
  const { logout, updateUser } = useAuth();
  const [sound, setSound] = useState(() => localStorage.getItem("mamis-sound") !== "off");

  const toggleSound = () => {
    const v = !sound;
    setSound(v);
    localStorage.setItem("mamis-sound", v ? "on" : "off");
  };

  const resetTutorial = () => {
    updateUser({ tutorialDone: false });
    localStorage.removeItem("mamis-tutorial");
  };

  return (
    <div className="py-4 space-y-3">
      <h2 className="text-lg font-bold px-1 mb-2">Ayarlar</h2>
      <div className="bg-card border border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Ses Efektleri</div>
          <div className="text-xs text-slate-400">Oyun sesleri</div>
        </div>
        <button onClick={toggleSound} className={"w-12 h-7 rounded-full transition " + (sound ? "bg-accent" : "bg-slate-700")}>
          <div className={"w-5 h-5 bg-white rounded-full transition-transform " + (sound ? "translate-x-6" : "translate-x-1")} />
        </button>
      </div>
      <div className="bg-card border border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Öğreticiyi Yeniden Göster</div>
          <div className="text-xs text-slate-400">Oyun öğreticisini tekrar başlat</div>
        </div>
        <button onClick={resetTutorial} className="text-sm bg-panel border border-slate-700 px-3 py-1.5 rounded-lg hover:border-accent">Sıfırla</button>
      </div>
      <div className="bg-card border border-slate-700 rounded-xl p-4">
        <div className="font-semibold mb-1">Hakkında</div>
        <div className="text-xs text-slate-400">Mamis Borsa v0.1 — Kendi dünyanda borsa yönet.</div>
      </div>
      <button onClick={logout} className="w-full bg-down/20 border border-down text-down font-bold py-2.5 rounded-lg hover:bg-down/30">Çıkış Yap</button>
    </div>
  );
}
