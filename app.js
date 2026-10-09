"use strict";
(() => {
  const P = window.PenrosePhysics;
  const el = id => document.getElementById(id);
  const canvas = el("scene"), ctx = canvas.getContext("2d");
  if (!ctx) {
    el("sceneNote").textContent = "This browser cannot initialize the canvas renderer. The live equations and controls remain available.";
  }
  const DEFAULT = Object.freeze({mass:10, view:"slice", scale:"physical", yaw:-0.55, pitch:0.61, zoom:1});
  let state = {...DEFAULT}, width=1, height=1, pending=false, geometry=null;
  const pointers = new Map();
  let lastPinch=0;
  const number = (n, decimals=2) => n.toLocaleString("en-US",{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const scientific = n => n.toExponential(5).replace("e+"," × 10^").replace("e-"," × 10^-");

  function updateReadouts() {
    const p = P.fromSolarMass(state.mass);
    el("radius").innerHTML = number(p.radiusM/1000) + " <small>km</small>";
    el("area").innerHTML = number(p.areaM2/1e6) + " <small>km²</small>";
    el("geoMass").innerHTML = number(p.m/1000) + " <small>km</small>";
    el("bound").innerHTML = number(p.boundKg/P.SOLAR_MASS) + " <span>M<sub>☉</sub></span>";
    el("massRange").value = Math.log10(state.mass);
    el("massRange").setAttribute("aria-valuetext",number(state.mass,1)+" solar masses");
    document.querySelectorAll("[data-mass]").forEach(button => {
      const selected=Math.abs(Number(button.dataset.mass)-state.mass)<0.051;
      button.classList.toggle("selected",selected);
      button.setAttribute("aria-pressed",String(selected));
    });
    el("stepMass").textContent = "M = "+number(state.mass)+" M☉ = "+scientific(p.massKg)+" kg → m = "+number(p.m/1000,5)+" km";
    el("stepArea").textContent = "A = 16π × ("+number(p.m/1000,5)+" km)² = "+number(p.areaM2/1e6,3)+" km²";
    el("stepBound").textContent = "√[16πm² / (16π)] = √(m²) = m = "+number(p.m/1000,5)+" km";
    el("stepResult").textContent = "M ≥ (c²/G)m = "+number(p.boundKg/P.SOLAR_MASS,5)+" M☉; chosen M = "+number(state.mass,5)+" M☉";
    requestDraw();
  }
  function setMass(value, syncNumber=true) {
    if (!Number.isFinite(value) || value<1 || value>100) {
      el("massError").hidden=false;
      el("massNumber").setAttribute("aria-invalid","true");
      return false;
    }
    state.mass=Number(value.toFixed(1));
    el("massError").hidden=true;
    el("massNumber").removeAttribute("aria-invalid");
    if(syncNumber) el("massNumber").value=state.mass;
    updateReadouts();
    return true;
  }
  function syncScale() {
    document.querySelectorAll('input[name="scale"]').forEach(radio => radio.checked=radio.value===state.scale);
    el("scaleHelp").textContent=state.scale==="physical"
      ? "The camera scale stays fixed as mass changes. Larger mass means a larger geometry. Use Fit to reframe."
      : "All lengths are divided by m. Every positive-mass Schwarzschild shape coincides; physical readouts still change.";
  }
  function setView(view) {
    state.view=view;
    ["slice","sphere"].forEach(v=>{
      const button=el(v+"View"), active=v===view;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    const slice=view==="slice";
    el("sceneKicker").textContent=slice ? "FLAMM’S PARABOLOID" : "SPHERICAL HORIZON AREA";
    el("sceneTitle").textContent=slice ? "Space, in a single slice." : "The boundary, in full.";
    el("dimensionTag").textContent=slice ? "2D SPATIAL SLICE → 3D EMBEDDING" : "INTRINSIC HORIZON SPHERE";
    el("legendGeometry").textContent=slice ? "Exterior geometry" : "Horizon surface";
    el("sceneNote").textContent=slice
      ? "A constant-time equatorial spatial slice embedded in Euclidean 3D. The vertical direction illustrates distance geometry; it is not a literal funnel in space."
      : "A separate view of the horizon’s intrinsic sphere: radius 2m and area 16πm². The gold equator corresponds to the slice’s rim; its disk is not the horizon area.";
    canvas.setAttribute("aria-label","Interactive 3D Schwarzschild "+(slice?"spatial slice":"horizon sphere")+". Drag to rotate, scroll or pinch to zoom. Arrow keys rotate; plus and minus zoom.");
    geometry=createGeometry(view);
    requestDraw();
  }
  function createGeometry(view) {
    const faces=[], lines=[];
    const n=64, rows=view==="slice"?24:28;
    function point(i,j) {
      const phi=j/n*2*Math.PI;
      if(view==="slice"){
        // Stable at the limiting horizon: r=2m+u²/(8m), z=+u.
        const u=Math.sqrt(80)*i/rows;
        const q=P.embeddingPoint(1,u,phi,1);
        return [q.x,q.y,q.z-4.2];
      }
      const theta=i/rows*Math.PI;
      return [2*Math.sin(theta)*Math.cos(phi),2*Math.sin(theta)*Math.sin(phi),2*Math.cos(theta)];
    }
    for(let i=0;i<rows;i++)for(let j=0;j<n;j++){
      const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);
      faces.push({points:[a,b,c,d],band:i/rows});
    }
    for(let i=0;i<=rows;i+=2)for(let j=0;j<n;j++)
      lines.push({points:[point(i,j),point(i,j+1)],horizon:view==="slice"?i===0:i===rows/2});
    for(let j=0;j<n;j+=4)for(let i=0;i<rows;i++)
      lines.push({points:[point(i,j),point(i+1,j)],horizon:false});
    if(view==="sphere"){
      // The equator is exactly theta=π/2, independent of row parity.
      for(let j=0;j<n;j++){
        const phi=j/n*2*Math.PI,ph2=(j+1)/n*2*Math.PI;
        lines.push({points:[[2*Math.cos(phi),2*Math.sin(phi),0],[2*Math.cos(ph2),2*Math.sin(ph2),0]],horizon:true});
      }
    }
    return {faces,lines};
  }
  function requestDraw() {
    if(pending || !ctx) return;
    pending=true;
    requestAnimationFrame(()=>{pending=false;draw();});
  }
  function rotatePoint(p) {
    const c=Math.cos(state.yaw),s=Math.sin(state.yaw), cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
    const x=p[0]*c-p[1]*s,y=p[0]*s+p[1]*c;
    return [x,p[2]*cp-y*sp,y*cp+p[2]*sp];
  }
  function draw() {
    ctx.clearRect(0,0,width,height);
    // Soft scientific reference grid; it is a screen backdrop, not a metric.
    ctx.save();
    ctx.strokeStyle="#30435730";ctx.lineWidth=0.5;
    for(let x=24;x<width;x+=44){ctx.beginPath();ctx.moveTo(x,90);ctx.lineTo(x,height-83);ctx.stroke();}
    for(let y=102;y<height-73;y+=44){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(width-20,y);ctx.stroke();}
    ctx.restore();
    const physicalFactor=state.scale==="physical"?state.mass/10:1;
    const unitsToPx = Math.min(width/29,(height-135)/17);
    const zoom=state.zoom*physicalFactor*(state.view==="sphere"?3.2:1);
    // Camera dolly: do not push points through a fixed near plane.
    const eye=42;
    const perspectiveStrength=0.55;
    function projected(p) {
      const q=rotatePoint(p);
      const denominator=1+q[2]/eye*perspectiveStrength;
      const f=unitsToPx*zoom/denominator;
      return {x:width/2+q[0]*f,y:height*0.51-q[1]*f,depth:q[2]};
    }
    const primitives=[];
    geometry.faces.forEach(face=>{
      const points=face.points.map(projected);
      primitives.push({type:"face",points,depth:points.reduce((s,p)=>s+p.depth,0)/points.length,band:face.band});
    });
    geometry.lines.forEach(line=>{
      const points=line.points.map(projected);
      primitives.push({type:"line",points,depth:(points[0].depth+points[1].depth)/2,horizon:line.horizon});
    });
    primitives.sort((a,b)=>b.depth-a.depth || (a.type==="face"?-1:1));
    primitives.forEach(item=>{
      ctx.beginPath();ctx.moveTo(item.points[0].x,item.points[0].y);
      for(let i=1;i<item.points.length;i++)ctx.lineTo(item.points[i].x,item.points[i].y);
      if(item.type==="face"){
        ctx.closePath();
        const shade=clamp(0.48+item.depth/30,0.20,0.83);
        ctx.fillStyle=state.view==="slice"
          ? "rgba(19,57,76,"+shade+")"
          : "rgba(26,66,86,"+clamp(shade+0.2,0.5,0.94)+")";
        ctx.fill();
      }else{
        ctx.lineWidth=item.horizon?2.1:0.65;
        ctx.strokeStyle=item.horizon?"#efbd76":(state.view==="slice"?"#65cde780":"#72dbef89");
        if(item.horizon){ctx.shadowColor="#efbd76";ctx.shadowBlur=8;}
        ctx.stroke();ctx.shadowBlur=0;
      }
    });
    // Numeric scale annotation tied to the same model-to-screen transform.
    const axisPoint=state.view==="slice"?[2,0,-4.2]:[2,0,0];
    const mark=projected(axisPoint);
    ctx.fillStyle="#efbd76";ctx.font="10px system-ui";
    const radiusLabel=state.scale==="physical" ? "rₛ = "+number(P.fromSolarMass(state.mass).radiusM/1000,1)+" km" : "rₛ / m = 2";
    const lx=clamp(mark.x+13,18,width-135),ly=clamp(mark.y+25,115,height-126);
    ctx.fillText(radiusLabel,lx,ly);
    ctx.fillStyle="#8ca8ba";ctx.font="9px system-ui";
    ctx.fillText(state.scale==="physical" ? "PHYSICAL SCALE · km" : "NORMALIZED SCALE · lengths / m",22,height-142);
  }
  function resize(){
    const box=el("viewport").getBoundingClientRect();
    width=Math.max(1,box.width);height=Math.max(1,box.height);
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
    requestDraw();
  }
  function cameraZoom(factor) {
    state.zoom=clamp(state.zoom*factor,0.06,20);
    requestDraw();
  }
  function fit(){
    state.zoom=state.scale==="physical"?10/state.mass:1;
    requestDraw();
  }
  function reset(){
    state={...DEFAULT};
    pointers.clear();lastPinch=0;
    setView("slice");syncScale();setMass(10);
    resize();
  }
  el("massNumber").addEventListener("input",()=>setMass(el("massNumber").valueAsNumber,false));
  el("massNumber").addEventListener("change",()=>{
    if(setMass(el("massNumber").valueAsNumber,false))el("massNumber").value=Number(state.mass.toFixed(1));
  });
  el("massRange").addEventListener("input",()=>setMass(Number((10**Number(el("massRange").value)).toFixed(1))));
  document.querySelectorAll("[data-mass]").forEach(button=>button.addEventListener("click",()=>setMass(Number(button.dataset.mass))));
  document.querySelectorAll('input[name="scale"]').forEach(radio=>radio.addEventListener("change",()=>{
    state.scale=radio.value;syncScale();fit();
  }));
  el("sliceView").addEventListener("click",()=>setView("slice"));
  el("sphereView").addEventListener("click",()=>setView("sphere"));
  el("reset").addEventListener("click",reset);
  el("fit").addEventListener("click",fit);
  el("zoomIn").addEventListener("click",()=>cameraZoom(1.2));
  el("zoomOut").addEventListener("click",()=>cameraZoom(1/1.2));
  el("rotateLeft").addEventListener("click",()=>{state.yaw-=0.2;requestDraw();});
  el("rotateRight").addEventListener("click",()=>{state.yaw+=0.2;requestDraw();});
  canvas.addEventListener("wheel",event=>{event.preventDefault();cameraZoom(Math.exp(-clamp(event.deltaY,-100,100)*0.004));},{passive:false});
  function distance(){const points=[...pointers.values()];return points.length>=2?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0;}
  canvas.addEventListener("pointerdown",event=>{
    if(event.pointerType==="mouse" && event.button!==0)return;
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    lastPinch=distance();
  });
  canvas.addEventListener("pointermove",event=>{
    if(!pointers.has(event.pointerId))return;
    const previous=pointers.get(event.pointerId);
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size>=2){
      const next=distance();
      if(lastPinch>0)cameraZoom(next/lastPinch);
      lastPinch=next;
    }else{
      state.yaw+=(event.clientX-previous.x)*0.008;
      state.pitch=clamp(state.pitch+(event.clientY-previous.y)*0.006,-1.35,1.35);
      requestDraw();
    }
  });
  function release(event){pointers.delete(event.pointerId);lastPinch=distance();}
  canvas.addEventListener("pointerup",release);
  canvas.addEventListener("pointercancel",release);
  canvas.addEventListener("lostpointercapture",release);
  canvas.addEventListener("keydown",event=>{
    let handled=true;
    switch(event.key){
      case "ArrowLeft":state.yaw-=0.12;break;
      case "ArrowRight":state.yaw+=0.12;break;
      case "ArrowUp":state.pitch=clamp(state.pitch-0.1,-1.35,1.35);break;
      case "ArrowDown":state.pitch=clamp(state.pitch+0.1,-1.35,1.35);break;
      case "+":case "=":cameraZoom(1.15);break;
      case "-":case "_":cameraZoom(1/1.15);break;
      case "0":fit();break;
      default:handled=false;
    }
    if(handled){event.preventDefault();requestDraw();}
  });
  if(typeof ResizeObserver!=="undefined")new ResizeObserver(resize).observe(el("viewport"));
  window.addEventListener("resize",resize);
  reset();
})();

