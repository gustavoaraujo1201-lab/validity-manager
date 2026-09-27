// ============================================
// STORAGE — Unidades (lojas/filiais)
// ============================================

export function getUnidades() {
    return JSON.parse(localStorage.getItem('cv_unidades') || '[]');
}

export function salvarUnidades(lista) {
    localStorage.setItem('cv_unidades', JSON.stringify(lista));
}
