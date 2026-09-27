// ============================================
// ANIMAÇÃO CÉU ESTRELADO (decorativa, só na tela de login)
// ============================================
export function iniciarCeuEstrelado() {
    const canvas = document.getElementById('canvas-estrelas');
    const ctx = canvas.getContext('2d');

    let W, H;
    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const NUM_FIXAS = 220;
    const estrelasFix = Array.from({ length: NUM_FIXAS }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        alpha: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
    }));

    const NUM_CADENTES = 6;
    function novaCadente() {
        const angle = (Math.random() * 20 + 15) * Math.PI / 180;
        const speed = Math.random() * 7 + 5;
        return {
            x: Math.random() * W,
            y: Math.random() * H * 0.5,
            len: Math.random() * 180 + 80,
            speed,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 0,
            fadeIn: true,
            trail: [],
            maxTrail: Math.floor(Math.random() * 18 + 12),
            delay: Math.random() * 180,
            active: false,
        };
    }

    let cadentes = Array.from({ length: NUM_CADENTES }, novaCadente);

    function drawFixas() {
        estrelasFix.forEach(s => {
            s.alpha += s.twinkleSpeed * s.twinkleDir;
            if (s.alpha >= 0.9 || s.alpha <= 0.1) s.twinkleDir *= -1;
            ctx.beginPath();
            ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
            ctx.fill();
        });
    }

    function drawCadentes() {
        cadentes.forEach((c, i) => {
            if (c.delay > 0) { c.delay--; return; }
            c.active = true;
            c.trail.unshift({ x: c.x, y: c.y });
            if (c.trail.length > c.maxTrail) c.trail.pop();
            if (c.fadeIn) {
                c.alpha = Math.min(c.alpha + 0.06, 1);
                if (c.alpha >= 1) c.fadeIn = false;
            }
            c.trail.forEach((pt, idx) => {
                const ratio = 1 - idx / c.trail.length;
                const a = c.alpha * ratio * ratio;
                const r = 1.5 * ratio;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${Math.round(200 + 55*ratio)},${Math.round(220 + 35*ratio)},255,${a})`;
                ctx.fill();
            });
            const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 6);
            grad.addColorStop(0, `rgba(255,255,255,${c.alpha})`);
            grad.addColorStop(1, 'rgba(100,180,255,0)');
            ctx.beginPath();
            ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            c.x += c.vx;
            c.y += c.vy;
            if (c.x > W + 50 || c.y > H + 50) {
                cadentes[i] = novaCadente();
                cadentes[i].delay = Math.random() * 120 + 30;
            }
        });
    }

    function loop() {
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#020b1a');
        bg.addColorStop(0.5, '#061630');
        bg.addColorStop(1, '#0a1f45');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        drawFixas();
        drawCadentes();
        requestAnimationFrame(loop);
    }
    loop();
}
