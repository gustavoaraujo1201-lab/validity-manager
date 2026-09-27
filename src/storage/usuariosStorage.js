// ============================================
// STORAGE — Usuários
// ============================================

export function carregarUsuarios() {
    return JSON.parse(localStorage.getItem('cv_usuarios') || '[]');
}

export function salvarUsuarios(lista) {
    localStorage.setItem('cv_usuarios', JSON.stringify(lista));
}
