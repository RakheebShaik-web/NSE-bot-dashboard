"use client";
import {useEffect,useState} from "react";

type Feed={generated_at:string|null;status:string;summary:{trades?:number;final_multiple?:number;max_drawdown?:number;win_rate?:number;cohort_sharpe?:number};equity:{date:string;value:number}[];yearly:{year:number;strategy_return:number}[];trades:{entry_date:string;ticker:string;sector:string;score:number;entry:number;exit:number;net_return:number;exit_reason:string}[];signals:{date:string;ticker:string;sector:string;score:number;close:number;initial_stop:number;rank:number}[];factors:{name:string;weight:number}[]};
type Trade={symbol:string;side:string;entryDate:string;exitDate:string;entry:number;exit:number;qty:number;ret:number;pnl:number;days:number;reason:string};
type Signal={symbol:string;action:string;sector:string;date:string;price:number;stop:number;target:number;conviction:number;note:string};

const topTrades:Trade[]=[
["SUNPHARMA","LONG","22 Jun 25","07 Aug 25",242,269,97,.1115,2613,46,"Trend exit"],
["CIPLA","LONG","03 Jun 25","21 Jul 25",332,320,96,-.0365,-1164,48,"Stop loss"],
["LT","LONG","09 Jun 25","18 Jul 25",2389,2440,224,.0214,11451,39,"Trend exit"],
["ITC","LONG","01 Jun 25","21 Jun 25",817,875,12,.071,696,20,"Trend exit"],
["RELIANCE","LONG","12 May 25","11 Jun 25",2366,2176,190,-.0804,-36142,30,"Time exit"],
["INFY","LONG","18 May 25","27 May 25",1063,1196,32,.1247,4244,9,"Trend exit"],
["TITAN","LONG","11 May 25","20 May 25",2720,2524,62,-.0721,-12161,9,"Stop loss"],
["CIPLA","LONG","12 Apr 25","14 May 25",2141,2347,82,.0963,16905,32,"Target"],
["HDFCBANK","LONG","12 Mar 25","26 Apr 25",2145,2397,221,.1174,55659,45,"Target"],
["BHARTIARTL","LONG","04 Mar 25","21 Apr 25",1068,987,55,-.0761,-4470,48,"Time exit"],
["TATAMOTORS","LONG","02 Mar 25","28 Mar 25",2295,2136,144,-.0693,-22899,26,"Stop loss"],
["INFY","LONG","28 Feb 25","21 Mar 25",1348,1428,52,.0593,4157,21,"Trend exit"],
["ITC","LONG","22 Feb 25","18 Mar 25",1376,1508,64,.0962,8471,24,"Target"],
["AXISBANK","LONG","20 Feb 25","09 Mar 25",954,948,40,-.0063,-240,17,"Stop loss"],
["CIPLA","LONG","22 Jan 25","08 Mar 25",1543,1605,110,.0401,6806,45,"Target"],
["TITAN","LONG","11 Nov 24","05 Dec 24",1466,1507,154,.0279,6297,24,"Target"],
["LT","LONG","24 Nov 24","05 Dec 24",1828,2067,54,.1307,12903,11,"Target"],
["BHARTIARTL","LONG","17 Oct 24","22 Nov 24",2129,2357,185,.1069,42104,36,"Trend exit"],
["SUNPHARMA","LONG","29 Oct 24","16 Nov 24",1526,1647,144,.0794,17447,18,"Target"],
["JSWSTEEL","LONG","21 Sept 24","09 Nov 24",2426,2535,39,.0449,4249,49,"Trend exit"],
["HDFCBANK","LONG","28 Aug 24","06 Oct 24",981,1121,151,.1424,21093,39,"Trend exit"],
["TATAMOTORS","LONG","15 Aug 24","26 Sept 24",2214,2404,180,.0857,34157,42,"Target"],
["HDFCBANK","LONG","22 Aug 24","03 Sept 24",1273,1248,28,-.0194,-691,12,"Stop loss"],
["TITAN","LONG","13 Jul 24","25 Aug 24",803,898,36,.1172,3390,43,"Target"],
["TITAN","LONG","06 Aug 24","22 Aug 24",1314,1252,182,-.0477,-11411,16,"Stop loss"],
].map(r=>({symbol:r[0],side:r[1],entryDate:r[2],exitDate:r[3],entry:r[4],exit:r[5],qty:r[6],ret:r[7],pnl:r[8],days:r[9],reason:r[10]} as Trade));
const symbols=["RELIANCE","INFY","LT","ITC","CIPLA","TITAN","HDFCBANK","AXISBANK","JSWSTEEL","MARUTI","SUNPHARMA","TATAMOTORS"];
const extraTrades:Trade[]=Array.from({length:43},(_,i)=>{const entry=650+(i*137)%2100,ret=((i%5)-2)*.031+Math.sin(i)*.018,qty=25+(i*17)%180;return{symbol:symbols[i%symbols.length],side:"LONG",entryDate:`${String(20-i%18).padStart(2,"0")} Jun 24`,exitDate:`${String(24-i%18).padStart(2,"0")} Jul 24`,entry,exit:+(entry*(1+ret)).toFixed(2),qty,ret,pnl:Math.round(entry*ret*qty),days:18+i%31,reason:ret>0?"Trend exit":"Stop loss"}});
const allSampleTrades=[...topTrades,...extraTrades];
const sampleSignals:Signal[]=[
["RELIANCE","BUY","Energy","30 Jul 26",1632,1518,1861,92,"Momentum breakout with expanding volume and positive earnings revision."],
["HDFCBANK","BUY","Financials","29 Jul 26",1537,1430,1753,63,"Momentum breakout with expanding volume and positive earnings revision."],
["INFY","BUY","Technology","28 Jul 26",943,877,1075,65,"Momentum breakout with expanding volume and positive earnings revision."],
["TATAMOTORS","BUY","Auto","27 Jul 26",1731,1609,1973,84,"Momentum breakout with expanding volume and positive earnings revision."],
["LT","EXIT","Industrials","26 Jul 26",1778,1654,2027,65,"Trend score decayed below exit threshold; volatility regime turning."],
["SUNPHARMA","WATCH","Healthcare","25 Jul 26",2123,1974,2420,59,"Setup forming, awaiting confirmation close above pivot."],
].map(s=>({symbol:s[0],action:s[1],sector:s[2],date:s[3],price:s[4],stop:s[5],target:s[6],conviction:s[7],note:s[8]} as Signal));
const sampleYears=[["2019",.246,58,.69,-.204,.89],["2020",-.084,67,.62,-.211,1.25],["2021",.412,65,.53,-.203,1.69],["2022",.069,37,.70,-.112,1.91],["2023",.287,47,.59,-.197,1.95],["2024",.173,66,.64,-.164,1.66],["2025",.114,51,.62,-.093,.94]];
const sampleFactors=[["Momentum (12-1)","Primary alpha driver",.82,.094],["Quality (ROE)","Balance-sheet screen",.41,.031],["Low Volatility","Structural tilt away",-.18,-.009],["Value (EV/EBITDA)","Mild cheapness bias",.12,.012],["Size (SMID)","Mid-cap skew",.36,.026],["Liquidity","Turnover constraint",-.24,-.004]];
type EquityPoint={date:string;value:number;dd:number};
function makeEquity(){let v=1000000;const raw=Array.from({length:320},(_,i)=>{v*=1+.00115+Math.sin(i/9)*.006+Math.cos(i/21)*.004+(i%67===0?-.065:0);const date=new Date(2019,4,24+i*8);return{date:date.toISOString(),value:v,dd:0}});const targetFinal=1449894,targetMultiple=1.4418,targetStart=targetFinal/targetMultiple,rawMultiple=raw.at(-1)!.value/raw[0].value,power=Math.log(targetMultiple)/Math.log(rawMultiple);let peak=0;return raw.map(p=>{const value=targetStart*Math.pow(p.value/raw[0].value,power);peak=Math.max(peak,value);return{...p,value,dd:value/peak-1}})}
const sampleEquity=makeEquity();
const inr=(n:number,d=0)=>`${n<0?"-":""}₹${Math.abs(n).toLocaleString("en-IN",{minimumFractionDigits:d,maximumFractionDigits:d})}`;
const pct=(n:number,d=1)=>`${n>0?"+":""}${(n*100).toFixed(d)}%`;
const line=(v:number[],w=1000,h=360)=>{const lo=Math.min(...v),hi=Math.max(...v);return v.map((x,i)=>`${i/(v.length-1)*w},${h-(x-lo)/Math.max(1,hi-lo)*h}`).join(" ")};
function SectionHead({eyebrow,title,copy,tag}:{eyebrow:string;title:string;copy:string;tag?:string}){return <header className="section-head"><div><span>{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>{tag&&<b>{tag}</b>}</header>}
function equityForRange(points:EquityPoint[],range:string){
 if(range==="ALL"||points.length<2)return points;
 const years=Number.parseInt(range,10);
 if(!Number.isFinite(years))return points;
 const lastDate=new Date(points.at(-1)!.date);
 if(Number.isNaN(lastDate.getTime()))return points;
 const cutoff=new Date(lastDate);
 cutoff.setFullYear(cutoff.getFullYear()-years);
 const start=points.findIndex(point=>new Date(point.date)>=cutoff);
 return start<0?points:points.slice(Math.max(0,start-1));
}
function EquityChart({points,demo}:{points:EquityPoint[];demo:boolean}){
 const[hover,setHover]=useState<number|null>(null);
 const values=points.map(p=>p.value),lo=Math.min(...values),hi=Math.max(...values),span=Math.max(1,hi-lo);
 const x=(i:number)=>i/Math.max(1,points.length-1)*1000,y=(v:number)=>360-(v-lo)/span*330;
 const idx=hover??points.length-1,point=points[idx],first=points[0]?.value??1,change=point?point.value/first-1:0;
 const onMove=(e:React.PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();setHover(Math.max(0,Math.min(points.length-1,Math.round(((e.clientX-r.left)/r.width)*(points.length-1)))))};
 return <div className="chart-shell" onPointerLeave={()=>setHover(null)}>
  <svg viewBox="0 0 1000 390" role="img" aria-label="Portfolio equity curve" onPointerMove={onMove}>
   <defs><linearGradient id="navfill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b9ed18" stopOpacity=".2"/><stop offset="1" stopColor="#b9ed18" stopOpacity="0"/></linearGradient></defs>
   {[30,140,250,360].map(v=><line className="grid-line" key={v} x1="0" x2="1000" y1={v} y2={v}/>)}
   <polygon points={`0,390 ${values.map((v,i)=>`${x(i)},${y(v)}`).join(" ")} 1000,390`} fill="url(#navfill)"/>
   <polyline className="equity-line" points={values.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}/>
   {hover!==null&&point&&<g className="chart-focus"><line x1={x(idx)} x2={x(idx)} y1="0" y2="390"/><line x1="0" x2="1000" y1={y(point.value)} y2={y(point.value)}/><circle cx={x(idx)} cy={y(point.value)} r="6"/></g>}
  </svg>
  {hover!==null&&point&&<div className={`chart-tooltip ${x(idx)>760?"left":""}`} style={{left:`${x(idx)/10}%`,top:`${Math.max(4,y(point.value)/3.9)}%`}}>
   <span>{new Date(point.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>
   <strong>{demo?inr(point.value):inr(point.value)}</strong>
   <em className={change>=0?"positive":"negative"}>{pct(change,2)} from range start</em>
  </div>}
 </div>
}

export default function Home(){
 const[feed,setFeed]=useState<Feed|null>(null),[loading,setLoading]=useState(true),[sample,setSample]=useState(false),[range,setRange]=useState("ALL"),[filter,setFilter]=useState(""),[outcome,setOutcome]=useState("all"),[sort,setSort]=useState("Recent"),[shown,setShown]=useState(25);
 const load=()=>{setLoading(true);fetch("/api/data",{cache:"no-store"}).then(r=>r.json()).then(setFeed).finally(()=>setLoading(false))};useEffect(load,[]);
 const live=feed?.status==="ready"&&Boolean(feed.equity?.length),demo=!live&&sample;
 const equity:EquityPoint[]=live?feed!.equity.map(x=>({date:x.date,value:x.value*1000000,dd:0})):demo?sampleEquity:[];
 let peak=0;equity.forEach(x=>{peak=Math.max(peak,x.value);x.dd=x.value/peak-1});
 const signals:Signal[]=live?feed!.signals.map(s=>({symbol:s.ticker,action:"BUY",sector:s.sector,date:s.date,price:s.close,stop:s.initial_stop,target:s.close*1.14,conviction:s.score,note:"Systematic entry cleared the strategy filters."})):demo?sampleSignals:[];
 const trades:Trade[]=live?feed!.trades.map(t=>({symbol:t.ticker,side:"LONG",entryDate:t.entry_date,exitDate:"Closed",entry:t.entry,exit:t.exit,qty:0,ret:t.net_return,pnl:(t.exit-t.entry),days:0,reason:t.exit_reason})):demo?allSampleTrades:[];
 const rows=trades.filter(t=>t.symbol.toLowerCase().includes(filter.toLowerCase())&&(outcome==="all"||outcome==="wins"&&t.ret>0||outcome==="losses"&&t.ret<0)).sort((a,b)=>sort==="Return"?b.ret-a.ret:sort==="P&L"?b.pnl-a.pnl:sort==="Symbol"?a.symbol.localeCompare(b.symbol):0);
 const visibleEquity=equityForRange(equity,range),eqValues=visibleEquity.map(x=>x.value),allValues=equity.map(x=>x.value),dds=equity.map(x=>x.dd),final=eqValues.at(-1)??0;
 const rangeTotal=final&&eqValues[0]?final/eqValues[0]-1:0,inceptionTotal=allValues.length>1?allValues.at(-1)!/allValues[0]-1:0;
 return <main>
  <a className="skip" href="#main">Skip to content</a>
  <header className="command"><div className="pulse-logo">⌁</div><div className="brand-copy"><h1>NSE-bot <em>/ Research Terminal</em></h1><p>INDIAN EQUITIES · SYSTEMATIC LONG BOOK · SCHEMA V1</p></div><div className={`mode ${demo?"sample":live?"live":""}`}><i/>{demo?"SAMPLE MODE":live?"LIVE":"AWAITING DATA"}</div><div className="stamp">NO TIMESTAMP · 0S AGO</div><button onClick={load}>↻</button></header>
  <div id="main" className="terminal">
   {!live&&!demo&&<section className="await"><div>▤</div><h3>Feed connected · awaiting first publish</h3><p>The live feed is reachable and valid, but the bot has not written any equity, trade or signal records yet.</p><button onClick={()=>setSample(true)}>PREVIEW WITH ILLUSTRATIVE SAMPLE</button></section>}
   {demo&&<div className="sample-alert"><b>△ ILLUSTRATIVE SAMPLE</b> — synthetic figures generated in-browser to demonstrate layout. Not verified, not backtested, not the NSE-bot track record.</div>}
   <section className="kpis">{[["TOTAL RETURN",demo?"+44.2%":live?pct(inceptionTotal):"—",demo?"NAV ₹14.5L":"since inception","positive"],["MAX DRAWDOWN",demo?"-17.3%":live?pct(Math.min(...dds)):"—","peak-to-trough","negative"],["SHARPE",demo?"1.32":live?String(feed?.summary.cohort_sharpe??"—"):"—",demo?"Sortino 1.86":"Sortino —",""],["WIN RATE",demo?"60.3%":live?pct(feed?.summary.win_rate??0):"—",demo?"41 of 68 closed":"0 of — closed","positive"],["CLOSED TRADES",demo?"68":live?String(trades.length):"0",demo?"PF 1.74":"PF —",""]].map(x=><div key={x[0]}><span>{x[0]}</span><strong className={x[3]}>{x[1]}</strong><small>{x[2]}</small></div>)}</section>
   <div className="hero-grid">
    <section className="module equity-module"><SectionHead eyebrow="PORTFOLIO" title="Equity curve" copy={demo?"Illustrative sample series — not verified performance.":"Mark-to-market net asset value published by the strategy runner."}/><div className="ranges">{["1Y","3Y","5Y","ALL"].map(r=><button className={range===r?"active":""} onClick={()=>setRange(r)} key={r}>{r}</button>)}</div>{visibleEquity.length?<><div className="equity-stats"><div><span>LATEST NAV</span><b>{demo?inr(1449894):inr(final)}</b></div><div><span>{range} CHANGE</span><b>{pct(rangeTotal,2)}</b></div></div><EquityChart points={visibleEquity} demo={demo}/></>:<div className="empty"><h3>No equity history</h3><p>The NAV series is empty. The curve renders after the first published mark.</p></div>}</section>
    <section className="module signals-module"><SectionHead eyebrow="LIVE BOOK" title="Current signals" copy={demo?"Illustrative signals — do not trade on these.":"Latest actionable calls emitted by the scanner, newest first."} tag={`${signals.length} OPEN`}/>{signals.length?<ul>{signals.map(s=><li key={s.symbol}><div className="signal-copy"><div><b>{s.symbol}</b><em className={s.action.toLowerCase()}>{s.action}</em><span>{s.sector}</span></div><p>{s.note}</p><small>{s.date}</small></div><dl><div><dt>PRICE</dt><dd>{inr(s.price)}</dd></div><div><dt>STOP</dt><dd className="negative">{inr(s.stop)}</dd></div><div><dt>TARGET</dt><dd className="positive">{inr(s.target)}</dd></div><div className="conv"><dt>CONVICTION {s.conviction}</dt><dd><i style={{width:`${s.conviction}%`}}/></dd></div></dl></li>)}</ul>:<div className="empty"><h3>No open signals</h3><p>The strategy is flat. Fresh entries publish after the next scan.</p></div>}</section>
   </div>
   <div className="risk-grid">
    <section className="module"><SectionHead eyebrow="RISK" title="Underwater curve" copy={demo?"Illustrative drawdown profile from the sample series.":"Peak-to-trough decline of published NAV."} tag={demo?"-17.27%":dds.length?pct(Math.min(...dds),2):"MAX DD —"}/>{dds.length?<><svg className="dd-chart" viewBox="0 0 700 220">{[10,60,110,160,210].map(y=><line key={y} x1="0" x2="700" y1={y} y2={y}/>)}<polyline points={dds.map((v,i)=>`${i/(dds.length-1)*700},${10+Math.abs(v)*1100}`).join(" ")}/></svg><div className="dd-foot"><span>CURRENT DRAWDOWN <b>{demo?"-10.18%":pct(dds.at(-1)??0,2)}</b></span><span>OBSERVATIONS <b>{dds.length}</b></span></div></>:<div className="empty"><h3>No drawdown history</h3></div>}</section>
    <section className="module regime"><SectionHead eyebrow="CONTEXT" title="Regime & posture" copy={demo?"Illustrative regime read — synthetic.":"How the strategy is currently positioned."}/><span>MARKET REGIME</span><h3>{demo?"Risk-On · Expansion":"Not published"}</h3><div className="exposure"><span>GROSS EXPOSURE <b>{demo?"64%":"—"}</b></span><i><b style={{width:demo?"64%":"0%"}}/></i></div><dl>{[["SORTINO",demo?"1.86":"—"],["PROFIT FACTOR",demo?"1.74":"—"],["AVG HOLD",demo?"27d":"—"],["WIN RATE",demo?"60.3%":"—"],["CAGR",demo?"+19.4%":"—"],["BENCHMARK · NIFTY 50",demo?"+96.4%":"—"]].map(x=><div key={x[0]}><dt>{x[0]}</dt><dd>{x[1]}</dd></div>)}</dl></section>
   </div>
   <section className="module ledger"><SectionHead eyebrow="EXECUTION" title="Trade ledger" copy={demo?"Illustrative fills — synthetic, not executed orders.":"Every closed position published by the bot, with realised P&L."} tag={`${trades.length} TRADES`}/><div className="ledger-tools"><input placeholder="Filter symbol" value={filter} onChange={e=>setFilter(e.target.value)}/><div>{["all","wins","losses"].map(o=><button className={outcome===o?"active":""} onClick={()=>setOutcome(o)} key={o}>{o}</button>)}</div><label>Sort <select value={sort} onChange={e=>setSort(e.target.value)}><option>Recent</option><option>Return</option><option>P&amp;L</option><option>Symbol</option></select></label></div>{rows.length?<><div className="table-scroll"><table><caption>Closed trades with entry, exit and realised P&amp;L</caption><thead><tr>{["Symbol","Side","Entry","Exit","Entry ₹","Exit ₹","Qty","Return","P&L","Days","Reason"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice(0,shown).map((t,i)=><tr key={`${t.symbol}${i}`}><td><b>{t.symbol}</b></td><td>{t.side}</td><td>{t.entryDate}</td><td>{t.exitDate}</td><td>{inr(t.entry)}</td><td>{inr(t.exit)}</td><td>{t.qty||"—"}</td><td className={t.ret>=0?"positive":"negative"}>{pct(t.ret,2)}</td><td className={t.pnl>=0?"positive":"negative"}>{inr(t.pnl,1)}</td><td>{t.days||"—"}</td><td>{t.reason}</td></tr>)}</tbody></table></div>{shown<rows.length&&<button className="load-more" onClick={()=>setShown(v=>v+25)}>Load 25 more · {rows.length-shown} remaining</button>}</>:<div className="empty"><h3>No closed trades yet</h3></div>}</section>
   <div className="bottom-grid">
    <section className="module"><SectionHead eyebrow="TRACK RECORD" title="Yearly performance" copy={demo?"Illustrative annual returns — synthetic figures.":"Calendar-year returns, activity and risk."}/><ul className="year-cards">{(demo?sampleYears:[]).map(y=><li key={String(y[0])}><b>{y[0]}</b><strong className={(y[1] as number)>=0?"positive":"negative"}>{pct(y[1] as number)}</strong><span>{y[2]} trades</span><span>WR {pct(y[3] as number)}</span><span>DD {pct(y[4] as number)}</span><span>SR {y[5]}</span></li>)}</ul></section>
    <section className="module"><SectionHead eyebrow="ATTRIBUTION" title="Factor exposure" copy={demo?"Illustrative factor tilts — synthetic figures.":"Standardised tilts of the live book."}/><ul className="factor-cards">{(demo?sampleFactors:[]).map(f=><li key={String(f[0])}><div><b>{f[0]}</b><span>{f[1]}</span></div><strong>{f[2]}</strong><em className={(f[3] as number)>=0?"positive":"negative"}>{pct(f[3] as number)}</em></li>)}</ul></section>
    <section className="module integrity"><SectionHead eyebrow="INTEGRITY" title="Feed freshness" copy="Transport diagnostics for the live data contract."/><b className="overlay">{demo?"SAMPLE OVERLAY":"CAUTION"}</b><p>{demo?"Within the daily publish window":"No generated timestamp in payload"}</p><dl><div><dt>Schema version</dt><dd>1</dd></div><div><dt>Payload status</dt><dd>{demo?"sample":feed?.status??"unknown"}</dd></div><div><dt>Generated</dt><dd>{demo?"5m ago":"unknown"}</dd></div><div><dt>Polled</dt><dd>0s ago</dd></div><div><dt>Records</dt><dd>{equity.length} eq · {trades.length} tr · {signals.length} sg</dd></div></dl>{demo&&<button onClick={()=>setSample(false)}>Hide illustrative sample</button>}</section>
   </div>
  </div>
  <footer>Research display only. Nothing here is investment advice or a solicitation to trade.</footer>
 </main>
}
