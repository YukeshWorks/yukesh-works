import { useState, useEffect, useCallback } from "react";

const CARD_EMOJIS = ["🌈", "🔥", "💎", "👑", "⚡", "🎭", "🌊", "🦋"];

const SAVAGE_WIN_MSGS = [
  "Took you long enough... my WiFi loaded faster 🐌",
  "Congrats! You have the memory of a... wait, what was I saying? 🧠",
  "You won but at what cost? {moves} moves of pure suffering 😩",
  "Even a goldfish would've done it in fewer moves 🐠",
  "Victory! Your brain cell (singular) is celebrating 🎉",
  "GG... but also, {moves} moves? Really? 💀",
  "You matched emojis. Your parents must be SO proud 👏",
  "Winner winner... but that move count is a sin 📊",
];

const SAVAGE_MISMATCH_MSGS = [
  "Were you even looking? 👀",
  "That wasn't it, chief 🚫",
  "Your memory is giving amnesia 🧠💨",
  "Bro just guessing at this point 🎲",
  "Those two don't even look alike 😭",
  "Wrong. Again. Shocking. 🤯",
  "The cards are SCREAMING at you rn 🗣️",
  "Even a random click would be better 🎰",
  "Did you close your eyes? Be honest 😴",
  "Pain. Agony, even. 💀",
];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [mismatchMsg, setMismatchMsg] = useState("");
  const [showMismatchMsg, setShowMismatchMsg] = useState(false);
  const [consecutiveFails, setConsecutiveFails] = useState(0);

  const initGame = useCallback(() => {
    const pairs = [...CARD_EMOJIS, ...CARD_EMOJIS];
    const shuffled = pairs
      .map((emoji, i) => ({ id: i, emoji, isFlipped: false, isMatched: false, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort, ...card }, i) => ({ ...card, id: i }));
    setCards(shuffled);
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setIsLocked(false);
    setGameWon(false);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const handleCardClick = (id: number) => {
    if (isLocked) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;
    if (flippedIds.length >= 2) return;

    const newCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsLocked(true);
      const [first, second] = newFlipped.map(fid => newCards.find(c => c.id === fid)!);

      if (first.emoji === second.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first.id || c.id === second.id ? { ...c, isMatched: true } : c
          ));
          setFlippedIds([]);
          setIsLocked(false);
          setConsecutiveFails(0);
          setShowMismatchMsg(false);
          setMatches(m => {
            const newM = m + 1;
            if (newM === CARD_EMOJIS.length) {
              setGameWon(true);
              setBestScore(prev => prev === 0 ? moves + 1 : Math.min(prev, moves + 1));
            }
            return newM;
          });
        }, 500);
      } else {
        setConsecutiveFails(prev => prev + 1);
        const msg = SAVAGE_MISMATCH_MSGS[Math.floor(Math.random() * SAVAGE_MISMATCH_MSGS.length)];
        setMismatchMsg(msg);
        setShowMismatchMsg(true);
        setTimeout(() => setShowMismatchMsg(false), 1500);
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c
          ));
          setFlippedIds([]);
          setIsLocked(false);
        }, 800);
      }
    }
  };

  return (
    <section className="min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden pt-16 page-transition">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float-slow delay-300" />

      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-md px-4">
        <div className="text-center mb-1">
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            <span className="text-foreground">Memory</span>
            <span className="gradient-text ml-2">Match</span>
          </h2>
          <p className="text-muted-foreground text-xs mt-1">Find all matching pairs</p>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="glass px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">Moves: </span>
            <span className="text-primary font-bold">{moves}</span>
          </div>
          <div className="glass px-4 py-2 rounded-lg">
            <span className="text-muted-foreground">Pairs: </span>
            <span className="text-primary font-bold">{matches}/{CARD_EMOJIS.length}</span>
          </div>
          {bestScore > 0 && (
            <div className="glass px-4 py-2 rounded-lg">
              <span className="text-muted-foreground">Best: </span>
              <span className="text-primary font-bold">{bestScore}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 w-full max-w-[340px]">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-500 transform-gpu
                ${card.isMatched
                  ? 'bg-primary/20 border border-primary/40 scale-95 opacity-80'
                  : card.isFlipped
                    ? 'glass glow-border scale-105 rotate-y-0'
                    : 'glass hover:scale-105 hover:glow-border cursor-pointer'
                }
              `}
              style={{
                transformStyle: 'preserve-3d',
                transform: card.isFlipped || card.isMatched ? 'rotateY(0deg)' : 'rotateY(180deg)',
              }}
              disabled={card.isMatched}
            >
              <span
                className="transition-opacity duration-300"
                style={{ opacity: card.isFlipped || card.isMatched ? 1 : 0 }}
              >
                {card.emoji}
              </span>
              {!card.isFlipped && !card.isMatched && (
                <span className="absolute text-primary/30 text-lg">?</span>
              )}
            </button>
          ))}
        </div>

        {/* Savage mismatch message - below game grid */}
        <div className="h-10 flex items-center justify-center">
          {showMismatchMsg && (
            <p className="text-destructive text-sm font-bold animate-fade-in pointer-events-none">
              {mismatchMsg}
              {consecutiveFails >= 3 && ` (${consecutiveFails}x streak 💀)`}
            </p>
          )}
        </div>

        {gameWon && (
          <div className="glass rounded-2xl p-6 text-center glow-border fade-in-up">
            <p className="font-display text-xl font-bold text-primary mb-1">🎉 You Won!</p>
            <p className="text-muted-foreground text-xs mb-2 italic max-w-[260px]">
              {SAVAGE_WIN_MSGS[Math.floor(Math.random() * SAVAGE_WIN_MSGS.length)].replace("{moves}", String(moves))}
            </p>
            <p className="text-muted-foreground text-sm mb-3">Completed in {moves} moves</p>
            <button
              onClick={initGame}
              className="glass px-4 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors btn-glow"
            >
              Try Again (you'll need it) 🔄
            </button>
          </div>
        )}

        {!gameWon && (
          <button
            onClick={initGame}
            className="glass px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Restart
          </button>
        )}
      </div>
    </section>
  );
};

export default MemoryGame;
