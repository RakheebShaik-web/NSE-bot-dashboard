"use client";

import { useEffect, useMemo, useState } from "react";

type Period = "1Y" | "3Y" | "ALL";
type Feed = {
  generated_at: string | null;
  status: string;
  summary: {
    trades?: number;
    final_multiple?: number;
    max_drawdown?: number;
    win_rate?: number;
    cohort_sharpe?: number;
  };
  equity: { date: string; value: number }[];
  yearly: { year: number; strategy_return: number }[];
  trades: {
    entry_date: string; ticker: string; sector: string; score: number;
    entry: number; exit: number; net_return: number; exit_reason: string;
  }[];
  signals: {
    date: string; ticker: string; sector: string; score: number;
    close: number; initial_stop: number; rank: number;
  }[];
  factors: { name: string; weight: number }[];
};

const demoEquity = [100,104,101,109,116,113,128,137,132,148,161,157,174,191,183,207,225,219,244,271,263,289,318,306,342,371,363,405,438,427,469,512];
const demoBenchmark = [100,102,98,106,111,108,117,123,119,128,136,132,142,151,146,157,166,162,174,185,181,191,203,198,211,223,219,231,242,238,250,261];
const demoYears = [
  { year: "2020", strategy: 31.4, nifty: 14.9 }, { year: "2021", strategy: 38.7, nifty: 24.1 },
  { year: "2022", strategy: -8.6, nifty: 4.3 }, { year: "2023", strategy: 27.9, nifty: 20.0 },
  { year: "2024", strategy: 22.6, nifty: 8.8 }, { year: "2025", strategy: 16.8, nifty: 10.4 },
  { year: "2026", strategy: 9.2, nifty: 4.8 },
];
const demoTrades = [
  ["12 Jul 2026","TRENT","Consumer","91.8","₹5,412","₹5,793","+7.04%","Time exit"],
  ["12 Jul 2026","BEL","Industrials","89.6","₹426","₹449","+5.40%","Time exit"],
  ["28 Jun 2026","COFORGE","Technology","87.9","₹1,742","₹1,656","−4.94%","ATR stop"],
];
const demoFactors = [
  ["6M momentum",30],["12M momentum",25],["3M momentum",15],
  ["20D relative strength",10],["Relative volume",10],["Liquidity",5],["Low volatility",5],
] as [string, number][];

function linePoints(values: number[], width=1000, height=260, pad=12) {
  if (values.length < 2) values = [values[0] ?? 100, values[0] ?? 100];
  const min=Math.min(...values), max=Math.max(...values);
  return values.map((v,i)=>{
    const x=pad+i/(values.length-1)*(width-pad*2);
    const y=height-pad-(v-min)/Math.max(max-min,1)*(height-pad*2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function Shell({children,className=""}:{children:React.ReactNode;className?:string}) {
  return <div className={`shell ${className}`}><div className="core">{children}</div></div>;
}
const money=(v:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v);
const pct=(v:number)=>`${v>=0?"+":""}${(v*100).toFixed(2)}%`;

export default function Home() {
  const [period,setPeriod]=useState<Period>("ALL");
  const [section,setSection]=useState("Overview");
  const [feed,setFeed]=useState<Feed|null>(null);

  useEffect(()=>{ fetch("/api/data",{cache:"no-store"}).then(r=>r.json()).then(setFeed).catch(()=>setFeed(null)); },[]);
  const live=Boolean(feed?.status==="ready" && feed.equity.length);
  const fullEquity=live ? feed!.equity.map(x=>x.value*100) : demoEquity;
  const benchmark=demoBenchmark;
  const years=live && feed!.yearly.length
    ? feed!.yearly.map(x=>({year:String(x.year),strategy:x.strategy_return*100,nifty:0}))
    : demoYears;
  const trades=live
    ? feed!.trades.map(t=>[t.entry_date,t.ticker,t.sector,t.score.toFixed(1),money(t.entry),money(t.exit),pct(t.net_return),t.exit_reason])
    : demoTrades;
  const factors: [string,number][]=feed?.factors.length
    ? feed.factors.map(f=>[f.name.replaceAll("_"," "),f.weight*100])
    : demoFactors;
  const series=useMemo(()=>{
    const n=period==="1Y"?Math.min(9,fullEquity.length):period==="3Y"?Math.min(18,fullEquity.length):fullEquity.length;
    return {equity:fullEquity.slice(-n),nifty:benchmark.slice(-n)};
  },[period,fullEquity]);
  const runningMax:number[]=[]; let high=0;
  const drawdowns=fullEquity.map(v=>{high=Math.max(high,v);const d=(v/high-1)*100;runningMax.push(high);return d;});
  const finalMultiple=feed?.summary.final_multiple ?? 5.12;
  const finalValue=100000*finalMultiple;
  const elapsedYears=live && feed!.equity.length > 1
    ? Math.max((new Date(feed!.equity.at(-1)!.date).getTime()-new Date(feed!.equity[0].date).getTime())/(365.25*864e5),1/12)
    : 8;
  const cagr=Math.pow(finalMultiple,1/elapsedYears)-1;
  const maxDD=feed?.summary.max_drawdown ?? -0.186;
  const sharpe=feed?.summary.cohort_sharpe ?? 1.31;
  const winRate=feed?.summary.win_rate ?? 0.61;
  const generated=feed?.generated_at ? new Date(feed.generated_at).toLocaleString("en-IN") : "awaiting first bot run";

  return <main>
    <div className="grain"/>
    <nav className="island" aria-label="Primary">
      <button className="brand" onClick={()=>setSection("Overview")}><span className="brand-mark">L</span>LEADER / INDIA</button>
      <div className="nav-links">{["Overview","Signals","Trades","Factors"].map(item=>
        <button key={item} className={section===item?"active":""} onClick={()=>{setSection(item);document.getElementById(item.toLowerCase())?.scrollIntoView({behavior:"smooth"});}}>{item}</button>
      )}</div>
      <div className="live"><span/> {live?"BOT CONNECTED":"AWAITING DATA"}</div>
    </nav>

    <header className="hero reveal">
      <div><span className="eyebrow">NIFTY 500 · LIVE RESEARCH FEED</span><h1>Signal quality,<br/><em>without the fiction.</em></h1></div>
      <div className="hero-note"><p>Metrics, trades and signals are read directly from the NSE-bot repository. The frontend contains no trading logic.</p><div className="asof">LAST BOT EXPORT <strong>{generated}</strong></div></div>
    </header>

    <section id="overview" className="overview-grid reveal">
      <Shell className="equity-card"><div className="card-head">
        <div><span className="label">PORTFOLIO EQUITY</span><h2>{money(finalValue)} <small>from ₹1,00,000</small></h2></div>
        <div className="periods">{(["1Y","3Y","ALL"] as Period[]).map(p=><button key={p} onClick={()=>setPeriod(p)} className={period===p?"selected":""}>{p}</button>)}</div>
      </div><div className="chart-wrap"><div className="axis"><span>HIGH</span><span>MID</span><span>START</span></div>
        <svg viewBox="0 0 1000 260" role="img" aria-label="Strategy equity curve"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b8ff6a" stopOpacity=".22"/><stop offset="1" stopColor="#b8ff6a" stopOpacity="0"/></linearGradient></defs>
          {[25,80,135,190,245].map(y=><line key={y} x1="10" x2="990" y1={y} y2={y} className="gridline"/>)}
          <polygon points={`12,248 ${linePoints(series.equity)} 988,248`} fill="url(#fill)"/>
          {!live&&<polyline points={linePoints(series.nifty)} className="nifty-line"/>}<polyline points={linePoints(series.equity)} className="strategy-line"/>
        </svg><div className="legend"><span className="strategy-dot"/> Leader India <strong>{pct(finalMultiple-1)}</strong>{!live&&<><span className="nifty-dot"/> Illustrative NIFTY <strong>+161%</strong></>}</div>
      </div></Shell>
      <div className="metric-stack">
        <Shell><div className="metric"><span>TOTAL RETURN</span><strong>{pct(finalMultiple-1)}</strong><small>{feed?.summary.trades ?? trades.length} completed trades</small></div></Shell>
        <Shell><div className="metric"><span>ANNUALISED RETURN</span><strong>{pct(cagr)}</strong><small>{elapsedYears.toFixed(1)} year observation window</small></div></Shell>
        <Shell><div className="metric"><span>MAX DRAWDOWN</span><strong className="amber">{pct(maxDD)}</strong><small>Gap-aware stop model</small></div></Shell>
        <Shell><div className="metric"><span>SHARPE</span><strong>{sharpe.toFixed(2)}</strong><small>Win rate {(winRate*100).toFixed(1)}%</small></div></Shell>
      </div>
      <Shell className="status-card"><div className="status-inner"><span className="label">DATA STATUS</span><div className="status-orbit"><div><b>{feed?.signals.length ?? 0}</b><small>signals</small></div></div><h3>{live?"Connected to NSE-bot":"Waiting for first backtest"}</h3><p>{live?"This dashboard is displaying the latest committed bot export.":"Illustrative values remain visible until dashboard-data/latest.json is generated."}</p><div className="regime"><span>FEED</span><strong><i/> {feed?.status?.toUpperCase() ?? "LOADING"}</strong></div></div></Shell>
    </section>

    <section className="section reveal"><div className="section-title"><div><span className="eyebrow">DOWNSIDE ANATOMY</span><h2>Drawdown, made visible.</h2></div><p>Underwater periods measured from the prior portfolio high.</p></div><Shell><div className="drawdown-core"><div className="dd-stat"><strong>{pct(maxDD)}</strong><span>WORST DECLINE</span></div><svg viewBox="0 0 1000 180"><line x1="12" x2="988" y1="18" y2="18" className="zero"/><polygon points={`12,18 ${drawdowns.map((v,i)=>`${12+i/Math.max(drawdowns.length-1,1)*976},${18+Math.abs(v)*7}`).join(" ")} 988,18`} className="dd-fill"/><polyline points={drawdowns.map((v,i)=>`${12+i/Math.max(drawdowns.length-1,1)*976},${18+Math.abs(v)*7}`).join(" ")} className="dd-line"/></svg></div></Shell></section>

    <section id="signals" className="section reveal"><div className="section-title"><div><span className="eyebrow">CURRENT SIGNALS</span><h2>What the bot sees now.</h2></div><p>Latest ranked entries exported by the strategy engine.</p></div><Shell><div className="table-wrap"><table><thead><tr>{["RANK","DATE","SYMBOL","SECTOR","SCORE","CLOSE","INITIAL STOP"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
      {feed?.signals.length?feed.signals.map(s=><tr key={`${s.date}-${s.ticker}`}><td><span className="rank-chip">{s.rank}</span></td><td>{s.date}</td><td><strong>{s.ticker}</strong></td><td>{s.sector}</td><td>{s.score.toFixed(1)}</td><td>{money(s.close)}</td><td>{money(s.initial_stop)}</td></tr>):<tr><td colSpan={7}>No live signals exported yet. The bot will populate this table after its next export.</td></tr>}
    </tbody></table></div></Shell></section>

    <section className="section split reveal"><div><span className="eyebrow">YEAR-BY-YEAR</span><h2>Consistency over spectacle.</h2><p className="lede">Negative years remain visible. Benchmark values appear when the bot feed includes them.</p></div><Shell><div className="year-table"><div className="year-row header"><span>YEAR</span><span>LEADER</span><span>NIFTY 50</span><span>ALPHA</span></div>{years.map(y=><div className="year-row" key={y.year}><strong>{y.year}</strong><span className={y.strategy>=0?"positive":"negative"}>{y.strategy>0?"+":""}{y.strategy.toFixed(1)}%</span><span>{y.nifty?`${y.nifty>0?"+":""}${y.nifty.toFixed(1)}%`:"—"}</span><b>{y.nifty?`${y.strategy-y.nifty>0?"+":""}${(y.strategy-y.nifty).toFixed(1)}%`:"—"}</b></div>)}</div></Shell></section>

    <section id="trades" className="section reveal"><div className="section-title"><div><span className="eyebrow">TRADE LEDGER</span><h2>Every position, auditable.</h2></div></div><Shell><div className="table-wrap"><table><thead><tr>{["ENTRY","SYMBOL","SECTOR","SCORE","ENTRY","EXIT","NET P&L","REASON"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{trades.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} className={j===6?(String(v).includes("+")?"positive":"negative"):""}>{v}</td>)}</tr>)}</tbody></table></div></Shell></section>

    <section id="factors" className="section split factors reveal"><div><span className="eyebrow">FACTOR WEIGHTS</span><h2>Built on evidence,<br/>not decoration.</h2><p className="lede">Weights are sourced from the bot configuration, so frontend and engine cannot silently diverge.</p><div className="warning">{live?"LIVE BOT DATA":"ILLUSTRATIVE FALLBACK"}<span>Historical performance remains hypothetical research, not investment advice.</span></div></div><Shell><div className="factor-list"><div className="factor-head"><span>FACTOR</span><span>WEIGHT</span><span>STATUS</span></div>{factors.map(([name,weight])=><div className="factor" key={name}><span>{name}</span><div className="bar"><i style={{transform:`scaleX(${weight/30})`}}/></div><strong>{weight.toFixed(0)}%</strong><b>ACTIVE</b></div>)}</div></Shell></section>
    <footer><div><span className="brand-mark">L</span><strong>LEADER SCORE INDIA</strong></div><p>NSE-bot engine → JSON feed → Vercel dashboard</p><span>SCHEMA v1</span></footer>
  </main>;
}
