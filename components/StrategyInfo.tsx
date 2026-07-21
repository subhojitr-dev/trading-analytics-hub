function TrailingStopDiagram() {
  return (
    <svg viewBox="0 0 240 100" className="h-24 w-full">
      <line x1="10" y1="90" x2="230" y2="90" stroke="currentColor" strokeOpacity="0.2" />
      <path
        d="M10,85 L45,45 L80,60 L120,25 L160,40 L215,15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M45,65 L80,65 L80,50 L120,50 L120,35 L160,35 L160,25 L215,25"
        fill="none"
        stroke="#e11d48"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <text x="12" y="98" fontSize="8" fill="currentColor" opacity="0.6">
        price
      </text>
      <text x="150" y="98" fontSize="8" fill="#e11d48">
        trailing stop, steps up with price
      </text>
    </svg>
  );
}

function CopyTradeDiagram() {
  return (
    <svg viewBox="0 0 240 100" className="h-24 w-full">
      <text x="30" y="55" fontSize="28" textAnchor="middle">
        🏛️
      </text>
      <text x="30" y="85" fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.7">
        politician buys
      </text>
      <path
        d="M65,45 L165,45"
        stroke="currentColor"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />
      <text x="115" y="35" fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.7">
        disclosed publicly
      </text>
      <text x="200" y="55" fontSize="28" textAnchor="middle">
        🤖
      </text>
      <text x="200" y="85" fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.7">
        bot copies the buy
      </text>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}

function FlywheelDiagram() {
  const cx = 120;
  const cy = 52;
  const r = 34;
  const steps = [
    { label: "Sell Put", angle: -90 },
    { label: "Assigned", angle: 0 },
    { label: "Sell Call", angle: 90 },
    { label: "Called Away", angle: 180 },
  ];
  return (
    <svg viewBox="0 0 240 100" className="h-24 w-full">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.5"
        markerEnd="url(#cyclearrow)"
      />
      {steps.map((s) => {
        const rad = (s.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * r;
        const y = cy + Math.sin(rad) * r;
        return (
          <g key={s.label}>
            <circle cx={x} cy={y} r="3" fill="currentColor" />
            <text
              x={x}
              y={s.angle === -90 ? y - 8 : s.angle === 90 ? y + 14 : y + (s.angle === 0 ? -8 : 4)}
              fontSize="9"
              textAnchor="middle"
              fill="currentColor"
            >
              {s.label}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="cyclearrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,1 L7,4 L0,7 Z" fill="currentColor" opacity="0.6" />
        </marker>
      </defs>
    </svg>
  );
}

function StrangleDiagram() {
  return (
    <svg viewBox="0 0 240 100" className="h-24 w-full">
      <line x1="10" y1="35" x2="230" y2="35" stroke="currentColor" strokeOpacity="0.2" />
      <text x="14" y="30" fontSize="8" fill="currentColor" opacity="0.6">
        profit
      </text>
      <path
        d="M10,20 L95,75 L145,75 L230,20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M10,20 L95,75 L145,75 L230,20 L230,90 L10,90 Z" fill="#16a34a" opacity="0.08" />
      <rect x="95" y="75" width="50" height="12" fill="#e11d48" opacity="0.15" />
      <text x="120" y="84" fontSize="8" textAnchor="middle" fill="#e11d48">
        max loss (premium)
      </text>
      <text x="30" y="90" fontSize="8" fill="#16a34a">
        stock drops big
      </text>
      <text x="180" y="90" fontSize="8" fill="#16a34a">
        stock jumps big
      </text>
    </svg>
  );
}

function IronCondorDiagram() {
  return (
    <svg viewBox="0 0 240 100" className="h-24 w-full">
      <line x1="10" y1="75" x2="230" y2="75" stroke="currentColor" strokeOpacity="0.2" />
      <path
        d="M10,80 L60,80 L95,30 L145,30 L180,80 L230,80"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect x="95" y="30" width="50" height="45" fill="#16a34a" opacity="0.12" />
      <text x="120" y="45" fontSize="8" textAnchor="middle" fill="#16a34a">
        profit zone
      </text>
      <text x="120" y="57" fontSize="8" textAnchor="middle" fill="currentColor" opacity="0.6">
        (SPY stays in range)
      </text>
      <text x="35" y="93" fontSize="8" fill="#e11d48">
        SPY crashes
      </text>
      <text x="195" y="93" fontSize="8" fill="#e11d48">
        SPY spikes
      </text>
    </svg>
  );
}

export interface StrategyDetail {
  label: string;
  blurb: string;
  usefulWhen: string;
  Diagram: () => React.ReactElement;
}

export const STRATEGY_INFO: Record<string, StrategyDetail> = {
  TrailingStop: {
    label: "Trailing Stop",
    blurb:
      "Buys 15 hand-picked stocks and protects each position automatically: sells everything if it drops 10% from cost, \"trails\" a stop upward as it rises and locks in gains if it then pulls back 5% from the peak, or buys more if it drops 20% (averaging down).",
    usefulWhen: "Riding a trend while capping downside, without watching the market all day.",
    Diagram: TrailingStopDiagram,
  },
  CopyTrade: {
    label: "Copy Trade",
    blurb:
      "Watches public stock-trade disclosures from two politicians and automatically copies their buys — never sells, never holds more than 10 positions at once.",
    usefulWhen: "Piggybacking on trades made by people who may have an information edge, with zero manual research.",
    Diagram: CopyTradeDiagram,
  },
  Flywheel: {
    label: "Flywheel (Options Wheel)",
    blurb:
      "Repeatedly sells options on 4 stocks in a cycle: sell a put for premium → if assigned, own the shares → sell a call for more premium → if called away, repeat. Closes early once 70% of the max profit is captured.",
    usefulWhen: "Generating steady income from stocks you're happy to own, in sideways-to-up markets.",
    Diagram: FlywheelDiagram,
  },
  Strangle: {
    label: "Strangle (Earnings Play)",
    blurb:
      "Ahead of earnings, buys both a call and a put on the same stock — profits if it moves sharply in either direction. Only enters when the stock has a history of big earnings moves and options aren't already priced expensively.",
    usefulWhen: "Betting on volatility itself rather than a direction, around a binary catalyst like earnings.",
    Diagram: StrangleDiagram,
  },
  IronCondor: {
    label: "Iron Condor (SPY)",
    blurb:
      "Sells a range on SPY using two credit spreads — a put spread below the market and a call spread above it — and profits as time passes if SPY stays inside that range. Adjusts the threatened side if SPY moves too close to a strike.",
    usefulWhen: "Calm, range-bound markets — betting on nothing dramatic happening.",
    Diagram: IronCondorDiagram,
  },
};
