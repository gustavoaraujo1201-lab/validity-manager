// ============================================
// CONTAGEM DE PRODUTOS
// ============================================

import { state } from '../state.js';
import { escaparHTML } from '../components/escaparHTML.js';
import { salvarDados } from '../storage/produtosStorage.js';
import { atualizarResumoGlobal } from './produtosService.js';
import { renderizarProxValidade } from '../components/renderProdutos.js';

export function contagemBuscar(termo) {
    const resultadoEl = document.getElementById('contagem-resultado-busca');
    const formEl = document.getElementById('contagem-form');
    termo = (termo || '').trim().toLowerCase();

    if (!termo) {
        resultadoEl.style.display = 'none';
        formEl.style.display = 'none';
        state.contagemProdutoSelecionado = null;
        return;
    }

    // Busca em todos os produtos cadastrados
    const resultados = [];
    state.categorias.forEach(cat => {
        (state.produtos[cat.id] || []).forEach(p => {
            const nomeMatch  = p.nome.toLowerCase().includes(termo);
            const codigoMatch = p.codigo && p.codigo.toLowerCase() === termo;
            if (nomeMatch || codigoMatch) {
                resultados.push({ catId: cat.id, catNome: cat.nome, produto: p });
            }
        });
    });

    if (resultados.length === 0) {
        resultadoEl.innerHTML = `<p style="opacity:.6;font-size:.875rem;padding:.5rem 0">Nenhum produto encontrado. Verifique se ele está cadastrado.</p>`;
        resultadoEl.style.display = 'block';
        formEl.style.display = 'none';
        return;
    }

    if (resultados.length === 1) {
        // Seleção automática se único resultado
        contagemSelecionarProduto(resultados[0]);
        resultadoEl.style.display = 'none';
        return;
    }

    // Mostra lista para o usuário escolher
    resultadoEl.innerHTML = resultados.map((r, i) => `
        <div onclick="contagemSelecionarProduto(contagemResultados[${i}])"
             style="padding:.6rem .9rem;border-radius:8px;margin-bottom:.35rem;cursor:pointer;
                    background:var(--card);border:1px solid var(--borda);
                    transition:border-color .15s"
             onmouseover="this.style.borderColor='var(--azul,#3b82f6)'"
             onmouseout="this.style.borderColor='var(--borda)'">
            <div style="font-weight:600;font-size:.9rem">${escaparHTML(r.produto.nome)}</div>
            <div style="font-size:.78rem;opacity:.6">${escaparHTML(r.catNome)}${r.produto.fabricante ? ' · ' + escaparHTML(r.produto.fabricante) : ''}</div>
        </div>`).join('');
    window.contagemResultados = resultados;
    resultadoEl.style.display = 'block';
    formEl.style.display = 'none';
}

export function contagemSelecionarProduto(item) {
    state.contagemProdutoSelecionado = item;
    const resultadoEl = document.getElementById('contagem-resultado-busca');
    const formEl = document.getElementById('contagem-form');

    document.getElementById('contagem-prod-nome').textContent = item.produto.nome;
    document.getElementById('contagem-prod-fab').textContent =
        (item.catNome || '') + (item.produto.fabricante ? ' · ' + item.produto.fabricante : '');
    document.getElementById('contagem-validade').value = '';
    document.getElementById('contagem-quantidade').value = 1;
    document.getElementById('contagem-banner-erro').classList.add('escondido');

    resultadoEl.style.display = 'none';
    formEl.style.display = 'block';
    document.getElementById('contagem-validade').focus();
}

export function contagemLancar() {
    if (!state.contagemProdutoSelecionado) return;
    const validade  = document.getElementById('contagem-validade').value;
    const quantidade = parseInt(document.getElementById('contagem-quantidade').value) || 1;
    const erroBanner = document.getElementById('contagem-banner-erro');
    const erroMsg    = document.getElementById('contagem-erro-msg');

    if (!validade) {
        erroMsg.textContent = '⚠️ Informe a data de validade.';
        erroBanner.classList.remove('escondido');
        document.getElementById('contagem-validade').focus();
        return;
    }

    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const dataVal = new Date(validade + 'T00:00:00');
    if (isNaN(dataVal.getTime()) || dataVal <= hoje) {
        erroMsg.textContent = '🚫 Data vencida ou inválida — não é permitido lançar produto vencido.';
        erroBanner.classList.remove('escondido');
        document.getElementById('contagem-validade').focus();
        return;
    }
    erroBanner.classList.add('escondido');

    const { catId, produto } = state.contagemProdutoSelecionado;
    const lista = state.produtos[catId] || [];
    const idx = lista.findIndex(p => p.id === produto.id);

    if (idx !== -1) {
        // Soma quantidade se já há lançamento com mesma validade
        const existente = lista.find(p => p.id === produto.id && p.validade === validade);
        if (existente) {
            existente.quantidade = (parseInt(existente.quantidade) || 0) + quantidade;
        } else {
            // Atualiza validade e quantidade do produto existente
            lista[idx] = { ...lista[idx], validade, quantidade };
        }
    }

    salvarDados();
    atualizarResumoGlobal();

    // Feedback e limpa
    contagemCancelar();
    const buscaEl = document.getElementById('contagem-busca');
    if (buscaEl) buscaEl.value = '';

    // Mostra badge verde de sucesso
    const btn = document.querySelector('#aba-proxvalidade');
    if (btn) {
        const orig = btn.style.outline;
        btn.style.outline = '2px solid #16a34a';
        setTimeout(() => { btn.style.outline = orig; }, 800);
    }
    renderizarProxValidade();
}

export function contagemCancelar() {
    state.contagemProdutoSelecionado = null;
    document.getElementById('contagem-form').style.display = 'none';
    document.getElementById('contagem-resultado-busca').style.display = 'none';
    const buscaEl = document.getElementById('contagem-busca');
    if (buscaEl) { buscaEl.value = ''; buscaEl.focus(); }
}
