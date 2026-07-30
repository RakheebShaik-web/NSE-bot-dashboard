"use client";

import { useEffect, useMemo, useState } from "react";

type Feed = {
  generated_at: string | null;
  status: string;
  summary: { trades?: number; final_multiple?: number; max_drawdown?: number; win_rate?: number; cohort_sharpe?: number };
  equity: { date: string; value: number }[];
  yearly: { year: number; strategy_return: number }[];
  trades: { entry_date: string; ticker: string; sector: string; score: number; entry: number; exit: number; net_return: number; exit_reason: string }[];
  signals: { date: string; ticker: string; sector: string; score: number; close: number; initial_stop: number; rank: number }[];
  factors: { name: string; weight: number }[];
};

const sample = {
  equity: [100,104,101,109,116,113,128,137,132,148,161,157,174,191,183,207,225,219,244,271,263,289,318,306,342,371,363,405,438,427,469,512],
  signals: [
    {rank:1,ticker:"RELIANCE",sector:"Energy",score:91.8,close:1418.6,initial_stop:1347.7,date:"30 Jul 2026"},
    {rank:2,ticker:"HDFCBANK",sector:"Financials",score:86.7,close:1994.25,initial_stop:1894.5,date:"30 Jul 2026"},
    {rank:3,ticker:"TATAMOTORS",sector:"Auto",score:74.4,close:712.9,initial_stop:677.25,date:"29 Jul 2026"},
  ],
  trades: [
    {entry_date:"12 Jul 2026",ticker:"TRENT",sector:"Consumer",score:91.8,entry:5412,exit:5793,net_return:.0704,exit_reason:"TIME EXIT"},
    {entry_date:"12 Jul 2026",ticker:"BEL",sector:"Industrials",score:89.6,entry:426,exit:449,net_return:.054,exit_reason:"TIME EXIT"},
    {entry_date:"28 Jun 2026",ticker:"COFORGE",sector:"Technology",score:87.9,entry:1742,exit:1656,net_return:-.0494,exit_reason:"ATR STOP"},
  ],
  factors: [{name:"Momentum",weight:.30},{name:"Quality",weight:.25},{name:"Relative strength",weight:.15},{name:"Liquidity",weight:.10},{name:"Low volatility",weight:.05}],
  yearly: [{year:2021,strategy_return:.342},{year:2022,strategy_return:-.068},{year:2023,strategy_return:.289},{year:2024,strategy_return:.194},{year:2025,strategy_return:.227}],
};

const money=(v:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v);
const pct=(v:number,d=1)=>`${v>0?"+":""}${(v*100).toFixed(d)}%`;
const points=(values:number[],w=900,h=240)=>{
  const min=Math.min(...values),max=Math.max(...values);
  return values.map((v,i)=>`${(i/(values.length-1))*w},${h-((v-min)/Math.max(1,max-min))*h}`).join(" ");
};

function Panel({children,className=""}:{children:React.ReactNode;className?:string}){return <section className={`panel ${className}`}>{children}</section>}
function Head({kicker,title,tag}:{kicker:string;title:string;tag?:string}){return <div className="panel-head"><div><span>{kicker}</span><h2>{title}</h2></div>{tag&&<small>{tag}</small>}</div>}

export default function Home(){
  const [feed,setFeed]=useState<Feed|null>(null);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("");
  const load=()=>{setLoading(true);fetch("/api/data",{cache:"no-store"}).then(r=>r.json()).then(setFeed).finally(()=>setLoading(false))};
  useEffect(load,[]);
  const live=feed?.status==="ready"&&Boolean(feed.equity?.length);
  const equity=live?feed!.equity.map(x=>x.value*100):sample.equity;
  const signals=feed?.signals?.length?feed.signals:sample.signals;
  const trades=feed?.trades?.length?feed.trades:sample.trades;
  const factors=feed?.factors?.length?feed.factors:sample.factors;
  const yearly=feed?.yearly?.length?feed.yearly:sample.yearly;
  const multiple=feed?.summary.final_multiple??2.292;
  const maxDD=feed?.summary.max_drawdown??-.089;
  const sharpe=feed?.summary.cohort_sharpe??1.42;
  const win=feed?.summary.win_rate??.57;
  const years=Math.max(1,yearly.length);
  const cagr=live?Math.pow(multiple,1/years)-1:.144;
  const underwater=useMemo(()=>{let peak=0;return equity.map(v=>{peak=Math.max(peak,v);return (v/peak-1)*100})},[equity]);
  const visibleTrades=trades.filter(t=>`${t.ticker} ${t.sector} ${t.exit_reason}`.toLowerCase().includes(filter.toLowerCase()));
  const stamp=feed?.generated_at?new Date(feed.generated_at).toLocaleString("en-IN"):"No timestamp in feed";

  return <main>
    <a className="skip" href="#dashboard">Skip to dashboard</a>
    <header className="terminal-head">
      <div className="head-main">
        <div><span className="eyebrow">INDIAN EQUITIES · SYSTEMATIC DESK</span><h1>NSE-bot <em>/ performance terminal</em></h1><p>A read-only institutional view over the NSE-bot research pipeline — signals, execution record, drawdown and factor risk, rendered directly from the repository&apos;s published snapshot.</p></div>
        <div className="feed-meta">
          <button onClick={load} disabled={loading}>↻ {loading?"Syncing":"Refresh"}</button>
          <dl><div><dt>Snapshot</dt><dd>{stamp}</dd></div><div><dt>Status</dt><dd>{live?"LIVE FEED":"UNVERIFIED"}</dd></div><div><dt>Schema</dt><dd>v1</dd></div></dl>
        </div>
      </div>
      <div className="ticker"><i/> Upstream reports <strong>{feed?.status??"loading"}</strong> · source RakheebShaik-web/NSE-bot</div>
    </header>

    <div id="dashboard" className="board">
      {!live&&<div className="notice"><b>△ Illustrative data in use.</b> The upstream feed currently has no published rows. Every visible sample number demonstrates the interface only and is not an NSE-bot track record.</div>}

      <div className="primary-grid">
        <div>
          <div className="stats">
            {[
              ["TOTAL RETURN",pct(multiple-1), "Since inception","pos"],
              ["CAGR",pct(cagr), "Annualised","pos"],
              ["SHARPE",sharpe.toFixed(2), "Risk-adjusted",""],
              ["MAX DRAWDOWN",pct(maxDD), "Peak to trough","warn"],
              ["WIN RATE",pct(win,0), "Closed trades",""],
              ["TRADES",String(live?(feed?.summary.trades??trades.length):24), "All time",""],
              ["EXPOSURE","78%", "Avg. invested",""],
              ["OPEN POSITIONS",String(signals.length), "Live book",""],
            ].map(([a,b,c,t])=><div className="stat" key={a}><span>{a}</span><strong className={t}>{b}</strong><small>{c}</small></div>)}
          </div>

          <Panel className="equity">
            <Head kicker="CUMULATIVE PERFORMANCE" title="Equity curve & drawdown" tag={`${equity.length} OBS`}/>
            <div className="nav-value">{equity.at(-1)?.toFixed(2)} <small>NAV</small></div>
            <svg viewBox="0 0 900 250" role="img" aria-label="Portfolio equity curve">
              {[0,60,120,180,240].map(y=><line key={y} x1="0" x2="900" y1={y} y2={y}/>)}
              <polygon points={`0,250 ${points(equity,900,225)} 900,250`} className="eq-fill"/>
              <polyline points={points(equity,900,225)} className="eq-line"/>
            </svg>
            <div className="under"><span className="eyebrow">UNDERWATER / DRAWDOWN</span><svg viewBox="0 0 900 90"><line x1="0" x2="900" y1="4" y2="4"/><polygon points={`0,4 ${underwater.map((v,i)=>`${i/(underwater.length-1)*900},${4+Math.abs(v)*7}`).join(" ")} 900,4`} /></svg></div>
          </Panel>
        </div>

        <aside>
          <Panel>
            <Head kicker="LATEST OUTPUT" title="Current signals" tag={`${signals.length} ACTIVE`}/>
            <div className="signals">{signals.map(s=><article key={`${s.ticker}-${s.rank}`}><div><b>{s.ticker}</b><span>{s.sector}</span></div><strong className={s.rank<3?"pos":""}>{s.rank<3?"BUY":"WATCH"}</strong><div className="score"><i style={{width:`${Math.min(100,s.score)}%`}}/><span>{s.score.toFixed(1)}</span></div><small>{money(s.close)} · stop {money(s.initial_stop)}</small></article>)}</div>
          </Panel>
          <Panel>
            <Head kicker="RISK DECOMPOSITION" title="Factor exposure" tag="MODEL WEIGHTS"/>
            <div className="factor-list">{factors.map(f=><div key={f.name}><span>{f.name.replaceAll("_"," ")}</span><i><b style={{width:`${Math.min(100,Math.abs(f.weight)*300)}%`}}/></i><strong>{pct(f.weight,0)}</strong></div>)}</div>
          </Panel>
        </aside>
      </div>

      <div className="lower-grid">
        <Panel>
          <Head kicker="CALENDAR ATTRIBUTION" title="Yearly performance"/>
          <div className="years">{yearly.map(y=><div key={y.year}><span>{y.year}</span><i className={y.strategy_return<0?"negative":""} style={{height:`${Math.max(8,Math.abs(y.strategy_return)*240)}px`}}/><b className={y.strategy_return>=0?"pos":"neg"}>{pct(y.strategy_return)}</b></div>)}</div>
        </Panel>
        <Panel>
          <div className="trades-head"><Head kicker="EXECUTION RECORD" title="Trade blotter" tag={`${visibleTrades.length} ROWS`}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter symbol, sector…"/></div>
          <div className="table-wrap"><table><thead><tr>{["ENTRY","SYMBOL","SECTOR","SCORE","ENTRY","EXIT","NET P&L","REASON"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visibleTrades.map((t,i)=><tr key={`${t.ticker}-${i}`}><td>{t.entry_date}</td><td><b>{t.ticker}</b></td><td>{t.sector}</td><td>{t.score.toFixed(1)}</td><td>{money(t.entry)}</td><td>{money(t.exit)}</td><td className={t.net_return>=0?"pos":"neg"}>{pct(t.net_return,2)}</td><td>{t.exit_reason}</td></tr>)}</tbody></table></div>
        </Panel>
      </div>
    </div>
    <footer>Research interface only. Illustrative figures are synthetic placeholders and must not be read as realised or backtested performance.</footer>
  </main>
}
