import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "../lib/store";
import { useTutorialBus } from "../lib/tutorialBus";

type Spot = { top: number; left: number; width: number; height: number };

export default function Tutorial() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  const dragBase = useRef(0);
  const selected = useTutorialBus((s) => s.selected);
  const drags = useTutorialBus((s) => s.drags);

  /* first step takes the player to the real Assets page */
  useEffect(() => {
    if (step === 1) navigate("/assets");
  }, [step, navigate]);

  /* spotlight the real UI element of the current step */
  useEffect(() => {
    const selector =
      step === 1 ? '[data-tutorial="buy-house"]'
        : step === 3 ? '[data-tutorial="buy-item"]'
          : step === 2 || step === 4 ? '[data-tutorial="canvas"]'
            : null;
    if (!selector) { setSpot(null); return; }
    const update = () => {
      const el = document.querySelector(selector);
      if (!el) { setSpot(null); return; }
      const r = el.getBoundingClientRect();
      setSpot({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const timer = setInterval(update, 400);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      clearInterval(timer);
    };
  }, [step]);

  /* watch real actions: buying the house / the chosen item */
  useEffect(() => {
    if (step !== 1 && step !== 3) return;
    let alive = true;
    const check = async () => {
      try {
        const j = await api("/appliances");
        const rows: { id: string; owned: boolean }[] = j.appliances || [];
        if (!alive) return;
        if (step === 1 && rows.some((a) => a.id === "house" && a.owned)) {
          // grant the tutorial funds so the player can actually buy a first item
          try {
            const r = await api("/auth/tutorial/complete", { method: "POST" });
            updateUser(r.user);
          } catch {}
          setStep(2);
        }
        if (step === 3 && targetId && rows.some((a) => a.id === targetId && a.owned)) setStep(4);
      } catch {}
    };
    check();
    const timer = setInterval(check, 700);
    return () => { alive = false; clearInterval(timer); };
  }, [step, targetId]);

  /* tapping an item in the 3D world opens its buy panel */
  useEffect(() => {
    if (step === 2 && selected && selected !== "house") {
      setTargetId(selected);
      setStep(3);
    }
  }, [step, selected]);

  /* moving an item with drag & drop completes the placement lesson */
  useEffect(() => { if (step === 4) dragBase.current = drags; }, [step]);
  useEffect(() => { if (step === 4 && drags > dragBase.current) setStep(5); }, [step, drags]);

  const close = async (grant: boolean) => {
    if (grant) {
      try { await api("/auth/tutorial/complete", { method: "POST" }); } catch {}
    }
    try { await api("/auth/tutorial", { method: "PUT" }); } catch {}
    updateUser({ tutorialDone: true });
    useTutorialBus.getState().reset();
  };

  const copy = [
    { title: "Hoş geldin!", text: "Evini ve eşyalarını birlikte kuracağız. Gerçek butonlara dokunarak öğreneceksin — sadece okumak yok." },
    { title: "1/4 · Evini satın al", text: "Varlıklarım sayfasındaki turuncu 'Ev Satın Al (400 MC)' butonuna dokun. Ev senin olunca 3D görünümü açılacak." },
    { title: "2/4 · Eşyana dokun", text: "3D evde herhangi bir eşyaya dokun (örneğin buzdolabı). Satın alma paneli açılacak." },
    { title: "3/4 · Eşyayı satın al", text: "Açılan paneldeki 'Satın Al' butonuna dokun. Eşya evine fiziksel olarak eklenecek." },
    { title: "4/4 · Yerini değiştir", text: "Eşyaya dokun, panelden 'Taşı'ya bas, sonra eşyayı sürükle. Izgaraya oturur, üst üste binmez. Kendi düzenini kur!" },
    { title: "Tebrikler!", text: "Artık evini ve eşyalarını yönetebilirsin. İyi eğlenceler!" },
  ][step];

  return (
    <>
      {/* dark backdrop with a hole over the element the player must touch */}
      {spot && (
        <div className="fixed inset-0 z-[55] pointer-events-none">
          <div className="absolute bg-black/65" style={{ left: 0, top: 0, right: 0, height: Math.max(0, spot.top - 8) }} />
          <div className="absolute bg-black/65" style={{ left: 0, top: spot.top + spot.height + 8, right: 0, bottom: 0 }} />
          <div className="absolute bg-black/65" style={{ left: 0, top: Math.max(0, spot.top - 8), width: Math.max(0, spot.left - 8), height: spot.height + 16 }} />
          <div className="absolute bg-black/65" style={{ left: spot.left + spot.width + 8, top: Math.max(0, spot.top - 8), right: 0, height: spot.height + 16 }} />
          <div className="absolute rounded-xl border-2 border-accent shadow-[0_0_0_5px_rgba(34,211,238,0.18)] animate-pulse" style={{ top: spot.top - 8, left: spot.left - 8, width: spot.width + 16, height: spot.height + 16 }} />
        </div>
      )}

      {!spot && <div className="fixed inset-0 z-[54] bg-black/60 pointer-events-none" />}

      {/* instruction card */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[56] w-[min(92vw,440px)] bg-card border border-accent/40 rounded-2xl p-4 shadow-2xl pop">
        <h3 className="font-bold text-lg text-slate-100 mb-1">{copy.title}</h3>
        <p className="text-sm text-slate-300 leading-relaxed">{copy.text}</p>
        <div className="flex items-center gap-3 mt-3">
          {step === 0 && (
            <button onClick={() => setStep(1)} className="bg-accent text-bg font-bold py-2 px-5 rounded-lg text-sm">Başla</button>
          )}
          {step === 5 && (
            <button onClick={() => close(true)} className="bg-accent text-bg font-bold py-2 px-5 rounded-lg text-sm">Başla</button>
          )}
          {step > 0 && step < 5 && <span className="text-xs text-accent animate-pulse">Yukarıdaki alanı dene ●</span>}
          <button onClick={() => close(false)} className="ml-auto text-xs text-slate-400 hover:text-slate-200">Eğitimi geç</button>
        </div>
      </div>
    </>
  );
}
