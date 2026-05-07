import { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom/client";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg: "#0a0c10", bgCard: "#0f1218", bgPanel: "#141820", bgHover: "#1a2030",
  border: "#1e2535", borderAccent: "#2a3550",
  green: "#00e676", greenDim: "#00c853", greenBg: "rgba(0,230,118,0.08)",
  red: "#ff3d57", redBg: "rgba(255,61,87,0.08)",
  yellow: "#ffc107", yellowBg: "rgba(255,193,7,0.08)",
  blue: "#2979ff", blueBg: "rgba(41,121,255,0.09)",
  text: "#e8eaf0", textDim: "#8892a4", textMuted: "#4a5568",
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const r2 = n => Math.round((n || 0) * 100) / 100;
const mono = { fontFamily: "'Space Mono', monospace" };

const Badge = ({ color = "green", children, small }) => {
  const map = {
    green: { bg: C.greenBg, fg: C.green, b: "#00e67628" },
    red: { bg: C.redBg, fg: C.red, b: "#ff3d5728" },
    yellow: { bg: C.yellowBg, fg: C.yellow, b: "#ffc10728" },
    blue: { bg: C.blueBg, fg: C.blue, b: "#2979ff28" },
    muted: { bg: "#1a2030", fg: C.textDim, b: C.border },
  };
  const s = map[color] || map.green;
  return (
    <span style={{
      background: s.bg, color: s.fg, border: `1px solid ${s.b}`,
      borderRadius: 4, padding: small ? "1px 6px" : "2px 9px",
      fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: "0.06em", ...mono,
    }}>{children}</span>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.bgCard, border: `1px solid ${C.border}`,
    borderRadius: 14, padding: 16, marginBottom: 12, ...style,
  }}>{children}</div>
);

const SecTitle = ({ icon, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
    <span style={{ fontSize: 15 }}>{icon}</span>
    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: "0.03em" }}>{children}</span>
  </div>
);

const Lbl = ({ children }) => (
  <div style={{ fontSize: 10, letterSpacing: "0.1em", color: C.textMuted, fontWeight: 700, marginBottom: 5, textTransform: "uppercase", ...mono }}>{children}</div>
);

const Toggle = ({ value, onChange, label, sub }) => (
  <div onClick={() => onChange(!value)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer", gap: 10 }}>
    <div style={{ flex: 1 }}>
      <div style={{ color: value ? C.text : C.textDim, fontSize: 13 }}>{label}</div>
      {sub && <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
    <div style={{ width: 38, height: 20, borderRadius: 10, background: value ? C.green : C.bgHover, border: `1px solid ${value ? C.green : C.border}`, position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: value ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: value ? "#000" : C.textMuted, transition: "left 0.2s" }} />
    </div>
  </div>
);

const NumInput = ({ label, value, onChange, unit = "" }) => (
  <div style={{ marginBottom: 12 }}>
    <Lbl>{label}</Lbl>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, background: C.bgPanel, border: `1px solid ${C.borderAccent}`, borderRadius: 8, color: C.text, padding: "10px 12px", fontSize: 15, outline: "none", WebkitAppearance: "none", ...mono }} />
      {unit && <span style={{ color: C.textDim, fontSize: 12 }}>{unit}</span>}
    </div>
  </div>
);

const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    <Lbl>{label}</Lbl>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: C.bgPanel, border: `1px solid ${C.borderAccent}`, borderRadius: 8, color: C.text, padding: "10px 12px", fontSize: 14, outline: "none" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const SignalBox = ({ signal, reason, sub }) => {
  const map = {
    "强烈买入": { fg: C.green, bg: C.greenBg, b: "#00e67640", icon: "▲" },
    "买入": { fg: C.green, bg: C.greenBg, b: "#00e67622", icon: "△" },
    "持有": { fg: C.yellow, bg: C.yellowBg, b: "#ffc10722", icon: "─" },
    "减仓": { fg: C.yellow, bg: C.yellowBg, b: "#ffc10722", icon: "▽" },
    "卖出": { fg: C.red, bg: C.redBg, b: "#ff3d5722", icon: "▼" },
    "强烈卖出": { fg: C.red, bg: C.redBg, b: "#ff3d5740", icon: "▼▼" },
    "观察": { fg: C.blue, bg: C.blueBg, b: "#2979ff22", icon: "○" },
    "空仓": { fg: C.textDim, bg: "#1a2030", b: C.border, icon: "✕" },
  };
  const s = map[signal] || map["观察"];
  return (
    <div style={{ background: s.bg, border: `2px solid ${s.b}`, borderRadius: 16, padding: "18px 16px", textAlign: "center", marginBottom: 14 }}>
      <div style={{ fontSize: 26, color: s.fg, fontWeight: 900, marginBottom: 4, ...mono }}>{s.icon} {signal}</div>
      <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: sub ? 6 : 0 }}>{reason}</div>
      {sub && <div style={{ color: C.textDim, fontSize: 11, lineHeight: 1.6 }}>{sub}</div>}
    </div>
  );
};

const ScoreBar = ({ label, score, max = 12 }) => {
  const pct = Math.min(1, score / max);
  const color = pct > 0.65 ? C.green : pct > 0.35 ? C.yellow : C.red;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.textDim }}>{label}</span>
        <span style={{ fontSize: 12, color, fontWeight: 700, ...mono }}>{score}/{max}</span>
      </div>
      <div style={{ height: 4, background: C.bgPanel, borderRadius: 2 }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
};

// Mini K-line chart
const MiniChart = ({ klines }) => {
  if (!klines || klines.length === 0) return null;
  const closes = klines.map(k => k.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const W = 280, H = 52, pad = 4;
  const pts = closes.map((c, i) => {
    const x = pad + (i / (closes.length - 1)) * (W - pad * 2);
    const y = H - pad - ((c - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const lastChange = closes.at(-1) - closes.at(-2);
  const color = lastChange >= 0 ? C.green : C.red;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", marginTop: 8 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={pts.split(' ').at(-1).split(',')[0]} cy={pts.split(' ').at(-1).split(',')[1]} r="3" fill={color} />
    </svg>
  );
};

// Loading spinner
const Spinner = () => (
  <div style={{ display: "inline-block", width: 14, height: 14, border: `2px solid ${C.border}`, borderTopColor: C.green, borderRadius: "50%", animation: "spin 0.8s linear infinite" }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── ANALYSIS ENGINES ──────────────────────────────────────────────────────────

function analyzeMarket(m) {
  let score = 0;
  const ok = [], warn = [];
  if (m.limitUpCount >= 50) { score += 2; ok.push(`涨停${m.limitUpCount}家 ✓`); }
  else if (m.limitUpCount >= 30) { score += 1; ok.push(`涨停${m.limitUpCount}家`); }
  else warn.push(`涨停仅${m.limitUpCount}家 不足`);
  if (m.limitDownCount <= 15) { score += 2; ok.push(`跌停${m.limitDownCount}家 ✓`); }
  else warn.push(`跌停${m.limitDownCount}家 过多`);
  if (m.boardHeight >= 3) { score += 2; ok.push(`连板高度${m.boardHeight}板 ✓`); }
  else warn.push(`连板高度${m.boardHeight}板 不足`);
  if (m.boardRate >= 45) { score += 1; ok.push(`晋级率${m.boardRate}% ✓`); }
  if (m.mainlineCount >= 3) { score += 1; ok.push("主线明确"); }
  else warn.push("主线不清晰");
  if (m.bombRate <= 40) { score += 1; ok.push(`炸板率${m.bombRate}% 正常`); }
  else warn.push(`炸板率${m.bombRate}% 过高`);
  if (m.topStocksBroken) warn.push("高位股核按钮");
  if (m.oneDay) warn.push("题材一日游");
  if (m.indexWeak) warn.push("指数走弱");
  let state, signal;
  if (m.topStocksBroken || m.limitDownCount > 30 || m.bombRate > 55) { state = "必须空仓"; signal = "空仓"; }
  else if (score >= 8) { state = "可进攻"; signal = "强烈买入"; }
  else if (score >= 6) { state = "谨慎进攻"; signal = "买入"; }
  else if (score >= 4) { state = "观望"; signal = "观察"; }
  else { state = "必须空仓"; signal = "空仓"; }
  return { score, ok, warn, state, signal };
}

function analyzeStock(s) {
  let bull = 0, bear = 0;
  const sigs = [], warns = [];
  if (s.priceAboveMiddle) { bull += 2; sigs.push("价格站稳中轨上方"); } else { bear += 2; warns.push("价格跌破中轨"); }
  if (s.middleBandUp) { bull += 2; sigs.push("中轨方向向上"); } else { bear += 1; warns.push("中轨走平/向下"); }
  if (s.bollExpanding) { bull += 1; sigs.push("布林线开口扩张"); }
  if (s.bollShrinking) { bear += 1; warns.push("布林线收口"); }
  if (s.nearUpperBand && s.middleBandUp) { bull += 1; sigs.push("触及上轨·强势特征"); }
  if (s.nearLowerBand && !s.middleBandUp) { bear += 2; warns.push("贴近下轨"); }
  const e5 = s.expma5 || s.expma?.e5 || 0;
  const e12 = s.expma12 || s.expma?.e12 || 0;
  const e26 = s.expma26 || s.expma?.e26 || 0;
  if (e5 > e12 && e12 > e26) { bull += 3; sigs.push("EXPMA多头排列(5>12>26)"); }
  else if (e5 < e12 && e12 < e26) { bear += 3; warns.push("EXPMA空头排列"); }
  else if (e5 < e12) { bear += 1; warns.push("EXPMA 5日死叉12日"); }
  if (s.ralliesWithVolume && s.pullbacksShrink) { bull += 2; sigs.push("上涨放量·回调缩量"); }
  else if (!s.ralliesWithVolume && !s.pullbacksShrink) { bear += 2; warns.push("下跌放量·反弹无量"); }
  if (s.volumeBreakMiddle) { bear += 2; warns.push("⚠ 放量跌破中轨·真破位"); }
  if (s.shrinkBreakMiddle) { bull += 1; sigs.push("缩量跌破中轨·疑洗盘"); }
  if (s.obvNewLow) { bear += 1; warns.push("OBV创新低·资金流出"); }
  if (s.rsi6Turning && s.rsi14 > 50) { bull += 1; sigs.push("RSI回升且>50"); }
  let signal, reason;
  const diff = bull - bear;
  if (diff >= 6) { signal = "强烈买入"; reason = "多指标共振看多"; }
  else if (diff >= 3) { signal = "买入"; reason = "趋势健康可介入"; }
  else if (diff >= 1) { signal = "持有"; reason = "趋势完好继续持有"; }
  else if (diff === 0) { signal = "观察"; reason = "多空平衡等待方向"; }
  else if (diff >= -2) { signal = "减仓"; reason = "出现破位信号"; }
  else { signal = "卖出"; reason = "空头信号确认"; }
  return { signal, reason, bull, bear, sigs, warns };
}

function calcRisk(r) {
  const cap = r.totalCapital, sl = r.stopLossRate / 100;
  const maxLoss = cap * (r.maxSingleLoss / 100);
  const maxPos = Math.min(maxLoss / sl, cap * (r.maxPositionPct / 100));
  const shares = Math.floor(maxPos / r.stockPrice / 100) * 100;
  const actual = shares * r.stockPrice;
  return {
    suggested: actual, shares,
    stopPrice: r2(r.stockPrice * (1 - sl)),
    target1: r2(r.stockPrice * 1.05),
    target2: r2(r.stockPrice * 1.10),
    riskAmount: Math.round(actual * sl),
    positionPct: r2((actual / cap) * 100),
  };
}

const STAGES = [null,
  { name: "底部启动", icon: "🌱", color: C.green, bg: C.greenBg, action: "10-20%试探", desc: "BOLL收口→放量突破，EXPMA开始粘合" },
  { name: "上升趋势确立", icon: "📈", color: C.green, bg: C.greenBg, action: "60-80%重仓", desc: "价格站稳中轨，中轨向上，EXPMA多头" },
  { name: "主升浪/加速", icon: "🚀", color: C.green, bg: C.greenBg, action: "持有不卖", desc: "沿上轨运行，上轨变支撑，卖飞风险最大" },
  { name: "上升回调/洗盘", icon: "🌊", color: C.yellow, bg: C.yellowBg, action: "缩量持有/加", desc: "缩量回踩中轨，次日确认法" },
  { name: "顶部震荡/筑顶", icon: "⚡", color: C.yellow, bg: C.yellowBg, action: "逐步减仓", desc: "天量十字星，BOLL收口，放量滞涨" },
  { name: "下跌趋势确立", icon: "💧", color: C.red, bg: C.redBg, action: "清仓空仓", desc: "连续跌破中轨，EXPMA死叉，下跌放量" },
  { name: "下跌反弹/诱多", icon: "🪝", color: C.red, bg: C.redBg, action: "不抄底", desc: "反弹至中轨遇阻，缩量反弹，假金叉" },
  { name: "超跌极端筑底", icon: "🏔️", color: C.yellow, bg: C.yellowBg, action: "5-10%极小仓", desc: "BOLL极度收窄，等放量K线定生死" },
];

const TABS = [
  { id: "market", icon: "🌐", label: "市场" },
  { id: "stock", icon: "📊", label: "个股" },
  { id: "stage", icon: "📈", label: "阶段" },
  { id: "risk", icon: "🛡️", label: "风控" },
  { id: "ref", icon: "📋", label: "速查" },
];

// ── MAIN APP ──────────────────────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState("market");

  // ── Market state ──
  const [market, setMarket] = useState({
    limitUpCount: 50, limitDownCount: 10, boardHeight: 3,
    boardRate: 50, mainlineCount: 3, bombRate: 30,
    topStocksBroken: false, oneDay: false, indexWeak: false,
    emotionPhase: "回暖",
  });

  // ── Stock state ──
  const [stock, setStock] = useState({
    priceAboveMiddle: true, middleBandUp: true, bollExpanding: true, bollShrinking: false,
    nearUpperBand: false, nearLowerBand: false,
    expma5: 12, expma12: 10, expma26: 8,
    ralliesWithVolume: true, pullbacksShrink: true,
    volumeBreakMiddle: false, shrinkBreakMiddle: false,
    obvNewLow: false, rsi6Turning: true, rsi14: 55,
  });

  // ── Auto-fetch state ──
  const [stockCode, setStockCode] = useState("");
  const [stockInfo, setStockInfo] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState("");
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState("");
  const [mktExtra, setMktExtra] = useState(null); // extra market data (themes, dragons etc)
  const [lastMktTime, setLastMktTime] = useState("");
  const [lastStockTime, setLastStockTime] = useState("");
  const autoTimer = useRef(null);

  // ── Stage ──
  const [selStage, setSelStage] = useState(2);

  // ── Risk ──
  const [risk, setRisk] = useState({
    totalCapital: 100000, stockPrice: 10,
    stopLossRate: 6, maxSingleLoss: 2, maxPositionPct: 20,
  });

  const setM = (k, v) => setMarket(p => ({ ...p, [k]: v }));
  const setS = (k, v) => setStock(p => ({ ...p, [k]: v }));
  const setR = (k, v) => setRisk(p => ({ ...p, [k]: v }));

  // ── Fetch stock data ───────────────────────────────────────────
  const fetchStock = useCallback(async (code) => {
    if (!code || !/^\d{6}$/.test(code)) {
      setStockError("请输入6位股票代码");
      return;
    }
    setStockLoading(true);
    setStockError("");
    try {
      const res = await fetch(`/api/stock?code=${code}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStockInfo(data);
      setLastStockTime(data.timestamp);
      // Auto-populate stock analysis toggles
      setStock(prev => ({
        ...prev,
        priceAboveMiddle: data.priceAboveMiddle,
        middleBandUp: data.middleBandUp,
        bollExpanding: data.bollExpanding,
        bollShrinking: data.bollShrinking,
        nearUpperBand: data.nearUpperBand,
        nearLowerBand: data.nearLowerBand,
        expma5: data.expma?.e5 || prev.expma5,
        expma12: data.expma?.e12 || prev.expma12,
        expma26: data.expma?.e26 || prev.expma26,
        ralliesWithVolume: data.ralliesWithVolume,
        pullbacksShrink: data.pullbacksShrink,
        volumeBreakMiddle: data.volumeBreakMiddle,
        shrinkBreakMiddle: data.shrinkBreakMiddle,
        obvNewLow: data.obvNewLow,
      }));
      // Update risk price
      if (data.price > 0) setRisk(p => ({ ...p, stockPrice: data.price }));
    } catch (e) {
      setStockError(e.message);
    }
    setStockLoading(false);
  }, []);

  // ── Fetch market data ──────────────────────────────────────────
  const fetchMarket = useCallback(async () => {
    setMarketLoading(true);
    setMarketError("");
    try {
      const res = await fetch("/api/market");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMktExtra(data);
      setLastMktTime(data.timestamp);
      setMarket(prev => ({
        ...prev,
        limitUpCount: data.limitUpCount,
        limitDownCount: data.limitDownCount,
        boardHeight: data.boardHeight,
        boardRate: data.boardRate,
        bombRate: data.bombRate,
        mainlineCount: data.mainlineCount,
      }));
    } catch (e) {
      setMarketError(e.message);
    }
    setMarketLoading(false);
  }, []);

  // ── Auto-refresh every 5 min during trading hours ──────────────
  useEffect(() => {
    const scheduleRefresh = () => {
      autoTimer.current = setInterval(() => {
        const now = new Date();
        const h = now.getHours(), m = now.getMinutes();
        const isTradingTime = (h === 9 && m >= 30) || (h >= 10 && h < 11) ||
          (h === 11 && m === 30) || (h >= 13 && h < 15);
        if (isTradingTime) {
          fetchMarket();
          if (stockCode) fetchStock(stockCode);
        }
      }, 5 * 60 * 1000);
    };
    scheduleRefresh();
    return () => clearInterval(autoTimer.current);
  }, [fetchMarket, fetchStock, stockCode]);

  // ── Computed ───────────────────────────────────────────────────
  const mktResult = analyzeMarket(market);
  const stockResult = analyzeStock(stock);
  const riskResult = calcRisk(risk);
  const stageInfo = STAGES[selStage];

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ padding: "14px 16px 10px", background: C.bgCard, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "0.05em", background: `linear-gradient(90deg, ${C.green}, ${C.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", ...mono }}>
              郭氏交易模型
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: "0.08em", marginTop: 1 }}>BOLL·EXPMA·量价·情绪 实时分析</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastMktTime && <span style={{ fontSize: 10, color: C.textMuted, ...mono }}>{lastMktTime}</span>}
            <Badge color={mktResult.signal === "空仓" ? "muted" : mktResult.signal.includes("买") ? "green" : "yellow"}>
              {mktResult.state}
            </Badge>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>

        {/* ═══════════════ MARKET TAB ═══════════════ */}
        {tab === "market" && (
          <div>
            {/* Auto-fetch button */}
            <Card style={{ background: C.bgPanel }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={fetchMarket} disabled={marketLoading}
                  style={{ flex: 1, background: marketLoading ? C.bgHover : `linear-gradient(135deg, ${C.greenDim}, #00897b)`, border: "none", borderRadius: 10, color: "#000", padding: "12px 0", fontSize: 13, fontWeight: 900, cursor: marketLoading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.04em" }}>
                  {marketLoading ? <><Spinner /> 获取中…</> : "🔄 自动获取市场数据"}
                </button>
              </div>
              {marketError && <div style={{ color: C.red, fontSize: 11, marginTop: 8 }}>⚠ {marketError}</div>}
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6, textAlign: "center" }}>每5分钟交易时段自动刷新 · 盘后手动刷新</div>
            </Card>

            <SignalBox signal={mktResult.signal} reason={`市场得分 ${mktResult.score}/10 · ${mktResult.state}`}
              sub={mktResult.warn.slice(0, 2).join(" · ") || "市场环境良好"} />

            {/* Top themes & dragons from auto data */}
            {mktExtra && (
              <Card>
                <SecTitle icon="🔥">主线题材</SecTitle>
                <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>
                  主线：<span style={{ color: C.yellow, fontWeight: 700 }}>{mktExtra.mainlineTheme}</span>
                  <span style={{ color: C.textMuted, marginLeft: 6 }}>{mktExtra.mainlineCount}只涨停</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {(mktExtra.topThemes || []).map((t, i) => (
                    <span key={i} style={{ background: C.bgHover, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, color: i === 0 ? C.yellow : C.textDim }}>
                      {t.name} <span style={{ color: C.green, ...mono }}>{t.count}</span>
                    </span>
                  ))}
                </div>
                {mktExtra.dragons?.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>龙头梯队</div>
                    {mktExtra.dragons.map((d, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                        <span style={{ color: C.text }}>{d.name}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Badge small color="green">{d.boards}连板</Badge>
                          {d.theme && <Badge small color="muted">{d.theme}</Badge>}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </Card>
            )}

            <Card>
              <SecTitle icon="🌡️">市场情绪</SecTitle>
              <Sel label="情绪阶段" value={market.emotionPhase} onChange={v => setM("emotionPhase", v)}
                options={[
                  { value: "冰点", label: "❄️ 冰点 — 必须空仓" },
                  { value: "回暖", label: "🌤 回暖 — 模型A进攻" },
                  { value: "高潮", label: "🔥 高潮 — 模型A末期" },
                  { value: "震荡", label: "🌊 震荡 — 模型B防御" },
                  { value: "退潮", label: "🌧 退潮 — 必须空仓" },
                ]} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <Lbl>涨停家数</Lbl>
                  <div style={{ fontSize: 22, fontWeight: 900, color: mktResult.ok.some(o => o.includes("涨停")) ? C.green : C.red, ...mono }}>{market.limitUpCount}</div>
                </div>
                <div>
                  <Lbl>跌停家数</Lbl>
                  <div style={{ fontSize: 22, fontWeight: 900, color: market.limitDownCount <= 15 ? C.green : C.red, ...mono }}>{market.limitDownCount}</div>
                </div>
                <div>
                  <Lbl>连板高度</Lbl>
                  <div style={{ fontSize: 22, fontWeight: 900, color: market.boardHeight >= 3 ? C.green : C.yellow, ...mono }}>{market.boardHeight}板</div>
                </div>
                <div>
                  <Lbl>炸板率</Lbl>
                  <div style={{ fontSize: 22, fontWeight: 900, color: market.bombRate <= 40 ? C.green : C.red, ...mono }}>{market.bombRate}%</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <NumInput label="涨停家数(手动微调)" value={market.limitUpCount} onChange={v => setM("limitUpCount", v)} unit="家" />
                <NumInput label="跌停家数" value={market.limitDownCount} onChange={v => setM("limitDownCount", v)} unit="家" />
                <NumInput label="连板晋级率" value={market.boardRate} onChange={v => setM("boardRate", v)} unit="%" />
              </div>
            </Card>

            <Card>
              <SecTitle icon="🚨">一票否决</SecTitle>
              <Toggle value={market.topStocksBroken} onChange={v => setM("topStocksBroken", v)} label="高位股连续核按钮" sub="龙头杀·情绪退潮" />
              <Toggle value={market.oneDay} onChange={v => setM("oneDay", v)} label="题材一日游" sub="无主线·轮动过快" />
              <Toggle value={market.indexWeak} onChange={v => setM("indexWeak", v)} label="指数弱·个股普跌" sub="系统性风险" />
            </Card>

            <Card style={{ background: C.bgPanel }}>
              <SecTitle icon="🎯">模型建议</SecTitle>
              {market.emotionPhase === "回暖" && <div style={{ color: C.green, fontSize: 13, lineHeight: 1.7 }}>✓ 优先<b>模型A</b>：龙头分歧转一致<br />主买点 1320-1430，回封瞬间介入</div>}
              {market.emotionPhase === "震荡" && <div style={{ color: C.yellow, fontSize: 13, lineHeight: 1.7 }}>◎ 优先<b>模型B</b>：趋势回踩中轨低吸<br />1440-1455 尾盘确认站稳均线买入</div>}
              {market.emotionPhase === "高潮" && <div style={{ color: C.yellow, fontSize: 13, lineHeight: 1.7 }}>⚡ 模型A末期：次日冲高先兑现<br />+5% 先减 1/3，防隔夜大幅低开</div>}
              {(market.emotionPhase === "退潮" || market.emotionPhase === "冰点") && <div style={{ color: C.red, fontSize: 13, lineHeight: 1.7 }}>✕ 必须空仓，环境错了个股再好也不做<br />等情绪回暖信号再介入</div>}
            </Card>

            {mktResult.ok.length > 0 && (
              <Card style={{ background: C.greenBg, border: `1px solid #00e67620` }}>
                {mktResult.ok.map((f, i) => <div key={i} style={{ color: C.green, fontSize: 12, padding: "3px 0" }}>✓ {f}</div>)}
              </Card>
            )}
            {mktResult.warn.length > 0 && (
              <Card style={{ background: C.redBg, border: `1px solid #ff3d5720` }}>
                {mktResult.warn.map((w, i) => <div key={i} style={{ color: C.red, fontSize: 12, padding: "3px 0" }}>⚠ {w}</div>)}
              </Card>
            )}
          </div>
        )}

        {/* ═══════════════ STOCK TAB ═══════════════ */}
        {tab === "stock" && (
          <div>
            {/* Stock code input + fetch */}
            <Card style={{ background: C.bgPanel }}>
              <SecTitle icon="🔍">输入股票代码</SecTitle>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={stockCode}
                  onChange={e => setStockCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && fetchStock(stockCode)}
                  placeholder="如 600519"
                  maxLength={6}
                  style={{ flex: 1, background: C.bgCard, border: `1px solid ${C.borderAccent}`, borderRadius: 10, color: C.text, padding: "12px 14px", fontSize: 18, fontWeight: 700, outline: "none", letterSpacing: "0.08em", ...mono }}
                />
                <button onClick={() => fetchStock(stockCode)} disabled={stockLoading}
                  style={{ background: stockLoading ? C.bgHover : `linear-gradient(135deg, ${C.blue}, #1565c0)`, border: "none", borderRadius: 10, color: "#fff", padding: "0 20px", fontSize: 13, fontWeight: 700, cursor: stockLoading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {stockLoading ? <Spinner /> : "获取"}
                </button>
              </div>
              {stockError && <div style={{ color: C.red, fontSize: 12 }}>⚠ {stockError}</div>}
              {lastStockTime && <div style={{ fontSize: 10, color: C.textMuted, ...mono }}>更新时间：{lastStockTime} · 每5分钟自动刷新</div>}
            </Card>

            {/* Stock info card */}
            {stockInfo && (
              <Card style={{ background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgPanel})`, border: `1px solid ${stockInfo.changePct >= 0 ? "#00e67630" : "#ff3d5730"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{stockInfo.name}</div>
                    <div style={{ fontSize: 12, color: C.textDim, ...mono }}>{stockInfo.code}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: stockInfo.changePct >= 0 ? C.green : C.red, ...mono }}>{stockInfo.price}</div>
                    <div style={{ fontSize: 13, color: stockInfo.changePct >= 0 ? C.green : C.red, fontWeight: 700, ...mono }}>
                      {stockInfo.changePct >= 0 ? "+" : ""}{stockInfo.changePct}%
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                  {[
                    { l: "BOLL上轨", v: stockInfo.boll?.upper, c: C.textDim },
                    { l: "BOLL中轨", v: stockInfo.boll?.middle, c: C.yellow },
                    { l: "BOLL下轨", v: stockInfo.boll?.lower, c: C.textDim },
                    { l: "EMA5", v: stockInfo.expma?.e5, c: stockInfo.priceAboveMiddle ? C.green : C.red },
                    { l: "EMA12", v: stockInfo.expma?.e12, c: C.textDim },
                    { l: "量比", v: stockInfo.volumeRatio, c: stockInfo.volumeRatio > 1.5 ? C.green : C.textDim },
                  ].map((item, i) => (
                    <div key={i} style={{ background: C.bgHover, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 3, textTransform: "uppercase" }}>{item.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: item.c, ...mono }}>{item.v}</div>
                    </div>
                  ))}
                </div>
                <MiniChart klines={stockInfo.klines} />
              </Card>
            )}

            <SignalBox signal={stockResult.signal} reason={stockResult.reason}
              sub={`多头 ${stockResult.bull}分 | 空头 ${stockResult.bear}分`} />

            <Card>
              <ScoreBar label="多头强度" score={stockResult.bull} max={12} />
              <ScoreBar label="空头压力" score={stockResult.bear} max={12} />
            </Card>

            <Card>
              <SecTitle icon="📏">布林线</SecTitle>
              <Toggle value={stock.priceAboveMiddle} onChange={v => setS("priceAboveMiddle", v)} label="收盘价站稳中轨上方" />
              <Toggle value={stock.middleBandUp} onChange={v => setS("middleBandUp", v)} label="中轨方向向上(20MA上行)" />
              <Toggle value={stock.bollExpanding} onChange={v => setS("bollExpanding", v)} label="布林线开口扩张中" />
              <Toggle value={stock.bollShrinking} onChange={v => setS("bollShrinking", v)} label="布林线收口中" />
              <Toggle value={stock.nearUpperBand} onChange={v => setS("nearUpperBand", v)} label="价格触及/贴近上轨" sub="强势特征·非卖出信号" />
              <Toggle value={stock.nearLowerBand} onChange={v => setS("nearLowerBand", v)} label="价格触及/贴近下轨" />
              <Toggle value={stock.volumeBreakMiddle} onChange={v => setS("volumeBreakMiddle", v)} label="⚠ 放量跌破中轨(真破位)" />
              <Toggle value={stock.shrinkBreakMiddle} onChange={v => setS("shrinkBreakMiddle", v)} label="缩量跌破中轨(疑洗盘)" />
            </Card>

            <Card>
              <SecTitle icon="〽️">EXPMA值(自动填入)</SecTitle>
              <div style={{ display: "flex", gap: 8 }}>
                <NumInput label="EMA5" value={stock.expma5} onChange={v => setS("expma5", v)} />
                <NumInput label="EMA12" value={stock.expma12} onChange={v => setS("expma12", v)} />
                <NumInput label="EMA26" value={stock.expma26} onChange={v => setS("expma26", v)} />
              </div>
              <div style={{ padding: "6px 10px", background: C.bgHover, borderRadius: 8, fontSize: 12 }}>
                {stock.expma5 > stock.expma12 && stock.expma12 > stock.expma26
                  ? <span style={{ color: C.green }}>✓ 多头排列 (5{">"12>"}26)</span>
                  : stock.expma5 < stock.expma12 && stock.expma12 < stock.expma26
                  ? <span style={{ color: C.red }}>✕ 空头排列</span>
                  : <span style={{ color: C.yellow }}>◎ 排列混乱·需观察</span>}
              </div>
            </Card>

            <Card>
              <SecTitle icon="📊">量价关系</SecTitle>
              <Toggle value={stock.ralliesWithVolume} onChange={v => setS("ralliesWithVolume", v)} label="上涨时放量" />
              <Toggle value={stock.pullbacksShrink} onChange={v => setS("pullbacksShrink", v)} label="回调时缩量" />
              <Toggle value={stock.obvNewLow} onChange={v => setS("obvNewLow", v)} label="⚠ OBV创新低(资金流出)" />
            </Card>

            <Card>
              <SecTitle icon="📌">中轨五步判定</SecTitle>
              {[
                { l: "收盘价站稳中轨上", ok: stock.priceAboveMiddle },
                { l: "中轨方向向上", ok: stock.middleBandUp },
                { l: "EXPMA多头排列", ok: stock.expma5 > stock.expma12 },
                { l: "无放量跌破", ok: !stock.volumeBreakMiddle },
                { l: "缩量回踩(若有)", ok: stock.shrinkBreakMiddle || !stock.volumeBreakMiddle },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span>{item.ok ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 13, color: item.ok ? C.text : C.textMuted }}>{item.l}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, padding: 10, background: C.bgHover, borderRadius: 8, fontSize: 11, color: C.textDim, lineHeight: 1.7 }}>
                铁律：以<b style={{ color: C.yellow }}>收盘价</b>为唯一判定依据<br />盘中跌破一律视为假跌破，次日开盘30分钟定生死
              </div>
            </Card>

            {stockResult.sigs.length > 0 && (
              <Card style={{ background: C.greenBg, border: `1px solid #00e67620` }}>
                <SecTitle icon="✅">多头信号</SecTitle>
                {stockResult.sigs.map((s, i) => <div key={i} style={{ color: C.green, fontSize: 13, padding: "3px 0" }}>▸ {s}</div>)}
              </Card>
            )}
            {stockResult.warns.length > 0 && (
              <Card style={{ background: C.redBg, border: `1px solid #ff3d5720` }}>
                <SecTitle icon="⚠️">风险信号</SecTitle>
                {stockResult.warns.map((w, i) => <div key={i} style={{ color: C.red, fontSize: 13, padding: "3px 0" }}>▸ {w}</div>)}
              </Card>
            )}
          </div>
        )}

        {/* ═══════════════ STAGE TAB ═══════════════ */}
        {tab === "stage" && (
          <div>
            <Card>
              <SecTitle icon="🗺️">选择当前阶段</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {STAGES.slice(1).map((s, i) => {
                  const idx = i + 1;
                  const active = selStage === idx;
                  return (
                    <div key={idx} onClick={() => setSelStage(idx)}
                      style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: active ? s.bg : C.bgPanel, border: `1px solid ${active ? s.color + "55" : C.border}`, transition: "all 0.2s" }}>
                      <div style={{ fontSize: 18, marginBottom: 3 }}>{s.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: active ? s.color : C.textDim, lineHeight: 1.3 }}>阶段{idx}<br />{s.name}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {stageInfo && (
              <>
                <div style={{ background: stageInfo.bg, border: `2px solid ${stageInfo.color}40`, borderRadius: 16, padding: 20, marginBottom: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{stageInfo.icon}</div>
                  <div style={{ color: stageInfo.color, fontSize: 16, fontWeight: 900, marginBottom: 4 }}>阶段{selStage}：{stageInfo.name}</div>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>建议：{stageInfo.action}</div>
                  <div style={{ color: C.textDim, fontSize: 12, lineHeight: 1.7 }}>{stageInfo.desc}</div>
                </div>

                <Card>
                  <SecTitle icon="📋">操作指引</SecTitle>
                  {selStage === 1 && <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.9 }}>• BOLL收口后出现放量突破K线<br />• EXPMA开始粘合，等金叉确认<br />• 建议仓位：<b style={{ color: C.green }}>10-20%</b>小仓试探<br />• 止损：跌回收口区域立刻离场</div>}
                  {selStage === 2 && <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.9 }}>• 中轨向上，价格站稳中轨<br />• EXPMA 5{">"12>"}26多头排列<br />• 建议仓位：<b style={{ color: C.green }}>60-80%</b><br />• 回踩中轨缩量：<b style={{ color: C.green }}>加仓机会</b><br />• 止损：连续2日收盘跌破中轨</div>}
                  {selStage === 3 && <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.9 }}>• <b style={{ color: C.green }}>不卖！</b>触及上轨是强势特征<br />• 沿上轨运行：上轨变支撑<br />• 建议仓位：<b style={{ color: C.green }}>满仓持有</b><br />• 天量十字星+放量滞涨才预警<br />• 此时卖飞风险最大</div>}
                  {selStage === 4 && <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.9 }}>• 缩量回踩：<b style={{ color: C.green }}>坚决持有/加仓</b><br />• 当天不操作，次日开盘30分定生死<br />• 1-2日放量收回：洗盘，持有<br />• 3日无法收回：转弱，减仓30%<br />• 连续2日收在中轨下：清仓</div>}
                  {selStage === 5 && <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.9 }}>• <b style={{ color: C.yellow }}>逐步减仓</b><br />• +7%减1/3，+10%再减1/3<br />• 放量滞涨立刻清仓<br />• 天量十字星：次日观察<br />• EXPMA 5日死叉12日：必须走</div>}
                  {selStage === 6 && <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.9 }}>• <b style={{ color: C.red }}>清仓空仓</b>，不言底<br />• EXPMA空头排列，下跌有量<br />• 中轨从支撑变压力<br />• 下轨是下一个目标位，不接反弹</div>}
                  {selStage === 7 && <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.9 }}>• <b style={{ color: C.red }}>诱多陷阱，不接反弹</b><br />• 放量反弹首日放量次日缩量：假金叉<br />• 反弹至中轨遇阻继续下行<br />• 等待超跌后再观察</div>}
                  {selStage === 8 && <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.9 }}>• BOLL极度收窄，等放量K线<br />• 建议仓位：<b style={{ color: C.yellow }}>5-10%极小仓</b><br />• 放量向上突破→转阶段1/2<br />• 放量向下破→继续阶段6</div>}
                </Card>
              </>
            )}
          </div>
        )}

        {/* ═══════════════ RISK TAB ═══════════════ */}
        {tab === "risk" && (
          <div>
            <Card>
              <SecTitle icon="💰">仓位计算器</SecTitle>
              <NumInput label="总资金" value={risk.totalCapital} onChange={v => setR("totalCapital", v)} unit="元" />
              <NumInput label="买入价格(自动同步)" value={risk.stockPrice} onChange={v => setR("stockPrice", v)} unit="元" />
              <NumInput label="止损比例" value={risk.stopLossRate} onChange={v => setR("stopLossRate", v)} unit="%" />
              <NumInput label="单票最大亏损" value={risk.maxSingleLoss} onChange={v => setR("maxSingleLoss", v)} unit="%" />
              <NumInput label="单票最大仓位" value={risk.maxPositionPct} onChange={v => setR("maxPositionPct", v)} unit="%" />
            </Card>

            <Card style={{ background: C.greenBg, border: `1px solid #00e67630` }}>
              <SecTitle icon="📊">计算结果</SecTitle>
              {[
                { l: "建议买入金额", v: `¥${Math.round(riskResult.suggested).toLocaleString()}`, c: C.green },
                { l: "建议股数", v: `${riskResult.shares} 股`, c: C.text },
                { l: "仓位占比", v: `${riskResult.positionPct}%`, c: C.text },
                { l: "止损价", v: `¥${riskResult.stopPrice}`, c: C.red },
                { l: "最大亏损", v: `¥${riskResult.riskAmount}`, c: C.red },
                { l: "目标1 (+5%)", v: `¥${riskResult.target1}`, c: C.green },
                { l: "目标2 (+10%)", v: `¥${riskResult.target2}`, c: C.green },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 6 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 13, color: C.textDim }}>{row.l}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: row.c, ...mono }}>{row.v}</span>
                </div>
              ))}
            </Card>

            <Card>
              <SecTitle icon="⚔️">风控铁律</SecTitle>
              {[
                ["单票亏损 -4%~-6%", "必须离场", "red"],
                ["48小时无盈利", "减半仓", "yellow"],
                ["持仓3天不创新高", "清仓", "red"],
                ["持仓3天最大盈利<3%", "无条件清仓", "red"],
                ["当日账户亏损 -2%~-3%", "停止交易", "red"],
                ["连续2笔亏损", "次日只观察", "yellow"],
                ["连续4笔亏损", "强制停止3天", "red"],
                ["单周回撤 -5%~-7%", "总仓位减半", "yellow"],
              ].map((r, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.textDim, flex: 1 }}>{r[0]}</span>
                  <Badge color={r[2]}>{r[1]}</Badge>
                </div>
              ))}
            </Card>

            <Card style={{ background: C.bgPanel }}>
              <SecTitle icon="📅">334仓位法</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[{ l: "底仓", p: "30%", c: C.blue }, { l: "机动", p: "30%", c: C.yellow }, { l: "现金", p: "40%", c: C.green }].map((item, i) => (
                  <div key={i} style={{ background: C.bgHover, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: item.c, ...mono }}>{item.p}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{item.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.8 }}>
                强市仓位上限：<b style={{ color: C.text }}>60%</b>，单票上限：<b style={{ color: C.text }}>20%</b><br />
                弱市：<b style={{ color: C.red }}>0%</b> · 胜率 ≥55% · 盈亏比 ≥1.5:1
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════ REFERENCE TAB ═══════════════ */}
        {tab === "ref" && (
          <div>
            <Card style={{ background: C.bgPanel }}>
              <SecTitle icon="⏰">买点时间窗口</SecTitle>
              {[
                ["09:30-09:50", "❌ 禁止追高", "red"],
                ["10:00-13:20", "👀 观察为主", "muted"],
                ["10:30-11:00", "🔵 低吸建仓(分歧转一致+3~+5%)", "blue"],
                ["13:20-14:20", "⭐ 主买点(回封瞬间)", "green"],
                ["14:20-14:50", "✓ 最终确认买点", "green"],
                ["14:40-14:55", "📌 模型B尾盘低吸", "green"],
                ["14:50后", "❌ 不临时起意抢板", "red"],
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ ...mono, fontSize: 10, color: C.textMuted, width: 78, flexShrink: 0 }}>{r[0]}</span>
                  <span style={{ fontSize: 12, color: r[2] === "green" ? C.green : r[2] === "red" ? C.red : r[2] === "blue" ? C.blue : C.textDim }}>{r[1]}</span>
                </div>
              ))}
            </Card>

            <Card>
              <SecTitle icon="📤">次日开盘预案</SecTitle>
              {[
                ["低开>2.5% 板块弱", "930-933卖70-100%", "red"],
                ["平开 945前无法收复VWAP", "清仓", "red"],
                ["高开>3% 板块不弱", "先止盈1/3", "yellow"],
                ["高开低走 跌破VWAP", "清仓", "red"],
                ["快速涨停 板块扩散", "持有·盯封单", "green"],
                ["龙头断板 板块退潮", "不幻想·卖出", "red"],
                ["盈利8-15% 放量滞涨", "分批止盈", "yellow"],
              ].map((r, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{r[0]}</div>
                  <Badge color={r[2]}>{r[1]}</Badge>
                </div>
              ))}
            </Card>

            <Card>
              <SecTitle icon="⚡">五大量价陷阱</SecTitle>
              {[
                ["缩量突破上轨", "假突破·1-2日回落", "red"],
                ["放量跌破中轨", "真破位·趋势逆转", "red"],
                ["缩量回踩3日不弹", "阴跌开始·非洗盘", "red"],
                ["放量反弹遇阻", "诱多·继续下行", "red"],
                ["天量十字星", "顶部信号·极致分歧", "yellow"],
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.textDim }}>{r[0]}</span>
                  <Badge color={r[2]}>{r[1]}</Badge>
                </div>
              ))}
            </Card>

            <Card>
              <SecTitle icon="🛡️">反量化规则</SecTitle>
              {[
                "不买全天在均价线下·尾盘才翻红的票",
                "不买只有个股涨·板块不跟的票",
                "不买缩量加速一致板",
                "不买反复炸板·回封越来越弱的票",
                "不买大单频繁撤单·封单虚胖的票",
                "不在情绪高潮次日接力",
              ].map((rule, i) => (
                <div key={i} style={{ fontSize: 12, color: C.textDim, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>✕ {rule}</div>
              ))}
            </Card>

            <Card style={{ background: C.bgPanel }}>
              <SecTitle icon="📖">盘后复盘五问</SecTitle>
              {["今天做的是不是主线？", "买点是不是分歧确认？", "有没有追一致？", "止损是否执行？", "明天哪些票必须卖？"]
                .map((q, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.text, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.green, ...mono, marginRight: 8 }}>0{i + 1}</span>{q}
                  </div>
                ))}
            </Card>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.bgCard, borderTop: `1px solid ${C.border}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "10px 4px 8px", border: "none", cursor: "pointer", background: "transparent", color: tab === t.id ? C.green : C.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400, letterSpacing: "0.04em", ...mono }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 16, height: 2, background: C.green, borderRadius: 1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
