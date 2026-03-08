import { useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { useGameAuth } from "@/hooks/useGameAuth";

const GameAuthButton = () => {
  const { user, loading, signInWithGoogle, signOut } = useGameAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (loading) return null;

  if (user) {
    const avatar = user.user_metadata?.avatar_url;
    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Player";

    return (
      <div className="fixed top-24 right-4 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-9 h-9 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm overflow-hidden flex items-center justify-center hover:border-white/40 transition-all"
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={14} className="text-white/60" />
          )}
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/10 rounded-xl p-3 min-w-[160px] animate-fade-in">
            <p className="text-white/80 text-[11px] font-medium truncate mb-2">{name}</p>
            <button
              onClick={() => { signOut(); setShowMenu(false); }}
              className="flex items-center gap-2 text-white/50 hover:text-white text-[11px] transition-colors w-full"
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="fixed top-24 right-4 z-50 w-9 h-9 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm flex items-center justify-center hover:border-white/40 hover:bg-white/10 transition-all group"
      title="Sign in to save scores"
    >
      <LogIn size={14} className="text-white/50 group-hover:text-white transition-colors" />
    </button>
  );
};

export default GameAuthButton;
