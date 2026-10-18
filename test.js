const a=require('assert'),C=require('./calc.js');let n=0;const t=(f)=>{f();n++};
t(()=>a.strictEqual(C.dtt(32,22,10),17));
t(()=>a.strictEqual(C.dtt(15,3,10),0));
t(()=>a.strictEqual(C.dtt(20,0,10),0));
t(()=>a.strictEqual(C.dtt('31','21','10'),16));
t(()=>{const r=C.accumulate([{tmax:32,tmin:22},{tmax:15,tmin:3},{tmax:30,tmin:20}],10);a.deepStrictEqual(r.map(x=>x.total),[17,17,32]);});
t(()=>a.strictEqual(C.daysToTarget(32,22,10,700),42));
t(()=>a.strictEqual(C.daysToTarget(15,3,10,700),Infinity));
t(()=>{const y=C.yieldCalc(110,15,0.45);a.strictEqual(y.biomass,1650);a.ok(Math.abs(y.grain-742.5)<1e-9);a.ok(Math.abs(y.tPerHa-7.425)<1e-9);});
global.window={};require('./data/weather.js');const S=require('./sim.js');const M=S.CROPS.maize;const near=(x,y,e)=>a.ok(Math.abs(x-y)<(e||1e-6),x+' vs '+y);
t(()=>near(S.thermal(32,22,M),17)); // handout example: (32+22)/2-10 = 17
t(()=>{a.strictEqual(M.tb,10);a.strictEqual(C.dtt(32,22,10),17)});
t(()=>a.strictEqual(S.thermal(10,4,M),0));
t(()=>near(S.thermal(44,34,M),(34-10)*(44-39)/10));
t(()=>a.strictEqual(S.thermal(50,40,M),0));
t(()=>near(S.ra(0,80),37.6,0.6));
t(()=>near(S.et0Hargreaves(32,22,37.6),0.0023*44.8*Math.sqrt(10)*0.408*37.6));
t(()=>{const e=S.et0Hargreaves(32,22,S.ra(5.1,100));a.ok(e>3&&e<6.5)});
t(()=>{a.strictEqual(S.ks(10,100,55),1);near(S.ks(77.5,100,55),0.5);a.strictEqual(S.ks(100,100,55),0)});
t(()=>{near(S.kcAt(0,M),0.3);near(S.kcAt(1050,M),1.2);near(S.kcAt(1790,M),0.6)});
t(()=>{a.strictEqual(S.stageIndex(0,M),0);a.strictEqual(S.stageIndex(980,M),3);a.strictEqual(S.stageIndex(5000,M),5)});
t(()=>{const w=S.buildWeather(window.WEATHER.tamale,2021,160,10,'heat');a.strictEqual(w.length,10);a.strictEqual(w[0].doy,160)});
t(()=>{const w=S.buildWeather(window.WEATHER.tamale,2024,360,10,'normal');a.strictEqual(w[6].doy,366);a.strictEqual(w[7].doy,1)});
const run=(sc,loc,lat,doy)=>S.simulate({years:window.WEATHER[loc],year:2021,doy:doy,crop:'maize',scenario:sc,lat:lat});
t(()=>{const r=run('normal','tamale',9.4,160);a.ok(r.matured);a.ok(r.days.length>90&&r.days.length<130);
  a.ok(r.days.every((d,i)=>i==0||d.biomass>=r.days[i-1].biomass));a.ok(r.days.every(d=>d.soilPct>=0&&d.soilPct<=100));
  near(r.days.reduce((s,d)=>s+d.dtt,0),r.days.at(-1).tt);near(r.yieldDryT,r.biomass*r.hi/100);a.ok(r.yieldDryT>3&&r.yieldDryT<9)});
t(()=>a.ok(run('drought','tamale',9.4,160).yieldDryT<run('normal','tamale',9.4,160).yieldDryT));
t(()=>a.ok(run('heat','tamale',9.4,160).yieldDryT<run('normal','tamale',9.4,160).yieldDryT));
t(()=>a.ok(run('heat','tamale',9.4,160).days.length<=run('normal','tamale',9.4,160).days.length));
// Scenarios must really differ: weather series and outputs, for every location
const SC=['normal','drought','heat','elnino','late'],LOCS={tamale:[9.4,152],capecoast:[5.1,91]};
const sig=a=>a.map(v=>v.toFixed(2)).join(',');
for(const l in LOCS){const res={};for(const sc of SC)res[sc]=S.simulate({years:window.WEATHER[l],year:2021,doy:LOCS[l][1],crop:'maize',scenario:sc,lat:LOCS[l][0]});
 for(let i=0;i<SC.length;i++)for(let j=i+1;j<SC.length;j++){const A=res[SC[i]],B=res[SC[j]];
  t(()=>a.notStrictEqual(sig(A.days.map(d=>d.rain))+sig(A.days.map(d=>d.tmax)),sig(B.days.map(d=>d.rain))+sig(B.days.map(d=>d.tmax)),l+' '+SC[i]+' vs '+SC[j]+' weather identical'));
  t(()=>a.notStrictEqual([A.yieldDryT.toFixed(2),A.days.length,Math.round(A.rain)].join(),[B.yieldDryT.toFixed(2),B.days.length,Math.round(B.rain)].join(),l+' '+SC[i]+' vs '+SC[j]+' outputs identical'))}
 const dry=r=>{let run=0,m=0;r.days.forEach(d=>{if(d.rain<1){run++;m=Math.max(m,run)}else run=0});return m};
 t(()=>a.ok(dry(res.drought)>=25&&dry(res.drought)>dry(res.normal)+15,l+' drought needs a long dry run'));
 t(()=>a.ok(res.heat.days.filter(d=>d.tmax>35).length>=res.normal.days.filter(d=>d.tmax>35).length+15,l+' heat wave needs hot days'));
 t(()=>a.ok(res.elnino.rain<res.normal.rain*0.7&&res.elnino.days.filter(d=>d.rain>=1).length<res.normal.days.filter(d=>d.rain>=1).length,l+' El Nino must be drier with fewer rainy days'));
 t(()=>a.notStrictEqual(res.late.days[0].doy,res.normal.days[0].doy));
 t(()=>a.ok(res.drought.yieldDryT<res.normal.yieldDryT&&res.heat.yieldDryT<res.normal.yieldDryT,l+' stress scenarios must yield less'))}
// Season chart data
const CH=require('./chart.js');
{const L=LOCS.tamale,mk=sc=>S.simulate({years:window.WEATHER.tamale,year:2021,doy:L[1],crop:'maize',scenario:sc,lat:L[0]});
 const nr=mk('normal'),dr=mk('drought'),ht=mk('heat');
 const dN=CH.data(nr),dD=CH.data(dr,nr),dH=CH.data(ht,nr);
 t(()=>a.notDeepStrictEqual(dD.rain,dN.rain));t(()=>a.notDeepStrictEqual(dH.tmax,dN.tmax));t(()=>a.notDeepStrictEqual(dD.tt,dH.tt));
 t(()=>a.deepStrictEqual(dD.rain,dr.days.map(d=>d.rain)));
 t(()=>{let c=0;dD.tt.forEach((v,i)=>{c+=dr.days[i].dtt;near(v,c,1e-9)})}); // DTT line = cumulative simulator DTT
 t(()=>a.deepStrictEqual(dD.thresholds.map(x=>[x.name,x.value]),S.CROPS.maize.stages.slice(1).map(s=>[s[0],s[1]])));
 t(()=>a.deepStrictEqual(dD.thresholds.map(x=>x.value),[70,270,980,1120,1790]));
 t(()=>{a.ok(dD.normal);a.deepStrictEqual(dD.normal.tt,dN.tt);a.strictEqual(CH.data(dr).normal,undefined)});
 const lay=CH.layout(600,false);
 t(()=>{near(CH.xFor(0,100,lay),lay.L);near(CH.xFor(100,100,lay),600-lay.R);near(CH.xFor(50,100,lay),(lay.L+600-lay.R)/2)});
 t(()=>{for(const d of [1,37,62,100])a.strictEqual(CH.dayAt(CH.xFor(d,105,lay),105,lay),d)});}
// Mathematics section
const MX=require('./maths.js');
t(()=>{for(const [a,b] of [[32,22],[38.5,24.1],[29,18]])near(MX.sineMean(a,b),(a+b)/2,1e-9)});
t(()=>{near(MX.sineT(15,32,22),32,1e-9);near(MX.sineT(3,32,22),22,1e-9)});
t(()=>near(MX.sineDTT(32,22,null),17,1e-9)); // matches handout example
t(()=>{a.ok(MX.sineDTT(38,25,30)<MX.sineDTT(38,25,null));near(MX.sineDTT(28,20,30),MX.sineDTT(28,20,null),1e-12)});
{const tt=[],yy=[];for(let i=0;i<730;i++){tt.push(i);yy.push(27+2*Math.cos(2*Math.PI*i/365.25)-1.5*Math.sin(2*Math.PI*i/365.25)+0.6*Math.cos(4*Math.PI*i/365.25))}
 const f2=MX.fourierFit(tt,yy,2);t(()=>{near(f2.c[0],27,1e-6);near(f2.c[1],2,1e-6);near(f2.c[2],-1.5,1e-6);near(f2.c[3],0.6,1e-6);near(f2.c[4],0,1e-6);near(f2.r2,1,1e-9)});
 const f1=MX.fourierFit(tt,yy,1);t(()=>{a.ok(f1.r2<1&&f1.r2>0.8);near(f1.c[1],2,0.05)});}
for(const loc of ['tamale','capecoast']){const Y=MX.yearlyMeans(window.WEATHER[loc]);t(()=>{a.strictEqual(Y.t.length,1827);const r1=MX.fourierFit(Y.t,Y.y,1).r2,r2=MX.fourierFit(Y.t,Y.y,2).r2;a.ok(r1>0.2&&r2>=r1&&r2<1,loc+' '+r1+' '+r2)});}
{const L=LOCS.tamale,mk=sc=>S.simulate({years:window.WEATHER.tamale,year:2021,doy:L[1],crop:'maize',scenario:sc,lat:L[0]});
 const nr=mk('normal'),ht=mk('heat'),dr=mk('drought'),y0=nr.yieldDryT;
 t(()=>{const u=MX.cumDTT(ht.days,null),c=MX.cumDTT(ht.days,30);a.ok(c.at(-1)<u.at(-1)-50,'heat cap '+u.at(-1)+' '+c.at(-1));near(u.at(-1),ht.days.at(-1).tt,1e-6)});
 t(()=>{const hc=MX.cumDTT(ht.days,30).at(-1)/ht.days.at(-1).tt,nc=MX.cumDTT(nr.days,30).at(-1)/nr.days.at(-1).tt;a.ok(hc<nc,'cap bites harder in heat wave')});
 t(()=>{MX.cumDTT(nr.days,30);near(mk('normal').yieldDryT,y0,1e-12)}); // cap never touches main yields
 for(const r of [nr,ht,dr])t(()=>{const e=MX.euler(r);r.days.forEach((d,i)=>{near(e.S[i],d.sw,1e-9);near(e.B[i],d.biomass,1e-9)})});
 t(()=>{const en=MX.euler(nr),ed=MX.euler(dr);a.notDeepStrictEqual(en.S,ed.S);a.notDeepStrictEqual(en.B,ed.B);a.ok(Math.min(...ed.S.slice(45,75))<Math.min(...en.S.slice(45,75)))});}
t(()=>{near(MX.beer(0.65,0),0);near(MX.beer(0.65,3),1-Math.exp(-1.95),1e-12);near(MX.beer(0.65,3),0.8577,1e-4);a.ok(MX.beer(0.65,6)<1&&MX.beer(0.9,3)>MX.beer(0.5,3))});
console.log('All '+n+' tests passed');
