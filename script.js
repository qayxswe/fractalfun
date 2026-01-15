window.addEventListener('load', () => {

  /* ======================================================
     DOM
  ====================================================== */
  const body = document.body;

  const canvas1 = document.getElementById('canvas1');
  const canvas2 = document.getElementById('canvas2');
  const ctx1 = canvas1.getContext('2d');
  const ctx2 = canvas2.getContext('2d');

  const collapseHandle = document.getElementById('collapseHandle');
  const themeToggle = document.getElementById('themeToggle');
  const helpButton = document.getElementById('helpButton');
  const helpOverlay = document.getElementById('helpOverlay');
  const helpClose = document.getElementById('helpClose');

  const debugInfo = document.getElementById('debugInfo');
  const debugContent = document.getElementById('debugContent');
  const debugClose = document.getElementById('debugClose');

  const randomizeButton = document.getElementById('randomizeButton');
  const resetButton = document.getElementById('resetButton');

  const successMessage = document.getElementById('successMessage');
  const screenFlash = document.getElementById('screenFlash');

  const sliders = {
    spread: document.getElementById('spread'),
    sides: document.getElementById('sides'),
    levels: document.getElementById('levels'),
    scale: document.getElementById('scale'),
    lineWidth: document.getElementById('lineWidth'),
    lineLength: document.getElementById('lineLength'),
    branching: document.getElementById('branching'),
    nLevelBranches: document.getElementById('nLevelBranches'),
    hue: document.getElementById('hue'),
    rotation: document.getElementById('rotation')
  };

  const values = {
    spread: document.getElementById('spreadValue'),
    sides: document.getElementById('sidesValue'),
    levels: document.getElementById('levelsValue'),
    scale: document.getElementById('scaleValue'),
    lineWidth: document.getElementById('lineWidthValue'),
    lineLength: document.getElementById('lineLengthValue'),
    branching: document.getElementById('branchingValue'),
    nLevelBranches: document.getElementById('nLevelBranchesValue'),
    hue: document.getElementById('hueValue'),
    rotation: document.getElementById('rotationValue')
  };

  const sliderOrder = Object.values(sliders);
  let currentSliderIndex = 0;

  const difficultySlider = document.getElementById('difficulty');
  const difficultyLabel = document.getElementById('difficultyLabel');

  /* ======================================================
     PLAYER STATE
  ====================================================== */
  const PLAYER_DEFAULTS = {
    spread: 0.7,
    sides: 5,
    levels: 3,
    scale: 0.5,
    lineWidth: 15,
    lineLength: 1,
    branching: 1,
    nLevelBranches: 2,
    hue: 290,
    rotation: 0
  };

  let state = { ...PLAYER_DEFAULTS };
  let target = null;
  let gameMode = false;
  let debugVisible = false;

  /* ======================================================
     CANVAS
  ====================================================== */
  function resizeCanvases() {
    const portrait = window.innerHeight > window.innerWidth;
    if (portrait) {
      canvas1.width = window.innerWidth;
      canvas1.height = window.innerHeight / 2;
      canvas2.width = window.innerWidth;
      canvas2.height = window.innerHeight / 2;
      canvas2.style.top = canvas1.height + 'px';
      canvas2.style.left = '0';
    } else {
      canvas1.width = window.innerWidth / 2;
      canvas1.height = window.innerHeight;
      canvas2.width = window.innerWidth / 2;
      canvas2.height = window.innerHeight;
      canvas2.style.left = canvas1.width + 'px';
      canvas2.style.top = '0';
    }
    updateSidebarArrow();
  }

  function applyCtx(ctx) {
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
  }

  /* ======================================================
     FRACTAL
  ====================================================== */
  function drawBranch(ctx, cfg, level) {
    if (level > cfg.levels) return;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cfg.size * cfg.lineLength, 0);
    ctx.stroke();

    for (let i = 0; i < cfg.branching; i++) {
      ctx.save();
      ctx.translate(cfg.size - (cfg.size / cfg.branching) * i, 0);
      ctx.scale(cfg.scale, cfg.scale);

      ctx.save();
      ctx.rotate(cfg.spread);
      drawBranch(ctx, cfg, level + 1);
      ctx.restore();

      if (cfg.nLevelBranches === 2) {
        ctx.save();
        ctx.rotate(-cfg.spread);
        drawBranch(ctx, cfg, level + 1);
        ctx.restore();
      }

      ctx.restore();
    }
  }

  function drawFractal(ctx, cfg, rotation = 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    applyCtx(ctx);

    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.rotate(rotation);

    ctx.lineWidth = cfg.lineWidth;
    ctx.strokeStyle = cfg.color;

    for (let i = 0; i < cfg.sides; i++) {
      ctx.rotate((Math.PI * 2) / cfg.sides);
      drawBranch(ctx, cfg, 0);
    }

    ctx.restore();
  }

  function drawPlayer() {
    const size = Math.min(canvas1.width, canvas1.height) * 0.22;
    drawFractal(ctx1, { ...state, size, color: `hsl(${state.hue},100%,50%)` }, state.rotation * Math.PI / 180);
  }

  function drawTarget() {
    if (!target) return;
    const size = Math.min(canvas2.width, canvas2.height) * 0.22;

    const rounded = {};
    Object.keys(target).forEach(k => {
      if (['sides','levels','branching','nLevelBranches','lineWidth','hue'].includes(k)) rounded[k] = Math.round(target[k]);
      else if (['scale','spread','lineLength','rotation'].includes(k)) rounded[k] = Math.round(target[k]*10)/10;
      else rounded[k] = target[k];
    });

    drawFractal(ctx2, { ...rounded, size, color: `hsl(${rounded.hue},100%,50%)` });
  }

  /* ======================================================
     UTILS
  ====================================================== */
  function rand(min,max,step=1){return Math.round((min+Math.random()*(max-min))/step)*step;}
  function chance(p){return Math.random()<p;}

  /* ======================================================
     TARGET GENERATION
  ====================================================== */
  function generateTargetByDifficulty(level) {
    const cfg = [ 
      {sides:[1,3],levels:[1,2],branching:[1,1],n:0}, 
      {sides:[5,8],levels:[2,3],branching:[1,2],n:0.2}, 
      {sides:[7,10],levels:[2,3],branching:[1,2],n:0.5}, 
      {sides:[8,12],levels:[3,4],branching:[2,3],n:0.8},
      {sides:[10,15],levels:[3,4],branching:[2,3],n:1}
    ][level];

    target = {
      sides: rand(...cfg.sides),
      levels: rand(...cfg.levels),
      branching: rand(...cfg.branching),
      nLevelBranches: chance(cfg.n) ? 2 : 1,
      scale: Math.round(rand(0.35,0.6,0.05)*10)/10,
      spread: Math.round(rand(0.6,3.2,0.1)*10)/10,
      lineWidth: rand(10,25,5),
      lineLength: Math.round(rand(0.6,1,0.1)*10)/10,
      hue: Math.floor(Math.random()*11)*30,
      rotation: 0
    };

    // Difficulty > 2: Rotation randomisieren
    if(level >= 3) {
      target.rotation = Math.round(Math.random() * 360);
    }

    // Difficulty 4: noch schwieriger; leicht andere lineLength und scale, schwerer zu matchen
    if(level === 4) {
      target.lineLength = Math.round(rand(0.4,1,0.1)*10)/10;
      target.scale = Math.round(rand(0.35,0.6,0.05)*10)/10;
    }

    target.color = `hsl(${target.hue},100%,50%)`;

    drawTarget();
    updateDebug();
  }

  /* ======================================================
     UPDATE VALUES & DEBUG
  ====================================================== */
  function updateValues() {
    Object.keys(values).forEach(k => {
      values[k].textContent =
        k === 'scale' ? state[k].toFixed(2) :
        k === 'spread' ? state[k].toFixed(1) :
        k === 'rotation' ? state[k] + '°' :
        state[k];
    });
  }

  function updateDebug() {
    if (!debugVisible) return;
    debugContent.innerHTML = Object.entries(target || {}).map(([k,v])=>`${k}: ${v}`).join('<br>');
  }

  /* ======================================================
     MATCH CHECK
  ====================================================== */
  function checkMatch() {
    if (!gameMode || !target) return;
    const keys=['spread','sides','levels','scale','lineWidth','lineLength','branching','nLevelBranches','hue'];
    if(keys.every(k=>state[k]===target[k])){
      screenFlash.classList.add('active');
      successMessage.style.display='block';
      setTimeout(()=>{screenFlash.classList.remove('active'); successMessage.style.display='none';},500);
      gameMode=false;
      randomizeButton.disabled=false;
    }
  }

  /* ======================================================
     SIDEBAR TOGGLE
  ====================================================== */
  function updateSidebarArrow() {
    const portrait = window.innerHeight > window.innerWidth;
    if(body.classList.contains('sliders-collapsed')){
      collapseHandle.textContent = portrait ? '▲' : '▶';
    } else {
      collapseHandle.textContent = portrait ? '▼' : '◀';
    }
  }

  function toggleSidebar(){
    body.classList.toggle('sliders-collapsed');
    updateSidebarArrow();
  }

  collapseHandle.onclick = toggleSidebar;

  /* ======================================================
     THEME TOGGLE
  ====================================================== */
  themeToggle.onclick = () => {
    if(body.classList.contains('dark-mode')){
      body.classList.replace('dark-mode','light-mode');
      themeToggle.textContent='☀';
    } else {
      body.classList.replace('light-mode','dark-mode');
      themeToggle.textContent='☾';
    }
  };

  /* ======================================================
     HELP & DEBUG
  ====================================================== */
  helpButton.onclick = () => helpOverlay.style.display='flex';
  helpClose.onclick = () => helpOverlay.style.display='none';

  debugClose.onclick = () => { debugVisible=false; debugInfo.style.display='none'; };

  /* ======================================================
     SLIDERS
  ====================================================== */
  sliderOrder.forEach((s,i)=>{
    s.addEventListener('input',()=>{
      state[s.id]=Number(s.value); updateValues(); drawPlayer(); checkMatch();
    });
    s.addEventListener('focus',()=>currentSliderIndex=i);
  });

  /* ======================================================
     BUTTONS
  ====================================================== */
  randomizeButton.onclick = ()=>{ generateTargetByDifficulty(+difficultySlider.value); gameMode=true; randomizeButton.disabled=true; };
  resetButton.onclick = ()=>{ state={...PLAYER_DEFAULTS}; Object.keys(sliders).forEach(k=>sliders[k].value=state[k]); updateValues(); drawPlayer(); ctx2.clearRect(0,0,canvas2.width,canvas2.height); gameMode=false; randomizeButton.disabled=false; };

  difficultySlider.oninput = ()=>{ difficultyLabel.textContent=difficultySlider.value; };

  /* ======================================================
     KEYBOARD
  ====================================================== */

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();

    // -----------------------
    // Debug anzeigen/verstecken
    // -----------------------
    if (k === 'h') {
      debugVisible = !debugVisible;
      debugInfo.style.display = debugVisible ? 'block' : 'none';
      updateDebug();
    }

    // -----------------------
    // Sidebar ein-/ausklappen
    // -----------------------
    if (k === 'e') toggleSidebar();

    // -----------------------
    // Reset / Neues Ziel
    // -----------------------
    if (k === 'q') resetButton.click();
    if (k === 'r' && !randomizeButton.disabled) randomizeButton.click();

    // -----------------------
    // Difficulty mit 0-4 einstellen
    // -----------------------
    if (['0','1','2','3','4'].includes(e.key)) {
      difficultySlider.value = e.key;
      difficultyLabel.textContent = e.key;
    }

    // -----------------------
    // Slider mit W/A/S/D steuern
    // -----------------------
    if (['w','a','s','d'].includes(k)) {
      e.preventDefault();
      if (k === 'w') currentSliderIndex = (currentSliderIndex - 1 + sliderOrder.length) % sliderOrder.length;
      if (k === 's') currentSliderIndex = (currentSliderIndex + 1) % sliderOrder.length;
      if (k === 'a') sliderOrder[currentSliderIndex].stepDown();
      if (k === 'd') sliderOrder[currentSliderIndex].stepUp();
      sliderOrder[currentSliderIndex].dispatchEvent(new Event('input'));
      sliderOrder[currentSliderIndex].focus();
    }
  });

  /* ======================================================
     INIT
  ====================================================== */
  resizeCanvases();
  updateValues();
  drawPlayer();
  themeToggle.textContent = body.classList.contains('light-mode') ? '☀' : '☾';

  window.addEventListener('resize', () => { resizeCanvases(); drawPlayer(); drawTarget(); });

});
