// api/market.js — Vercel Serverless Function
// 获取全市场情绪数据：涨停数、跌停数、连板高度、炸板率、主线题材

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const headers = {
    Referer: "https://quote.eastmoney.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  };

  try {
    // 并发请求：涨停 + 跌停 + 炸板（开板）
    const [ztRes, dtRes, zdRes] = await Promise.all([
      fetch(
        "https://push2ex.eastmoney.com/getTopicZT" +
          "?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt&Nt=0&Pt=0&json=1",
        { headers }
      ),
      fetch(
        "https://push2ex.eastmoney.com/getTopicDT" +
          "?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.dtdt&Nt=0&Pt=0&json=1",
        { headers }
      ),
      fetch(
        "https://push2ex.eastmoney.com/getTopicKBZBoard" +
          "?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.kbzb&Nt=0&Pt=0&json=1",
        { headers }
      ),
    ]);

    const [ztData, dtData, zdData] = await Promise.all([
      ztRes.json(),
      dtRes.json(),
      zdRes.json(),
    ]);

    const ztList = ztData?.data?.pool || [];
    const dtList = dtData?.data?.pool || [];
    const zdList = zdData?.data?.pool || [];

    // ── 连板高度 ──────────────────────────────────────────────────
    const boardHeights = ztList.map((s) => parseInt(s.lbc) || 1);
    const maxBoardHeight = boardHeights.length ? Math.max(...boardHeights) : 0;

    // ── 连板晋级率（2板以上 / 全部涨停）─────────────────────────
    const continuers = ztList.filter((s) => parseInt(s.lbc) >= 2).length;
    const boardRate = ztList.length
      ? Math.round((continuers / ztList.length) * 100)
      : 0;

    // ── 炸板率（炸板数 / (涨停+炸板)）────────────────────────────
    const total = ztList.length + zdList.length;
    const bombRate = total > 0 ? Math.round((zdList.length / total) * 100) : 0;

    // ── 主线题材分析 ──────────────────────────────────────────────
    const themes = {};
    ztList.forEach((s) => {
      // 东财涨停数据的题材字段
      const raw = s.hybj || s.hy || s.concept || "";
      raw
        .split(/[,，]/)
        .slice(0, 3)
        .forEach((t) => {
          t = t.trim();
          if (t && t.length > 0) themes[t] = (themes[t] || 0) + 1;
        });
    });
    const topThemes = Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const mainlineCount = topThemes[0]?.[1] || 0;
    const mainlineTheme = topThemes[0]?.[0] || "暂无";

    // ── 连板梯队分布 ──────────────────────────────────────────────
    const boardDist = {};
    boardHeights.forEach((h) => {
      boardDist[h] = (boardDist[h] || 0) + 1;
    });

    // ── 龙头列表（连板最高的前5只）────────────────────────────────
    const dragons = ztList
      .filter((s) => parseInt(s.lbc) >= 2)
      .sort((a, b) => parseInt(b.lbc) - parseInt(a.lbc))
      .slice(0, 5)
      .map((s) => ({
        code: s.dm,
        name: s.mc,
        boards: parseInt(s.lbc),
        theme: (s.hybj || "").split(",")[0],
      }));

    return res.json({
      limitUpCount: ztList.length,
      limitDownCount: dtList.length,
      openBoardCount: zdList.length,
      boardHeight: maxBoardHeight,
      boardRate,
      bombRate,
      mainlineCount,
      mainlineTheme,
      topThemes: topThemes.map(([name, count]) => ({ name, count })),
      boardDist,
      dragons,
      timestamp: new Date().toLocaleTimeString("zh-CN"),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "市场数据获取失败：" + err.message });
  }
        }
