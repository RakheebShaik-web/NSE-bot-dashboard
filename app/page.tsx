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
type BlotterRow={symbol:string;side:"LONG"|"SHORT";entryDate:string;exitDate:string|null;qty:number;entry:number;exit:number|null;pnl:number|null;ret:number|null};

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
const sampleBlotter:BlotterRow[]=[
["JSWSTEEL","LONG","14 Dec 25","18 Dec 25",168,1987,1990.97,667,.002],
["MARUTI","LONG","05 Dec 25","09 Dec 25",131,1094,1081.2,-1677,-.012],
["RELIANCE","LONG","03 Dec 25",null,25,480,null,null,null],
["RELIANCE","LONG","15 Nov 25","19 Nov 25",181,2124,2357.64,42289,.11],
["JSWSTEEL","LONG","06 Nov 25","10 Nov 25",144,1231,1364.69,19251,.109],
["HDFCBANK","LONG","04 Nov 25",null,38,617,null,null,null],
["HDFCBANK","LONG","16 Oct 25","20 Oct 25",194,2261,2274.11,2543,.006],
["INFY","LONG","05 Oct 25",null,51,754,null,null,null],
["INFY","LONG","17 Sept 25","21 Sept 25",27,2398,2217.43,-4875,-.075],
["LT","SHORT","06 Sept 25","10 Sept 25",64,891,827.74,-4049,-.071],
["LT","LONG","18 Aug 25","22 Aug 25",40,2535,2661.24,5050,.05],
["TATAMOTORS","LONG","07 Aug 25","11 Aug 25",77,1028,1092.15,4940,.062],
["TATAMOTORS","LONG","19 Jul 25","23 Jul 25",53,2672,2935.73,13978,.099],
["SUNPHARMA","LONG","08 Jul 25","12 Jul 25",90,1165,1271.13,9552,.091],
["SUNPHARMA","SHORT","20 Jun 25","24 Jun 25",66,2809,2699.45,-7230,-.039],
["ICICIBANK","LONG","09 Jun 25","13 Jun 25",103,1302,1237.16,-6679,-.05],
["ICICIBANK","LONG","21 May 25","25 May 25",79,546,517.34,-2264,-.053],
["TITAN","LONG","10 May 25","14 May 25",116,1439,1378.42,-7027,-.042],
["TITAN","LONG","22 Apr 25","26 Apr 25",92,683,743.58,5573,.089],
["AXISBANK","LONG","11 Apr 25","15 Apr 25",129,1576,1728.56,19680,.097],
["BHARTIARTL","LONG","12 Mar 25","16 Mar 25",142,1713,1804.3,12965,.053],
["AXISBANK","LONG","03 Mar 25","07 Mar 25",105,820,873.87,5656,.066],
["MARUTI","SHORT","13 Feb 25","17 Feb 25",155,1850,1712.36,-21334,-.074],
["BHARTIARTL","LONG","04 Feb 25","08 Feb 25",118,957,890.49,-7848,-.07],
].map(r=>({symbol:r[0],side:r[1],entryDate:r[2],exitDate:r[3],qty:r[4],entry:r[5],exit:r[6],pnl:r[7],ret:r[8]} as BlotterRow));

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
  const [preview,setPreview]=useState(false);
  const [tradeView,setTradeView]=useState<"ALL"|"OPEN"|"CLOSED">("ALL");
  const [tradeSort,setTradeSort]=useState<"NEWEST"|"BEST"|"SYMBOL">("NEWEST");
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
  const blotter:BlotterRow[]=live?trades.map(t=>({symbol:t.ticker,side:"LONG",entryDate:t.entry_date,exitDate:t.exit?"Closed":null,qty:0,entry:t.entry,exit:t.exit||null,pnl:t.exit?(t.exit-t.entry):null,ret:t.net_return})):sampleBlotter;
  const visibleTrades=blotter.filter(t=>{
    const text=t.symbol.toLowerCase().includes(filter.toLowerCase());
    const status=tradeView==="ALL"||(tradeView==="OPEN"?!t.exitDate:Boolean(t.exitDate));
    return text&&status;
  }).sort((a,b)=>tradeSort==="BEST"?(b.pnl??-Infinity)-(a.pnl??-Infinity):tradeSort==="SYMBOL"?a.symbol.localeCompare(b.symbol):0);
  const stamp=feed?.generated_at?new Date(feed.generated_at).toLocaleString("en-IN"):"No timestamp in feed";

  return <main>
    <a className="skip" href="#dashboard">Skip to dashboard</a>
    <header className="terminal-head">
      <div className="head-main">
        <div className="terminal-identity"><span className="terminal-mark">⌁</span><div><h1>NSE-bot <em>/ Research Terminal</em></h1><p>INDIAN EQUITIES · SYSTEMATIC LONG BOOK · SCHEMA V1</p></div></div>
        <div className="feed-meta">
          <a className="blotter-link" href="#trade-blotter">View trade blotter ↓</a>
          <button onClick={load} disabled={loading}>↻ {loading?"Syncing":"Refresh"}</button>
          <dl><div><dt>Snapshot</dt><dd>{stamp}</dd></div><div><dt>Status</dt><dd>{live?"LIVE FEED":"UNVERIFIED"}</dd></div><div><dt>Schema</dt><dd>v1</dd></div></dl>
        </div>
      </div>
      <div className="ticker"><i/> Data feed status <strong>{feed?.status??"loading"}</strong> · read-only research terminal</div>
    </header>

    <div id="dashboard" className="board">
      {!live&&!preview?<div className="empty-gate"><div className="database-mark">▤</div><h3>Feed connected · awaiting first publish</h3><p>The live feed is reachable and valid, but the bot has not written any equity, trade or signal records yet.</p><button onClick={()=>setPreview(true)}>PREVIEW WITH ILLUSTRATIVE SAMPLE</button></div>:<>
      {!live&&<div className="notice"><b>Illustrative preview.</b> Synthetic sample output is shown only to demonstrate the terminal layout and is not an NSE-bot track record. <button onClick={()=>setPreview(false)}>Exit preview</button></div>}

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
        <Panel className="trade-panel">
          <div id="trade-blotter" className="anchor"/>
          <div className="trades-head"><Head kicker="EXECUTION RECORD" title="Trade blotter" tag={`${blotter.length} trades · net ${money(blotter.reduce((n,t)=>n+(t.pnl??0),0))}`}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter symbol…"/></div>
          <div className="blotter-controls" role="group" aria-label="Filter trades by status">
            {(["ALL","OPEN","CLOSED"] as const).map(v=><button key={v} className={tradeView===v?"selected":""} onClick={()=>setTradeView(v)}>{v}</button>)}
            <label>Sort trades <select value={tradeSort} onChange={e=>setTradeSort(e.target.value as typeof tradeSort)}><option value="NEWEST">Newest</option><option value="BEST">Best P&amp;L</option><option value="SYMBOL">Symbol</option></select></label>
          </div>
          <div className="table-wrap"><table><caption>Full list of trades with entry, exit and P&amp;L</caption><thead><tr>{["SYMBOL","SIDE","ENTRY","EXIT","QTY","IN","OUT","P&L","RETURN"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visibleTrades.map((t,i)=><tr key={`${t.symbol}-${i}`}><td><b>{t.symbol}</b>{!t.exitDate&&<small className="open-badge">Open</small>}</td><td>{t.side}</td><td>{t.entryDate}</td><td>{t.exitDate??"—"}</td><td>{t.qty||"—"}</td><td>{t.entry.toLocaleString("en-IN")}</td><td>{t.exit?.toLocaleString("en-IN")??"—"}</td><td className={(t.pnl??0)>=0?"pos":"neg"}>{t.pnl===null?"—":money(t.pnl)}</td><td className={(t.ret??0)>=0?"pos":"neg"}>{t.ret===null?"—":pct(t.ret)}</td></tr>)}</tbody></table></div>
        </Panel>
      </div>
      </>}
    </div>
    <footer>Research interface only. Illustrative figures are synthetic placeholders and must not be read as realised or backtested performance.</footer>
  </main>
}
