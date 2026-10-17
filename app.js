(function(){
'use strict';
var $=function(i){return document.getElementById(i)},f=function(n,d){return Number(n).toFixed(d==null?1:d)};
var NS='http://www.w3.org/2000/svg',RM=matchMedia('(prefers-reduced-motion: reduce)');
var LOC={tamale:{lat:9.4,doy:152},capecoast:{lat:5.1,doy:91}},YEAR=2021;
var HINT={normal:'Real 2021 weather, unchanged.',drought:'Half the rain, plus a 30 day dry spell from about day 45, close to flowering.',heat:'Daily highs 6 \u00B0C hotter for 3 weeks from about day 50, close to flowering.',elnino:'An El Ni\u00F1o style year: 25 percent less rain and slightly warmer.',late:'Same weather, but sown 30 days after the usual date.'};
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dateStr(y,doy){var d=new Date(Date.UTC(y,0,doy));return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+y}
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function lerp(a,b,t){return a+(b-a)*t}
function mix(c1,c2,t){t=Math.max(0,Math.min(1,t));var a=parseInt(c1.slice(1),16),b=parseInt(c2.slice(1),16);
 var r=Math.round(lerp(a>>16,b>>16,t)),g=Math.round(lerp(a>>8&255,b>>8&255,t)),bl=Math.round(lerp(a&255,b&255,t));return '#'+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1)}
function scen(){return document.querySelector('input[name=scen]:checked').value}
function run(sc){var L=LOC[$('loc').value],s=sc||scen();return SIM.simulate({years:WEATHER[$('loc').value],year:YEAR,doy:L.doy+(s==='late'?30:0),crop:'maize',scenario:s==='late'?'normal':s,lat:L.lat})}

/* ---------- Scene ---------- */
var svg=$('scene'),defs=el('defs',{},svg);
var g1=el('linearGradient',{id:'sky',x1:0,y1:0,x2:0,y2:1},defs);var st1=el('stop',{offset:0},g1),st2=el('stop',{offset:1},g1);
var sky=el('rect',{x:0,y:0,width:400,height:170,fill:'url(#sky)'},svg);
var sun=el('g',{transform:'translate(330 52)'},svg);var rays=el('g',{'class':'rays'},sun);
for(var i=0;i<12;i++){var a=i*Math.PI/6;el('line',{x1:Math.cos(a)*26,y1:Math.sin(a)*26,x2:Math.cos(a)*36,y2:Math.sin(a)*36,stroke:'#e3a92b','stroke-width':3,'stroke-linecap':'round'},rays)}
var sunDisc=el('circle',{r:20,fill:'#f2c14e'},sun);
var clouds=el('g',{},svg),shimmer=el('g',{'class':'shimmer'},svg),rain=el('g',{'class':'rain'},svg);
var hills=el('path',{d:'M0 150 Q 80 128 160 146 T 320 140 T 400 146 V170 H0Z',fill:'#b7a77e',opacity:.55},svg);
var ground=el('rect',{x:0,y:168,width:400,height:92},svg);
var cracks=el('g',{stroke:'#7d5c3a','stroke-width':1.2,fill:'none',opacity:0},svg);
[[40,200],[120,236],[210,214],[300,240],[360,206],[80,250],[250,190]].forEach(function(p){el('path',{d:'M'+p[0]+' '+p[1]+' l8 4 l-3 7 l9 3 M'+(p[0]+8)+' '+(p[1]+4)+' l10 -3'},cracks)});
var puddles=el('g',{fill:'#6f8fa3',opacity:0},svg);[[70,226,22],[260,232,28],[340,214,16]].forEach(function(p){el('ellipse',{cx:p[0],cy:p[1],rx:p[2],ry:3},puddles)});
var rowsG=el('g',{},svg);
var PL=[[46,214,.78],[104,214,.78],[162,214,.78],[220,214,.78],[278,214,.78],[336,214,.78],[18,246,1],[82,246,1],[146,246,1],[210,246,1],[274,246,1],[338,246,1],[392,246,1]];
function cloud(x,y,s,c){var g=el('g',{transform:'translate('+x+' '+y+') scale('+s+')',fill:c},clouds);el('ellipse',{cx:0,cy:0,rx:26,ry:14},g);el('ellipse',{cx:20,cy:-8,rx:20,ry:15},g);el('ellipse',{cx:40,cy:2,rx:22,ry:12},g);return g}
function plant(g,x,y,sc,p){
 var h=p.h*sc;if(h<2){if(p.sown)el('ellipse',{cx:x,cy:y,rx:3*sc,ry:1.5*sc,fill:'#4a2c18'},g);return}
 var lean=p.droop*6*sc;
 el('path',{d:'M'+x+' '+y+' Q '+(x+lean*0.3)+' '+(y-h*0.6)+' '+(x+lean)+' '+(y-h),stroke:p.stem,'stroke-width':Math.max(1.5,3.2*sc*Math.min(1,p.h/60+.3)),fill:'none','stroke-linecap':'round'},g);
 for(var k=0;k<p.leaves;k++){
  var t=(k+1)/(p.leaves+1),sy=y-h*t*0.92,sx=x+lean*t,side=k%2?1:-1,len=(14+26*Math.sin(Math.PI*Math.min(.95,t*0.9+.08)))*sc*Math.min(1,.35+p.h/120);
  var up=lerp(0.9,-0.6,p.droop),tx=sx+side*len*Math.cos(up*0.6),ty=sy-len*Math.sin(up);
  var cx=sx+side*len*0.55,cy=sy-len*(0.55+0.2*(1-p.droop));
  el('path',{d:'M'+sx+' '+sy+' Q '+cx+' '+cy+' '+tx+' '+ty,stroke:p.leaf,'stroke-width':Math.max(1.4,3.4*sc*(1-p.droop*0.45)),fill:'none','stroke-linecap':'round'},g)}
 var top=[x+lean,y-h];
 if(p.tassel){for(var j=-2;j<=2;j++)el('line',{x1:top[0],y1:top[1],x2:top[0]+j*3.2*sc,y2:top[1]-9*sc+Math.abs(j)*2*sc,stroke:p.tasselC,'stroke-width':1.6*sc,'stroke-linecap':'round'},g)}
 if(p.cob>0){var cyy=y-h*0.52,cx2=x+lean*0.5+4*sc;el('ellipse',{cx:cx2,cy:cyy,rx:3.4*sc*p.cob,ry:8*sc*p.cob,fill:p.cobC,transform:'rotate(18 '+cx2+' '+cyy+')'},g);
  el('path',{d:'M'+(cx2+1)+' '+(cyy-8*sc*p.cob)+' q 3 -5 6 -3',stroke:'#8a5a2b','stroke-width':1.2,fill:'none'},g)}
}
var curRef=1;
function drawScene(d,res){
 var rainmm=d?d.rain:0,tx=d?d.tmax:30,soil=d?d.soilPct/100:0.6,stress=d?d.stress:0,ks=d?d.ks:1;
 var hot=Math.max(0,Math.min(1,(tx-33)/6)),wet=Math.min(1,rainmm/15),cloudy=d?Math.max(wet,Math.max(0,(18-d.srad)/10)):0.1;
 st1.setAttribute('stop-color',mix(mix('#9fc3d6','#e9c98d',hot),'#8e9aa0',wet));st2.setAttribute('stop-color',mix(mix('#e6eee8','#f6e3b8',hot),'#c6cbc8',wet));
 sun.setAttribute('opacity',f(1-0.85*Math.min(1,cloudy),2));sunDisc.setAttribute('r',f(20+hot*5,1));sunDisc.setAttribute('fill',mix('#f2c14e','#f08a2c',hot));
 while(clouds.firstChild)clouds.removeChild(clouds.firstChild);
 var nC=rainmm>0.5?Math.min(4,1+Math.round(rainmm/6)):(cloudy>0.3?1:0),cc=mix('#ffffff','#7c8487',wet);
 for(var i=0;i<nC;i++)cloud(30+i*85+(i%2)*20,30+(i%2)*18,0.9+wet*0.4,cc);
 while(rain.firstChild)rain.removeChild(rain.firstChild);
 if(rainmm>1){var n=Math.min(60,Math.round(rainmm*3));for(i=0;i<n;i++){var x=(i*53)%400,y=50+((i*37)%110);el('line',{x1:x,y1:y,x2:x-3,y2:y+10,stroke:'#4f7d99','stroke-width':1.4,'stroke-linecap':'round',style:'animation-delay:-'+(i%7)*0.11+'s'},rain)}}
 while(shimmer.firstChild)shimmer.removeChild(shimmer.firstChild);
 if(tx>34){for(i=0;i<5;i++){var yy=110+i*12;el('path',{d:'M0 '+yy+' q 20 -5 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0',stroke:'#e08e3c','stroke-width':1.2,fill:'none',opacity:f(0.15+hot*0.35,2),style:'animation-delay:-'+i*0.3+'s'},shimmer)}}
 ground.setAttribute('fill',mix('#c4a274','#5a3a22',soil));
 cracks.setAttribute('opacity',f(Math.max(0,(0.3-soil)/0.3),2));puddles.setAttribute('opacity',f(rainmm>15?0.7:rainmm>8?0.35:0,2));
 hills.setAttribute('fill',mix('#c2ad7c','#7f9a5b',Math.min(1,soil*1.2)));
 while(rowsG.firstChild)rowsG.removeChild(rowsG.firstChild);
 var c=SIM.CROPS.maize,tt=d?d.tt:0,stg=c.stages,sen=Math.max(0,Math.min(1,(tt-stg[4][1])/(stg[5][1]-stg[4][1])));
 var grow=d?Math.min(1,d.biomass/curRef):0,dev=Math.min(1,tt/stg[3][1]);
 var hgt=tt<stg[1][1]?0:8+150*Math.min(dev,0.25+0.75*grow)*(0.55+0.45*Math.min(1,grow*1.3));
 var p={sown:!!d,h:hgt,droop:Math.min(1,(1-ks)*1.25+(sen*0.25)),leaves:Math.min(11,Math.max(2,Math.floor(tt/95))),
  leaf:mix(mix('#3f7d3a','#9b9440',stress*1.2),'#c7a95e',sen),stem:mix(mix('#4f8a3f','#9b9440',stress),'#bf9f58',sen),
  tassel:tt>=stg[3][1]-60,tasselC:mix('#d9b54a','#a8874a',sen),cob:tt>=stg[4][1]?Math.min(1,0.4+(tt-stg[4][1])/400):0,cobC:mix('#8fb05a','#e3c27a',sen)};
 PL.forEach(function(q,k){var jitter=1+((k*7)%5-2)*0.03;var pp=Object.assign({},p,{h:p.h*jitter});plant(rowsG,q[0],q[1],q[2],pp)});
}

/* ---------- Strip, readouts ---------- */
var strip=$('strip');
function drawStrip(res,k){while(strip.firstChild)strip.removeChild(strip.firstChild);
 var n=res.days.length,w=400/n;el('rect',{x:0,y:0,width:400,height:90,fill:'#fffdf8'},strip);
 el('text',{x:4,y:10,'font-size':8,fill:'#5a4d40'},strip).textContent='Hot days';el('text',{x:4,y:68,'font-size':8,fill:'#5a4d40'},strip).textContent='Rain';el('text',{x:4,y:89,'font-size':8,fill:'#5a4d40'},strip).textContent='Water stress';
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

/* ---------- Playback ---------- */
var res=null,k=0,timer=null;
function prepare(){res=run();curRef=Math.max(800,run('normal').biomass*0.9);k=0;lastStage=-1;$('result').hidden=true;ttBar(res);}
function frame(){var d=res.days[k-1];drawScene(d,res);drawStrip(res,k);if(d){readouts(d,res);stageChange(d,res,false)}}
function stop(){clearInterval(timer);timer=null;$('pause').disabled=true;$('pause').textContent='Pause';$('play').textContent='Play the season'}
function tick(){k++;frame();if(k>=res.days.length){stop();result(res);document.body.classList.remove('playing')}}
function play(){if(RM.matches){finish();return}document.body.classList.add('playing');$('pause').disabled=false;$('play').textContent='Restart';timer=setInterval(tick,+$('speed').value)}
function finish(){stop();if(!res)prepare();k=res.days.length;lastStage=-1;var d=res.days[k-1];drawScene(d,res);drawStrip(res,k);readouts(d,res);stageChange(d,res,true);result(res);document.body.classList.remove('playing')}
$('play').addEventListener('click',function(){stop();prepare();play()});
$('pause').addEventListener('click',function(){if(timer){clearInterval(timer);timer=null;this.textContent='Resume';document.body.classList.remove('playing')}else{this.textContent='Pause';document.body.classList.add('playing');timer=setInterval(tick,+$('speed').value)}});
$('skip').addEventListener('click',function(){stop();prepare();finish()});
$('speed').addEventListener('change',function(){if(timer){clearInterval(timer);timer=setInterval(tick,+this.value)}});
function reset(){stop();prepare();drawScene(null,res);drawStrip(res,0);$('ttFill').style.width='0';$('ttTotal').textContent='0';$('status').textContent='Press play to start the season.';$('dDay').textContent='Day 0';$('dDate').textContent='';$('scenHint').textContent=HINT[scen()];
 ['rWx','rSoil','rStress','rBio'].forEach(function(i){$(i).textContent='-'});$('mSoil').style.width='0';$('mStress').style.width='0';
 $('ttFormula').innerHTML='Today: Daily Thermal Time (DTT) = (maximum temperature + minimum temperature) / 2 &minus; base temperature of 10 &deg;C'}
$('loc').addEventListener('change',reset);document.querySelectorAll('input[name=scen]').forEach(function(r){r.addEventListener('change',reset)});
reset();
window.__cw={state:function(){var d=res&&res.days[k-1];return {k:k,n:res.days.length,done:!$('result').hidden,stress:d?d.stress:0,ks:d?d.ks:1,yield:res.yieldDryT}}};
function calc(){var a=parseFloat($('cTmax').value),b=parseFloat($('cTmin').value),c=parseFloat($('cTb').value);if([a,b,c].some(isNaN)){$('cOut').textContent='Enter all three temperatures.';return}var m=(a+b)/2,v=CW.dtt(a,b,c);
 $('cOut').innerHTML='('+a+' + '+b+') / 2 &minus; '+c+' = '+f(m-c)+(m-c<0?', which is negative, so DTT = <strong>0 degree days</strong>.':' &rarr; <strong>DTT = '+f(v)+' degree days</strong>')}
['cTmax','cTmin','cTb'].forEach(function(i){$(i).addEventListener('input',calc)});calc();
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(function(){})}
})();
