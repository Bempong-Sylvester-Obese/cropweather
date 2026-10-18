(function(){
'use strict';
var $=function(i){return document.getElementById(i)},f=function(n,d){return Number(n).toFixed(d==null?1:d)};
var NS='http://www.w3.org/2000/svg',RM=matchMedia('(prefers-reduced-motion: reduce)');
var LOC={tamale:{lat:9.4,doy:152},capecoast:{lat:5.1,doy:91}},YEAR=2021;
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dateStr(y,doy){var d=new Date(Date.UTC(y,0,doy));return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+y}
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function lerp(a,b,t){return a+(b-a)*t}
function mix(c1,c2,t){t=Math.max(0,Math.min(1,t));var a=parseInt(c1.slice(1),16),b=parseInt(c2.slice(1),16);
 var r=Math.round(lerp(a>>16,b>>16,t)),g=Math.round(lerp(a>>8&255,b>>8&255,t)),bl=Math.round(lerp(a&255,b&255,t));return '#'+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1)}
function scen(){return document.querySelector('input[name=scen]:checked').value}
function run(sc,loc){loc=loc||$('loc').value;var L=LOC[loc];return SIM.simulate({years:WEATHER[loc],year:YEAR,doy:L.doy,crop:'maize',scenario:sc||scen(),lat:L.lat})}
function stats(r){var run=0,mx=0;r.days.forEach(function(x){if(x.rain<1){run++;mx=Math.max(mx,run)}else run=0});return {rain:r.rain,rainDays:r.days.filter(function(x){return x.rain>=1}).length,dry:mx,hot:r.days.filter(function(x){return x.tmax>35}).length,stress:r.days.filter(function(x){return x.stress>0.2}).length,yield:r.yieldDryT,mature:r.days.length}}
function summary(){var a=stats(res),n=stats(run('normal')),s=scen();
 var cell=function(lbl,v,nv,unit){return '<div><span>'+lbl+'</span><strong>'+v+unit+'</strong>'+(s==='normal'?'':'<small>normal '+nv+unit+'</small>')+'</div>'};
 $('scenHint').textContent=SIM.SCENARIOS[s];
 $('sumStrip').innerHTML=cell('Season rain',f(a.rain,0),f(n.rain,0),' mm')+cell('Rainy days (1 mm or more)',a.rainDays,n.rainDays,'')+cell('Longest dry run',a.dry,n.dry,' days')+cell('Days above 35 \u00B0C',a.hot,n.hot,'')}

/* ---------- Scene ---------- */
var scene=new Scene($('scene')),curRef=1,scorch=0;
function sceneState(d,res){var c=res.crop;return {sown:!!d,loc:$('loc').value,tt:d?d.tt:0,stages:c.stages,grow:d?Math.min(1,d.biomass/curRef):0,ks:d?d.ks:1,stress:d?d.stress:0,scorch:scorch,
 rain:d?d.rain:0,tmax:d?d.tmax:30,srad:d?d.srad:18,soil:d?d.soilPct/100:.6}}
function scorchUpTo(res,k){var s=0;for(var i=0;i<k;i++){var t=res.days[i].tmax;if(t>35)s+=(t-35)/28}return Math.min(1,s)}
function drawScene(d,res){scene.render(sceneState(d,res))}
/* ---------- Strip, readouts ---------- */
var strip=$('strip');
function drawStrip(res,k){while(strip.firstChild)strip.removeChild(strip.firstChild);
 var n=res.days.length,w=400/n;el('rect',{x:0,y:0,width:400,height:90,fill:'#fffdf8'},strip);
 el('text',{x:4,y:10,'font-size':8,fill:'#5a4d40'},strip).textContent='Hot days';el('text',{x:4,y:89,'font-size':8,fill:'#5a4d40'},strip).textContent='Water stress';
 for(var i=0;i<k;i++){var d=res.days[i],x=i*w;
  if(d.tmax>35)el('rect',{x:x,y:14,width:Math.max(1,w-0.5),height:6,fill:'#b23a1e'},strip);
  if(d.rain>0.2){var h=Math.min(46,d.rain*1.3);el('rect',{x:x,y:70-h,width:Math.max(1,w-0.5),height:h,fill:'#3b6e8f'},strip)}
  if(d.ks<0.95)el('rect',{x:x,y:74,width:Math.max(1,w-0.5),height:6,fill:'#9b6a2f',opacity:f(0.25+0.75*(1-d.ks),2)},strip)}
 el('line',{x1:0,x2:400,y1:70.5,y2:70.5,stroke:'#d9ccb3'},strip);
 if(k>0)el('line',{x1:k*w,x2:k*w,y1:2,y2:88,stroke:'#241c15','stroke-width':1.2},strip);
}
function ttBar(res){var bar=$('ttBar');bar.querySelectorAll('.tick').forEach(function(t){t.remove()});var c=res.crop,mat=c.stages[c.stages.length-1][1];
 c.stages.slice(1).forEach(function(s){var t=document.createElement('span');t.className='tick';t.style.left=(100*s[1]/mat)+'%';t.title=s[0];bar.appendChild(t)})}
function readouts(d,res){var c=res.crop,mat=c.stages[c.stages.length-1][1];
 $('dDay').textContent='Day '+d.day;$('dDate').textContent=dateStr(d.year,d.doy);
 $('ttTotal').textContent=f(d.tt,0);$('ttNeed').textContent=mat;$('ttFill').style.width=Math.min(100,100*d.tt/mat)+'%';
 $('ttFormula').innerHTML='Today: Daily Thermal Time (DTT) = ('+f(d.tmax)+' + '+f(d.tmin)+') / 2 &minus; 10 = <strong>'+f(d.dtt)+' &deg;C days</strong>'+(d.tmax>34?' (little extra benefit above 34 &deg;C)':'');
 $('rWx').textContent=f(d.tmax,0)+' / '+f(d.tmin,0)+' \u00B0C, '+(d.rain<0.2?'dry':f(d.rain)+' mm rain');
 $('rSoil').textContent=f(d.soilPct,0)+' percent';$('mSoil').style.width=d.soilPct+'%';
 $('rStress').textContent=d.stress<0.05?'None':(d.ks<d.heat?'Water stress, ':'Heat stress, ')+f(100*d.stress,0)+' percent';$('mStress').style.width=(100*d.stress)+'%';
 $('rBio').textContent=f(d.biomass/100,1)+' tonnes per hectare';}
var lastStage=-1,toastT=null;
function stageChange(d,res,quiet){if(d.stage===lastStage)return;lastStage=d.stage;var name=res.crop.stages[d.stage][0];
 $('status').textContent='Day '+d.day+': '+name+'.';if(quiet)return;var t=$('toast');t.textContent=name;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},1700)}
function result(res){var s=scen(),norm=s==='normal'?res:run('normal'),c=res.crop,last=res.days[res.days.length-1];
 var flo=res.days.find(function(x){return x.tt>=c.stages[3][1]}),stressDays=res.days.filter(function(x){return x.stress>0.2}).length;
 var pct=Math.round(100*(res.yieldDryT/norm.yieldDryT-1));
 $('resText').innerHTML='Maize reached physiological maturity on <strong>day '+last.day+'</strong> ('+dateStr(last.year,last.doy)+')'+(flo?', flowering on day '+flo.day:'')+'. Season rain '+f(res.rain,0)+' mm; '+stressDays+' days of strong stress. Dry matter '+f(res.biomass/100,1)+' tonnes per hectare &times; Harvest Index (HI) '+f(res.hi,2)+(res.hiFactor<0.99?' (cut from 0.48 by stress at flowering)':'')+'.';
 var mx=Math.max(res.yieldDryT,norm.yieldDryT);
 var row=function(lbl,v,cls){return '<div class="crow '+cls+'"><span>'+lbl+'</span><i><b style="width:'+(100*v/mx)+'%"></b></i><strong>'+f(v,1)+' t/ha</strong></div>'};
 $('compare').innerHTML=(s==='normal'?row('Normal season',res.yieldDryT,'this'):row(document.querySelector('input[name=scen]:checked').nextElementSibling.textContent,res.yieldDryT,'this')+row('Normal season',norm.yieldDryT,'norm'))+
  '<p class="note">Dry grain yield in tonnes per hectare (t/ha).</p><p class="delta">'+(s==='normal'?'Try Drought or Heat wave next.':(pct<0?'<strong>'+(-pct)+' percent less</strong> grain than the normal season.':pct>0?'<strong>'+pct+' percent more</strong> grain than the normal season.':'About the same as the normal season.'))+'</p>';
 $('result').hidden=false;}

/* ---------- Season chart ---------- */
var chart=new CWChart.Chart($('chartWx'),$('chartTT')),normalRes=null;
function chartSet(){normalRes=scen()==='normal'?res:run('normal');chart.set(res,normalRes);$('scrub').max=res.days.length}
function chartDraw(){chart.render(k);$('scrub').value=k;$('scrubOut').textContent=k;readout(k);if(window.__maths)window.__maths.sync()}
function readout(day){var d=res.days[day-1];if(!d){$('readout').textContent='Tap or hover on the chart, or move the day slider, to read a day\'s values.';return}
 $('readout').innerHTML='<strong>Day '+d.day+'</strong> ('+dateStr(d.year,d.doy)+'): maximum '+f(d.tmax)+' \u00B0C, minimum '+f(d.tmin)+' \u00B0C, rain '+f(d.rain)+' mm, Daily Thermal Time (DTT) '+f(d.dtt)+', total '+f(d.tt,0)+' \u00B0C days, '+res.crop.stages[d.stage][0]+'.'}
function pointer(e){var svg=e.currentTarget,r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;if(!chart.lay)return;var x=(e.clientX-r.left)/r.width*vb.width;var day=Math.max(1,Math.min(res.days.length,CWChart.dayAt(x,chart.span,chart.lay)));readout(day)}
['chartWx','chartTT'].forEach(function(id){$(id).addEventListener('pointermove',pointer);$(id).addEventListener('pointerdown',pointer)});
$('cmpNormal').addEventListener('change',function(){chart.overlay=this.checked;chartDraw()});
$('scrub').addEventListener('input',function(){stop();document.body.classList.remove('playing');k=+this.value;scorch=scorchUpTo(res,k);lastStage=-1;var d=res.days[k-1];drawScene(d,res);drawStrip(res,k);if(d){readouts(d,res);stageChange(d,res,true)}chartDraw();readout(k);if(k>=res.days.length)result(res);else $('result').hidden=true});
var rz;addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(chartDraw,150)});

/* ---------- Playback ---------- */
var res=null,k=0,timer=null;
function prepare(){res=run();scorch=0;curRef=Math.max(800,run('normal').biomass*0.9);k=0;lastStage=-1;$('result').hidden=true;ttBar(res);chartSet();if(window.__maths)window.__maths.reset();}
function frame(){var d=res.days[k-1];scorch=scorchUpTo(res,k);drawScene(d,res);drawStrip(res,k);chartDraw();if(d){readouts(d,res);stageChange(d,res,false)}}
function stop(){clearInterval(timer);timer=null;document.body.classList.remove('playing');$('play').textContent='Play';$('play').setAttribute('aria-pressed','false')}
function speed(){return +document.querySelector('input[name=speed]:checked').value}
function tick(){k++;frame();if(k>=res.days.length){stop();result(res);document.body.classList.remove('playing')}}
function play(){if(RM.matches){finish();return}document.body.classList.add('playing');$('play').textContent='Pause';$('play').setAttribute('aria-pressed','true');timer=setInterval(tick,speed())}
function finish(){stop();if(!res)prepare();k=res.days.length;lastStage=-1;scorch=scorchUpTo(res,k);var d=res.days[k-1];drawScene(d,res);drawStrip(res,k);chartDraw();readouts(d,res);stageChange(d,res,true);result(res);document.body.classList.remove('playing')}
$('play').addEventListener('click',function(){if(timer){stop();return}if(!res||k===0||k>=res.days.length){stop();prepare()}play()});
$('skip').addEventListener('click',function(){stop();prepare();finish()});
document.querySelectorAll('input[name=speed]').forEach(function(r){r.addEventListener('change',function(){if(timer){clearInterval(timer);timer=setInterval(tick,speed())}})});
function reset(){stop();prepare();drawScene(null,res);drawStrip(res,0);chartDraw();readout(0);$('ttFill').style.width='0';$('ttTotal').textContent='0';$('status').textContent='Press play to start the season.';$('dDay').textContent='Day 0';$('dDate').textContent='';summary();
 ['rWx','rSoil','rStress','rBio'].forEach(function(i){$(i).textContent='-'});$('mSoil').style.width='0';$('mStress').style.width='0';
 $('ttFormula').innerHTML='Today: Daily Thermal Time (DTT) = (maximum temperature + minimum temperature) / 2 &minus; base temperature of 10 &deg;C'}
$('loc').addEventListener('change',reset);document.querySelectorAll('input[name=scen]').forEach(function(r){r.addEventListener('change',reset)});
reset();
window.__cw={chart:function(){return chart},res:function(){return res},seek:function(n){stop();k=Math.min(n,res.days.length);scorch=scorchUpTo(res,k);lastStage=-1;frame();return k},sceneHash:function(){var s=$('scene').innerHTML,h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h},state:function(){var d=res&&res.days[k-1];return {k:k,n:res.days.length,done:!$('result').hidden,stress:d?d.stress:0,ks:d?d.ks:1,yield:res.yieldDryT}}};
function calc(){var a=parseFloat($('cTmax').value),b=parseFloat($('cTmin').value),c=parseFloat($('cTb').value);if([a,b,c].some(isNaN)){$('cOut').textContent='Enter all three temperatures.';return}var m=(a+b)/2,v=CW.dtt(a,b,c);
 $('cOut').innerHTML='('+a+' + '+b+') / 2 &minus; '+c+' = '+f(m-c)+(m-c<0?', which is negative, so DTT = <strong>0 degree days</strong>.':' &rarr; <strong>DTT = '+f(v)+' degree days</strong>')}
['cTmax','cTmin','cTb'].forEach(function(i){$(i).addEventListener('input',calc)});calc();
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(function(){})}

/* ---------- The mathematics behind it (lazy: renders only while open) ---------- */
(function(){
var M=window.CWMath,det=$('maths'),dayTouched=false,raf=0,fitCache={};
function open(){return det.open}
function f1(v,n){return v.toFixed(n==null?1:n)}
function draw1(){var r=res,n=r.days.length,dy=Math.max(1,Math.min(n,+$('mDay').value)),d=r.days[dy-1],cap=$('mCap').checked?30:null;
 $('mDay').max=n;$('mDayOut').textContent=dy;
 var hs=[],ts=[],tc=[];for(var h=0;h<=24;h+=0.25){hs.push(h);var t=M.sineT(h,d.tmax,d.tmin);ts.push(t);tc.push(cap!=null?Math.min(t,cap):t)}
 var mean=(d.tmax+d.tmin)/2,lo=Math.floor(Math.min(d.tmin,M.TB)/5)*5-5,hi=Math.ceil(d.tmax/5)*5+5;if((hi-lo)%10)hi+=5;
 var ser=[{x:hs,y:ts,color:'#b23a1e',width:2,cls:'m-sine'}];if(cap!=null)ser.push({x:hs,y:tc,color:'#241c15',width:1.4,dash:'4 3',cls:'m-capped'});
 M.plot($('mSine'),{x0:0,x1:24,y0:lo,y1:hi,ny:(hi-lo)/5>6?(hi-lo)/10:(hi-lo)/5,xt:[0,6,12,18,24],fx:function(v){return (v<10?'0':'')+v+':00'},yl:'Temperature (\u00B0C)',xl:'Hour of day '+dy+' ('+dateStr(d.year,d.doy)+')',
  bands:[{y0:M.TB,y1:mean,color:'#d08a1a',op:.22}],series:ser,hlines:[{y:mean,color:'#6b4226',label:'Mean '+f1(mean)+' \u00B0C'},{y:M.TB,color:'#2f6b3a',label:'Base 10 \u00B0C'}].concat(cap!=null?[{y:30,color:'#241c15',label:'Cap 30 \u00B0C',left:true,below:mean>30}]:[])});
 var sm=M.sineMean(d.tmax,d.tmin),dn=M.sineDTT(d.tmax,d.tmin,null),dc=M.sineDTT(d.tmax,d.tmin,30);
 $('mSineOut').innerHTML='Average of the curve: <strong>'+f1(sm,2)+' \u00B0C</strong>; (Tmax + Tmin) / 2 = ('+f1(d.tmax)+' + '+f1(d.tmin)+') / 2 = <strong>'+f1(mean,2)+' \u00B0C</strong>. Daily Thermal Time (DTT) '+f1(dn)+(cap!=null?', with the cap '+f1(dc):'')+' \u00B0C days. The shaded band is the mean above the base.';
 var cu=M.cumDTT(r.days,null),cc=M.cumDTT(r.days,30),ser2=[{y:cu,color:'#2f6b3a',width:2,cls:'m-cum'}];if(cap!=null)ser2.push({y:cc,color:'#241c15',width:1.6,dash:'5 3',cls:'m-cumcap'});
 var top=Math.ceil(cu[n-1]/500)*500;M.plot($('mCum'),{x0:0,x1:n,y0:0,y1:top,ny:4,xt:[0,25,50,75,100].filter(function(v){return v<=n}),yl:'Accumulated DTT (\u00B0C days)',xl:'Days after sowing',series:ser2,marks:[{x:dy,label:'Day '+dy}],
  hlines:[{y:cu[n-1],color:'#2f6b3a',label:'No cap '+f1(cu[n-1],0),left:true}].concat(cap!=null?[{y:cc[n-1],color:'#241c15',label:'With 30 \u00B0C cap '+f1(cc[n-1],0),left:true,below:true}]:[])});
 $('mCum').dataset.nocap=cu[n-1];$('mCum').dataset.cap=cc[n-1]}
function draw2(){var r=res,e=M.euler(r),n=r.days.length,sw=r.days.map(function(d){return d.sw});
 var sHi=Math.ceil(Math.max.apply(null,e.S)/40)*40,xt=[0,25,50,75,100].filter(function(v){return v<=n}),dy=Math.max(1,Math.min(n,+$('mDay').value));
 M.plot($('mWater'),{h:160,x0:0,x1:n,y0:0,y1:sHi,ny:4,xt:xt,yl:'Soil water stored, S (mm)',xl:'Days after sowing',series:[{y:e.S,color:'#3b6e8f',width:2,cls:'m-water'}],marks:[{x:dy}]});
 var bHi=Math.ceil(Math.max(1,e.B[n-1])/400)*400;M.plot($('mBio'),{h:160,x0:0,x1:n,y0:0,y1:bHi,ny:4,xt:xt,yl:'Dry matter, B (g per square metre)',xl:'Days after sowing',series:[{y:e.B,color:'#2f6b3a',width:2,cls:'m-bio'}],marks:[{x:dy}]});
 $('mWater').dataset.series=JSON.stringify(e.S.map(function(v){return +v.toFixed(3)}));$('mBio').dataset.series=JSON.stringify(e.B.map(function(v){return +v.toFixed(3)}));
 var d=r.days[dy-1],prev=dy>1?r.days[dy-2]:null;
 $('mEulerOut').innerHTML='Day '+dy+': S = '+f1(prev?prev.sw:e.S0)+' + '+f1(d.effRain)+' rain &minus; '+f1(d.etc)+' evapotranspiration &minus; '+f1(d.drain)+' drainage'+(Math.abs(d.swOther)>0.05?' + '+f1(d.swOther)+' from deeper roots':'')+' = <strong>'+f1(d.sw)+' mm</strong>. B = '+f1(prev?prev.biomass:0)+' + '+f1(d.growth)+' = <strong>'+f1(d.biomass)+' g per square metre</strong>.'}
function draw3(){var loc=$('loc').value,hN=+document.querySelector('input[name=harm]:checked').value,key=loc+hN,Y=M.yearlyMeans(WEATHER[loc]),fit=fitCache[key]||(fitCache[key]=M.fourierFit(Y.t,Y.y,hN));
 var n=Y.t.length,fy=Y.t.map(fit.f),lo=Math.floor(Math.min.apply(null,Y.y))-1,hi=Math.ceil(Math.max.apply(null,Y.y))+1,xt=Y.years.map(function(_,i){return Math.round(i*365.25)});
 M.plot($('mFour'),{h:180,x0:0,x1:n,y0:lo,y1:hi,ny:4,xt:xt,fx:function(v){return Y.years[Math.round(v/365.25)]},yl:'Daily mean temperature (\u00B0C)',xl:'Year (NASA POWER, '+(loc==='tamale'?'Tamale':'Cape Coast')+')',
  series:[{x:Y.t,y:Y.y,color:'#a8977b',dots:true,r:.9,op:.7},{x:Y.t,y:fy,color:'#b23a1e',width:2,cls:'m-fit'}]});
 var c=fit.c,s='a<sub>0</sub> = '+f1(c[0],2)+' \u00B0C';for(var j=1;j<=hN;j++)s+=', a<sub>'+j+'</sub> = '+f1(c[2*j-1],2)+', b<sub>'+j+'</sub> = '+f1(c[2*j],2);
 $('mFourOut').innerHTML=s+'. R squared = <strong>'+f1(fit.r2,2)+'</strong>: the fit explains '+Math.round(fit.r2*100)+' percent of the day to day variation; the rest is weather noise.';$('mFour').dataset.r2=fit.r2}
function draw4(){var kk=+$('mK').value,ls=[],fs=[],dy=Math.max(1,Math.min(res.days.length,+$('mDay').value)),lai=res.days[dy-1].lai;$('mKOut').textContent=kk.toFixed(2);
 for(var l=0;l<=6.001;l+=0.1){ls.push(l);fs.push(M.beer(kk,l))}var fi=M.beer(kk,lai);
 M.plot($('mBeer'),{h:170,x0:0,x1:6,y0:0,y1:1,ny:4,xt:[0,1,2,3,4,5,6],yl:'Fraction of light intercepted',xl:'Leaf Area Index (LAI)',series:[{x:ls,y:fs,color:'#2f6b3a',width:2,cls:'m-beer'}],marks:[{x:lai,y:fi,label:'Day '+dy}]});
 $('mBeerOut').innerHTML='Day '+dy+': Leaf Area Index (LAI) '+f1(lai,2)+', so 1 &minus; e<sup>&minus;'+kk.toFixed(2)+' &times; '+f1(lai,2)+'</sup> = <strong>'+f1(fi*100,0)+' percent</strong> of the light is caught.'}
function all(){if(!open()||!res)return;if(!dayTouched)$('mDay').value=Math.max(1,Math.min(res.days.length,k||Math.round(res.days.length/2)));draw1();draw2();draw3();draw4()}
window.__maths={all:all,sync:function(){if(!open()||dayTouched)return;cancelAnimationFrame(raf);raf=requestAnimationFrame(all)},reset:function(){dayTouched=false;if(open())all()}};
det.addEventListener('toggle',all);
$('mDay').addEventListener('input',function(){dayTouched=true;draw1();draw2();draw4()});
$('mCap').addEventListener('change',draw1);
$('mK').addEventListener('input',draw4);
document.querySelectorAll('input[name=harm]').forEach(function(r){r.addEventListener('change',draw3)});
})();

})();
