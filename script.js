document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const themeToggle = document.getElementById('themeToggle');
    const slideNumDisp = document.getElementById('slideNum');
    
    let currentSlide = 0;
    
    // --- WASD Demo State ---
    let activeIdx = 0; 
    const demoValues = [40, 20, 80];

    // --- Core Functions ---
    const updateSlides = () => {
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });
        // Seitenzahl update
        if(slideNumDisp) slideNumDisp.textContent = currentSlide + 1;
        
        // Buttons
        prevBtn.style.visibility = (currentSlide === 0) ? "hidden" : "visible";
        nextBtn.style.visibility = (currentSlide === slides.length - 1) ? "hidden" : "visible";
    };

    const toggleTheme = () => {
        const root = document.documentElement;
        const isDark = root.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        root.setAttribute('data-theme', newTheme);
        themeToggle.textContent = isDark ? '☾' : '☀';
    };

    // --- Demos ---

    // Rotation Logic (Slide 7 & 8)
    const setupRotateDemo = (btnId, frameId, codeRowId, codeColId) => {
        const btn = document.getElementById(btnId);
        const frame = document.getElementById(frameId);
        const rowCode = document.getElementById(codeRowId);
        const colCode = document.getElementById(codeColId);

        if(btn && frame) {
            btn.addEventListener('click', () => {
                frame.classList.toggle('portrait');
                const isPortrait = frame.classList.contains('portrait');
                
                // Code Highlight switch
                if(rowCode && colCode) {
                    if(isPortrait) {
                        rowCode.classList.remove('highlight-line');
                        colCode.classList.add('highlight-line');
                    } else {
                        rowCode.classList.add('highlight-line');
                        colCode.classList.remove('highlight-line');
                    }
                }
            });
        }
    };

    setupRotateDemo('btnRotate7', 'phoneFrame7', 'code-row', 'code-col');
    setupRotateDemo('btnRotate8', 'phoneFrame8', 'js-code-row', 'js-code-stack');

    // Slide 9 WASD UI Updater
    const updateWASDUI = () => {
        for (let i = 0; i < 3; i++) {
            const box = document.getElementById(`box-${i}`);
            const fill = document.getElementById(`fill-${i}`);
            const val = document.getElementById(`val-${i}`);
            
            if (box && fill && val) {
                if (i === activeIdx) box.classList.add('active-box');
                else box.classList.remove('active-box');
                
                fill.style.width = demoValues[i] + '%';
                val.textContent = Math.round(demoValues[i] / 10);
            }
        }
    };

    // --- Events ---
    nextBtn.addEventListener('click', () => { if(currentSlide < slides.length - 1) { currentSlide++; updateSlides(); }});
    prevBtn.addEventListener('click', () => { if(currentSlide > 0) { currentSlide--; updateSlides(); }});
    themeToggle.addEventListener('click', toggleTheme);

    // Slide 4 Range
    const rangeInput = document.getElementById('demoSlider');
    const rangeOutput = document.getElementById('demoSliderValue');
    if (rangeInput) rangeInput.addEventListener('input', (e) => rangeOutput.textContent = e.target.value);

    // Keyboard Control
    document.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();

        if (e.key === 'Enter') { toggleTheme(); return; }

        if (k === 'arrowright' || k === ' ') {
            if (k === ' ') e.preventDefault();
            if (currentSlide < slides.length - 1) { currentSlide++; updateSlides(); }
        } else if (k === 'arrowleft' || k === 'backspace') {
            if (k === 'backspace') e.preventDefault();
            if (currentSlide > 0) { currentSlide--; updateSlides(); }
        }

        // WASD Demo Interaction
        if (slides[currentSlide].dataset.title === 'JS: Input System') {
            const keyEl = document.getElementById(`key-${k}`);
            if (keyEl) keyEl.classList.add('active');
            
            const codeEl = document.getElementById(`code-${k}`);
            if (codeEl) codeEl.classList.add('highlight-line');

            if (k === 'w') activeIdx = (activeIdx - 1 + 3) % 3;
            if (k === 's') activeIdx = (activeIdx + 1) % 3;
            
            // Werte ändern
            if (k === 'a') demoValues[activeIdx] = Math.max(0, demoValues[activeIdx] - 10);
            if (k === 'd') demoValues[activeIdx] = Math.min(100, demoValues[activeIdx] + 10);
            
            updateWASDUI();
        }
    });

    document.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        const keyEl = document.getElementById(`key-${k}`);
        if (keyEl) keyEl.classList.remove('active');
        const codeEl = document.getElementById(`code-${k}`);
        if (codeEl) codeEl.classList.remove('highlight-line');
    });

    // Init
    updateSlides();
    updateWASDUI();
});
