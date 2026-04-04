export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #06060e 0%, #0a0a14 50%, #07070f 100%)",
      }}
    >
      {/* Decorative suit symbols */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span
          style={{
            fontSize: "22rem",
            color: "rgba(212,160,23,0.025)",
            lineHeight: 1,
            transform: "rotate(-10deg)",
            userSelect: "none",
          }}
        >
          ♠
        </span>
      </div>
      <div
        className="absolute top-8 right-8 pointer-events-none select-none"
        style={{ fontSize: "6rem", color: "rgba(212,160,23,0.04)", lineHeight: 1 }}
        aria-hidden="true"
      >
        ♥
      </div>
      <div
        className="absolute bottom-8 left-8 pointer-events-none select-none"
        style={{ fontSize: "6rem", color: "rgba(212,160,23,0.04)", lineHeight: 1 }}
        aria-hidden="true"
      >
        ♦
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-bold"
              style={{
                background: "linear-gradient(135deg, #c8920f, #f5c842)",
                boxShadow: "0 0 24px rgba(212,160,23,0.5)",
                color: "#07070f",
              }}
            >
              ♠
            </div>
            <span
              className="text-2xl font-bold tracking-wide"
              style={{
                background: "linear-gradient(135deg, #d4a017, #f5d060, #c8920f)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Poker League
            </span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
