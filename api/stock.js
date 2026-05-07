// api/stock.js — Vercel Serverless Function
// 获取个股实时行情 + 自动计算 BOLL(18,2) / EXPMA(5,12,26) / 量价信号

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { code } = req.query;
  if (!code || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "请输入6位股票代码" });
  }

  // 判断市场：沪市1 深市0
  const market = code.startsWith("6") ? "1" : "0";
  const secid = `${market}.${code}`;

  try {
    const headers = {
      Referer: "https://quote.eastmoney.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };

    // 并发请求：实时报价 + 日K线(60日)
    const [quoteRes, klineRes] = await Promise.all([
      fetch(
        `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}` +
          `&fields=f43,f44,f45,f46,f47,f48,f57,f58,f60,f107,f168,f169,f170,f171` +
          `&ut=bd1d9bfd84ebde1f3ade7d9c7c7eae87&fltt=2&invt=2`,
        { headers }
      ),
      fetch(
        `https://push2.eastmoney.com/api/qt/stock/kline/get?secid=${secid}` +
          `&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56` +
          `&klt=101&fqt=1&end=20500101&lmt=60` +
          `&ut=fa5fd1943c7b386f172d6893dbfba10b`,
        { headers }
      ),
    ]);

    const [quoteData, klineData] = await Promise.all([
      quoteRes.json(),
      klineRes.json(),
    ]);

    // 解析K线数据 date,open,close,high,low,volume
    const rawKlines = klineData?.data?.klines || [];
    if (rawKlines.length < 20) {
      return res.status(404).json({ error: "数据不足，请检查股票代码" });
    }

    const klines = rawKlines.map((k) => {
      const p = k.split(",");
      return {
        date: p[0],
        open: parseFloat(p[1]),
        close: parseFloat(p[2]),
        high: parseFloat(p[3]),
        low: parseFloat(p[4]),
        volume: parseFloat(p[5]),
      };
    });

    const closes = klines.map((k) => k.close);
    const volumes = klines.map((k) => k.volume);
    const n = closes.length;

    // ── BOLL (18, 2) ──────────────────────────────────────────────
    const boll = calcBOLL(closes, 18, 2);
    const lastBoll = {
      upper: round2(boll.upper.at(-1)),
      middle: round2(boll.middle.at(-1)),
      lower: round2(boll.lower.at(-1)),
    };
    const prevBollWidth = boll.upper.at(-2) - boll.lower.at(-2);
    const currBollWidth = boll.upper.at(-1) - boll.lower.at(-1);
    const bollExpanding = currBollWidth > prevBollWidth;
    const bollShrinking = currBollWidth < prevBollWidth * 0.97;

    // ── EXPMA (5, 12, 26) ─────────────────────────────────────────
    const ema5arr = calcEMA(closes, 5);
    const ema12arr = calcEMA(closes, 12);
    const ema26arr = calcEMA(closes, 26);

    const expma = {
      e5: round2(ema5arr.at(-1)),
      e12: round2(ema12arr.at(-1)),
      e26: round2(ema26arr.at(-1)),
      prev5: round2(ema5arr.at(-2)),
      prev12: round2(ema12arr.at(-2)),
    };

    // ── 实时报价 ──────────────────────────────────────────────────
    const q = quoteData?.data || {};
    // 东方财富接口价格已经是浮点数（fltt=2参数）
    const price = parseFloat(q.f43) || 0;
    const prevClose = parseFloat(q.f60) || 0;

    // ── 量价分析 ──────────────────────────────────────────────────
    const last5klines = klines.slice(-5);
    const last5vols = volumes.slice(-5);
    const vol5avg = last5vols.reduce((a, b) => a + b, 0) / 5;
    const latestVol = volumes.at(-1);

    // 近5日上涨日 vs 下跌日平均成交量
    const upDays = last5klines.filter((k) => k.close >= k.open);
    const downDays = last5klines.filter((k) => k.close < k.open);
    const avgUpVol = upDays.length
      ? upDays.reduce((a, k) => a + k.volume, 0) / upDays.length
      : 0;
    const avgDownVol = downDays.length
      ? downDays.reduce((a, k) => a + k.volume, 0) / downDays.length
      : 0;

    // 回调是否缩量（近3日均量 vs 5日均量）
    const vol3avg = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const pullbackShrink = vol3avg < vol5avg * 0.85;

    // ── 自动判断布尔信号 ─────────────────────────────────────────
    const priceAboveMiddle = price > lastBoll.middle;
    const middleBandUp = boll.middle.at(-1) > boll.middle.at(-2);
    const nearUpperBand = price >= lastBoll.upper * 0.995;
    const nearLowerBand = price <= lastBoll.lower * 1.005;
    const expmaMultiHead = expma.e5 > expma.e12 && expma.e12 > expma.e26;
    const expmaDeadCross = expma.prev5 >= expma.prev12 && expma.e5 < expma.e12;
    const ralliesWithVolume = avgUpVol > avgDownVol;

    // 放量/缩量跌破中轨判断
    const lastClose = closes.at(-1);
    const prevClose2 = closes.at(-2);
    const breakMiddle =
      lastClose < lastBoll.middle && prevClose2 >= boll.middle.at(-2);
    const volumeBreakMiddle = breakMiddle && latestVol > vol5avg * 1.3;
    const shrinkBreakMiddle = breakMiddle && latestVol < vol5avg * 0.8;

    // OBV简化计算（判断资金流向）
    let obv = 0;
    const obvArr = [];
    for (let i = 1; i < klines.length; i++) {
      obv +=
        klines[i].close >= klines[i - 1].close
          ? klines[i].volume
          : -klines[i].volume;
      obvArr.push(obv);
    }
    const obvNewLow = obvArr.at(-1) < Math.min(...obvArr.slice(-10, -1));

    return res.json({
      code,
      name: q.f58 || code,
      price: round2(price),
      prevClose: round2(prevClose),
      change: round2(parseFloat(q.f169) || 0),
      changePct: round2(parseFloat(q.f170) || 0),
      high: round2(parseFloat(q.f44) || 0),
      low: round2(parseFloat(q.f45) || 0),
      volume: parseInt(q.f47) || 0,
      volumeRatio: round2(parseFloat(q.f168) || 0),
      // BOLL
      boll: lastBoll,
      bollExpanding,
      bollShrinking,
      // EXPMA
      expma,
      // Price signals
      priceAboveMiddle,
      middleBandUp,
      nearUpperBand,
      nearLowerBand,
      // EXPMA signals
      expmaMultiHead,
      expmaDeadCross,
      // Volume signals
      ralliesWithVolume,
      pullbacksShrink: pullbackShrink,
      volumeBreakMiddle,
      shrinkBreakMiddle,
      obvNewLow,
      // Raw stats
      vol5avg: Math.round(vol5avg),
      latestVol,
      // Recent klines for mini-chart
      klines: klines.slice(-10).map((k) => ({
        date: k.date,
        close: round2(k.close),
        open: round2(k.open),
        high: round2(k.high),
        low: round2(k.low),
        volume: k.volume,
      })),
      timestamp: new Date().toLocaleTimeString("zh-CN"),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "数据获取失败：" + err.message });
  }
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calcBOLL(closes, period = 18, mult = 2) {
  const middle = [],
    upper = [],
    lower = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      middle.push(null);
      upper.push(null);
      lower.push(null);
      continue;
    }
    const slice = closes.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(
      slice.reduce((a, b) => a + (b - avg) ** 2, 0) / period
    );
    middle.push(avg);
    upper.push(avg + mult * std);
    lower.push(avg - mult * std);
  }
  return { middle, upper, lower };
}

function calcEMA(closes, period) {
  const k = 2 / (period + 1);
  const result = [];
  // 初始值用前period日均值
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < period - 1; i++) result.push(null);
  result.push(ema);
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}
