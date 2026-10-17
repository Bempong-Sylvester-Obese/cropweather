(function(){
var $=function(id){return document.getElementById(id)};
function fmt(n,d){return Number(n).toFixed(d==null?1:d)}
var cs=getComputedStyle(document.documentElement);function pal(n,f){var v=cs.getPropertyValue(n).trim();return v||f}
/* Phenophases */
var stages=[
 ["Sowing","Seed goes into moist soil. Thermal time counting starts here (0 degree Celsius days)."],
 ["Emergence","Seedling appears above the soil. Typically about 60 to 80 degree Celsius days after sowing (about 4 to 6 days in warm Ghanaian soils)."],
 ["Vegetative","Leaves and stem grow quickly. Dry matter builds up as leaves intercept more sunlight."],
 ["Tasselling and silking","Flowering. Typically about 700 to 800 degree Celsius days after sowing with a 10 \u00B0C base (about 50 to 60 days). Very sensitive to drought and heat: stress here lowers the harvest index."],
 ["Grain filling","Dry matter moves into the grain. Sunlight and water still matter a lot."],
 ["Physiological maturity","A black layer forms at the base of each kernel; the grain has reached maximum dry weight. Typically about 1400 to 1600 degree Celsius days with a 10 \u00B0C base (about 100 to 120 days)."]];
document.querySelectorAll('.stages button').forEach(function(b){
 b.setAttribute('aria-pressed','false');
 b.addEventListener('click',function(){
  document.querySelectorAll('.stages button').forEach(function(x){x.setAttribute('aria-pressed','false')});
  b.setAttribute('aria-pressed','true');var s=stages[b.dataset.i];
  $('stageInfo').innerHTML='<strong>'+s[0]+':</strong> '+s[1];});});
/* Yield */
function yieldUpd(){
 var l=+$('lgp').value,r=+$('rate').value,h=+$('hi').value;
 $('lgpOut').textContent=l;$('rateOut').textContent=r;$('hiOut').textContent=fmt(h,2);
 var y=CW.yieldCalc(l,r,h);
 $('bio').textContent=fmt(y.biomass,0)+' grams per square metre ('+fmt(y.biomass/100,1)+' tonnes per hectare)';
 $('yld').textContent=fmt(y.grain,0)+' grams per square metre = '+fmt(y.tPerHa,2)+' tonnes per hectare';
 $('barGrain').style.width=(h*100)+'%';}
['lgp','rate','hi'].forEach(function(i){$(i).addEventListener('input',yieldUpd)});
document.querySelectorAll('[data-p]').forEach(function(b){b.addEventListener('click',function(){
 var p=b.dataset.p.split(',');$('lgp').value=p[0];$('rate').value=p[1];$('hi').value=p[2];yieldUpd();});});
yieldUpd();
/* DTT */
var crops=[["Maize",10,750,"to tasselling"],["Sorghum",10,1100,"to flowering"],["Rice",10,1200,"to flowering"],["Cowpea",8,700,"to flowering"],["Groundnut",10,850,"to flowering"],["Cassava",13,1500,"to early tuber bulking"],["Custom",10,750,""]];
crops.forEach(function(c,i){var o=document.createElement('option');o.value=i;o.textContent=c[0]+(i<crops.length-1?', base '+c[1]+' \u00B0C':' (enter your own)');$('crop').appendChild(o)});
$('crop').addEventListener('change',function(){var c=crops[this.value];if(this.value<crops.length-1){$('tbase').value=c[1];$('target').value=c[2];}dttUpd();});
function series(tmax,tmin,tb,target){
 var days=[],vary=$('vary').value==='1',seed=7;
 function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647-0.5}
 var d=CW.dtt(tmax,tmin,tb),n=d>0?Math.min(400,Math.ceil(target/d)+15):60;
 for(var i=0;i<n;i++){var j=vary?rnd()*4:0;days.push({tmax:tmax+j,tmin:tmin+j*0.6});}
 return CW.accumulate(days,tb);}
function dttUpd(){
 var tx=parseFloat($('tmax').value),tn=parseFloat($('tmin').value),tb=parseFloat($('tbase').value),tg=parseFloat($('target').value);
 if([tx,tn,tb,tg].some(isNaN)){$('dttWork').textContent='Please fill in all the numbers.';return;}
 if(tn>tx){$('dttWork').textContent='Minimum temperature should not be higher than maximum temperature.';return;}
 var mean=(tx+tn)/2,raw=mean-tb,d=CW.dtt(tx,tn,tb);
 $('dttWork').innerHTML='Mean temperature = ('+tx+' + '+tn+') / 2 = '+fmt(mean)+' \u00B0C. DTT = '+fmt(mean)+' \u2212 '+tb+' = '+fmt(raw)+(raw<0?', which is negative, so DTT = <strong>0</strong> (no development today).':', so DTT = <strong>'+fmt(d)+' \u00B0C days</strong> for this day.');
 var s=series(tx,tn,tb,tg),hit=null;for(var i=0;i<s.length;i++){if(s[i].total>=tg){hit=s[i].day;break;}}
 $('dttDays').innerHTML=hit?'The crop reaches the stage target of '+tg+' \u00B0C days on <strong>day '+hit+'</strong>.':'At these temperatures the crop never reaches the target: it is too cold for development.';
 draw(s,tg,hit);}
function draw(s,tg,hit){
 var svg=$('chart'),W=600,H=300,L=55,R=15,T=15,B=40,ns='http://www.w3.org/2000/svg',ink=pal('--chart-ink','#444'),line=pal('--chart-a','#1f5f3a'),acc=pal('--chart-b','#b85c00'),grid=pal('--chart-grid','#e3e3e3');
 while(svg.childNodes.length>1)svg.removeChild(svg.lastChild);
 var maxY=Math.max(tg*1.1,s.length?s[s.length-1].total:0,1),maxX=Math.max(s.length,1);
 function X(v){return L+(W-L-R)*v/maxX}function Y(v){return H-B-(H-T-B)*v/maxY}
 function el(n,a,t){var e=document.createElementNS(ns,n);for(var k in a)e.setAttribute(k,a[k]);if(t)e.textContent=t;svg.appendChild(e);return e}
 for(var g=0;g<=4;g++){var v=maxY*g/4;el('line',{x1:L,x2:W-R,y1:Y(v),y2:Y(v),stroke:grid});el('text',{x:L-6,y:Y(v)+4,'text-anchor':'end','font-size':12,fill:ink},fmt(v,0));}
 for(g=0;g<=5;g++){var dx=Math.round(maxX*g/5);el('text',{x:X(dx),y:H-B+18,'text-anchor':'middle','font-size':12,fill:ink},dx);}
 el('text',{x:(W+L)/2,y:H-6,'text-anchor':'middle','font-size':13,fill:ink},'Days after sowing');
 el('text',{x:14,y:H/2,'font-size':13,fill:ink,transform:'rotate(-90 14 '+H/2+')','text-anchor':'middle'},'Accumulated \u00B0C days');
 el('line',{x1:L,x2:W-R,y1:Y(tg),y2:Y(tg),stroke:acc,'stroke-dasharray':'6 4','stroke-width':2});
 el('text',{x:W-R-4,y:Y(tg)-6,'text-anchor':'end','font-size':12,fill:acc},'Stage target '+tg);
 var p='M'+X(0)+' '+Y(0);s.forEach(function(d){p+=' L'+X(d.day)+' '+Y(d.total)});
 el('path',{d:p,fill:'none',stroke:line,'stroke-width':3});
 if(hit){el('circle',{cx:X(hit),cy:Y(s[hit-1].total),r:6,fill:acc});}}
['tmax','tmin','tbase','target','vary'].forEach(function(i){$(i).addEventListener('input',dttUpd)});
dttUpd();
/* Day length and PAR */
function dayLength(lat,doy){var decl=23.44*Math.sin(2*Math.PI*(284+doy)/365)*Math.PI/180,phi=lat*Math.PI/180;
 var x=-Math.tan(phi)*Math.tan(decl);x=Math.max(-1,Math.min(1,x));return 24/Math.PI*Math.acos(x);}
function lightUpd(){var lat=+$('lat').value,doy=+$('doy').value;$('latOut').textContent=fmt(lat);$('doyOut').textContent=doy;
 var h=dayLength(lat,doy),hh=Math.floor(h),mm=Math.round((h-hh)*60);if(mm===60){hh++;mm=0}
 $('dl').textContent=hh+' hours '+mm+' minutes (approximate)';
 var sr=+$('srad').value,f=+$('lai').value,rue=+$('rue').value,par=sr*0.48;
 $('sradOut').textContent=sr;$('intOut').textContent=fmt(f,2);$('rueOut').textContent=fmt(rue);
 $('par').textContent=fmt(par)+' megajoules per square metre per day (48 percent of '+sr+')';
 $('dm').textContent=fmt(par*f*rue)+' grams per square metre per day ('+fmt(par)+' \u00D7 '+fmt(f,2)+' \u00D7 '+fmt(rue)+')';}
['lat','doy','srad','lai','rue'].forEach(function(i){$(i).addEventListener('input',lightUpd)});lightUpd();
/* Model types */
var types=[
 ["Statistical","Pair: statistical versus mechanistic","Links yield directly to weather using statistics, such as simple regression. It shows the relationship but not why it happens.","Example: from 20 years of Tamale data, maize yield (tonnes per hectare) = 0.6 + 0.0025 \u00D7 season rainfall (mm). Rainfall 800 mm gives about 2.6 tonnes per hectare. (Made up numbers for illustration.)"],
 ["Mechanistic","Pair: statistical versus mechanistic","Explains the relationship between weather and yield and also the steps in between (the other dependent variables), such as leaf area, water uptake and dry matter.","Example: rainfall raises soil water, soil water lets leaves expand, more leaf area intercepts more PAR, more PAR makes more dry matter, which gives more grain."],
 ["Deterministic","Pair: deterministic versus stochastic","Gives one exact answer for a set of inputs, using fixed coefficients. Same inputs always give the same output.","Example: Tmax 32, Tmin 22, Tbase 10 always gives DTT = 17 \u00B0C days. Nothing random."],
 ["Stochastic","Pair: deterministic versus stochastic","Attaches a probability to each output. For the same inputs it gives several possible outcomes, each with a chance.","Example: next season maize yield: 30 percent chance of under 1.5 tonnes per hectare, 50 percent chance of 1.5 to 2.5, 20 percent chance of over 2.5."],
 ["Dynamic","Pair: dynamic versus static","Time is a variable. Values change over time according to rates of change, day by day.","Example: the season simulator adds DTT and biomass every day, so the crop's stage changes over time."],
 ["Static","Pair: dynamic versus static","Time is not a variable. Inputs and outputs are treated as constant for the period studied.","Example: the yield formula uses one season-long average rate. It gives one number for the whole season."],
 ["Simulation","","Computer models that represent a real system mathematically. Crop simulation models estimate production from weather, soil and management, using equations stepped through time from planting to harvest.","Example: DSSAT (Decision Support System for Agrotechnology Transfer) and APSIM (Agricultural Production Systems sIMulator) are widely used, including in Ghana, to test planting dates and fertilizer rates."],
 ["Descriptive","Pair: descriptive versus explanatory","Describes how a system behaves in a simple way using equations, with little or no detail of the causes.","Example: a growth curve fitted to plant weights measured every 2 weeks, used to estimate the weight on a day when nobody weighed the crop."],
 ["Explanatory","Pair: descriptive versus explanatory","Describes, with numbers, the processes and mechanisms that cause the system's behaviour. Each process (leaf area expansion, tiller production, and so on) is quantified separately, then joined into one model.","Example: separate equations for leaf growth, light capture, photosynthesis and root water uptake, combined so that crop growth comes out as the result."]];
var tl=$('typesList');types.forEach(function(t){var d=document.createElement('details');d.className='type';
 d.innerHTML='<summary>'+t[0]+' model</summary>'+(t[1]?'<p class="pair">'+t[1]+'</p>':'')+'<p>'+t[2]+'</p><p><em>'+t[3]+'</em></p>';tl.appendChild(d)});
/* Quiz */
var qs=[
 ["A model says: there is a 70 percent chance that maize yield will be above 2 tonnes per hectare this season.","Stochastic","It gives a probability with the output."],
 ["Yield is estimated from a regression line between July rainfall and maize yield over 15 years.","Statistical","It uses a statistical relationship between weather and yield."],
 ["A model always gives exactly 17 \u00B0C days when Tmax is 32, Tmin is 22 and Tbase is 10.","Deterministic","One exact answer with fixed coefficients."],
 ["A model updates leaf area and soil water every day from sowing to harvest.","Dynamic","Time is a variable and values change day by day."],
 ["One equation gives the season's yield from average rainfall, with no time steps.","Static","Time is not included as a variable."],
 ["A model contains separate equations for leaf expansion, tiller production and photosynthesis, combined to give crop growth.","Explanatory","It quantifies the processes that cause the behaviour."],
 ["A curve fitted to plant weights is used to guess the weight on a day with no measurement.","Descriptive","It describes behaviour without explaining causes. This is the lecture's own example."],
 ["DSSAT is run on a computer to compare yields from planting in April or in May in Kumasi.","Simulation","A computer model estimating production from weather, soil and management."],
 ["A model explains that more rain gives more soil water, more leaf area and then more yield, not just that rain and yield are linked.","Mechanistic","It explains the in-between dependent variables, not only the final relationship."]];
var opts=["Statistical","Mechanistic","Deterministic","Stochastic","Dynamic","Static","Simulation","Descriptive","Explanatory"];
var qi=0,score=0,box=$('quizBox');
function showQ(){if(qi>=qs.length){box.innerHTML='<p class="big">You scored <strong>'+score+' out of '+qs.length+'</strong>.</p><button type="button" id="again">Try again</button>';$('again').onclick=function(){qi=0;score=0;showQ()};$('again').focus();return;}
 var q=qs[qi];box.innerHTML='<p><strong>Question '+(qi+1)+' of '+qs.length+':</strong> '+q[0]+'</p><div class="qopts" role="group" aria-label="Answer choices"></div><p id="fb"></p>';
 var g=box.querySelector('.qopts');opts.forEach(function(o){var b=document.createElement('button');b.type='button';b.textContent=o;b.onclick=function(){answer(o)};g.appendChild(b)});}
function answer(o){var q=qs[qi];box.querySelectorAll('.qopts button').forEach(function(x){x.disabled=true;if(x.textContent===q[1])x.classList.add('on')});
 var ok=o===q[1];if(ok)score++;$('fb').innerHTML='<span class="'+(ok?'ok':'bad')+'">'+(ok?'Correct.':'Not quite. The answer is '+q[1]+'.')+'</span> '+q[2]+' <br><button type="button" id="next">Next question</button>';
 $('next').onclick=function(){qi++;showQ();var f=box.querySelector('button');if(f)f.focus()};$('next').focus();}
showQ();
/* Glossary */
var gl=[["Base temperature (Tbase)","The temperature below which a crop stops developing. Typical for maize: 8 to 10 \u00B0C."],
 ["Crop model","A representation of a crop through mathematical equations explaining its interaction with the above-ground and below-ground environment."],
 ["Crop coefficient (Kc)","Ratio of a crop's water use to reference evapotranspiration. Maize: about 0.3 early, 1.2 at flowering, 0.6 at maturity."],
 ["Daily Thermal Time (DTT)","Useful heat a crop receives in a day: ((Tmax + Tmin) / 2) minus Tbase, or 0 if negative. Unit: degree Celsius days. Also called growing degree days."],
 ["Day length (photoperiod)","The number of hours of daylight in a day. Controls flowering in photoperiod sensitive crops."],
 ["Development","Progress of a crop through its life stages (phenophases) from sowing to maturity."],
 ["Dry matter","Plant material left after all water is removed. Used to measure growth."],
 ["Evapotranspiration (ET)","Water lost from soil (evaporation) plus water lost through leaves (transpiration). Reference evapotranspiration (ETo) is for a standard grass surface."],
 ["Growth","Increase in the dry matter of a crop."],
 ["Harvest Index (HI)","Fraction of total dry matter that is harvested as yield, for example grain. Typical for maize: about 0.4 to 0.5 without stress."],
 ["Leaf Area Index (LAI)","Leaf area per unit of ground area. An LAI of 3 means 3 square metres of leaf over each square metre of soil."],
 ["Length of Growing Period (LGP)","Number of days over which the crop accumulates dry matter."],
 ["Partitioning","How dry matter is shared between roots, stems, leaves and grain."],
 ["Phenology","Study of the timing of crop life stages and how weather affects it."],
 ["Phenophase","A distinct stage in the crop life cycle, such as emergence, flowering or maturity."],
 ["Photosynthetically Active Radiation (PAR)","Sunlight between 400 and 700 nanometres that plants use for photosynthesis, about half of total solar radiation."],
 ["Radiation Use Efficiency (RUE)","Grams of dry matter produced per megajoule of PAR intercepted."],
 ["Maximum temperature (Tmax)","The highest air temperature recorded in a day."],
 ["Minimum temperature (Tmin)","The lowest air temperature recorded in a day, usually just before dawn."],
 ["Biotic interference","Effects of living things such as pests, diseases and weeds on crop growth."],
 ["Regression","A statistical method for finding a line or curve linking one variable (such as yield) to others (such as rainfall)."],
 ["Water stress coefficient (Ks)","A factor from 0 to 1 that reduces crop water use and growth when the soil is too dry. 1 means no stress."]];
gl.sort(function(a,b){return a[0].localeCompare(b[0])});
function gRender(){var q=$('gsearch').value.toLowerCase(),h='';gl.forEach(function(g){if(!q||(g[0]+g[1]).toLowerCase().indexOf(q)>=0)h+='<dt>'+g[0]+'</dt><dd>'+g[1]+'</dd>'});$('glist').innerHTML=h||'<dd>No matching terms.</dd>';}
$('gsearch').addEventListener('input',gRender);gRender();
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(function(){});}
})();
