import { NavLink } from "react-router-dom";
import { IconAssets, IconMarkets, IconProfile, IconLeader, IconSettings } from "../icons";
import { useAuth } from "../lib/store";

export default function BottomNav() {
  const { user } = useAuth();
  const items = [
    { to: "/assets", label: "Varlıklarım", Icon: IconAssets },
    { to: "/markets", label: "Borsalar", Icon: IconMarkets },
    { to: "/profile", label: "Profilim", Icon: IconProfile },
    { to: "/leaderboard", label: "Liderlik", Icon: IconLeader },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin", Icon: IconSettings }] : []),
    { to: "/settings", label: "Ayarlar", Icon: IconSettings },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-panel/90 backdrop-blur border-t border-slate-700/60">
      <div className="max-w-5xl mx-auto flex justify-around items-center h-16 px-1">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              "flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors " +
              (isActive ? "text-accent" : "text-slate-400 hover:text-slate-200")
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
