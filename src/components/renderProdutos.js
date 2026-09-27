// ============================================
// RENDER — Próximos a vencer / Lista do painel de categoria
// ============================================

import { state } from '../state.js';
import { listaEl } from '../dom.js';
import { escaparHTML } from './escaparHTML.js';
import { isAdmin } from '../services/sessaoService.js';
import { categoriasDeSessao } from '../services/categoriasService.js';
import { diasParaVencer, calcularFaixa, FAIXA_CONFIG, formatarData } from '../services/produtosUtil.js';
import { atualizarResumoGlobal } from '../services/produtosService.js';

// ===== PRÓXIMOS A VENCER =====
export function renderizarProxValidade() {
    // Popula filtro de categorias
    const selCat = document.getElementById('filtro-prox-cat');
    if (selCat) {
        const valorAtual = selCat.value;
        selCat.innerHTML = '<option value="">Todas as categorias</option>';
        categoriasDeSessao().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.nome;
            selCat.appendChild(opt);
        });
        if (valorAtual) selCat.value = valorAtual;
    }

    const filtroFaixa = document.getElementById('filtro-prox-faixa')?.value || 'todos';
    const filtroCat   = document.getElementById('filtro-prox-cat')?.value   || '';

    // Coleta todos os produtos com validade dentro de 12 meses (ou vencidos)
    const lista = [];
    categoriasDeSessao().forEach(cat => {
        if (filtroCat && cat.id != filtroCat) return;
        (state.produtos[cat.id] || []).forEach(p => {
            if (!p.validade) return;
            const dias  = diasParaVencer(p.validade);
            if (dias === Infinity) return;
            const faixa = calcularFaixa(p.validade);
            if (faixa === 'ok' && filtroFaixa !== 'ok') return; // só aparece se filtro específico
            lista.push({ ...p, catNome: cat.nome, catId: cat.id, dias, faixa });
        });
    });

    // Filtra por faixa
    const listafiltrada = filtroFaixa === 'todos'
        ? lista.filter(p => p.faixa !== 'ok')
        : lista.filter(p => p.faixa === filtroFaixa);

    // Ordena por urgência
    listafiltrada.sort((a, b) => a.dias - b.dias);

    // Resumo por faixa
    const contadores = { vencido:0, critico:0, alerta:0, atencao:0, proximo:0 };
    lista.filter(p => p.faixa !== 'ok').forEach(p => {
        if (contadores[p.faixa] !== undefined) contadores[p.faixa]++;
    });

    const resumoEl = document.getElementById('proxval-resumo');
    const faixasOrdem = ['vencido','critico','alerta','atencao','proximo'];
    resumoEl.innerHTML = faixasOrdem.map(f => {
        const cfg = FAIXA_CONFIG[f];
        const n = contadores[f];
        return `<div class="proxval-card proxval-card--${f}" onclick="document.getElementById('filtro-prox-faixa').value='${f}';renderizarProxValidade()">
            <span class="proxval-card-num ${n > 0 ? '' : 'proxval-zero'}">${n}</span>
            <span class="proxval-card-label">${cfg.label}</span>
        </div>`;
    }).join('');

    // Lista de produtos
    const listaProxEl = document.getElementById('proxval-lista');
    if (listafiltrada.length === 0) {
        listaProxEl.innerHTML = '<p class="lista-vazia" style="padding:2rem">✅ Nenhum produto próximo ao vencimento nos filtros selecionados.</p>';
        return;
    }

    let html = `<div class="cabecalho-lista" style="border-radius:12px 12px 0 0">
        <span>Categoria</span>
        <span>Produto</span>
        <span>Fabricante</span>
        <span>Validade</span>
        <span>Qtd.</span>
        <span>Dias Rest.</span>
        <span>Status</span>
    </div>`;

    listafiltrada.forEach(p => {
        const cfg = FAIXA_CONFIG[p.faixa];
        const dias = p.dias;
        let diasTexto = '';
        if (dias < 0)        diasTexto = `<span class="dias-texto vencido">${Math.abs(dias)}d atrás</span>`;
        else if (dias === 0) diasTexto = `<span class="dias-texto critico">Hoje!</span>`;
        else                 diasTexto = `<span class="dias-texto ${p.faixa}">${dias} dias</span>`;

        html += `<div class="produto-item faixa-${p.faixa}">
            <div class="produto-codigo-col" style="font-size:.8rem;opacity:.75">${escaparHTML(p.catNome)}</div>
            <div class="produto-nome-col">${escaparHTML(p.nome)}</div>
            <div class="produto-codigo-col" title="${escaparHTML(p.fabricante || '')}">${p.fabricante ? escaparHTML(p.fabricante) : '<span style="opacity:.35">—</span>'}</div>
            <div class="produto-data-col">${formatarData(p.validade)}</div>
            <div class="produto-qtd-col"><span class="badge-qtd">${p.quantidade || 1}</span></div>
            <div class="produto-dias-col">${diasTexto}</div>
            <div><span class="badge ${cfg.classe}">${cfg.label}</span></div>
        </div>`;
    });

    listaProxEl.innerHTML = html;
}

// ===== LISTA DO PAINEL (dentro da aba Categorias) =====
export function renderizarListaPainel() {
    if (!state.categoriaAtual) return;
    const lista = state.produtos[state.categoriaAtual] || [];

    // Contadores por faixa
    const contadores = { vencido:0, critico:0, alerta:0, atencao:0, proximo:0, ok:0 };

    const total = lista.length;
    document.getElementById('painel-contador').textContent = total + (total === 1 ? ' produto' : ' produtos');

    if (lista.length === 0) {
        listaEl.innerHTML = '<p class="lista-vazia">Nenhum produto nesta categoria ainda.<br><small>Vá em <strong>Cadastro</strong> para adicionar produtos.</small></p>';
        document.getElementById('p-total').textContent    = 0;
        document.getElementById('p-aviso').textContent    = 0;
        document.getElementById('p-vencidos').textContent = 0;
        const pRealVencidosVazio = document.getElementById('p-real-vencidos');
        if (pRealVencidosVazio) pRealVencidosVazio.textContent = 0;
        return;
    }

    // Ordena: mais urgentes primeiro
    const ordenados = [...lista].sort((a, b) => diasParaVencer(a.validade) - diasParaVencer(b.validade));

    let html = `
        <div class="cabecalho-lista">
            <span>Fabricante</span>
            <span>Produto</span>
            <span>Validade</span>
            <span>Qtd.</span>
            <span>Dias Rest.</span>
            <span>Status</span>
            <span>Ações</span>
        </div>`;

    ordenados.forEach(produto => {
        const faixa = calcularFaixa(produto.validade);
        const cfg   = FAIXA_CONFIG[faixa];
        const dias  = diasParaVencer(produto.validade);
        contadores[faixa]++;

        // Texto de dias restantes
        let diasTexto = '';
        if (dias === Infinity)    diasTexto = `<span class="dias-texto" style="opacity:.4">—</span>`;
        else if (dias < 0)        diasTexto = `<span class="dias-texto vencido">${Math.abs(dias)}d atrás</span>`;
        else if (dias === 0)      diasTexto = `<span class="dias-texto critico">Hoje!</span>`;
        else                      diasTexto = `<span class="dias-texto ${faixa}">${dias} dias</span>`;

        const badge = `<span class="badge ${cfg.classe}">${cfg.label}</span>`;

        html += `
            <div class="produto-item faixa-${faixa}">
                <div class="produto-codigo-col" title="${escaparHTML(produto.fabricante || '')}">${produto.fabricante ? escaparHTML(produto.fabricante) : '<span style="opacity:.35">—</span>'}</div>
                <div class="produto-nome-col">${escaparHTML(produto.nome)}</div>
                <div class="produto-data-col">${formatarData(produto.validade)}</div>
                <div class="produto-qtd-col"><span class="badge-qtd">${produto.quantidade || 1}</span></div>
                <div class="produto-dias-col">${diasTexto}</div>
                <div>${badge}</div>
                <div class="acoes">
                    <button class="btn-editar"  onclick="editarProduto(${produto.id})"  title="Editar">✏️</button>
                    ${isAdmin() ? `<button class="btn-excluir" onclick="removerProduto(${produto.id})" title="Excluir">🗑️</button>` : ''}
                </div>
            </div>`;
    });

    listaEl.innerHTML = html;

    // Atualiza painel resumo
    // Corrigido: "p-vencidos" estava rotulado como "Próx. 6–9m" na tela, mas
    // somava alerta+atencao (3–9 meses). Agora mostra só a faixa 6–9m, e foi
    // adicionado um contador separado para produtos realmente vencidos.
    document.getElementById('p-total').textContent    = lista.length;
    document.getElementById('p-aviso').textContent    = contadores.critico;
    document.getElementById('p-vencidos').textContent = contadores.atencao;
    const pRealVencidos = document.getElementById('p-real-vencidos');
    if (pRealVencidos) pRealVencidos.textContent = contadores.vencido;
    atualizarResumoGlobal();
}
