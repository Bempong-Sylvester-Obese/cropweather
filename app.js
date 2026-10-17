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

/* ---------- Playback ---------- */
var res=null,k=0,timer=null;
function prepare(){res=run();scorch=0;curRef=Math.max(800,run('normal').biomass*0.9);k=0;lastStage=-1;$('result').hidden=true;ttBar(res);}
function frame(){var d=res.days[k-1];scorch=scorchUpTo(res,k);drawScene(d,res);drawStrip(res,k);if(d){readouts(d,res);stageChange(d,res,false)}}
function stop(){clearInterval(timer);timer=null;$('pause').disabled=true;$('pause').textContent='Pause';$('play').textContent='Play the season'}
function tick(){k++;frame();if(k>=res.days.length){stop();result(res);document.body.classList.remove('playing')}}
function play(){if(RM.matches){finish();return}document.body.classList.add('playing');$('pause').disabled=false;$('play').textContent='Restart';timer=setInterval(tick,+$('speed').value)}
function finish(){stop();if(!res)prepare();k=res.days.length;lastStage=-1;scorch=scorchUpTo(res,k);var d=res.days[k-1];drawScene(d,res);drawStrip(res,k);readouts(d,res);stageChange(d,res,true);result(res);document.body.classList.remove('playing')}
$('play').addEventListener('click',function(){stop();prepare();play()});
$('pause').addEventListener('click',function(){if(timer){clearInterval(timer);timer=null;this.textContent='Resume';document.body.classList.remove('playing')}else{this.textContent='Pause';document.body.classList.add('playing');timer=setInterval(tick,+$('speed').value)}});
$('skip').addEventListener('click',function(){stop();prepare();finish()});
$('speed').addEventListener('change',function(){if(timer){clearInterval(timer);timer=setInterval(tick,+this.value)}});
function reset(){stop();prepare();drawScene(null,res);drawStrip(res,0);$('ttFill').style.width='0';$('ttTotal').textContent='0';$('status').textContent='Press play to start the season.';$('dDay').textContent='Day 0';$('dDate').textContent='';summary();
 ['rWx','rSoil','rStress','rBio'].forEach(function(i){$(i).textContent='-'});$('mSoil').style.width='0';$('mStress').style.width='0';
 $('ttFormula').innerHTML='Today: Daily Thermal Time (DTT) = (maximum temperature + minimum temperature) / 2 &minus; base temperature of 10 &deg;C'}
$('loc').addEventListener('change',reset);document.querySelectorAll('input[name=scen]').forEach(function(r){r.addEventListener('change',reset)});
reset();
window.__cw={seek:function(n){stop();k=Math.min(n,res.days.length);scorch=scorchUpTo(res,k);lastStage=-1;frame();return k},sceneHash:function(){var s=$('scene').innerHTML,h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h},state:function(){var d=res&&res.days[k-1];return {k:k,n:res.days.length,done:!$('result').hidden,stress:d?d.stress:0,ks:d?d.ks:1,yield:res.yieldDryT}}};
function calc(){var a=parseFloat($('cTmax').value),b=parseFloat($('cTmin').value),c=parseFloat($('cTb').value);if([a,b,c].some(isNaN)){$('cOut').textContent='Enter all three temperatures.';return}var m=(a+b)/2,v=CW.dtt(a,b,c);
 $('cOut').innerHTML='('+a+' + '+b+') / 2 &minus; '+c+' = '+f(m-c)+(m-c<0?', which is negative, so DTT = <strong>0 degree days</strong>.':' &rarr; <strong>DTT = '+f(v)+' degree days</strong>')}
['cTmax','cTmin','cTb'].forEach(function(i){$(i).addEventListener('input',calc)});calc();
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(function(){})}
})();
