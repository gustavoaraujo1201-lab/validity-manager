// ============================================
// STORAGE — Categorias / Produtos
// ============================================
// Camada fina só de leitura/escrita no localStorage.
// Nenhuma regra de negócio aqui, só persistência.

import { state } from '../state.js';

export function carregarDados() {
    const catSalvas  = localStorage.getItem('categorias');
    const prodSalvos = localStorage.getItem('produtos');
    state.categorias = catSalvas  ? JSON.parse(catSalvas)  : [];
    state.produtos   = prodSalvos ? JSON.parse(prodSalvos) : {};
}

export function salvarDados() {
    localStorage.setItem('categorias', JSON.stringify(state.categorias));
    localStorage.setItem('produtos',   JSON.stringify(state.produtos));
}
