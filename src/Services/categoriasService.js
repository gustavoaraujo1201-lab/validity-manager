// ============================================
// CATEGORIAS — regra de negócio
// ============================================
// Nota sobre import circular: este módulo e produtosService.js se
// referenciam mutuamente (categoriasDeSessao/atualizarResumoGlobar/
// fecharPainel). Isso é seguro em módulos ES porque cada função só é
// *usada* dentro do corpo de outra função, nunca no topo do arquivo —
// no momento em que qualquer uma delas é de fato chamada (clique do
// usuário), o grafo de módulos já terminou de carregar por completo.

import { state } from '../state.js';
import { inputCatNome } from '../dom.js';
import { isAdmin } from './sessaoService.js';
import { salvarDados } from '../storage/produtosStorage.js';
import { carregarUsuarios } from '../storage/usuariosStorage.js';
import { getUnidades } from '../storage/unidadesStorage.js';
import { renderizarSelectCategorias, renderizarGridCategorias } from '../components/renderCategorias.js';
import { atualizarResumoGlobal, fecharPainel } from './produtosService.js';

// ===== FILTRO DE CATEGORIAS POR SESSÃO =====
// Para colaborador: filtra por donoId E por loja (unidadeIdx)
export function categoriasDeSessao() {
    if (isAdmin()) return state.categorias;

    // Colaborador: vê categorias atribuídas a ele
    // Se o colaborador tiver loja vinculada, também filtra categorias dessa loja
    return state.categorias.filter(c => {
        const ehDono = c.donoId === state.sessaoAtual.id;
        return ehDono;
    });
}

// ===== MODAL CATEGORIA =====
export function abrirModalCategoria(idCat) {
    if (!isAdmin()) return; // apenas admin cria/renomeia categorias
    state.idEditandoCat = idCat || null;

    // Popula select de colaboradores
    const campoAtribuir = document.getElementById('campo-atribuir-colaborador');
    const selColab = document.getElementById('select-cat-colaborador');
    selColab.innerHTML = '<option value="">— Selecione um colaborador —</option>';
    const usuarios = carregarUsuarios().filter(u => u.id !== 1); // exclui apenas o admin raiz
    const unidades = getUnidades();
    usuarios.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        let label = (u.nome || u.usuario) + ' (@' + u.usuario + ')';
        if (u.unidadeIdx !== undefined && u.unidadeIdx !== null) {
            const loja = unidades[u.unidadeIdx];
            if (loja) label += ' · 🏪 ' + loja.nome;
        }
        opt.textContent = label;
        selColab.appendChild(opt);
    });

    if (state.idEditandoCat) {
        const cat = state.categorias.find(c => c.id === state.idEditandoCat);
        document.getElementById('modal-titulo').textContent    = 'Renomear categoria';
        document.getElementById('modal-descricao').textContent = 'Digite o novo nome para esta categoria.';
        inputCatNome.value = cat ? cat.nome : '';
        if (cat && cat.donoId) selColab.value = cat.donoId;
        campoAtribuir.style.display = 'block';
    } else {
        document.getElementById('modal-titulo').textContent    = 'Nova categoria';
        document.getElementById('modal-descricao').textContent = 'Digite o nome da categoria. Ex: Leites, Suplementos, Medicamentos OTC...';
        inputCatNome.value = '';
        selColab.value = '';
        campoAtribuir.style.display = 'block';
    }
    document.getElementById('modal-categoria').classList.remove('escondido');
    document.getElementById('overlay-modal').classList.remove('escondido');
    setTimeout(() => inputCatNome.focus(), 50);
}

export function fecharModalCategoria() {
    document.getElementById('modal-categoria').classList.add('escondido');
    document.getElementById('overlay-modal').classList.add('escondido');
    state.idEditandoCat = null;
}

export function salvarCategoria() {
    const nome = inputCatNome.value.trim();
    if (!nome) { alert('Digite um nome para a categoria!'); return; }

    const selColab = document.getElementById('select-cat-colaborador');
    const donoIdRaw = selColab ? selColab.value : '';
    const donoId = donoIdRaw ? (isNaN(donoIdRaw) ? donoIdRaw : Number(donoIdRaw)) : null;

    if (state.idEditandoCat) {
        const idx = state.categorias.findIndex(c => c.id === state.idEditandoCat);
        if (idx !== -1) {
            state.categorias[idx].nome   = nome;
            state.categorias[idx].donoId = donoId;
        }
    } else {
        const novoId = 'cat_' + Date.now();
        state.categorias.push({ id: novoId, nome, donoId });
        state.produtos[novoId] = [];
    }

    salvarDados();
    fecharModalCategoria();
    renderizarSelectCategorias();
    renderizarGridCategorias();
    atualizarResumoGlobal();
}

export function excluirCategoria(id) {
    const cat = state.categorias.find(c => c.id === id);
    const qtd = (state.produtos[id] || []).length;
    const msg = qtd > 0
        ? `Excluir "${cat.nome}" e seus ${qtd} produto(s)? Não pode ser desfeito.`
        : `Excluir a categoria "${cat.nome}"?`;
    if (!confirm(msg)) return;

    state.categorias = state.categorias.filter(c => c.id !== id);
    delete state.produtos[id];

    if (state.categoriaAtual === id) fecharPainel();

    salvarDados();
    renderizarSelectCategorias();
    renderizarGridCategorias();
    atualizarResumoGlobal();
}
