/* Jardim em penumbra. Luz difusa, relevo e água são camadas independentes do conteúdo. */
(() => {
  'use strict';
  const hero = document.querySelector('#inicio');
  const surface = hero?.querySelector('.hero-jardim');
  const canvas = surface?.querySelector('canvas');
  if (!canvas) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(pointer: coarse)');
  let reduced = motion.matches, coarse = touch.matches;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return;
  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D heightmap, watermap;
    uniform vec2 resolution, mapSize, pointer, trail;
    uniform float time, presence, strength, exposure, still, waterStrength;
    uniform float revealStrength, reach, atmosphere, protection, mobile;
    uniform vec4 quietAreas[4];
    uniform int quietCount;
    float localLift;
    float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),u.x),u.y);}
    float paper(vec2 p){return noise(p*85.)*.55+noise(p*237.)*.3+noise(p*670.)*.15;}
    float influence(vec2 p,vec2 center,float radius){vec2 d=(p-center)*vec2(resolution.x/resolution.y,1.);return exp(-dot(d,d)/radius);}
    float discovery(vec2 p,vec2 mist){
      vec2 metric=vec2(resolution.x/resolution.y,1.);
      // Dois campos lentos quebram o contorno. O rastro alonga a descoberta sem um disco visível.
      vec2 warp=(mist-.5)*.09;
      vec2 direction=normalize((pointer-trail)*metric+vec2(.09,-.065));
      vec2 crossDirection=vec2(-direction.y,direction.x);
      vec2 d=(p-pointer)*metric+warp;
      vec2 organic=vec2(dot(d,direction)/1.28,dot(d,crossDirection)/.86);
      vec2 memory=(p-trail)*metric+warp*.7+vec2(.025,-.018);
      float radius=max(.12,reach);
      float current=exp(-dot(organic,organic)/(.027*radius*radius));
      float wake=exp(-dot(memory,memory)/(.057*radius*radius));
      float irregular=mix(.72,1.2,mist.x)*mix(.86,1.12,mist.y);
      return 1.-exp(-(current*1.9+wake*.65)*irregular*presence*revealStrength);
    }
    float contentReserve(vec2 p){
      float reserve=0.;
      vec2 metric=vec2(resolution.x/resolution.y,1.);
      for(int i=0;i<4;i++){
        if(i<quietCount){
          vec4 area=quietAreas[i];
          vec2 outside=max((abs(p-area.xy)-area.zw)*metric,0.);
          reserve=max(reserve,1.-smoothstep(0.,.11,length(outside)));
        }
      }
      return reserve*protection;
    }
    float heightAt(vec2 p){
      vec4 data=texture2D(heightmap,clamp(p,0.,1.));
      float h=(data.r*65280.+data.g*255.)/65535.;
      return h*.1*localLift;
    }
    void main(){
      vec2 p=vec2(uv.x,1.-uv.y);
      float aspect=resolution.x/resolution.y;
      // Gradientes RG/BA de 16 bits evitam degraus e cintilação quando a água repousa.
      vec4 water=texture2D(watermap,p);
      vec2 slope=(vec2(water.r*65280.+water.g*255.,water.b*65280.+water.a*255.)-32768.)/32767.;
      slope*=waterStrength*(1.-still);
      vec2 displacement=slope*.14/vec2(aspect,1.);
      p+=displacement+(pointer-.5)*presence*(1.-still)*.002;
      vec2 materialPoint=p*vec2(aspect,1.);
      vec2 mist=vec2(noise(materialPoint*3.6+vec2(time*.009,-time*.006)),
                     noise(materialPoint*7.3+vec2(-time*.006,time*.004)+19.));
      float revealed=discovery(p,mist)*(1.-still);
      float edges=1.-smoothstep(.12,.4,min(p.x,1.-p.x));
      float breath=.5+.5*sin(time*.12+p.y*4.+p.x*2.);
      float ambient=.03+edges*(.05+mobile*.07)*mix(.82,1.12,breath);
      localLift=min(1.25,(ambient+revealed*.85)*strength);
      float reserve=contentReserve(vec2(uv.x,1.-uv.y));
      vec2 step=1./mapSize;
      float h=heightAt(p);
      float dx=(heightAt(p+vec2(step.x,0.))-heightAt(p-vec2(step.x,0.)))/(2.*step.x*aspect);
      float dy=(heightAt(p+vec2(0.,step.y))-heightAt(p-vec2(0.,step.y)))/(2.*step.y);
      float plaster=paper(materialPoint);
      vec2 rough=vec2(noise(materialPoint*950.),noise(materialPoint*950.+71.))-.5;
      vec3 normal=normalize(vec3(-dx*1.2+rough.x*.07-slope.x*4.6,-dy*1.2+rough.y*.07-slope.y*4.6,1.));
      vec3 light=normalize(vec3(-.68,-.85,.9));
      float diffuse=max(0.,dot(normal,light));
      float shadow=0.;
      for(int i=1;i<=8;i++){
        float distance=float(i)*.0025;
        vec2 ray=p+vec2(-.68/aspect,-.85)*distance;
        float cover=heightAt(ray)-h-distance*.9;
        shadow+=smoothstep(-.0018,.0018,cover)*.105;
      }
      float cavity=max(0.,(heightAt(p+step*3.)+heightAt(p-step*3.))*.5-h);
      float ao=exp(-cavity*55.);
      float ink=texture2D(heightmap,p).b;
      float lift=smoothstep(.04,.85,localLift)*ink;
      vec3 base=mix(vec3(.013,.027,.022),vec3(.013,.025,.034),smoothstep(.3,.9,p.x));
      base+=vec3(.004,.007,.006)*(plaster-.5)*(1.+revealed*2.);
      vec3 forest=vec3(.045,.25,.105),ocean=vec3(.045,.14,.275),gold=vec3(.39,.29,.09);
      vec3 pigment=mix(forest,ocean,smoothstep(.3,.92,p.x));
      float golden=influence(p,vec2(.85,.24),.012)*.72+influence(p,vec2(.13,.46),.007)*.35;
      golden+=influence(p,vec2(.065,.22),.012)*.55+influence(p,vec2(.96,.62),.009)*.4;
      pigment=mix(pigment,gold,golden);
      vec3 color=mix(base,pigment,lift*(.13+revealed*.69));
      // Mesmo sem plantas, uma corrente larga conecta o campo inteiro. Não depende
      // do centro vazio: a presença atrás do conteúdo é regulada separadamente.
      float drift=(mist.x-.5)*.12+(mist.y-.5)*.035;
      float river=p.y-(.68-.34*p.x+.065*sin(p.x*5.+time*.035))-drift;
      float current=exp(-river*river/.022)*(.25+.75*mist.y);
      float undertow=exp(-pow(river+.13,2.)/.044)*(.7+.3*mist.x);
      vec3 haze=mix(vec3(.015,.058,.037),vec3(.023,.043,.088),smoothstep(.18,.84,p.x));
      haze=mix(haze,vec3(.105,.079,.025),.24*mist.x);
      color+=haze*(current*.52+undertow*.12)*atmosphere*(.5+revealed*.85);
      color+=mix(forest,ocean,p.x)*revealed*.10;
      color*=.35+diffuse*.95;
      color*=mix(1.,.43,shadow)*ao;
      float satin=pow(max(0.,dot(normal,normalize(light+vec3(0.,0.,1.)))),32.);
      color+=vec3(.42,.49,.34)*satin*.055*ink*localLift*revealed;
      // Reflexo de luz filtrada na água; a cor permanece contida na paleta do jardim.
      float wake=min(1.,length(slope)*9.);
      float glint=pow(max(0.,dot(normal,normalize(vec3(-.35,-.45,1.)))),24.);
      color+=mix(vec3(.055,.12,.16),vec3(.26,.21,.075),golden)*glint*wake*(.08+revealed*.32);
      color*=.96+plaster*.08;
      color*=1.-.23*smoothstep(.2,.82,length((p-.5)*vec2(.75,1.)));
      color*=exposure*(1.-reserve*.62);
      color+=(hash(gl_FragCoord.xy)-.5)/255.;
      gl_FragColor=vec4(color,1.);
    }`;
  let program, texture, locations, buffer;
  let loaded = false, lost = false, visible = false, frame = 0, previous = 0, elapsed = 0;
  let activeMap = '', currentImage, mapWidth = 1, mapHeight = 1, request = 0;
  let light = 1, relief = 1, rhythm = 1, waterAmount = 1, presence = 0, targetPresence = 0;
  let revelation = 1, radius = 1, atmosphereAmount = 1, contentProtection = .55;
  const quietAreas = new Float32Array(16);
  let quietCount = 0;
  const cursor = { x: .8, y: .3, tx: .8, ty: .3, trailX: .8, trailY: .3 };

  // Malha pequena independente da resolução de desenho. A integração fixa mantém
  // a mesma velocidade de propagação mesmo se o navegador variar a taxa de quadros.
  const water = (() => {
    let texture, width = 0, height = 0, current, previous, next, pixels, damping;
    let active = false, accumulator = 0, lastX = null, lastY = null;
    let pending = false, inputX = 0, inputY = 0;
    function bind() { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texture); }
    function create() {
      texture = gl.createTexture(); bind();
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      width = height = 0;
    }
    function clear() {
      if (!current) return;
      current.fill(0); previous.fill(0); next.fill(0);
      for (let i = 0; i < pixels.length; i += 4) { pixels[i] = pixels[i + 2] = 128; pixels[i + 1] = pixels[i + 3] = 0; }
      active = pending = false; accumulator = 0; lastX = lastY = null;
      bind(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    }
    function resize(aspect) {
      const nextWidth = coarse ? 112 : 240;
      const nextHeight = Math.max(64, Math.min(280, Math.round(nextWidth / aspect)));
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth; height = nextHeight;
      current = new Float32Array(width * height); previous = new Float32Array(current.length); next = new Float32Array(current.length);
      damping = new Float32Array(current.length); pixels = new Uint8Array(current.length * 4);
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const edge = Math.min(x, y, width - x - 1, height - y - 1) / 10;
        damping[y * width + x] = .986 - .17 * Math.pow(Math.max(0, 1 - edge), 2);
      }
      bind(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      clear();
    }
    function disturb(x, y) {
      if (!width || !waterAmount) return;
      const px = x * (width - 1), py = y * (height - 1);
      const dx = lastX === null ? 0 : px - lastX, dy = lastY === null ? 0 : py - lastY;
      const distance = Math.hypot(dx, dy);
      if (lastX !== null && distance < .12) return;
      const count = Math.min(24, Math.max(1, Math.ceil(distance / 2.5)));
      const force = .13 + Math.min(.14, distance * .012);
      for (let n = 1; n <= count; n++) {
        const cx = px - dx * (1 - n / count), cy = py - dy * (1 - n / count);
        for (let iy = Math.max(1, Math.floor(cy - 8)); iy <= Math.min(height - 2, Math.ceil(cy + 8)); iy++) {
          for (let ix = Math.max(1, Math.floor(cx - 8)); ix <= Math.min(width - 2, Math.ceil(cx + 8)); ix++) {
            const d = ((ix - cx) ** 2 + (iy - cy) ** 2) / 10;
            const amount = Math.exp(-d) * force, i = iy * width + ix;
            current[i] = Math.min(1.4, current[i] + amount);
            previous[i] = Math.min(1.4, previous[i] + amount * .85);
          }
        }
      }
      lastX = px; lastY = py; active = true;
    }
    function update(dt) {
      // Consolidar eventos evita trabalho extra com mouses de alta frequência.
      if (pending) { disturb(inputX, inputY); pending = false; }
      if (!active) return;
      accumulator += dt;
      while (accumulator >= 1 / 60) {
        let peak = 0;
        for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
          const i = y * width + x, h = current[i];
          const laplacian = current[i - 1] + current[i + 1] + current[i - width] + current[i + width] - h * 4;
          next[i] = (h * 2 - previous[i] + laplacian * .24) * damping[i];
          peak = Math.max(peak, Math.abs(next[i]));
        }
        const swap = previous; previous = current; current = next; next = swap;
        accumulator -= 1 / 60;
        if (peak < .00008) { clear(); return; }
      }
      for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
        const i = y * width + x, k = i * 4;
        const gx = Math.max(-1, Math.min(1, (current[i + 1] - current[i - 1]) * .5));
        const gy = Math.max(-1, Math.min(1, (current[i + width] - current[i - width]) * .5));
        const vx = Math.round(32768 + gx * 32767), vy = Math.round(32768 + gy * 32767);
        pixels[k] = vx >> 8; pixels[k + 1] = vx & 255; pixels[k + 2] = vy >> 8; pixels[k + 3] = vy & 255;
      }
      bind(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    }
    return {
      create, resize, update, clear,
      move(x, y) { inputX = x; inputY = y; pending = true; },
      leave() { lastX = lastY = null; pending = false; }
    };
  })();

  function setup() {
    program = gl.createProgram();
    const shaders = [];
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(type); shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(program); return false; }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program); shaders.forEach(s => gl.deleteShader(s));
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return false; }
    gl.useProgram(program);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    locations = Object.fromEntries(['heightmap','watermap','resolution','mapSize','pointer','trail','time','presence','strength','exposure','still','waterStrength','revealStrength','reach','atmosphere','protection','mobile','quietCount'].map(n => [n, gl.getUniformLocation(program, n)]));
    locations.quietAreas = gl.getUniformLocation(program, 'quietAreas[0]');
    gl.uniform1i(locations.heightmap, 0);
    gl.uniform1i(locations.watermap, 1); water.create();
    return true;
  }
  function upload(image) {
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    mapWidth = image.naturalWidth; mapHeight = image.naturalHeight;
    loaded = true;
  }
  function measure() {
    if (lost) return;
    const rect = surface.getBoundingClientRect(), css = getComputedStyle(hero);
    if (!rect.width || !rect.height) return;
    const setting = name => { const n = parseFloat(css.getPropertyValue(name)); return Number.isFinite(n) ? Math.min(2, Math.max(0, n)) : 1; };
    light = setting('--jardim-luz'); relief = setting('--jardim-relevo'); rhythm = setting('--jardim-ritmo'); waterAmount = setting('--jardim-agua');
    revelation = setting('--jardim-revelacao'); radius = setting('--jardim-alcance'); atmosphereAmount = setting('--jardim-atmosfera');
    contentProtection = Math.min(1, setting('--jardim-protecao'));
    quietAreas.fill(0); quietCount = 0;
    for (const element of hero.querySelectorAll('[data-jardim-resguardar]')) {
      if (quietCount === 4) break;
      const area = element.getBoundingClientRect();
      if (!area.width || !area.height) continue;
      quietAreas.set([(area.left + area.width / 2 - rect.left) / rect.width,
        (area.top + area.height / 2 - rect.top) / rect.height,
        area.width / rect.width / 2, area.height / rect.height / 2], quietCount++ * 4);
    }
    const scale = Math.min(devicePixelRatio || 1, coarse ? 1.2 : 1.5, Math.sqrt((coarse ? 440000 : 1250000) / Math.max(1, rect.width * rect.height)));
    canvas.width = Math.max(1, Math.round(rect.width * scale)); canvas.height = Math.max(1, Math.round(rect.height * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    water.resize(canvas.width / canvas.height);
    const map = rect.width < 701 ? 'mobile' : 'desktop';
    if (map !== activeMap) {
      activeMap = map;
      const version = ++request, image = new Image();
      image.onload = () => { if (version !== request || lost) return; currentImage = image; upload(image); draw(); start(); };
      image.onerror = () => { if (version === request) { loaded = false; stop(); surface.classList.remove('is-ready'); } };
      image.src = `IMG/jardim-altura-${map}.png`;
    }
    draw(); start();
  }
  function draw() {
    if (!loaded || lost) return;
    gl.uniform2f(locations.resolution, canvas.width, canvas.height); gl.uniform2f(locations.mapSize, mapWidth, mapHeight);
    gl.uniform2f(locations.pointer, cursor.x, cursor.y); gl.uniform2f(locations.trail, cursor.trailX, cursor.trailY);
    gl.uniform1f(locations.time, reduced ? 1.5 : elapsed); gl.uniform1f(locations.presence, reduced ? 0 : presence);
    gl.uniform1f(locations.strength, relief); gl.uniform1f(locations.exposure, light);
    gl.uniform1f(locations.still, reduced ? 1 : 0);
    gl.uniform1f(locations.waterStrength, waterAmount);
    gl.uniform1f(locations.revealStrength, revelation); gl.uniform1f(locations.reach, radius);
    gl.uniform1f(locations.atmosphere, atmosphereAmount); gl.uniform1f(locations.protection, contentProtection);
    gl.uniform1f(locations.mobile, coarse ? 1 : 0);
    gl.uniform1i(locations.quietCount, quietCount); gl.uniform4fv(locations.quietAreas, quietAreas);
    gl.drawArrays(gl.TRIANGLES, 0, 6); surface.classList.add('is-ready');
  }
  function render(now) {
    frame = 0;
    if (!visible || document.hidden || reduced || lost || !loaded) return;
    if (previous && now - previous < 1000 / (coarse ? 24 : 30)) { frame = requestAnimationFrame(render); return; }
    const dt = previous ? Math.min((now - previous) / 1000, .09) : 1 / 30; previous = now;
    elapsed += dt * rhythm;
    const ease = 1 - Math.exp(-dt * 4), slow = 1 - Math.exp(-dt * 1.7);
    cursor.x += (cursor.tx - cursor.x) * ease; cursor.y += (cursor.ty - cursor.y) * ease;
    cursor.trailX += (cursor.x - cursor.trailX) * slow; cursor.trailY += (cursor.y - cursor.trailY) * slow;
    presence += (targetPresence - presence) * (targetPresence ? ease : slow);
    water.update(dt); draw(); frame = requestAnimationFrame(render);
  }
  function stop() { cancelAnimationFrame(frame); frame = previous = 0; }
  function start() { if (!frame && loaded && visible && !document.hidden && !reduced && !lost) frame = requestAnimationFrame(render); }
  if (!setup()) return;
  window.addEventListener('pointermove', event => {
    if (!visible || coarse || reduced || lost || !loaded || event.pointerType !== 'mouse') return;
    const rect = surface.getBoundingClientRect();
    if (event.clientY < rect.top || event.clientY > rect.bottom) { targetPresence = 0; water.leave(); return; }
    // A primeira entrada nasce no local real do mouse, sem atravessar a hero desde o canto.
    if (!targetPresence && presence < .015) {
      cursor.x = cursor.trailX = (event.clientX - rect.left) / rect.width;
      cursor.y = cursor.trailY = (event.clientY - rect.top) / rect.height;
    }
    cursor.tx = (event.clientX - rect.left) / rect.width; cursor.ty = (event.clientY - rect.top) / rect.height; targetPresence = 1;
    water.move(cursor.tx, cursor.ty);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { targetPresence = 0; water.leave(); });
  document.addEventListener('visibilitychange', () => { stop(); targetPresence = 0; water.leave(); start(); });
  motion.addEventListener('change', event => { reduced = event.matches; stop(); targetPresence = 0; if (!lost) water.clear(); draw(); start(); });
  touch.addEventListener('change', event => { coarse = event.matches; targetPresence = 0; if (!lost) water.clear(); measure(); });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; stop(); surface.classList.remove('is-ready'); });
  canvas.addEventListener('webglcontextrestored', () => {
    if (!setup()) return; lost = false; loaded = false;
    if (currentImage) upload(currentImage);
    activeMap = ''; measure();
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else { stop(); targetPresence = 0; water.leave(); } }).observe(surface);
  new ResizeObserver(measure).observe(surface);
  // Marque até quatro blocos estáveis com data-jardim-resguardar. Novos conteúdos
  // podem recalcular suas reservas emitindo jardim:atualizar no elemento #inicio.
  const contentObserver = new ResizeObserver(measure);
  function observeContent() {
    contentObserver.disconnect();
    Array.from(hero.querySelectorAll('[data-jardim-resguardar]')).slice(0, 4).forEach(element => contentObserver.observe(element));
  }
  hero.addEventListener('jardim:atualizar', () => { observeContent(); measure(); });
  observeContent();
  document.fonts?.ready.then(measure);
  measure();
})();
