/* "The mathematics behind it": pure functions (tested in node) plus small SVG renderers. */
(function(root){
'use strict';
var TB=10;
/* 1. Symmetric sine daily cycle, peak at 15:00, minimum at 03:00. Its 24 hour mean is exactly (Tmax+Tmin)/2. */
function sineT(h,tmax,tmin){return (tmax+tmin)/2+(tmax-tmin)/2*Math.cos(2*Math.PI*(h-15)/24)}
function sineMean(tmax,tmin,n){n=n||240;var s=0;for(var i=0;i<n;i++)s+=sineT(24*(i+.5)/n,tmax,tmin);return s/n}
/* DTT from the sine cycle; cap (optional) clips each hourly value at cap before subtracting the base. */
function sineDTT(tmax,tmin,cap,n){n=n||24;var s=0;for(var i=0;i<n;i++){var t=sineT(24*(i+.5)/n,tmax,tmin);if(cap!=null)t=Math.min(t,cap);s+=Math.max(0,t-TB)}return s/n}
function cumDTT(days,cap){var c=0;return days.map(function(d){c+=sineDTT(d.tmax,d.tmin,cap);return c})}
/* 2. Euler daily steps taken from the simulator's own state. */
function euler(res){var S=[],B=[],s0=res.days.length?res.days[0].sw-res.days[0].effRain+res.days[0].etc+res.days[0].drain-res.days[0].swOther:0,s=s0,b=0;
 res.days.forEach(function(d){s=s+d.effRain-d.etc-d.drain+d.swOther;S.push(s);b=b+res.crop.rue*d.ipar*Math.min(d.ks,d.heat)*(d.growth>0?1:0);B.push(b)});return {S0:s0,S:S,B:B}}
/* 3. Least squares Fourier fit with h harmonics, period P days. */
function solve(A,b){var n=b.length,M=A.map(function(r,i){return r.concat([b[i]])});for(var c=0;c<n;c++){var p=c;for(var r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;var t=M[c];M[c]=M[p];M[p]=t;
 for(r=0;r<n;r++)if(r!==c){var f=M[r][c]/M[c][c];for(var k=c;k<=n;k++)M[r][k]-=f*M[c][k]}}return M.map(function(r,i){return r[n]/r[i]})}
function basis(t,h,P){var v=[1];for(var j=1;j<=h;j++){v.push(Math.cos(2*Math.PI*j*t/P),Math.sin(2*Math.PI*j*t/P))}return v}
function fourierFit(t,y,h,P){P=P||365.25;var m=1+2*h,A=[],b=[],i,j,k;for(i=0;i<m;i++){A.push(new Array(m).fill(0));b.push(0)}
 for(i=0;i<t.length;i++){var v=basis(t[i],h,P);for(j=0;j<m;j++){b[j]+=v[j]*y[i];for(k=0;k<m;k++)A[j][k]+=v[j]*v[k]}}
 var c=solve(A,b),f=function(x){var v=basis(x,h,P),s=0;for(var q=0;q<m;q++)s+=c[q]*v[q];return s};
 var mean=y.reduce(function(a,x){return a+x},0)/y.length,sr=0,st=0;for(i=0;i<t.length;i++){sr+=Math.pow(y[i]-f(t[i]),2);st+=Math.pow(y[i]-mean,2)}
 return {c:c,f:f,r2:1-sr/st}}
function yearlyMeans(years){var t=[],y=[],ks=Object.keys(years).sort(),off=0;ks.forEach(function(k){var Y=years[k];for(var i=0;i<Y.tx.length;i++){t.push(off+i);y.push((Y.tx[i]+Y.tn[i])/2)}off+=Y.tx.length});return {t:t,y:y,years:ks}}
/* 4. Beer's law. */
function beer(k,lai){return 1-Math.exp(-k*lai)}

/* ---------- rendering ---------- */
var NS='http://www.w3.org/2000/svg';
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function tx(p,x,y,s,a){var e=el('text',Object.assign({x:x,y:y,'font-size':10,fill:'#5a4d40'},a||{}),p);e.textContent=s;return e}
/* Generic small plot. series: [{y:[...], x:[...]?, color, dash, width, fill}] */
function plot(svg,o){var W=360,H=o.h||180,L=38,R=18,T=18,B=28;svg.setAttribute('viewBox','0 0 '+W+' '+H);while(svg.firstChild)svg.removeChild(svg.firstChild);
 var X=function(v){return L+(W-L-R)*(v-o.x0)/(o.x1-o.x0)},Y=function(v){return T+(H-T-B)*(1-(v-o.y0)/(o.y1-o.y0))};
 for(var i=0;i<=o.ny;i++){var v=o.y0+(o.y1-o.y0)*i/o.ny;el('line',{x1:L,x2:W-R,y1:Y(v),y2:Y(v),stroke:'#e6dcc8'},svg);tx(svg,L-4,Y(v)+3.5,(o.fy||String)(Math.round(v*100)/100),{'text-anchor':'end'})}
 (o.xt||[]).forEach(function(v){tx(svg,X(v),H-B+13,o.fx?o.fx(v):v,{'text-anchor':'middle'})});
 tx(svg,4,11,o.yl,{'font-weight':600,'font-size':9});tx(svg,W/2,H-3,o.xl,{'text-anchor':'middle','font-size':9});
 el('line',{x1:L,x2:W-R,y1:H-B,y2:H-B,stroke:'#a8977b'},svg);
 (o.bands||[]).forEach(function(b){el('rect',{x:L,width:W-L-R,y:Y(b.y1),height:Math.max(1,Y(b.y0)-Y(b.y1)),fill:b.color,opacity:b.op||.2},svg)});
 o.series.forEach(function(s){var d='';s.y.forEach(function(v,j){var xv=s.x?s.x[j]:j+1;d+=(j?'L':'M')+X(xv).toFixed(1)+' '+Y(v).toFixed(1)});
  if(s.dots){s.y.forEach(function(v,j){el('circle',{cx:X(s.x?s.x[j]:j+1).toFixed(1),cy:Y(v).toFixed(1),r:s.r||1,fill:s.color,opacity:s.op||1},svg)});return}
  el('path',{d:d,fill:'none',stroke:s.color,'stroke-width':s.width||1.8,'stroke-dasharray':s.dash||'',opacity:s.op||1,'class':s.cls||''},svg)});
 (o.hlines||[]).forEach(function(h){el('line',{x1:L,x2:W-R,y1:Y(h.y),y2:Y(h.y),stroke:h.color,'stroke-dasharray':'4 3'},svg);tx(svg,h.left?L+4:W-R-2,Y(h.y)+(h.below?11:-3),h.label,{'text-anchor':h.left?'start':'end',fill:h.color})});
 (o.marks||[]).forEach(function(m){el('line',{x1:X(m.x),x2:X(m.x),y1:T,y2:H-B,stroke:'#241c15','stroke-width':1},svg);if(m.y!=null)el('circle',{cx:X(m.x),cy:Y(m.y),r:3.5,fill:'#241c15','class':'m-mark','data-x':m.x,'data-y':m.y},svg);if(m.label)tx(svg,X(m.x)+4,T+8,m.label,{fill:'#241c15'})});
 return {X:X,Y:Y}}
root.CWMath={sineT:sineT,sineMean:sineMean,sineDTT:sineDTT,cumDTT:cumDTT,euler:euler,fourierFit:fourierFit,yearlyMeans:yearlyMeans,beer:beer,plot:plot,TB:TB};
if(typeof module!=='undefined')module.exports=root.CWMath;
})(typeof window!=='undefined'?window:this);
