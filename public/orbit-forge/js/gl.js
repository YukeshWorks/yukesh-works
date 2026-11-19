'use strict';
/* ===== WebGL planet renderer =====
   Each world's surface is baked ONCE into textures (albedo+specular, clouds+city lights) by a
   procedural shader; drawing a sphere is then a couple of texture reads plus lighting per pixel.
   The Sun stays procedural (animated) but cheap. Rings and atmospheres are analytic. */
const GLR = (() => {
  const NOISE = `
float h3(vec3 p){ p=fract(p*0.3183099+vec3(0.71,0.113,0.419)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vn(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1.,0.,0.)),f.x),mix(h3(i+vec3(0.,1.,0.)),h3(i+vec3(1.,1.,0.)),f.x),f.y),
             mix(mix(h3(i+vec3(0.,0.,1.)),h3(i+vec3(1.,0.,1.)),f.x),mix(h3(i+vec3(0.,1.,1.)),h3(i+vec3(1.,1.,1.)),f.x),f.y),f.z); }
vec3 rotY(vec3 v,float a){ float c=cos(a), s=sin(a); return vec3(c*v.x+s*v.z, v.y, -s*v.x+c*v.z); }
vec3 rotX(vec3 v,float a){ float c=cos(a), s=sin(a); return vec3(v.x, c*v.y-s*v.z, s*v.y+c*v.z); }`;
  /* ---- bake: equirectangular surface maps ---- */
  const VS_BAKE = `attribute vec2 aP; void main(){ gl_Position = vec4(aP, 0.0, 1.0); }`;
  const FS_BAKE = `precision highp float;
uniform vec2 uSize; uniform int uT; uniform float uSeed; uniform int uPass;
${NOISE}
float fbm(vec3 p){ float s=0.0; float a=0.5; for(int i=0;i<6;i++){ s+=a*vn(p); p=p*2.03+vec3(3.1,1.7,4.3); a*=0.5; } return s; }
float ridge(vec3 p){ return 1.0-abs(vn(p)*2.0-1.0); }
vec3 craters(vec3 q, vec3 base, float k){ float c=pow(ridge(q*22.0),7.0)*0.25+pow(ridge(q*55.0),9.0)*0.15; return base*(0.86+0.28*fbm(q*14.0))*(1.0+c*k)-vec3(0.05)*pow(ridge(q*8.0),12.0); }
void main(){
  vec2 uv=gl_FragCoord.xy/uSize; float lon=uv.x*6.2831853-3.1415927; float lat=(uv.y-0.5)*3.1415927;
  vec3 b=vec3(cos(lat)*cos(lon), sin(lat), cos(lat)*sin(lon)); vec3 q=b+vec3(uSeed*1.7,uSeed*0.9,uSeed*2.3);
  float la=b.y; vec3 alb=vec3(0.5); float spec=0.0, cloud=0.0, city=0.0;
  if(uT==1){
    float c=fbm(q*1.5)+0.18*(fbm(q*5.0)-0.5); float land=smoothstep(0.50,0.525,c); float hg=fbm(q*8.0+2.0);
    vec3 ocean=mix(vec3(0.008,0.035,0.13),vec3(0.03,0.19,0.37),smoothstep(0.38,0.5,c));
    float dry=smoothstep(0.45,0.62,fbm(q*2.5+7.0))*(1.0-smoothstep(0.3,0.55,abs(la)));
    vec3 lc=mix(mix(vec3(0.09,0.22,0.07),vec3(0.28,0.33,0.14),hg),vec3(0.70,0.56,0.35),dry);
    lc=mix(lc,vec3(0.42,0.40,0.37),smoothstep(0.62,0.78,hg)); lc=mix(lc,vec3(0.33,0.34,0.28),smoothstep(0.55,0.72,abs(la))*0.6);
    alb=mix(ocean,lc,land); float ice=smoothstep(0.80,0.86,abs(la)+0.05*vn(q*9.0)); alb=mix(alb,vec3(0.92,0.95,1.0),ice);
    vec3 cb=b+uSeed; cloud=smoothstep(0.5,0.74,fbm(cb*2.6)+0.12*(fbm(cb*11.0)-0.5));
    spec=(1.0-land)*(1.0-ice);
    city=land*(1.0-ice)*smoothstep(0.56,0.7,vn(q*60.0))*smoothstep(0.5,0.66,vn(q*9.0+4.0));
  } else if(uT==2){ float m=smoothstep(0.5,0.56,fbm(q*2.0)); alb=craters(q, mix(vec3(0.60,0.59,0.58),vec3(0.30,0.30,0.31),m), 1.0); }
  else if(uT==3){ alb=craters(q, mix(vec3(0.55,0.51,0.47),vec3(0.38,0.35,0.33),fbm(q*3.0)), 1.3); }
  else if(uT==4){ vec3 w=b+0.32*vec3(fbm(b*2.0),fbm(b*2.0+5.0),fbm(b*2.0+9.0)); float bd=fbm(vec3(w.x*2.0,w.y*7.0,w.z*2.0)); alb=mix(vec3(0.82,0.66,0.40),vec3(0.98,0.91,0.74),bd); }
  else if(uT==5){ float m=smoothstep(0.45,0.6,fbm(q*2.5)); alb=mix(vec3(0.74,0.34,0.16),vec3(0.40,0.19,0.10),m)*(0.85+0.3*fbm(q*10.0));
    alb=mix(alb,vec3(0.94,0.92,0.9),smoothstep(0.86,0.9,abs(la)+0.04*vn(q*10.0))); }
  else if(uT==6||uT==7){
    float w=fbm(b*vec3(3.0,1.0,3.0)*2.0)*0.08+fbm(b*12.0)*0.03; float y=la+w;
    float b1=0.5+0.5*sin(y*(uT==6?26.0:20.0)); float b2=0.5+0.5*sin(y*11.0+1.3);
    if(uT==6){ alb=mix(vec3(0.93,0.87,0.76),vec3(0.75,0.56,0.39),b1); alb=mix(alb,vec3(0.55,0.36,0.25),b2*0.35*(1.0-abs(la)));
      vec2 g=vec2((lon-1.2)/0.30,(la+0.37)/0.11); alb=mix(alb,vec3(0.80,0.38,0.24),1.0-smoothstep(0.55,1.0,length(g))); }
    else { alb=mix(vec3(0.95,0.88,0.68),vec3(0.83,0.71,0.49),b1*0.8); alb=mix(alb,vec3(0.7,0.6,0.42),b2*0.2); }
    alb*=1.0-0.3*smoothstep(0.78,0.98,abs(la));
  }
  else if(uT==8){ alb=vec3(0.62,0.86,0.90)*(0.95+0.05*sin(la*18.0+fbm(b*4.0))); }
  else if(uT==9){ alb=mix(vec3(0.17,0.34,0.82),vec3(0.30,0.50,0.95),0.5+0.5*sin(la*14.0+fbm(b*3.0)*2.0));
    alb=mix(alb,vec3(0.08,0.15,0.45),1.0-smoothstep(0.5,1.0,length(vec2((lon+0.8)/0.25,(la+0.3)/0.1))));
    alb=mix(alb,vec3(0.92,0.95,1.0),smoothstep(0.68,0.74,fbm(b*vec3(6.0,22.0,6.0)))*0.8); }
  else if(uT==10){ alb=mix(vec3(0.90,0.82,0.40),vec3(0.78,0.56,0.24),fbm(q*3.0)); alb=mix(alb,vec3(0.18,0.10,0.06),smoothstep(0.72,0.75,vn(q*14.0))); alb=mix(alb,vec3(0.85,0.35,0.15),smoothstep(0.74,0.78,vn(q*6.0+3.0))*0.7); }
  else if(uT==11){ float cr=1.0-smoothstep(0.0,0.07,abs(sin(fbm(q*2.0)*42.0))); alb=mix(vec3(0.88,0.84,0.76),vec3(0.55,0.34,0.20),cr*0.75)*(0.92+0.1*fbm(q*6.0)); }
  else if(uT==12){ alb=craters(q, mix(vec3(0.40,0.36,0.31),vec3(0.70,0.68,0.63),smoothstep(0.45,0.62,fbm(q*3.0))), 1.2); }
  else if(uT==13){ alb=vec3(0.86,0.60,0.28)*(0.9+0.1*fbm(q*3.0)); }
  else { alb=craters(q, vec3(0.42,0.38,0.34), 1.4); }
  gl_FragColor = uPass==0 ? vec4(clamp(alb,0.0,1.0), spec) : vec4(cloud, city, 0.0, 1.0);
}`;
  /* ---- draw: textured, lit spheres + procedural Sun ---- */
  const VS = `attribute vec2 aP; uniform vec2 uRes; uniform vec2 uC; uniform float uHalf;
void main(){ vec2 px = uC + aP*uHalf; gl_Position = vec4(px/uRes*2.0-1.0, 0.0, 1.0); }`;
  const FS = `precision highp float;
uniform vec2 uC; uniform float uR; uniform int uT; uniform float uSpin; uniform vec2 uL; uniform float uTime;
uniform float uTilt; uniform vec2 uRing; uniform vec3 uAtmC; uniform float uAtmK; uniform float uAtmH; uniform float uFade;
uniform sampler2D uA; uniform sampler2D uB; uniform float uCloudShift;
${NOISE}
float fbm3(vec3 p){ float s=0.0; float a=0.5; for(int i=0;i<3;i++){ s+=a*vn(p); p=p*2.03+vec3(3.1,1.7,4.3); a*=0.5; } return s+a*0.5; }
void main(){
  vec2 p=(gl_FragCoord.xy-uC)/uR; float d2=dot(p,p); float d=sqrt(d2);
  if(uT==0){
    vec3 c=vec3(0.0); float a=0.0;
    if(d2<1.0){ float z=sqrt(1.0-d2); vec3 b=rotY(vec3(p,z),uSpin);
      float g=fbm3(b*14.0+vec3(0.0,uTime*0.03,0.0)); float limb=pow(z,0.5);
      c=mix(vec3(1.0,0.38,0.06),vec3(1.0,0.95,0.78),limb)*(0.8+0.42*g);
      c*=1.0-0.6*smoothstep(0.70,0.76,fbm3(b*3.0+17.0)); a=1.0; }
    float r=max(d,1.0); float an=atan(p.y,p.x);
    float st=0.55+0.45*vn(vec3(cos(an)*4.0,sin(an)*4.0,uTime*0.04+r*1.5));
    float cor=exp(-(r-1.0)*4.0)*1.1*st+exp(-(r-1.0)*1.1)*0.22;
    if(a<1.0) c+=vec3(1.0,0.72,0.38)*cor;
    gl_FragColor=vec4(c,a)*uFade; return;
  }
  vec3 L=normalize(vec3(uL,0.0001)); vec3 col=vec3(0.0); float alpha=0.0; float zs=-1.0;
  if(d2<1.0){
    float z=sqrt(1.0-d2); zs=z; vec3 n=vec3(p,z);
    vec3 b=rotY(rotX(n,uTilt),uSpin); float lam=dot(n,L);
    vec2 uv=vec2(atan(b.z,b.x)*0.15915494+0.5, asin(clamp(b.y,-1.0,1.0))*0.31830989+0.5);
    vec4 A=texture2D(uA,uv); vec3 alb=A.rgb; float spec=A.a; vec3 emit=vec3(0.0);
    if(uT==1){
      float cl=texture2D(uB,vec2(uv.x+uCloudShift,uv.y)).r; float city=texture2D(uB,uv).g;
      spec*=1.0-cl; float night=1.0-smoothstep(-0.12,0.04,lam);
      emit=vec3(1.0,0.72,0.38)*city*(1.0-cl*0.85)*night*0.95; alb=mix(alb,vec3(0.96,0.97,1.0),cl*0.92);
    }
    float wrap=(uT>=6&&uT<=9)?0.12:0.0;
    vec3 c=alb*(clamp((lam+wrap)/(1.0+wrap),0.0,1.0)*1.08+0.012);
    if(uAtmK>0.0) c*=mix(vec3(1.0,0.6,0.4),vec3(1.0),smoothstep(0.0,0.3,lam));
    vec3 H=normalize(L+vec3(0.0,0.0,1.0)); c+=spec*pow(max(dot(n,H),0.0),60.0)*vec3(1.0,0.95,0.85)*0.9*step(0.0,lam);
    c+=emit; c+=uAtmC*pow(1.0-z,2.2)*uAtmK*smoothstep(-0.25,0.45,lam)*0.9;
    col=c; alpha=1.0;
  }
  if(uRing.y>0.0){
    float st=sin(uTilt), ct=cos(uTilt);
    if(abs(st)>0.02){
      float zr=p.y*ct/st; vec3 P=vec3(p,zr); float r=length(P);
      if(r>uRing.x&&r<uRing.y&&(d2>=1.0||zr>zs)){
        float f=(r-uRing.x)/(uRing.y-uRing.x); float dens=0.72+0.18*sin(r*420.0+sin(r*61.0)*3.0)+0.1*sin(r*97.0); vec3 rc;
        if(uT==7){ dens*=smoothstep(1.24,1.53,r)*0.6+0.4; if(r>1.95&&r<2.03) dens*=0.06; if(r>2.21&&r<2.23) dens*=0.3; rc=mix(vec3(0.78,0.70,0.56),vec3(0.95,0.90,0.80),f); }
        else { dens*=0.12*smoothstep(0.35,0.5,fract(r*7.0))*(1.0-smoothstep(0.5,0.65,fract(r*7.0))); rc=vec3(0.6,0.72,0.78); }
        float pl=dot(P,L); vec3 pp=P-pl*L; rc*=(pl<0.0&&dot(pp,pp)<1.0)?0.2:1.0;
        float a=clamp(dens*0.9,0.0,0.95); col=rc*a+col*(1.0-a); alpha=a+alpha*(1.0-a);
      }
    }
  }
  if(uAtmK>0.0&&d>=1.0){ float g=exp(-(d-1.0)/uAtmH*3.0)*uAtmK; col+=uAtmC*g*clamp(dot(p/d,uL)*0.7+0.45,0.0,1.0)*(1.0-alpha); }
  gl_FragColor=vec4(col,alpha)*uFade;
}`;
  let gl = null, prog = null, bake = null, U = {}, UB = {}, ok = false, cv = null, fbo = null;
  const TEX = {};
  function sh(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function program(vs, fs){
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p;
  }
  function init(canvas){
    cv = canvas;
    try {
      gl = canvas.getContext('webgl', {premultipliedAlpha:true, alpha:true, antialias:false, depth:false, stencil:false, powerPreference:'high-performance'});
      if (!gl) return false;
      prog = program(VS, FS); bake = program(VS_BAKE, FS_BAKE);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      for (const n of ['uRes','uC','uHalf','uR','uT','uSpin','uL','uTime','uTilt','uRing','uAtmC','uAtmK','uAtmH','uFade','uA','uB','uCloudShift']) U[n] = gl.getUniformLocation(prog, n);
      for (const n of ['uSize','uT','uSeed','uPass']) UB[n] = gl.getUniformLocation(bake, n);
      fbo = gl.createFramebuffer();
      gl.useProgram(prog); gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      ok = true;
    } catch (e){ console.warn('WebGL unavailable, using 2D planets', e); ok = false; }
    return ok;
  }
  function makeTex(w, h){
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  // bake a body's surface maps once (lazily, the first time it is drawn larger than a few pixels)
  function texFor(b){
    if (TEX[b.id]) return TEX[b.id];
    const w = PERF.tier === 0 ? 512 : 1024, h = w / 2, need = b.type === 1 ? 2 : 1;
    const t = {a:makeTex(w, h), b:need > 1 ? makeTex(w, h) : null};
    gl.useProgram(bake); gl.disable(gl.BLEND); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, w, h);
    gl.uniform2f(UB.uSize, w, h); gl.uniform1i(UB.uT, b.type); gl.uniform1f(UB.uSeed, b.seed);
    for (let pass = 0; pass < need; pass++){
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass ? t.b : t.a, 0);
      gl.uniform1i(UB.uPass, pass); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.enable(gl.BLEND); gl.useProgram(prog);
    gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U.uRes, cv.width, cv.height);
    return TEX[b.id] = t;
  }
  let pending = false, drewLast = true;
  function begin(){ pending = true; if (!ok) return; flush.drew = false; }
  function clearNow(){ gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uTime, (performance.now() / 1000) % 1000); }
  function flush(){ if (!ok) return; if (pending && drewLast) clearNow(); drewLast = flush.drew; pending = false; }
  flush.drew = false;
  /* draw body b at CSS-pixel screen point (sx,sy) with radius rpx; sun = screen-space unit vector (y up) toward the Sun */
  function sphere(b, sx, sy, rpx, sun, t, k2d, fade){
    const ext = b.type === 0 ? 5 : Math.max(b.rings ? b.rings[1] * 1.04 : 1, b.atm ? 1 + b.atm.h * 2.2 : 1.02);
    const sc = cv.width / k2d.W, half = rpx * ext * sc, cx = sx * sc, cy = (k2d.H - sy) * sc;
    if (cx + half < 0 || cy + half < 0 || cx - half > cv.width || cy - half > cv.height) return;
    if (!ok){ fallback(k2d.ctx, b, sx, sy, rpx, sun); return; }
    if (b.type !== 0 && rpx > 2.5){ const T = texFor(b); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.a); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, T.b || T.a); }
    if (pending){ clearNow(); pending = false; }
    flush.drew = true;
    gl.uniform2f(U.uC, cx, cy); gl.uniform1f(U.uHalf, half); gl.uniform1f(U.uR, rpx * sc);
    gl.uniform1i(U.uT, b.type); gl.uniform1f(U.uSpin, -spinB(b, t) % TAU);
    gl.uniform2f(U.uL, sun[0], sun[1]); gl.uniform1f(U.uTilt, (b.tilt || 0) * deg + 0.18);
    gl.uniform2f(U.uRing, b.rings ? b.rings[0] : 0, b.rings ? b.rings[1] : 0);
    gl.uniform1f(U.uCloudShift, ((performance.now() / 1000) * 0.0019) % 1);
    const a = b.atm;
    gl.uniform3f(U.uAtmC, a ? a.glow[0] : 0, a ? a.glow[1] : 0, a ? a.glow[2] : 0);
    gl.uniform1f(U.uAtmK, a ? a.k : 0); gl.uniform1f(U.uAtmH, a ? a.h : 0.05); gl.uniform1f(U.uFade, fade == null ? 1 : fade);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function fallback(c, b, sx, sy, r, sun){
    c.save();
    const g = c.createRadialGradient(sx + sun[0] * r * 0.4, sy - sun[1] * r * 0.4, r * 0.1, sx, sy, r);
    g.addColorStop(0, b.type === 0 ? '#fff6d8' : b.col); g.addColorStop(1, b.type === 0 ? '#ff9a3c' : '#05070d');
    c.fillStyle = g; c.beginPath(); c.arc(sx, sy, r, 0, TAU); c.fill(); c.restore();
  }
  return {init, begin, flush, sphere, get ok(){ return ok; }};
})();
