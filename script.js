window.addEventListener('load', function() {
    const canvas1 = document.getElementById('canvas1');
    const canvas2 = document.getElementById('canvas2');
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');

    const successMessage = document.getElementById('successMessage');
    const debugInfo = document.getElementById('debugInfo');

    const helpButton = document.getElementById('helpButton');
    const helpOverlay = document.getElementById('helpOverlay');
    const themeToggle = document.getElementById('themeToggle');
    const collapseButton = document.getElementById('collapseButton');

    const animationToggle = document.getElementById('animationToggle');
    const animationMenu = document.getElementById('animationMenu');

    const randomizeButton = document.getElementById('randomizeButton');
    const resetButton = document.getElementById('resetButton');

    const touchSurface = document.getElementById('canvasContainer');

    // Slider-Elemente + Labels
    const spreadControl = document.getElementById('spread');
    const spreadLabel = document.querySelector('[for="spread"]');

    const sidesControl = document.getElementById('sides');
    const sidesLabel = document.querySelector('[for="sides"]');

    const levelsControl = document.getElementById('levels');
    const levelsLabel = document.querySelector('[for="levels"]');

    const scaleControl = document.getElementById('scale');
    const scaleLabel = document.querySelector('[for="scale"]');

    const lineWidthControl = document.getElementById('lineWidth');
    const lineWidthLabel = document.querySelector('[for="lineWidth"]');

    const lineLengthControl = document.getElementById('lineLength');
    const lineLengthLabel = document.querySelector('[for="lineLength"]');

    const branchingControl = document.getElementById('branching');
    const branchingLabel = document.querySelector('[for="branching"]');

    const hueControl = document.getElementById('hue');
    const hueLabel = document.querySelector('[for="hue"]');

    const nLevelBranchesControl = document.getElementById('nLevelBranches');
    const nLevelBranchesLabel = document.querySelector('[for="nLevelBranches"]');

    const rotationControl = document.getElementById('rotation');
    const rotationLabel = document.querySelector('[for="rotation"]');

    // Slider in Reihenfolge für WASD / Gesten
    const sliderElements = [
        spreadControl,
        sidesControl,
        levelsControl,
        scaleControl,
        lineWidthControl,
        lineLengthControl,
        branchingControl,
        hueControl,
        nLevelBranchesControl,
        rotationControl
    ];
    let currentSliderIndex = 0;

    // Zustände
    let debugVisible = false;
    let slidersCollapsed = false;
    let fractalSize = 0;

    // Effekt-Einstellungen – linke Seite
    let blinkAlpha = 0;
    
    let sides = 5;
    let maxLevel = 3;
    let scale = 0.5;
    let spread = 0.7;
    let branches = 1;
    let color = 'hsl(290, 100%, 50%)';
    let lineWidth = 15;
    let lineLength = 1;
    let nLevelBranches = 2;
    let rotationDeg = 0; // nur für linkes Fraktal

    // Ziel-Fraktal – rechte Seite
    let targetSides = 5;
    let targetMaxLevel = 3;
    let targetScale = 0.5;
    let targetSpread = 0.7;
    let targetBranches = 1;
    let targetColor = 'hsl(290, 100%, 50%)';
    let targetLineWidth = 15;
    let targetLineLength = 1;
    let targetNLevelBranches = 2;
    let gameMode = false;

    // Animation-Status pro Slider
    const animState = {}; // key = sliderId

    // Basis-Delays pro Slider & Speed-Level
    const animDelays = {
        spread:         { 1: 220, 2: 140, 3: 80 },
        sides:          { 1: 260, 2: 170, 3: 90 },
        levels:         { 1: 350, 2: 220, 3: 130 },
        scale:          { 1: 220, 2: 140, 3: 80 },
        lineWidth:      { 1: 230, 2: 150, 3: 90 },
        lineLength:     { 1: 220, 2: 140, 3: 80 },
        branching:      { 1: 260, 2: 170, 3: 100 },
        hue:            { 1: 200, 2: 130, 3: 80 },
        nLevelBranches: { 1: 280, 2: 190, 3: 110 },
        rotation:       { 1: 220, 2: 140, 3: 80 }
    };

    // ==============================
    // Canvas-Größe & Position
    // ==============================
    function resizeCanvases() {
        const isPortrait = window.innerHeight > window.innerWidth;
        let canvasWidth, canvasHeight;

        if (isPortrait) {
            canvasWidth  = window.innerWidth;
            canvasHeight = Math.floor(window.innerHeight / 2);

            canvas1.style.left = '0px';
            canvas1.style.top  = '0px';

            canvas2.style.left = '0px';
            canvas2.style.top  = canvasHeight + 'px';
        } else {
            canvasWidth  = Math.floor(window.innerWidth / 2);
            canvasHeight = window.innerHeight;

            canvas1.style.left = '0px';
            canvas1.style.top  = '0px';

            canvas2.style.left = canvasWidth + 'px';
            canvas2.style.top  = '0px';
        }

        [canvas1, canvas2].forEach(canvas => {
            canvas.width  = canvasWidth;
            canvas.height = canvasHeight;
            canvas.style.width  = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';
        });

        fractalSize = Math.min(canvasWidth, canvasHeight) * 0.3;

        applyCtxSettings();
        updateDebugInfo();
    }

    function applyCtxSettings() {
        [ctx1, ctx2].forEach(ctx => {
            ctx.fillStyle = 'green';
            ctx.lineCap = 'round';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowOffsetX = 10;
            ctx.shadowOffsetY = 5;
            ctx.shadowBlur = 10;
        });
    }

    // ==============================
    // Slider / UI-Logik
    // ==============================
    function sliderChange() {
        updateSliders();
        drawFractal();
        checkMatch();
    }

    spreadControl.addEventListener('change', e => {
        spread = parseFloat(e.target.value);
        sliderChange();
    });

    sidesControl.addEventListener('change', e => {
        sides = parseInt(e.target.value);
        sliderChange();
    });

    levelsControl.addEventListener('change', e => {
        maxLevel = parseInt(e.target.value);
        sliderChange();
    });

    scaleControl.addEventListener('change', e => {
        scale = parseFloat(e.target.value);
        sliderChange();
    });

    lineWidthControl.addEventListener('change', e => {
        lineWidth = parseInt(e.target.value);
        sliderChange();
    });

    lineLengthControl.addEventListener('change', e => {
        lineLength = parseFloat(e.target.value);
        sliderChange();
    });

    branchingControl.addEventListener('change', e => {
        branches = parseInt(e.target.value);
        sliderChange();
    });

    hueControl.addEventListener('change', e => {
        const hue = parseInt(e.target.value);
        color = 'hsl(' + hue + ', 100%, 50%)';
        sliderChange();
    });

    nLevelBranchesControl.addEventListener('change', e => {
        nLevelBranches = parseInt(e.target.value);
        sliderChange();
    });

    // Rotation: NICHT im CheckMatch und NICHT im Ziel
    rotationControl.addEventListener('change', e => {
        rotationDeg = parseFloat(e.target.value);
        updateSliders();
        drawFractal(); // kein checkMatch()
    });

    sliderElements.forEach((slider, index) => {
        slider.addEventListener('focus', () => {
            currentSliderIndex = index;
        });
    });

    function focusSlider(index) {
        if (!sliderElements.length) return;
        currentSliderIndex = (index + sliderElements.length) % sliderElements.length;
        const slider = sliderElements[currentSliderIndex];
        if (slider) slider.focus();
    }

    function nudgeCurrentSlider(direction) {
        const slider = sliderElements[currentSliderIndex];
        if (!slider) return;
        nudgeSlider(slider, direction);
    }

    function nudgeSlider(slider, direction) {
        const step = parseFloat(slider.step) || 1;
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        let value = parseFloat(slider.value);

        value += direction * step;
        value = Math.max(min, Math.min(max, value));
        value = Math.round(value / step) * step;

        slider.value = value;
        slider.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function updateSliders() {
        spreadControl.value = spread;
        spreadLabel.innerText = 'Streuung: ' + Number(spread.toFixed(1));

        sidesControl.value = sides;
        sidesLabel.innerText = 'Seiten: ' + sides;

        levelsControl.value = maxLevel;
        levelsLabel.innerText = 'Tiefe: ' + maxLevel;

        scaleControl.value = scale;
        scaleLabel.innerText = 'Skalierung: ' + Number(scale.toFixed(2));

        lineWidthControl.value = lineWidth;
        lineWidthLabel.innerText = 'Linienbreite: ' + lineWidth;

        lineLengthControl.value = lineLength;
        lineLengthLabel.innerText = 'Länge: ' + Number(lineLength.toFixed(1));

        branchingControl.value = branches;
        branchingLabel.innerText = 'Äste: ' + branches;

        const hue = parseInt(color.slice(4, color.indexOf(',')));
        hueControl.value = hue;
        hueLabel.innerText = 'Farbton: ' + hue;

        nLevelBranchesControl.value = nLevelBranches;
        nLevelBranchesLabel.innerText = 'Verzweigung: ' + nLevelBranches;

        rotationControl.value = rotationDeg;
        rotationLabel.innerText = 'Rotation: ' + rotationDeg.toFixed(0) + '°';
    }

    // ==============================
    // Collapse-Funktion (E + Button)
    // ==============================
    function setSlidersCollapsed(state) {
        slidersCollapsed = state;
        document.body.classList.toggle('sliders-collapsed', slidersCollapsed);
        if (collapseButton) {
            collapseButton.textContent = slidersCollapsed ? '▾' : '▴';
        }
    }

    // ==============================
    // Tastatur-Shortcuts
    // ==============================
    window.addEventListener('keydown', function(e) {
        const key = e.key.toLowerCase();

        // R: Randomisieren
        if (key === 'r') {
            if (!randomizeButton.disabled) {
                e.preventDefault();
                randomizeButton.click();
            }
            return;
        }

        // Q: Reset
        if (key === 'q') {
            e.preventDefault();
            resetButton.click();
            return;
        }

        // H: Debug ein/aus
        if (key === 'h') {
            e.preventDefault();
            debugVisible = !debugVisible;
            if (debugInfo) {
                debugInfo.style.display = debugVisible ? 'block' : 'none';
            }
            return;
        }

        // E: Slider ein-/ausklappen
        if (key === 'e') {
            e.preventDefault();
            setSlidersCollapsed(!slidersCollapsed);
            return;
        }

        // WASD für Slider
        if (!['w', 'a', 's', 'd'].includes(key)) return;
        e.preventDefault();
        if (!sliderElements.length) return;

        if (key === 'w') {
            focusSlider(currentSliderIndex - 1);
        } else if (key === 's') {
            focusSlider(currentSliderIndex + 1);
        } else if (key === 'a') {
            nudgeCurrentSlider(-1);
        } else if (key === 'd') {
            nudgeCurrentSlider(1);
        }
    });

    // ==============================
    // Help-Overlay & Theme
    // ==============================
    if (helpButton && helpOverlay) {
        helpButton.addEventListener('click', () => {
            const visible = helpOverlay.style.display === 'block';
            helpOverlay.style.display = visible ? 'none' : 'block';
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-mode');
            themeToggle.textContent = isLight ? '☀' : '☾';
        });
        themeToggle.textContent = document.body.classList.contains('light-mode') ? '☀' : '☾';
    }

    if (collapseButton) {
        collapseButton.addEventListener('click', () => {
            setSlidersCollapsed(!slidersCollapsed);
        });
    }

    // ==============================
    // Animation-Menü
    // ==============================
    if (animationToggle && animationMenu) {
        animationToggle.addEventListener('click', () => {
            const visible = animationMenu.style.display === 'block';
            animationMenu.style.display = visible ? 'none' : 'block';
        });

        const rows = animationMenu.querySelectorAll('.anim-row');
        rows.forEach(row => {
            const sliderId = row.dataset.sliderId;
            const enable = row.querySelector('.anim-enable');
            const speed = row.querySelector('.anim-speed');
            const speedLabel = row.querySelector('.anim-speed-label');
            const slider = document.getElementById(sliderId);

            if (!slider) return;

            animState[sliderId] = {
                sliderId,
                slider,
                enable,
                speed,
                speedLabel,
                direction: 1,
                timerId: null
            };

            speed.addEventListener('input', () => {
                speedLabel.textContent = speedLevelToText(speed.value);
            });

            enable.addEventListener('change', () => {
                if (enable.checked) {
                    startSliderAnimation(sliderId);
                } else {
                    stopSliderAnimation(sliderId);
                }
            });
        });
    }

    function speedLevelToText(level) {
        if (Number(level) === 1) return 'Langsam';
        if (Number(level) === 2) return 'Mittel';
        return 'Schnell';
    }

    function getDelayFor(sliderId, speedLevel) {
        const cfg = animDelays[sliderId] || { 1: 250, 2: 170, 3: 100 };
        return cfg[speedLevel] || cfg[1];
    }

    function startSliderAnimation(sliderId) {
        const st = animState[sliderId];
        if (!st) return;

        if (st.timerId !== null) {
            clearTimeout(st.timerId);
            st.timerId = null;
        }

        const stepFn = () => {
            if (!st.enable.checked) {
                st.timerId = null;
                return;
            }
            const slider = st.slider;
            const step = parseFloat(slider.step) || 1;
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            let value = parseFloat(slider.value);

            value += st.direction * step;

            if (value > max) {
                value = max;
                st.direction = -1;
            } else if (value < min) {
                value = min;
                st.direction = 1;
            }

            slider.value = value;
            slider.dispatchEvent(new Event('change', { bubbles: true }));

            const speedLevel = Number(st.speed.value || 1);
            const delay = getDelayFor(sliderId, speedLevel);
            st.timerId = setTimeout(stepFn, delay);
        };

        stepFn();
    }

    function stopSliderAnimation(sliderId) {
        const st = animState[sliderId];
        if (!st) return;
        if (st.timerId !== null) {
            clearTimeout(st.timerId);
            st.timerId = null;
        }
    }

    function showInitialHelp() {
        if (!helpOverlay) return;
        helpOverlay.style.display = 'block';
        setTimeout(() => {
            if (helpOverlay.style.display === 'block') {
                helpOverlay.style.display = 'none';
            }
        }, 6000);
    }

    // ==============================
    // Touch-Gesten (Swipe + Tap)
    // ==============================
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let tapCount = 0;
    let tapTimeout = null;

    if (touchSurface) {
        touchSurface.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) return; // nur Single-Touch
            const t = e.touches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        touchSurface.addEventListener('touchend', function(e) {
            if (e.changedTouches.length === 0) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            const dt = Date.now() - touchStartTime;

            const distance = Math.hypot(dx, dy);
            const SWIPE_THRESHOLD = 30;
            const TAP_MAX_DIST = 10;
            const TAP_MAX_TIME = 250;

            // Tap / Double / Triple Tap
            if (distance < TAP_MAX_DIST && dt < TAP_MAX_TIME) {
                tapCount++;
                if (tapTimeout) clearTimeout(tapTimeout);
                tapTimeout = setTimeout(() => {
                    if (tapCount === 2) {
                        // Doppeltipp: Reset
                        resetButton.click();
                    } else if (tapCount >= 3) {
                        // Dreifachtipp: Randomisieren
                        if (!randomizeButton.disabled) randomizeButton.click();
                    }
                    tapCount = 0;
                    tapTimeout = null;
                }, 300);
                return;
            }

            // Swipe
            if (distance >= SWIPE_THRESHOLD && dt < 500) {
                const absX = Math.abs(dx);
                const absY = Math.abs(dy);

                if (absX > absY) {
                    // horizontal: A / D
                    if (dx > 0) {
                        nudgeCurrentSlider(1);   // wie D
                    } else {
                        nudgeCurrentSlider(-1);  // wie A
                    }
                } else {
                    // vertikal: W / S
                    if (dy > 0) {
                        focusSlider(currentSliderIndex + 1);   // wie S
                    } else {
                        focusSlider(currentSliderIndex - 1);   // wie W
                    }
                }
            }
        }, { passive: true });
    }

    // ==============================
    // Fraktal-Zeichnen
    // ==============================
    function drawBranch(level, ctx, cfg) {
        if (level > cfg.maxLevel) return;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(cfg.size * cfg.lineLength, 0);
        ctx.stroke();

        for (let i = 0; i < cfg.branches; i++) {
            ctx.save();
            ctx.translate(cfg.size - (cfg.size / cfg.branches) * i, 0);
            ctx.scale(cfg.scale, cfg.scale);

            if (cfg.nLevelBranches === 1) {
                ctx.save();
                ctx.rotate(cfg.spread);
                drawBranch(level + 1, ctx, cfg);
                ctx.restore();
            } else if (cfg.nLevelBranches === 2) {
                ctx.save();
                ctx.rotate(cfg.spread);
                drawBranch(level + 1, ctx, cfg);
                ctx.restore();

                ctx.save();
                ctx.rotate(-cfg.spread);
                drawBranch(level + 1, ctx, cfg);
                ctx.restore();
            }

            ctx.restore();
        }
    }

    function drawFractal() {
        ctx1.clearRect(0, 0, canvas1.width, canvas1.height);

        if (blinkAlpha > 0) {
            ctx1.save();
            ctx1.globalAlpha = blinkAlpha;
            ctx1.fillStyle = '#90ff90';
            ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
            ctx1.restore();
        }

        const cfg = {
            size:           fractalSize,
            scale:          scale,
            lineLength:     lineLength,
            nLevelBranches: nLevelBranches,
            branches:       branches,
            spread:         spread,
            maxLevel:       maxLevel
        };

        ctx1.save();
        ctx1.lineWidth = lineWidth;
        ctx1.strokeStyle = color;
        ctx1.translate(canvas1.width / 2, canvas1.height / 2);
        ctx1.rotate(rotationDeg * Math.PI / 180); // Rotation nur links
        for (let i = 0; i < sides; i++) {
            ctx1.rotate((Math.PI * 2) / sides);
            drawBranch(0, ctx1, cfg);
        }
        ctx1.restore();

        randomizeButton.style.backgroundColor = color;
    }

    function drawTarget() {
        const cfg = {
            size:           fractalSize,
            scale:          targetScale,
            lineLength:     targetLineLength,
            nLevelBranches: targetNLevelBranches,
            branches:       targetBranches,
            spread:         targetSpread,
            maxLevel:       targetMaxLevel
        };

        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        ctx2.save();
        ctx2.lineWidth = targetLineWidth;
        ctx2.strokeStyle = targetColor;
        ctx2.translate(canvas2.width / 2, canvas2.height / 2);
        for (let i = 0; i < targetSides; i++) {
            ctx2.rotate((Math.PI * 2) / targetSides);
            drawBranch(0, ctx2, cfg);
        }
        ctx2.restore();

        updateDebugInfo();
    }

    // ==============================
    // Debug-Infos
    // ==============================
    function updateDebugInfo() {
        const debugContent = document.getElementById('debugContent');
        if (!debugContent) return;

        debugContent.innerHTML = `
            Canvas1: ${canvas1.width} × ${canvas1.height}<br>
            Canvas2: ${canvas2.width} × ${canvas2.height}<br><br>
            Seiten: ${targetSides}<br>
            Tiefe: ${targetMaxLevel}<br>
            Skalierung: ${targetScale.toFixed(1)}<br>
            Streuung: ${targetSpread.toFixed(1)}<br>
            Äste: ${targetBranches}<br>
            Linienbreite: ${targetLineWidth}<br>
            Länge: ${targetLineLength.toFixed(1)}<br>
            Verzweigung: ${targetNLevelBranches}
        `;
    }

    // ==============================
    // Match-Check & Blink-Effekt
    // ==============================
    function checkMatch() {
        if (!gameMode) return;

        let spreadMatch;
        if (nLevelBranches === 2 && targetNLevelBranches === 2) {
            spreadMatch = Math.abs(spread) === Math.abs(targetSpread);
        } else {
            spreadMatch = spread === targetSpread;
        }

        const currentHue = parseInt(color.slice(4, color.indexOf(',')));
        const targetHue = parseInt(targetColor.slice(4, targetColor.indexOf(',')));

        const match =
            sides === targetSides &&
            maxLevel === targetMaxLevel &&
            scale === targetScale &&
            spreadMatch &&
            branches === targetBranches &&
            lineWidth === targetLineWidth &&
            lineLength === targetLineLength &&
            nLevelBranches === targetNLevelBranches &&
            currentHue === targetHue;

        if (match) {
            blinkCanvasSuccess();
            if (successMessage) {
                successMessage.style.display = 'block';
            }
            randomizeButton.disabled = false;
            setTimeout(() => {
                if (successMessage) successMessage.style.display = 'none';
            }, 2000);
        }
    }

    function blinkCanvasSuccess() {
        blinkAlpha = 0.7;
        const duration = 500;
        const start = performance.now();

        function animate(now) {
            const elapsed = now - start;
            blinkAlpha = Math.max(0, 0.7 * (1 - elapsed / duration));
            drawFractal();
            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                blinkAlpha = 0;
                drawFractal();
            }
        }
        requestAnimationFrame(animate);
    }

    // ==============================
    // Randomisieren & Reset
    // ==============================
    function randomizeFractal() {
        targetSpread = Number((Math.random() * 6.4 - 3.2).toFixed(1));
        targetSides = Math.floor(Math.random() * 14) + 2;
        targetMaxLevel = Math.floor(Math.random() * 4) + 1;
        targetScale = Number((Math.random() * 0.8 + 0.1).toFixed(1));
        targetLineWidth = (Math.floor(Math.random() * 6) + 1) * 5;
        targetLineLength = Number((0.3 + Math.floor(Math.random() * 8) * 0.1).toFixed(1));
        targetBranches = Math.floor(Math.random() * 3) + 1;
        const targetHue = Math.floor(Math.random() * 12) * 30;
        targetNLevelBranches = Math.floor(Math.random() * 2) + 1;
        targetColor = 'hsl(' + targetHue + ', 100%, 50%)';

        gameMode = true;
        randomizeButton.disabled = true;
        drawTarget();

        focusSlider(0);
    }

    randomizeButton.addEventListener('click', randomizeFractal);

    function resetFractal() {
        sides = 5;
        maxLevel = 3;
        scale = 0.5;
        spread = 0.7;
        branches = 1;
        color = 'hsl(290, 100%, 50%)';
        lineWidth = 15;
        lineLength = 1;
        nLevelBranches = 2;
        rotationDeg = 0;

        gameMode = false;
        randomizeButton.disabled = false;
        if (successMessage) successMessage.style.display = 'none';
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

        updateSliders();
        drawFractal();
        updateDebugInfo();
    }

    resetButton.addEventListener('click', function() {
        resetFractal();
        randomizeButton.focus();
    });

    // ==============================
    // Initialisierung
    // ==============================
    updateSliders();
    setSlidersCollapsed(false);

    setTimeout(() => {
        resizeCanvases();
        drawFractal();
        updateDebugInfo();
        randomizeButton.focus();
        showInitialHelp();
    }, 100);

    window.addEventListener('resize', function() {
        resizeCanvases();
        drawFractal();
        if (gameMode) drawTarget();
    });

    drawFractal();
});
