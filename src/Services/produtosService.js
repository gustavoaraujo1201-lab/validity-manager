// ============================================
// PRODUTOS — regra de negócio / formulário de cadastro
// ============================================

import { state } from '../state.js';
import {
    selectCategoria, inputCodigo, inputNome, inputFabricante,
    inputClassificacao, btnCadastrar,
} from '../dom.js';
import { salvarDados } from '../storage/produtosStorage.js';
import { categoriasDeSessao } from './categoriasService.js';
import { diasParaVencer } from './produtosUtil.js';
import { renderizarListaPainel } from '../components/renderProdutos.js';
import { renderizarGridCategorias, preencherClassificacao } from '../components/renderCategorias.js';
import { mudarAba } from '../navigation/abas.js';

// ===== PAINEL DE PRODUTOS (dentro da aba Categorias) =====
export function abrirPainel(id) {
    state.categoriaAtual = id;
    const cat = state.categorias.find(c => c.id === id);

    document.getElementById('grid-categorias').classList.add('escondido');
    document.getElementById('painel-produtos').classList.remove('escondido');

    document.getElementById('painel-titulo').textContent = cat ? cat.nome : '';
    renderizarListaPainel();
}

export function fecharPainel() {
    state.categoriaAtual = null;
    document.getElementById('painel-produtos').classList.add('escondido');
    document.getElementById('grid-categorias').classList.remove('escondido');
}

// ===== BADGE NAV — PRÓX. VALIDADE =====
export function atualizarBadgeProxValidade() {
    let urgentes = 0;
    categoriasDeSessao().forEach(cat => {
        (state.produtos[cat.id] || []).forEach(p => {
            if (!p.validade) return;
            const dias = diasParaVencer(p.validade);
            if (dias !== Infinity && dias <= 90) urgentes++;
        });
    });
    const badge = document.getElementById('badge-prox-val');
    if (!badge) return;
    if (urgentes > 0) {
        badge.textContent = urgentes;
        badge.classList.remove('escondido');
    } else {
        badge.classList.add('escondido');
    }
}

// ===== RESUMO GLOBAL =====
export function atualizarResumoGlobal() {
    // Corrigido: o card dizia "6–9 meses" mas somava tudo entre 91 e 270 dias
    // (ou seja, 3–9 meses, misturando as faixas "alerta" e "atencao"). Agora
    // cada card reflete exatamente o intervalo do seu próprio rótulo.
    let total = 0, prox3 = 0, prox6a9 = 0, vencidos = 0;
    const minhascats = categoriasDeSessao();
    minhascats.forEach(cat => {
        (state.produtos[cat.id] || []).forEach(p => {
            total++;
            const dias = diasParaVencer(p.validade);
            if (dias < 0) vencidos++;                     // vencido
            if (dias >= 0 && dias <= 90)  prox3++;         // até 3 meses
            if (dias > 180 && dias <= 270) prox6a9++;      // 6–9 meses
        });
    });
    document.getElementById('g-total').textContent  = total;
    document.getElementById('g-prox3').textContent  = prox3;
    document.getElementById('g-prox6').textContent  = prox6a9;
    document.getElementById('g-cats').textContent   = categoriasDeSessao().length;
    const gVencidos = document.getElementById('g-vencidos');
    if (gVencidos) gVencidos.textContent = vencidos;
    atualizarBadgeProxValidade();
}

// ===== EDITAR PRODUTO (vai para aba Cadastro) =====
export function editarProduto(id) {
    const lista = state.produtos[state.categoriaAtual] || [];
    const produto = lista.find(p => p.id === id);
    if (!produto) return;

    // Muda para aba de cadastro
    mudarAba('cadastro');

    // Preenche o formulário (edição do cadastro — sem validade/quantidade)
    selectCategoria.value   = state.categoriaAtual;
    if (inputCodigo) inputCodigo.value = produto.codigo || '';
    inputNome.value         = produto.nome;
    if (inputFabricante) inputFabricante.value = produto.fabricante || '';
    preencherClassificacao();

    state.idEditando = id;

    btnCadastrar.textContent = '💾 Salvar alterações';
    btnCadastrar.classList.add('btn-editando');
    document.getElementById('btn-cancelar').style.display = 'block';
    document.getElementById('banner-editando').classList.remove('escondido');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    inputCodigo.focus();
}

// ===== REMOVER PRODUTO =====
export function removerProduto(id) {
    if (state.idEditando === id) cancelarEdicao();
    state.produtos[state.categoriaAtual] = (state.produtos[state.categoriaAtual] || []).filter(p => p.id !== id);
    salvarDados();
    renderizarListaPainel();
    renderizarGridCategorias();
    // Re-abre o painel (renderizarGridCategorias fecha)
    abrirPainel(state.categoriaAtual);
}

// ===== SALVAR PRODUTO (Cadastro — sem validade/quantidade) =====
export function salvarProduto() {
    const catId      = selectCategoria.value;
    const codigo     = inputCodigo ? inputCodigo.value.trim() : '';
    const nome       = inputNome.value.trim();
    const fabricante = inputFabricante ? inputFabricante.value.trim() : '';

    if (!catId) { alert('⚠️ Selecione uma classificação!'); selectCategoria.focus(); return; }
    if (!nome)  { alert('⚠️ Informe a descrição do produto!'); inputNome.focus(); return; }

    if (!state.produtos[catId]) state.produtos[catId] = [];

    if (state.idEditando === null) {
        // Verifica duplicata pelo nome
        const duplicado = (state.produtos[catId] || []).find(
            p => p.nome.trim().toLowerCase() === nome.toLowerCase()
        );
        if (duplicado) {
            alert('⚠️ Produto com esse nome já está cadastrado nessa classificação.');
            return;
        }
        // Cadastra sem validade/quantidade — serão preenchidos na Contagem
        state.produtos[catId].push({ id: Date.now(), codigo, nome, fabricante, validade: '', quantidade: 0 });
    } else {
        const catOrigem = Object.keys(state.produtos).find(k => state.produtos[k].some(p => p.id === state.idEditando));
        if (catOrigem && catOrigem !== catId) {
            const p = state.produtos[catOrigem].find(p => p.id === state.idEditando);
            state.produtos[catOrigem] = state.produtos[catOrigem].filter(p => p.id !== state.idEditando);
            state.produtos[catId].push({ ...p, codigo, nome, fabricante });
        } else {
            const idx = state.produtos[catId].findIndex(p => p.id === state.idEditando);
            if (idx !== -1) {
                state.produtos[catId][idx] = { ...state.produtos[catId][idx], codigo, nome, fabricante };
            }
        }
        state.idEditando = null;
    }

    salvarDados();
    limparFormulario();
    atualizarResumoGlobal();
    mostrarSucesso();
}

export function mostrarSucesso() {
    const btn = btnCadastrar;
    const orig = btn.textContent;
    btn.textContent = '✅ Salvo!';
    btn.style.background = '#16a34a';
    setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = '';
    }, 1200);
}

// Mostra mensagem de erro abaixo de um campo
export function mostrarErroCampo(campo, idErro, mensagem) {
    campo.style.borderColor = '#dc2626';
    campo.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.25)';
    let el = document.getElementById(idErro);
    if (!el) {
        el = document.createElement('div');
        el.id = idErro;
        el.className = 'msg-erro-campo';
        campo.parentNode.insertBefore(el, campo.nextSibling);
    }
    el.textContent = mensagem;
    el.style.display = 'block';
    campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function esconderErroCampo(campo, idErro) {
    campo.style.borderColor = '';
    campo.style.boxShadow = '';
    const el = document.getElementById(idErro);
    if (el) el.style.display = 'none';
}

// Feedback quando produto duplicado é somado
export function mostrarSucessoDuplicata(novaQtd, nomeProduto) {
    const btn = btnCadastrar;
    const orig = btn.textContent;
    btn.textContent = `🔢 Quantidade atualizada: ${novaQtd}`;
    btn.style.background = '#2563eb';
    setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = '';
    }, 2500);
}

// ===== CANCELAR EDIÇÃO =====
export function cancelarEdicao() {
    state.idEditando = null;
    limparFormulario();
}

// ===== LIMPAR FORMULÁRIO =====
export function limparFormulario() {
    if (inputCodigo) inputCodigo.value = '';
    inputNome.value = '';
    if (inputFabricante) inputFabricante.value = '';
    if (inputClassificacao) inputClassificacao.value = '';
    btnCadastrar.textContent = '✅ Cadastrar produto';
    btnCadastrar.classList.remove('btn-editando');
    document.getElementById('btn-cancelar').style.display = 'none';
    document.getElementById('banner-editando').classList.add('escondido');
    preencherClassificacao();
}
