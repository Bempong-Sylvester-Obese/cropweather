/* Field scene: layered SVG illustration of a maize field under the day's weather. */
(function(root){
'use strict';
var NS='http://www.w3.org/2000/svg',W=400,H=280,HORIZON=150;
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function mix(c1,c2,t){t=clamp(t,0,1);var a=parseInt(c1.slice(1),16),b=parseInt(c2.slice(1),16);
 var r=Math.round(lerp(a>>16,b>>16,t)),g=Math.round(lerp(a>>8&255,b>>8&255,t)),bl=Math.round(lerp(a&255,b&255,t));return '#'+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1)}
function f(n){return Math.round(n*10)/10}
/* Smooth closed or open path through points (Catmull-Rom to cubic Bezier). */
function smooth(pts,closed){var n=pts.length,d='M'+f(pts[0][0])+' '+f(pts[0][1]);
 for(var i=0;i<(closed?n:n-1);i++){var p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
  if(!closed){if(i===0)p0=p1;if(i+2>=n)p3=p2}
  d+=' C'+f(p1[0]+(p2[0]-p0[0])/6)+' '+f(p1[1]+(p2[1]-p0[1])/6)+' '+f(p2[0]-(p3[0]-p1[0])/6)+' '+f(p2[1]-(p3[1]-p1[1])/6)+' '+f(p2[0])+' '+f(p2[1])}
 return d+(closed?'Z':'')}

function Scene(svg){
 this.svg=svg;svg.setAttribute('viewBox','0 0 '+W+' '+H);
 var defs=el('defs',{},svg);this.defs=defs;
 var sky=el('linearGradient',{id:'gSky',x1:0,y1:0,x2:0,y2:1},defs);
 this.sky=[el('stop',{offset:0},sky),el('stop',{offset:.65},sky),el('stop',{offset:1},sky)];
 var glow=el('radialGradient',{id:'gGlow'},defs);this.glow=[el('stop',{offset:0,'stop-opacity':.75},glow),el('stop',{offset:.45,'stop-opacity':.25},glow),el('stop',{offset:1,'stop-opacity':0},glow)];
 var disc=el('radialGradient',{id:'gDisc',cx:.4,cy:.4},defs);this.disc=[el('stop',{offset:0},disc),el('stop',{offset:1},disc)];
 var cl=el('radialGradient',{id:'gCloud'},defs);this.cloudStops=[el('stop',{offset:0,'stop-opacity':.98},cl),el('stop',{offset:.6,'stop-opacity':.85},cl),el('stop',{offset:1,'stop-opacity':0},cl)];
 var gr=el('linearGradient',{id:'gGround',x1:0,y1:0,x2:0,y2:1},defs);this.ground=[el('stop',{offset:0},gr),el('stop',{offset:1},gr)];
 var lf=el('linearGradient',{id:'gLeaf',x1:0,y1:0,x2:1,y2:1},defs);this.leafStops=[el('stop',{offset:0},lf),el('stop',{offset:1},lf)];
 var lb=el('linearGradient',{id:'gLeafBack',x1:0,y1:0,x2:1,y2:1},defs);this.leafBack=[el('stop',{offset:0},lb),el('stop',{offset:1},lb)];
 var st=el('linearGradient',{id:'gStem',x1:0,y1:0,x2:1,y2:0},defs);this.stemStops=[el('stop',{offset:0},st),el('stop',{offset:.5},st),el('stop',{offset:1},st)];
 var rn=el('linearGradient',{id:'gRain',x1:0,y1:0,x2:0,y2:1},defs);el('stop',{offset:0,'stop-color':'#dfe9ef','stop-opacity':0},rn);el('stop',{offset:1,'stop-color':'#dfe9ef','stop-opacity':.85},rn);
 var hz=el('filter',{id:'fBlur',x:'-20%',y:'-50%',width:'140%',height:'200%'},defs);el('feGaussianBlur',{stdDeviation:3},hz);

 el('rect',{x:0,y:0,width:W,height:HORIZON+20,fill:'url(#gSky)'},svg);
 this.sunG=el('g',{'class':'sun',transform:'translate(328 58)'},svg);
 el('circle',{r:70,fill:'url(#gGlow)'},this.sunG);
 this.rays=el('g',{'class':'rays'},this.sunG);
 for(var i=0;i<16;i++){var a=i*Math.PI/8;el('path',{d:'M'+f(Math.cos(a-.05)*24)+' '+f(Math.sin(a-.05)*24)+' L'+f(Math.cos(a)*(i%2?33:38))+' '+f(Math.sin(a)*(i%2?33:38))+' L'+f(Math.cos(a+.05)*24)+' '+f(Math.sin(a+.05)*24)+'Z',fill:'#f4c35a',opacity:.8},this.rays)}
 this.sunDisc=el('circle',{r:19,fill:'url(#gDisc)'},this.sunG);
 this.cloudsFar=el('g',{'class':'drift slow'},svg);this.clouds=el('g',{'class':'drift'},svg);
 this.hillFar=el('path',{d:smooth([[0,138],[60,126],[130,134],[200,122],[270,131],[340,120],[400,130]],false)+' L400 '+(HORIZON+20)+' L0 '+(HORIZON+20)+'Z'},svg);
 this.hillNear=el('path',{d:smooth([[0,150],[70,140],[150,148],[230,138],[310,147],[400,141]],false)+' L400 '+(HORIZON+20)+' L0 '+(HORIZON+20)+'Z'},svg);
 this.trees=el('g',{},svg);
 this.shimmer=el('g',{'class':'shimmer',filter:'url(#fBlur)'},svg);
 this.groundRect=el('rect',{x:0,y:HORIZON,width:W,height:H-HORIZON,fill:'url(#gGround)'},svg);
 this.furrows=el('g',{},svg);
 [[176,.5],[200,.7],[234,.9],[272,1.1]].forEach(function(r){el('path',{d:'M-10 '+r[0]+' Q 200 '+(r[0]-6*r[1])+' 410 '+r[0],stroke:'#000',  'stroke-opacity':.10,'stroke-width':6*r[1],fill:'none'},this.furrows)},this);
 this.cracks=el('g',{stroke:'#6e4d2e','stroke-width':1,'stroke-linecap':'round',fill:'none'},svg);
 var seed=11;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}
 for(i=0;i<26;i++){var x=rnd()*W,y=HORIZON+12+rnd()*(H-HORIZON-14),s=.5+(y-HORIZON)/110,d='M'+f(x)+' '+f(y);for(var j=0;j<4;j++){x+=(rnd()*14-4)*s;y+=(rnd()*6-3)*s;d+=' L'+f(x)+' '+f(y)}el('path',{d:d,'stroke-width':f(.6+s*.6)},this.cracks)}
 this.puddles=el('g',{fill:'#8fb0c2'},svg);[[64,250,26],[262,258,34],[350,226,18],[150,206,14]].forEach(function(p){el('ellipse',{cx:p[0],cy:p[1],rx:p[2],ry:p[2]*.14},this.puddles)},this);
 this.plants=el('g',{},svg);
 this.rain=el('g',{'class':'rain'},svg);
 this.loc=null;
}
Scene.prototype.setLocation=function(loc){if(this.loc===loc)return;this.loc=loc;var g=this.trees;while(g.firstChild)g.removeChild(g.firstChild);
 var c='#55603f';
 function baobab(x,y,s){var t=el('g',{transform:'translate('+x+' '+y+') scale('+s+')',fill:c,opacity:.8},g);
  el('path',{d:'M-7 0 C-6 -14 -5 -22 -3 -28 L3 -28 C5 -22 6 -14 7 0Z'},t);
  [[-3,-27,-16,-38],[0,-28,-2,-42],[3,-27,15,-37],[2,-27,9,-41]].forEach(function(b){el('path',{d:'M'+b[0]+' '+b[1]+' Q '+((b[0]+b[2])/2)+' '+(b[3]+4)+' '+b[2]+' '+b[3],stroke:c,'stroke-width':2.4,fill:'none','stroke-linecap':'round'},t);el('ellipse',{cx:b[2],cy:b[3],rx:6,ry:3.5},t)})}
 function shea(x,y,s){var t=el('g',{transform:'translate('+x+' '+y+') scale('+s+')',fill:c,opacity:.75},g);el('rect',{x:-1.6,y:-16,width:3.2,height:16},t);[[-8,-20,9],[3,-24,10],[10,-18,7],[-1,-17,8]].forEach(function(q){el('circle',{cx:q[0],cy:q[1],r:q[2]},t)})}
 function palm(x,y,s){var t=el('g',{transform:'translate('+x+' '+y+') scale('+s+')',fill:'none',stroke:c,'stroke-linecap':'round',opacity:.85},g);el('path',{d:'M0 0 Q 4 -22 -2 -46','stroke-width':2.6},t);
  [[-26,-40],[-20,-30],[-8,-58],[12,-56],[24,-44],[20,-34],[2,-60]].forEach(function(p){el('path',{d:'M-2 -46 Q '+((p[0]-2)/2)+' '+(p[1]-14)+' '+p[0]+' '+p[1],'stroke-width':1.8},t)})}
 if(loc==='capecoast'){palm(46,146,.95);palm(72,150,.7);palm(372,144,.85)}else{baobab(52,146,1);shea(118,146,.9);shea(356,144,1.1)}}

/* One maize plant. s: scale; p: plant state. detail: draw venation. */
Scene.prototype.maize=function(g,x,y,s,p,detail){
 if(!p.sown)return;
 if(p.h<3){el('ellipse',{cx:x,cy:y,rx:4*s,ry:1.4*s,fill:'#4a2c18',opacity:.6},g);return}
 var H=p.h*s,lean=(p.droop*5+p.sen*3)*s*(p.side||1),pl=this.palette(p),tip=[x+lean,y-H];
 // stem (tapered)
 var w0=Math.max(1.2,4.2*s*Math.min(1,.35+p.h/140)),w1=w0*.45,pts=[];
 pts.push([x-w0,y],[x-w0*.8+lean*.35,y-H*.5],[tip[0]-w1,tip[1]],[tip[0]+w1,tip[1]],[x+w0*.8+lean*.35,y-H*.5],[x+w0,y]);
 el('path',{d:smooth(pts,true),fill:'url(#gStem)'},g);
 // leaves
 var n=p.leaves;
 for(var k=0;k<n;k++){
  var t=n===1?.2:.06+.84*(k/(n-1||1)),bx=x+lean*t*t,by=y-H*t,side=(k%2?1:-1)*(p.side||1);
  var Lmax=Math.max(10,84*Math.min(1,.22+p.h/150))*s,L=Lmax*(.5+.5*Math.sin(Math.PI*(.12+.7*t)));
  if(p.h<40)L=Lmax*(.55+.45*(k/(n||1)));
  var senK=clamp(p.sen*1.8-t*.9,0,1),a0=lerp(1.15,.42,t),bend=lerp(1.25,.85,t)+p.droop*1.25+senK*.7;
  this.leaf(g,bx,by,side,L,a0,bend,p,senK,detail);
  if(detail&&k<n-1)el('path',{d:'M'+f(bx-w0*.9)+' '+f(by)+' q '+f(w0*.9)+' '+f(-1.4*s)+' '+f(w0*1.8)+' 0',stroke:pl.node,'stroke-width':.8,fill:'none'},g);
 }
 // ear with husk and silk
 if(p.ear>0){var et=.44,ex=x+lean*et*et,ey=y-H*et,side2=-(p.side||1),ang=(p.dry?1.9:.42)*side2,len=26*s*p.ear,wd=6.5*s*Math.min(1,.4+p.ear);
  var dx=Math.sin(ang),dy=-Math.cos(ang),nx=-dy,ny=dx,cx2=ex+dx*len*.5,cy2=ey+dy*len*.5;
  var husk=[[ex+nx*wd*.35,ey+ny*wd*.35],[cx2+nx*wd,cy2+ny*wd],[ex+dx*len,ey+dy*len],[cx2-nx*wd,cy2-ny*wd],[ex-nx*wd*.35,ey-ny*wd*.35]];
  el('path',{d:smooth(husk,true),fill:pl.husk,stroke:pl.huskLine,'stroke-width':.6},g);
  el('path',{d:'M'+f(ex)+' '+f(ey)+' Q '+f(cx2+nx*wd*.3)+' '+f(cy2+ny*wd*.3)+' '+f(ex+dx*len*.96)+' '+f(ey+dy*len*.96),stroke:pl.huskLine,'stroke-width':.6,fill:'none'},g);
  if(p.silk>0){var sx=ex+dx*len,sy=ey+dy*len;for(var q=0;q<7;q++){var aa=ang+(q-3)*.16,ll=(7+q%3*2)*s*p.silk;el('path',{d:'M'+f(sx)+' '+f(sy)+' q '+f(Math.sin(aa)*ll*.6+side2*2*s)+' '+f(-Math.cos(aa)*ll*.5)+' '+f(Math.sin(aa)*ll)+' '+f(-Math.cos(aa)*ll+ll*.35),stroke:pl.silk,'stroke-width':.7*s+.2,fill:'none','stroke-linecap':'round'},g)}}
 }
 // tassel
 if(p.tassel>0){var tl=24*s*p.tassel,tg=el('g',{},g);
  el('path',{d:'M'+f(tip[0])+' '+f(tip[1]+2*s)+' L'+f(tip[0]+lean*.05)+' '+f(tip[1]-tl),stroke:pl.tassel,'stroke-width':1.3*s+.3,'stroke-linecap':'round'},tg);
  for(var b=0;b<6;b++){var by2=tip[1]-tl*(.1+.1*b),sd=b%2?1:-1,bl=tl*(.75-.09*b),droopT=.6+p.dry*.6;
   el('path',{d:'M'+f(tip[0])+' '+f(by2)+' q '+f(sd*bl*.5)+' '+f(-bl*.25)+' '+f(sd*bl*.9)+' '+f(bl*(droopT-.3)),stroke:pl.tassel,'stroke-width':.9*s+.2,fill:'none','stroke-linecap':'round'},tg);
   if(detail&&!p.dry)for(var an=1;an<4;an++)el('circle',{cx:f(tip[0]+sd*bl*.25*an),cy:f(by2+bl*(droopT-.3)*an*an/16-bl*.05*an),r:.9*s,fill:pl.anther},tg)}}
};
Scene.prototype.leaf=function(g,bx,by,side,L,a0,bend,p,senK,detail){
 var N=10,c=[],wid=L*.075*(1-p.roll*.35);
 for(var i=0;i<=N;i++){var t=i/N,a=a0+bend*Math.pow(t,1.6),r=L*t;
  // integrate direction along arc
  if(i===0)c.push([bx,by]);else{var prev=c[i-1],step=L/N;c.push([prev[0]+side*Math.sin(a)*step,prev[1]-Math.cos(a)*step])}}
 var left=[],right=[];
 for(i=0;i<=N;i++){var t2=i/N,w=wid*Math.sin(Math.PI*Math.pow(t2,.55))*(1-.15*t2);if(i===N)w=0;
  var p0=c[Math.max(0,i-1)],p1=c[Math.min(N,i+1)],dx=p1[0]-p0[0],dy=p1[1]-p0[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  left.push([c[i][0]+nx*w,c[i][1]+ny*w]);right.push([c[i][0]-nx*w,c[i][1]-ny*w])}
 var outline=left.concat(right.reverse().slice(1,-1));
 var pl=this.palette(p),fillC=senK>0?mix(pl.leafA,pl.senA,senK):'url(#gLeaf)';
 el('path',{d:smooth(outline,true),fill:side>0?fillC:(senK>0?mix(pl.leafB,pl.senB,senK):'url(#gLeafBack)'),stroke:pl.edge,'stroke-width':.35},g);
 // scorched tip (heat) or dried tip (drought)
 var burn=Math.max(p.scorch,senK>.5?(senK-.5):0,p.stress>.55?(p.stress-.55)*1.2:0);
 if(burn>.02){var from=Math.max(1,Math.round(N*(1-burn*.4))),seg=[];for(i=from;i<=N;i++)seg.push(left[i]);var rr=right.slice().reverse();for(i=N;i>=from;i--)seg.push(rr[i]);
  el('path',{d:smooth(seg,true),fill:pl.scorch,opacity:.92},g)}
 el('path',{d:smooth(c.slice(0,N),false),stroke:pl.rib,'stroke-width':Math.max(.4,wid*.18),fill:'none','stroke-linecap':'round'},g);
 if(detail&&wid>1.6){var rr2=right.slice().reverse();[left,rr2].forEach(function(edge){var v=[];for(var j=1;j<N-1;j++)v.push([lerp(c[j][0],edge[j][0],.5),lerp(c[j][1],edge[j][1],.5)]);
  el('path',{d:smooth(v,false),stroke:pl.vein,'stroke-width':.35,fill:'none',opacity:.6},g)})}
};
Scene.prototype.palette=function(p){
 var st=clamp(p.stress,0,1),sen=p.sen;
 var a=mix(mix('#62a24a','#a9a463',st*1.15),'#d2b36a',sen),b=mix(mix('#2f6b33','#7b7a45',st*1.15),'#a8874a',sen);
 return {leafA:a,leafB:b,senA:'#d8bd7a',senB:'#b0905a',edge:mix('#244f27','#6d5a2e',Math.max(st,sen)),rib:mix(mix('#c9df9a','#d9d29a',st),'#efe0b0',sen),vein:mix('#9ec27a','#cfc48a',st),
  node:mix('#cfe0a0','#d9c48a',sen),husk:mix(mix('#7fae55','#a9a65a',st),'#d9bf80',sen),huskLine:mix('#4f7a33','#9a7d48',sen),silk:mix('#f0d9a8','#8a5a2b',sen*1.2+p.silkAge),
  tassel:mix('#d9b54a','#a8874a',sen),anther:'#f3d36b',scorch:mix('#a0642c','#7a4a22',p.scorch)};
};
/* Update everything for one day. s: {sown,tt,stages,grow,ks,stress,scorch,rain,tmax,srad,soil,loc} */
Scene.prototype.render=function(s){
 this.setLocation(s.loc);
 var hot=clamp((s.tmax-32)/7,0,1),wet=clamp(s.rain/18,0,1),drizzle=s.rain>=0.5&&s.rain<3,cloud=Math.max(wet,drizzle?.3:0,clamp((17-s.srad)/9,0,.6));
 var top=mix(mix('#6fa3c4','#d9b07a',hot),'#7d8a92',wet),mid=mix(mix('#bcd6e2','#efcf98',hot),'#a9b3b6',wet),low=mix(mix('#eef0e6','#f7e3b9',hot),'#cfd3cf',wet);
 [top,mid,low].forEach(function(c,i){this.sky[i].style.stopColor=c},this);
 var g1=mix('#ffe6a0','#ffb35c',hot);this.glow.forEach(function(st){st.style.stopColor=g1});
 this.disc[0].style.stopColor=mix('#fff3c4','#ffd27a',hot);this.disc[1].style.stopColor=mix('#f4b840','#ec7a2a',hot);
 this.sunG.style.opacity=f(1-.88*cloud);this.sunDisc.setAttribute('r',f(18+hot*6));
 var cc=mix('#ffffff','#8b9396',wet);this.cloudStops.forEach(function(st){st.style.stopColor=cc});
 this.drawClouds(this.cloudsFar,cloud>.15?Math.round(1+cloud*2):1,.55,7);this.drawClouds(this.clouds,s.rain>=0.5?Math.min(4,1+Math.round(s.rain/5)):(cloud>.25?1:0),1,3);
 this.hillFar.style.fill=mix('#c7b98f','#8ea37a',clamp(s.soil*1.2,0,1));this.hillFar.style.opacity=.6;
 this.hillNear.style.fill=mix('#b9a273','#6f8e55',clamp(s.soil*1.2,0,1));
 var soil=clamp(s.soil,0,1);this.ground[0].style.stopColor=mix('#cdb289','#7a5636',soil);this.ground[1].style.stopColor=mix('#b08a5c','#4a2f1c',soil);
 this.cracks.style.opacity=f(clamp((.35-soil)/.3,0,1));this.puddles.style.opacity=f(s.rain>12?.75:s.rain>6?.35:0);
 // rain streaks
 var r=this.rain;while(r.firstChild)r.removeChild(r.firstChild);
 if(s.rain>=3){var n=Math.min(90,Math.round(12+s.rain*3));for(var i=0;i<n;i++){var x=(i*47.3)%420,y=20+((i*61.7)%170),l=12+(i%4)*3;
  el('line',{x1:f(x),y1:f(y),x2:f(x-l*.35),y2:f(y+l),stroke:'url(#gRain)','stroke-width':1.1,'stroke-linecap':'round',style:'animation-delay:-'+((i*.137)%0.6).toFixed(2)+'s'},r)}}
 // heat shimmer
 var sh=this.shimmer;while(sh.firstChild)sh.removeChild(sh.firstChild);
 if(s.tmax>=34){for(i=0;i<4;i++){var yy=HORIZON-8+i*9;el('path',{d:'M-20 '+yy+' q 25 -6 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0',stroke:'#fff6e0','stroke-width':5,fill:'none',opacity:f(.3+hot*.5),style:'animation-delay:-'+(i*.35)+'s'},sh)}}
 // plants
 var pg=this.plants;while(pg.firstChild)pg.removeChild(pg.firstChild);
 var st=s.stages,tt=s.tt,sen=clamp((tt-st[4][1])/(st[5][1]-st[4][1]),0,1),dev=clamp(tt/st[3][1],0,1);
 var h=tt<st[1][1]?0:Math.max(4,170*Math.min(dev,.2+.8*s.grow)*(.6+.4*clamp(s.grow*1.25,0,1)));
 var leaves=tt<st[1][1]?0:Math.min(9,Math.max(2,Math.floor(2+tt/120)));
 var silkStart=st[3][1]+40,p={sown:s.sown,h:h,leaves:leaves,droop:clamp((1-s.ks)*1.15,0,1),roll:clamp((1-s.ks)*1.3,0,1),stress:s.stress,scorch:clamp(s.scorch,0,1),sen:sen,dry:sen>.85?1:0,
  tassel:clamp((tt-(st[3][1]-120))/120,0,1),ear:clamp((tt-(st[3][1]-60))/400,0,1),silk:clamp((tt-silkStart)/80,0,1),silkAge:clamp((tt-silkStart-150)/300,0,1)};
 var rows=[[180,.42,[22,74,126,178,230,282,334,386],false],[206,.6,[48,118,188,258,328,398],false],[262,1.02,[64,200,336],true]];
 rows.forEach(function(row,ri){row[2].forEach(function(x,k){var j=1+(((k*7+ri*3)%5)-2)*.035;this.maize(pg,x,row[0],row[1],Object.assign({},p,{h:p.h*j,side:(k+ri)%2?1:-1}),row[3])},this)},this);
 // shared gradients for leaves and stem
 var pl=this.palette(p);this.leafStops[0].style.stopColor=pl.leafA;this.leafStops[1].style.stopColor=pl.leafB;
 this.leafBack[0].style.stopColor=mix(pl.leafB,'#000000',.08);this.leafBack[1].style.stopColor=mix(pl.leafA,'#000000',.12);
 var sc=mix(mix('#6f9f4a','#a39e52',s.stress),'#c9a866',sen);this.stemStops[0].style.stopColor=mix(sc,'#000000',.25);this.stemStops[1].style.stopColor=mix(sc,'#ffffff',.15);this.stemStops[2].style.stopColor=mix(sc,'#000000',.3);
};
Scene.prototype.drawClouds=function(g,n,sc,seed){while(g.firstChild)g.removeChild(g.firstChild);
 for(var i=0;i<n;i++){var x=((seed*53+i*131)%360)+10,y=(sc<1?62:28)+((i*29+seed*7)%26),c=el('g',{transform:'translate('+x+' '+y+') scale('+sc+')'},g);
  [[0,0,34,15],[-22,6,24,11],[24,5,28,12],[6,-10,22,14],[-8,-6,18,11]].forEach(function(e){el('ellipse',{cx:e[0],cy:e[1],rx:e[2],ry:e[3],fill:'url(#gCloud)'},c)})}};
root.Scene=Scene;
})(this);
