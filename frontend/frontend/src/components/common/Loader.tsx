// Full-page loading screen with random funny phrases — shown while data loads
const PHRASES = [
  { emoji: "🚀", text: "Launching the warehouse...",      sub: "Houston, we have inventory." },
  { emoji: "☕", text: "Brewing your dashboard...",        sub: "Good things take time. Bad things take longer." },
  { emoji: "🧠", text: "Consulting the stock oracle...",  sub: "It knows all. It judges none." },
  { emoji: "🐢", text: "Moving at startup speed...",      sub: "Which is fast, we promise." },
  { emoji: "🎯", text: "Aligning your inventory...",      sub: "Step 1: Open app. Step 2: Profit." },
  { emoji: "⚡", text: "Charging up the servers...",      sub: "They run on caffeine and hope." },
];

// Pick a random phrase once when the module loads (stays stable during the session)
const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];

export default function Loader() {
  return (
    <div className="page-loader">
      <div className="page-loader-icon">{phrase.emoji}</div>
      <p className="page-loader-text">{phrase.text}</p>
      <p className="page-loader-sub">{phrase.sub}</p>
    </div>
  );
}
