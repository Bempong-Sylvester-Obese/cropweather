/* Season chart: weather panel and accumulated Daily Thermal Time (DTT) panel, hand-drawn SVG. */
(function(root){
'use strict';
var NS='http://www.w3.org/2000/svg';
var STAGE_LABEL={'Emergence':'Emergence','End of juvenile stage':'End of juvenile stage','Flowering (tasselling and silking)':'Flowering','Grain filling':'Grain filling','Physiological maturity':'Maturity'};
/* Pure data from a simulation result (and optional Normal season result). */
function data(res,normal){
 var d=res.days,c=res.crop;
 var out={n:d.length,tmax:d.map(function(x){return x.tmax}),tmin:d.map(function(x){return x.tmin}),rain:d.map(function(x){return x.rain}),
  tt:d.map(function(x){return x.tt}),
  thresholds:c.stages.slice(1).map(function(s){return {name:s[0],label:STAGE_LABEL[s[0]]||s[0],value:s[1]}})};
 if(normal)out.normal={n:normal.days.length,tmax:normal.days.map(function(x){return x.tmax}),tmin:normal.days.map(function(x){return x.tmin}),rain:normal.days.map(function(x){return x.rain}),tt:normal.days.map(function(x){return x.tt})};
 return out}
function layout(w,narrow){return {W:w,L:narrow?34:44,R:narrow?34:44,T:24,B:narrow?26:28}}
/* x position of the end of day `day` (1-based) when the axis spans `span` days. */
function xFor(day,span,lay){return lay.L+(lay.W-lay.L-lay.R)*day/Math.max(1,span)}
function dayAt(x,span,lay){return Math.round((x-lay.L)/(lay.W-lay.L-lay.R)*span)}
function niceMax(v,step){return Math.ceil(v/step)*step}
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function txt(p,x,y,s,a){var e=el('text',Object.assign({x:x,y:y},a||{}),p);e.textContent=s;return e}
function path(xs,ys){var d='';for(var i=0;i<ys.length;i++)d+=(i?' L':'M')+xs(i+1).toFixed(1)+' '+ys[i].toFixed(1);return d}
var INK='#5a4d40',GRID='#e6dcc8',TMAX='#b23a1e',TMIN='#d08a1a',RAIN='#3b6e8f',TT='#2f6b3a',STAGE='#6b4226';

function Chart(wxSvg,ttSvg){this.wx=wxSvg;this.tt=ttSvg;this.overlay=false}
Chart.prototype.set=function(res,normal){this.d=data(res,normal);this.span=Math.max(this.d.n,this.d.normal?this.d.normal.n:0)};
Chart.prototype.render=function(k){
 var D=this.d;if(!D)return;var narrow=this.wx.getBoundingClientRect().width<520,W=narrow?360:600,H1=narrow?190:200,H2=narrow?200:210;
 this.k=k;var lay=layout(W,narrow),span=this.span,self=this,show=this.overlay&&D.normal;
 var X=function(i){return xFor(i,span,lay)};
 /* Panel 1 */
 var s=this.wx;s.setAttribute('viewBox','0 0 '+W+' '+H1);while(s.firstChild)s.removeChild(s.firstChild);
 var all=D.tmax.concat(D.tmin,show?D.normal.tmax.concat(D.normal.tmin):[]);
 var tLo=Math.floor((Math.min.apply(null,all)-2)/5)*5,tHi=Math.max(40,niceMax(Math.max.apply(null,all),5)),tSt=(tHi-tLo)>20?10:5;tLo=tHi-niceMax(tHi-tLo,tSt);var rHi=Math.max(40,niceMax(Math.max.apply(null,D.rain.concat(show?D.normal.rain:[])),20)),nT=(tHi-tLo)/tSt;rHi=niceMax(rHi,nT*10);
 var Yt=function(v){return lay.T+(H1-lay.T-lay.B)*(1-(v-tLo)/(tHi-tLo))},Yr=function(v){return lay.T+(H1-lay.T-lay.B)*(1-Math.min(v,rHi)/rHi)};
 this.axes(s,lay,H1,span,narrow,[tLo,tHi,tSt],function(v){return v+''},Yt,TMAX,'Temperature (\u00B0C)',[0,rHi,rHi/nT],RAIN,'Rain (mm)',Yr);
 var bw=Math.max(1,(W-lay.L-lay.R)/span*0.72),g=el('g',{'class':'c-rain'},s);
 for(var i=0;i<k;i++){var r=D.rain[i];if(r>=0.5)el('rect',{x:(X(i)+0.4).toFixed(1),y:Yr(r).toFixed(1),width:bw.toFixed(1),height:(H1-lay.B-Yr(r)).toFixed(1),fill:RAIN,opacity:.75},g)}
 if(show){el('path',{'class':'c-normal',d:path(X,D.normal.tmax.map(Yt)),stroke:TMAX,'stroke-width':1.2,'stroke-dasharray':'4 3',fill:'none',opacity:.45},s);
  el('path',{'class':'c-normal',d:path(X,D.normal.tmin.map(Yt)),stroke:TMIN,'stroke-width':1.2,'stroke-dasharray':'4 3',fill:'none',opacity:.45},s)}
 el('path',{'class':'c-tmax',d:path(X,D.tmax.slice(0,k).map(Yt)),stroke:TMAX,'stroke-width':1.8,fill:'none','stroke-linejoin':'round'},s);
 el('path',{'class':'c-tmin',d:path(X,D.tmin.slice(0,k).map(Yt)),stroke:TMIN,'stroke-width':1.8,fill:'none','stroke-linejoin':'round'},s);
 this.marker(s,X(k),lay,H1,k);
 /* Panel 2 */
 s=this.tt;s.setAttribute('viewBox','0 0 '+W+' '+H2);while(s.firstChild)s.removeChild(s.firstChild);
 var mat=D.thresholds[D.thresholds.length-1].value,ttHi=niceMax(mat*1.08,500),Yd=function(v){return lay.T+(H2-lay.T-lay.B)*(1-v/ttHi)};
 this.axes(s,lay,H2,span,narrow,[0,ttHi,500],function(v){return v+''},Yd,TT,'Degree days (\u00B0C days)',null);
 D.thresholds.forEach(function(th,j){var y=Yd(th.value);el('line',{'class':'c-threshold','data-value':th.value,x1:lay.L,x2:W-lay.R,y1:y.toFixed(1),y2:y.toFixed(1),stroke:STAGE,'stroke-width':.9,'stroke-dasharray':'2 3',opacity:.7},s);
  var right=(j===1||j===2),below=(j===2);
  txt(s,right?W-lay.R-4:lay.L+4,(below?y+11:y-3).toFixed(1),th.label+' '+th.value,{'font-size':narrow?9:10,fill:STAGE,'text-anchor':right?'end':'start'})});
 if(show)el('path',{'class':'c-normal',d:path(X,D.normal.tt.map(Yd)),stroke:TT,'stroke-width':1.3,'stroke-dasharray':'4 3',fill:'none',opacity:.45},s);
 el('path',{'class':'c-tt',d:path(X,D.tt.slice(0,k).map(Yd)),stroke:TT,'stroke-width':2.2,fill:'none','stroke-linejoin':'round'},s);
 this.marker(s,X(k),lay,H2,k);
 this.lay=lay;
};
Chart.prototype.axes=function(s,lay,H,span,narrow,lr,fmt,Yl,lc,lu,rr,rc,ru,Yr){
 var W=lay.W,st=lr[2],steps=Math.round((lr[1]-lr[0])/st);
 for(var i=0;i<=steps;i++){var v=lr[0]+st*i,y=Yl(v);el('line',{x1:lay.L,x2:W-lay.R,y1:y.toFixed(1),y2:y.toFixed(1),stroke:GRID,'stroke-width':.8},s);
  txt(s,lay.L-5,(y+3.5).toFixed(1),fmt(Math.round(v)),{'text-anchor':'end','font-size':10,fill:lc});
  if(rr){var rv=rr[0]+rr[2]*i;txt(s,W-lay.R+5,(y+3.5).toFixed(1),Math.round(rv)+'',{'font-size':10,fill:rc})}}
 txt(s,4,11,lu,{'text-anchor':'start','font-size':9,fill:lc,'font-weight':600});
 if(rr)txt(s,W-4,11,ru,{'text-anchor':'end','font-size':9,fill:rc,'font-weight':600});
 var xs=narrow?25:15;for(var dd=0;dd<=span;dd+=xs){var x=xFor(dd,span,lay);txt(s,x.toFixed(1),H-lay.B+13,dd+'',{'text-anchor':'middle','font-size':10,fill:INK})}
 txt(s,(W/2).toFixed(1),H-3,'Days after sowing',{'text-anchor':'middle','font-size':9,fill:INK});
 el('line',{x1:lay.L,x2:W-lay.R,y1:H-lay.B,y2:H-lay.B,stroke:'#a8977b','stroke-width':1},s)};
Chart.prototype.marker=function(s,x,lay,H,k){if(k<1)return;var g=el('g',{'class':'c-today','data-day':k,'data-x':x.toFixed(2)},s);
 el('line',{x1:x.toFixed(1),x2:x.toFixed(1),y1:lay.T,y2:H-lay.B,stroke:'#241c15','stroke-width':1.2},g);el('circle',{cx:x.toFixed(1),cy:lay.T,r:2.6,fill:'#241c15'},g)};
root.CWChart={data:data,xFor:xFor,dayAt:dayAt,layout:layout,Chart:Chart};
if(typeof module!=='undefined')module.exports=root.CWChart;
})(typeof window!=='undefined'?window:this);
