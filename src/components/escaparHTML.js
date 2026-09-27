// ============================================
// SEGURANÇA — Escape de HTML
// ============================================
// Dados vindos de campos do usuário (nome de produto, categoria,
// fabricante, unidade, usuário) são inseridos via innerHTML em vários
// pontos da tela. Sem escapar, um valor como "<img src=x onerror=...>"
// digitado em qualquer um desses campos executaria JavaScript assim
// que a lista fosse renderizada. Esta função neutraliza isso.
export function escaparHTML(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
