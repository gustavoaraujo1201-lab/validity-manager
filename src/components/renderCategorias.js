// ============================================
// RENDER — Select de categorias e grid de categorias
// ============================================

import { state } from '../state.js';
import { selectCategoria, inputClassificacao } from '../dom.js';
import { escaparHTML } from './escaparHTML.js';
import { isAdmin } from '../services/sessaoService.js';
import { categoriasDeSessao } from '../services/categoriasService.js';
import { carregarUsuarios } from '../storage/usuariosStorage.js';
import { getUnidades } from '../storage/unidadesStorage.js';
import { calcularStatus } from '../services/produtosUtil.js';

export function renderizarSelectCategorias() {
    const sel = selectCategoria;
    const valorAtual = sel.value;
    sel.innerHTML = '<option value="">— Selecione uma categoria —</option>';
    categoriasDeSessao().forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.nome;
        sel.appendChild(opt);
    });
    // Restaura seleção se ainda existir
    if (valorAtual) sel.value = valorAtual;
    preencherClassificacao();
}

// Preenche automaticamente o campo Classificação com base na categoria selecionada
export function preencherClassificacao() {
    const catId = selectCategoria.value;
    const cat = state.categorias.find(c => c.id == catId);
    if (inputClassificacao) {
        inputClassificacao.value = cat ? cat.nome : '';
    }
}

// ===== GRID DE CATEGORIAS (aba Categorias) =====
export function renderizarGridCategorias() {
    const grid = document.getElementById('grid-categorias');

    // Fecha painel ao re-renderizar grid
    document.getElementById('painel-produtos').classList.add('escondido');
    grid.classList.remove('escondido');

    const lista = categoriasDeSessao();

    if (lista.length === 0) {
        grid.innerHTML = '<div class="cat-vazia">Nenhuma categoria criada ainda.</div>';
        return;
    }

    const usuarios  = carregarUsuarios();
    const unidades  = getUnidades();

    let html = '';
    lista.forEach(cat => {
        const prods   = state.produtos[cat.id] || [];
        const total   = prods.length;
        let aviso = 0, vencidos = 0;
        prods.forEach(p => {
            const s = calcularStatus(p.validade);
            if (s === 'aviso') aviso++;
            if (s === 'vencido') vencidos++;
        });

        const temAlerta = vencidos > 0 ? 'card-cat alerta-vencido' : aviso > 0 ? 'card-cat alerta-aviso' : 'card-cat';

        // Tag do dono (só admin vê)
        let tagDono = '';
        if (isAdmin()) {
            if (cat.donoId) {
                const dono = usuarios.find(u => u.id === cat.donoId);
                if (dono) {
                    // Mostra nome do colaborador e loja
                    let lojaTag = '';
                    if (dono.unidadeIdx !== undefined && dono.unidadeIdx !== null) {
                        const loja = unidades[dono.unidadeIdx];
                        if (loja) lojaTag = ` · 🏪 ${escaparHTML(loja.nome)}`;
                    }
                    tagDono = `<span class="cat-tag-dono">👤 ${escaparHTML(dono.nome || dono.usuario)}${lojaTag}</span>`;
                }
            } else {
                tagDono = `<span class="cat-tag-dono cat-tag-sem-dono">⚠️ Sem colaborador</span>`;
            }
        }

        html += `
        <div class="${temAlerta}" onclick="abrirPainel('${cat.id}')">
            <div class="card-cat-topo">
                <span class="card-cat-nome">${escaparHTML(cat.nome)}</span>
                <div class="card-cat-acoes" onclick="event.stopPropagation()">
                    <button class="btn-cat-acao" onclick="abrirModalCategoria('${cat.id}')" title="Renomear">✏️</button>
                    ${isAdmin() ? `<button class="btn-cat-acao" onclick="excluirCategoria('${cat.id}')" title="Excluir">🗑️</button>` : ''}
                </div>
            </div>
            ${tagDono}
            <div class="card-cat-stats">
                <span class="card-cat-total">${total} produto${total !== 1 ? 's' : ''}</span>
                ${vencidos > 0 ? `<span class="pill pill-vencido">${vencidos} vencido${vencidos > 1 ? 's' : ''}</span>` : ''}
                ${aviso > 0 ? `<span class="pill pill-aviso">${aviso} aviso${aviso > 1 ? 's' : ''}</span>` : ''}
            </div>
            <div class="card-cat-seta">Ver produtos →</div>
        </div>`;
    });

    grid.innerHTML = html;
}
