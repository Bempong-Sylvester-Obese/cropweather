(function(){
var $=function(i){return document.getElementById(i)},f=function(n,d){return Number(n).toFixed(d==null?1:d)};
var cs=getComputedStyle(document.documentElement);function pal(n,fb){var v=cs.getPropertyValue(n).trim();return v||fb}
var P={rain:pal('--c-rain','#4a8fd1'),tmax:pal('--c-tmax','#c0392b'),tmin:pal('--c-tmin','#e08e0b'),tt:pal('--c-tt','#d35400'),bio:pal('--c-bio','#1f7a3f'),soil:pal('--c-soil','#2a6db0'),stress:pal('--c-stress','#c0392b'),ink:pal('--chart-ink','#333'),grid:pal('--chart-grid','#eee')};
var LOC={capecoast:{lat:5.1,dates:[['15 March (early major season)',74],['1 April (major season)',91],['15 April (major season)',105],['1 May (late major season)',121],['1 September (minor season)',244],['15 September (minor season)',258]],def:1},
 tamale:{lat:9.4,dates:[['15 May',135],['1 June (common)',152],['15 June',166],['1 July',182]],def:1}};
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dateStr(y,doy){var d=new Date(Date.UTC(y,0,doy));return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+y}
function fill(){var L=LOC[$('sLoc').value];$('sDate').innerHTML='';L.dates.forEach(function(d,i){var o=new Option(d[0],d[1]);if(i===L.def)o.selected=true;$('sDate').add(o)});}
Object.keys(WEATHER.capecoast).sort().reverse().forEach(function(y){$('sYear').add(new Option(y,y))});
$('sYear').value='2021';$('sLoc').addEventListener('change',fill);fill();
function opts(sc){var doy=+$('sDate').value,s=sc||$('sScen').value;if(s==='late'){doy+=30;}
 return {years:WEATHER[$('sLoc').value],year:+$('sYear').value,doy:doy,crop:$('sCrop').value,scenario:s==='late'?'normal':s,lat:LOC[$('sLoc').value].lat};}
var NS='http://www.w3.org/2000/svg';
function chart(svg,n,series,opt){
 while(svg.firstChild)svg.removeChild(svg.firstChild);
 var vb=svg.viewBox.baseVal,W=vb.width,H=vb.height,L=42,R=42,T=12,B=28;function el(t,a,x){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(x!=null)e.textContent=x;svg.appendChild(e);return e}
 var X=function(i){return L+(W-L-R)*i/Math.max(n,1)};var ax={l:opt.l,r:opt.r};
 function Y(v,a){var m=ax[a];return H-B-(H-T-B)*(v-m[0])/(m[1]-m[0])}
 for(var g=0;g<=4;g++){var y=T+(H-T-B)*g/4;el('line',{x1:L,x2:W-R,y1:y,y2:y,stroke:P.grid});
  el('text',{x:L-6,y:y+4,'text-anchor':'end','font-size':11,fill:opt.lc||P.ink},f(ax.l[1]-(ax.l[1]-ax.l[0])*g/4,0));
  if(ax.r)el('text',{x:W-R+6,y:y+4,'font-size':11,fill:opt.rc||P.ink},f(ax.r[1]-(ax.r[1]-ax.r[0])*g/4,0));}
 for(g=0;g<=5;g++){var dx=Math.round(n*g/5);el('text',{x:X(dx),y:H-8,'text-anchor':'middle','font-size':11,fill:P.ink},dx)}
 series.forEach(function(s){var a=s.axis||'l';if(s.type==='bar'){var bw=Math.max(1,(W-L-R)/n*0.8);s.vals.forEach(function(v,i){if(v>0.2)el('rect',{x:X(i),y:Y(Math.min(v,ax[a][1]),a),width:bw,height:H-B-Y(Math.min(v,ax[a][1]),a),fill:s.color,opacity:s.op||1})});}
  else{var p='';s.vals.forEach(function(v,i){p+=(i?' L':'M')+X(i+1)+' '+Y(v,a)});if(p)el('path',{d:p,fill:'none',stroke:s.color,'stroke-width':s.w||2.5,'stroke-linejoin':'round'});}});
 if(opt.flower!=null)el('line',{x1:X(opt.flower),x2:X(opt.flower),y1:T,y2:H-B,stroke:P.ink,'stroke-dasharray':'2 4',opacity:.6});
}
var res=null,shown=0,timer=null;
var SHORT={'End of juvenile stage':'Juvenile','Physiological maturity':'Maturity','Storage root bulking':'Bulking','Canopy building':'Canopy','Harvest stage':'Harvest','Grain filling':'Grain fill'};
function short(n){n=n.split(' (')[0];return SHORT[n]||n}
function stageBar(i){var c=res.crop;$('stageBar').innerHTML=c.stages.map(function(s,j){return '<div class="'+(j<i?'done':j===i?'on':'')+'" title="'+s[0]+'">'+short(s[0])+'</div>'}).join('')}
function draw(k){var d=res.days.slice(0,k),n=res.crop.harvestDays||res.days.length,c=res.crop,mat=c.stages[c.stages.length-1][1],last=d[d.length-1];
 var maxT=Math.max.apply(null,res.days.map(function(x){return x.tmax}));
 var fl=null;if(c.harvestDays==null){for(var i=0;i<d.length;i++){if(d[i].tt>=c.stages[3][1]){fl=i+1;break}}}
 chart($('cWx'),n,[{vals:d.map(function(x){return x.rain}),color:P.rain,type:'bar',axis:'r'},{vals:d.map(function(x){return x.tmax}),color:P.tmax},{vals:d.map(function(x){return x.tmin}),color:P.tmin}],{l:[10,Math.max(45,Math.ceil(maxT/5)*5)],r:[0,80],lc:P.tmax,rc:P.rain,flower:fl});
 var maxB=Math.max(5,Math.ceil(res.biomass/100/5)*5);
 chart($('cGrow'),n,[{vals:d.map(function(x){return Math.min(100,100*x.tt/mat)}),color:P.tt,axis:'l'},{vals:d.map(function(x){return x.biomass/100}),color:P.bio,axis:'r',w:3}],{l:[0,100],r:[0,maxB],lc:P.tt,rc:P.bio,flower:fl});
 chart($('cWater'),n,[{vals:d.map(function(x){return x.soilPct}),color:P.soil},{vals:d.map(function(x){return 100*x.stress}),color:P.stress}],{l:[0,100],flower:fl});
 if(!last)return;
 $('kDay').textContent=last.day;$('kDate').textContent=dateStr(last.year,last.doy);$('kStage').textContent=c.stages[last.stage][0];
 $('kTT').textContent=f(last.tt,0);$('kLAI').textContent=f(last.lai,2);$('kBio').textContent=f(last.biomass/100,2);$('kSoil').textContent=f(last.soilPct,0);
 $('kWx').textContent=f(last.tmax)+' / '+f(last.tmin)+' \u00B0C';$('kWx2').textContent='Rain '+f(last.rain)+' mm, sun '+f(last.srad)+' MJ';
 $('kStress').textContent=last.stress<0.05?'None':(last.ks<last.heat?'Water ':'Heat ')+f(100*last.stress,0)+'%';
 stageBar(last.stage);}
function summary(){var c=res.crop,last=res.days[res.days.length-1];
 var flo=res.days.find(function(x){return x.tt>=c.stages[3][1]});
 var stressDays=res.days.filter(function(x){return x.stress>0.2}).length;
 var prod=c.product==='grain'?'grain':'storage roots';
 $('sResult').innerHTML='<p class="big"><strong>'+c.name+' '+(c.harvestDays?'harvested':'matured')+' on day '+last.day+' ('+dateStr(last.year,last.doy)+').</strong></p>'+
 '<p>'+(flo?c.stages[3][0]+' on day '+flo.day+'. ':'')+'Season rain '+f(res.rain,0)+' mm, crop water use '+f(res.etc,0)+' mm. Days with strong stress (over 20 percent): '+stressDays+'.</p>'+
 '<p>Final biomass '+f(res.biomass/100,1)+' tonnes per hectare &times; Harvest Index '+f(res.hi,2)+(res.hiFactor<0.99?' (lowered from '+f(c.hi,2)+' by stress at flowering)':'')+' = <strong>'+f(res.yieldDryT,1)+' tonnes per hectare dry '+prod+'</strong>'+(c.name==='Cassava'?' (about '+f(res.yieldFreshT,0)+' tonnes per hectare fresh roots)':' (about '+f(res.yieldFreshT,1)+' at market moisture)')+'.</p>'+
 '<p class="note">Teaching demo: no nutrient, pest or weed losses, so this is nearer to a well managed field than to an average Ghanaian farm.</p>';}
function stop(){clearInterval(timer);timer=null;$('sPause').disabled=true;$('sPause').textContent='Pause'}
function play(){stop();$('sPause').disabled=false;timer=setInterval(function(){shown++;draw(shown);if(shown>=res.days.length){stop();summary();}},+$('sSpeed').value)}
$('sRun').addEventListener('click',function(){res=SIM.simulate(opts());shown=0;$('sResult').innerHTML='<p>Simulating day by day...</p>';
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){shown=res.days.length;draw(shown);summary();return}play();});
$('sPause').addEventListener('click',function(){if(timer){clearInterval(timer);timer=null;this.textContent='Resume'}else play()});
$('sEnd').addEventListener('click',function(){res=SIM.simulate(opts());stop();shown=res.days.length;draw(shown);summary()});
function compare(){var sc=[['normal','Normal'],['drought','Drought'],['heat','Heat wave'],['elnino','El Ni\u00F1o style'],['lanina','La Ni\u00F1a style'],['late','Late planting']];
 var h='<table><caption class="note">'+$('sCrop').selectedOptions[0].text+', '+$('sLoc').selectedOptions[0].text.split(' (')[0]+', '+$('sYear').value+'</caption><thead><tr><th scope="col">Scenario</th><th scope="col">Days</th><th scope="col">Rain (mm)</th><th scope="col">Yield (t/ha dry)</th></tr></thead><tbody>';
 sc.forEach(function(s){var r=SIM.simulate(opts(s[0]));h+='<tr><td>'+s[1]+'</td><td>'+r.days.length+'</td><td>'+f(r.rain,0)+'</td><td>'+f(r.yieldDryT,1)+'</td></tr>'});
 $('sCompare').innerHTML=h+'</tbody></table>';}
['sLoc','sCrop','sYear','sDate'].forEach(function(i){$(i).addEventListener('change',compare)});compare();
res=SIM.simulate(opts());shown=0;draw(0);stageBar(-1);
window.__simDraw=function(){shown=res.days.length;draw(shown);summary()};
})();
