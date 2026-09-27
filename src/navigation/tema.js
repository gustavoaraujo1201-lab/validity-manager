// ============================================
// TEMA — Claro / Escuro
// ============================================

export function aplicarTema(tema) {
    const icone = document.getElementById('tema-icone-topo');
    if (tema === 'claro') {
        document.documentElement.classList.add('tema-claro');
        if (icone) icone.textContent = '🌙';
    } else {
        document.documentElement.classList.remove('tema-claro');
        if (icone) icone.textContent = '☀️';
    }
}

export function alterarTema() {
    const isClaro = document.documentElement.classList.contains('tema-claro');
    const novoTema = isClaro ? 'escuro' : 'claro';
    localStorage.setItem('cv_tema', novoTema);
    aplicarTema(novoTema);
}

// Aplica tema salvo IMEDIATAMENTE ao carregar este módulo
(function initTema() {
    const temaSalvo = localStorage.getItem('cv_tema') || 'escuro';
    aplicarTema(temaSalvo);
})();
