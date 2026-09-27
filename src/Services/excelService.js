// ============================================
// EXCEL — Importação e Exportação
// ============================================
// Depende da biblioteca global XLSX (carregada via <script> do
// cdn.jsdelivr.net no HTML, antes deste módulo).

import { state } from '../state.js';
import { escaparHTML } from '../components/escaparHTML.js';
import { salvarDados } from '../storage/produtosStorage.js';
import { diasParaVencer, calcularFaixa, formatarData } from './produtosUtil.js';
import { atualizarResumoGlobal } from './produtosService.js';

// ===== IMPORTAÇÃO DE EXCEL =====

export function importarResetar() {
    state.importDados = [];
    state.importClassificacoes = [];
    _show('import-dropzone');
    _hide('import-mapeamento-area');
    _hide('import-resultado');
    const fi = document.getElementById('import-file-input');
    if (fi) fi.value = '';
}

function _show(id) { const el = document.getElementById(id); if (el) el.classList.remove('escondido'); }
function _hide(id) { const el = document.getElementById(id); if (el) el.classList.add('escondido'); }

export function importDragOver(e) {
    e.preventDefault();
    document.getElementById('import-dropzone').classList.add('import-dropzone--over');
}
export function importDragLeave(e) {
    document.getElementById('import-dropzone').classList.remove('import-dropzone--over');
}
export function importDrop(e) {
    e.preventDefault();
    importDragLeave(e);
    const file = e.dataTransfer.files[0];
    if (file) importProcessarArquivo(file);
}
export function importLerArquivo(input) {
    if (input.files && input.files[0]) importProcessarArquivo(input.files[0]);
}

export function importProcessarArquivo(file) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('⚠️ Apenas arquivos .xlsx ou .xls são suportados.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const wb = XLSX.read(e.target.result, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

            if (!rows.length) { alert('⚠️ Planilha vazia ou sem dados.'); return; }

            // Normaliza cabeçalhos: aceita variações com acento / maiúscula
            const normalizar = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            const chaves = Object.keys(rows[0]);
            const findKey = (termo) => chaves.find(k => normalizar(k) === normalizar(termo)) || null;

            const kDesc  = findKey('Descricao') || findKey('Descrição') || findKey('descricao') || findKey('nome') || findKey('produto');
            const kClass = findKey('Classificacao') || findKey('Classificação') || findKey('classificacao') || findKey('categoria');
            const kFab   = findKey('Fabricante') || findKey('fabricante');

            if (!kDesc || !kClass) {
                alert('⚠️ Não encontrei as colunas "Descrição" e "Classificação" na planilha.\n\nColunas encontradas: ' + chaves.join(', '));
                return;
            }

            state.importDados = rows.map(r => ({
                nome: String(r[kDesc] || '').trim(),
                classificacao: String(r[kClass] || '').trim(),
                fabricante: kFab ? String(r[kFab] || '').trim() : ''
            })).filter(r => r.nome && r.classificacao);

            // Valores únicos de classificação
            state.importClassificacoes = [...new Set(state.importDados.map(r => r.classificacao))].sort();

            document.getElementById('import-resumo-arquivo').textContent =
                `${file.name} — ${state.importDados.length} produtos encontrados em ${state.importClassificacoes.length} classificação(ões)`;

            importRenderizarMapeamento();
            _hide('import-dropzone');
            _show('import-mapeamento-area');
            _hide('import-resultado');

        } catch(err) {
            alert('❌ Erro ao ler o arquivo: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

export function importRenderizarMapeamento() {
    const lista = document.getElementById('import-mapeamento-lista');
    lista.innerHTML = '';

    const opcoesSelect = state.categorias.map(c =>
        `<option value="${c.id}">${escaparHTML(c.nome)}</option>`
    ).join('');

    state.importClassificacoes.forEach(cls => {
        const qtd = state.importDados.filter(r => r.classificacao === cls).length;
        // tenta sugerir categoria pelo nome
        const sugestao = state.categorias.find(c =>
            cls.toLowerCase().includes(c.nome.toLowerCase()) ||
            c.nome.toLowerCase().includes(cls.toLowerCase().split('>').pop().trim())
        );

        const row = document.createElement('div');
        row.className = 'import-map-row';
        row.innerHTML = `
            <div class="import-map-cls">
                <span class="import-map-label">${escaparHTML(cls)}</span>
                <span class="import-map-qtd">${qtd} produto${qtd !== 1 ? 's' : ''}</span>
            </div>
            <div class="import-map-arrow">→</div>
            <div class="import-map-dest">
                <select class="import-cat-select" data-cls="${escaparHTML(cls)}">
                    <option value="">— ignorar —</option>
                    ${opcoesSelect}
                </select>
            </div>`;
        lista.appendChild(row);

        // aplica sugestão automática
        const sel = row.querySelector('select');
        if (sugestao) sel.value = sugestao.id;
    });
}

export function importConfirmar() {
    const selects = document.querySelectorAll('.import-cat-select');
    const mapa = {};
    selects.forEach(sel => {
        const cls = sel.getAttribute('data-cls');
        if (sel.value) mapa[cls] = sel.value;
    });

    const clsMapeadas = Object.keys(mapa);
    if (!clsMapeadas.length) {
        alert('⚠️ Mapeie ao menos uma classificação para uma categoria antes de importar.');
        return;
    }

    let totalImportados = 0;
    let totalDuplicatas = 0;
    let totalIgnorados  = 0;
    const porCategoria  = {};

    state.importDados.forEach(row => {
        const catId = mapa[row.classificacao];
        if (!catId) { totalIgnorados++; return; }

        if (!state.produtos[catId]) state.produtos[catId] = [];

        // Verifica duplicata (mesmo nome, sem validade definida)
        const dupl = state.produtos[catId].find(p =>
            p.nome.trim().toLowerCase() === row.nome.toLowerCase()
        );
        if (dupl) {
            totalDuplicatas++;
            return;
        }

        const nomeCategoria = (state.categorias.find(c => c.id == catId) || {}).nome || catId;
        state.produtos[catId].push({
            id: Date.now() + Math.random(),
            codigo: '',
            nome: row.nome,
            validade: '',         // sem validade → usuário preenche depois
            quantidade: 1,
            fabricante: row.fabricante
        });
        totalImportados++;
        porCategoria[nomeCategoria] = (porCategoria[nomeCategoria] || 0) + 1;
    });

    salvarDados();

    // Monta relatório
    let relatorio = `<p><strong>${totalImportados}</strong> produto(s) importado(s) com sucesso.</p>`;
    if (totalDuplicatas) relatorio += `<p style="color:var(--amarelo,#f59e0b)">⚠️ ${totalDuplicatas} produto(s) ignorado(s) por já existirem na categoria.</p>`;
    if (totalIgnorados)  relatorio += `<p style="opacity:.6">ℹ️ ${totalIgnorados} linha(s) ignorada(s) (classificação não mapeada).</p>`;

    if (Object.keys(porCategoria).length) {
        relatorio += '<ul style="margin:.75rem 0 0;padding-left:1.25rem">';
        Object.entries(porCategoria).forEach(([cat, n]) => {
            relatorio += `<li>${escaparHTML(cat)}: <strong>${n}</strong> produto(s)</li>`;
        });
        relatorio += '</ul>';
    }

    document.getElementById('import-resultado-corpo').innerHTML = relatorio;
    _hide('import-mapeamento-area');
    _show('import-resultado');
    atualizarResumoGlobal();
}

export function importCancelar() {
    importarResetar();
}

export function importNovaImportacao() {
    importarResetar();
}

// ===== EXPORTAR PARA EXCEL =====
export function exportarExcel(modo, catIdDirecto, idsSelecao) {
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const wb = XLSX.utils.book_new();

    const FAIXA_LABEL = {
        vencido: 'Vencido',
        critico: '< 3 meses',
        alerta:  '3–6 meses',
        atencao: '6–9 meses',
        proximo: '9–12 meses',
        ok:      '> 12 meses',
    };

    function montarLinhas(catId) {
        const lista = (state.produtos[catId] || []);
        const cat   = state.categorias.find(c => c.id === catId);
        return [...lista]
            .sort((a, b) => diasParaVencer(a.validade) - diasParaVencer(b.validade))
            .map(p => ({
                'Categoria':      cat ? cat.nome : '',
                'Cód. Barras':    p.codigo,
                'Produto':        p.nome,
                'Validade':       formatarData(p.validade),
                'Quantidade':     p.quantidade || 1,
                'Dias Restantes': diasParaVencer(p.validade),
                'Status':         FAIXA_LABEL[calcularFaixa(p.validade)] || '',
            }));
    }

    function adicionarAba(catId) {
        const cat    = state.categorias.find(c => c.id === catId);
        const linhas = montarLinhas(catId);
        if (linhas.length === 0) return null;
        const ws = XLSX.utils.json_to_sheet(linhas);
        aplicarEstilos(ws, linhas);
        XLSX.utils.book_append_sheet(wb, ws, (cat ? cat.nome : 'Cat').substring(0, 31));
        return linhas;
    }

    let nomeArquivo = '';

    if (modo === 'categoria' && state.categoriaAtual) {
        const cat    = state.categorias.find(c => c.id === state.categoriaAtual);
        const linhas = montarLinhas(state.categoriaAtual);
        if (linhas.length === 0) { alert('Esta categoria não tem produtos para exportar.'); return; }
        const ws = XLSX.utils.json_to_sheet(linhas);
        aplicarEstilos(ws, linhas);
        XLSX.utils.book_append_sheet(wb, ws, (cat ? cat.nome : 'Produtos').substring(0, 31));
        nomeArquivo = `Validade_${cat ? cat.nome : 'Categoria'}_${dataHoje.replace(/\//g,'-')}.xlsx`;

    } else if (modo === 'categoria-id' && catIdDirecto) {
        const cat    = state.categorias.find(c => c.id === catIdDirecto);
        const linhas = montarLinhas(catIdDirecto);
        if (linhas.length === 0) { alert('Esta categoria não tem produtos para exportar.'); return; }
        const ws = XLSX.utils.json_to_sheet(linhas);
        aplicarEstilos(ws, linhas);
        XLSX.utils.book_append_sheet(wb, ws, (cat ? cat.nome : 'Produtos').substring(0, 31));
        nomeArquivo = `Validade_${cat ? cat.nome : 'Categoria'}_${dataHoje.replace(/\//g,'-')}.xlsx`;

    } else if (modo === 'selecao' && idsSelecao && idsSelecao.length > 0) {
        let todasLinhas = [];
        idsSelecao.forEach(id => {
            const linhas = adicionarAba(id);
            if (linhas) todasLinhas = todasLinhas.concat(linhas);
        });
        if (todasLinhas.length === 0) { alert('As categorias selecionadas não têm produtos.'); return; }
        if (idsSelecao.length > 1) {
            const wsGeral = XLSX.utils.json_to_sheet(todasLinhas);
            aplicarEstilos(wsGeral, todasLinhas);
            XLSX.utils.book_append_sheet(wb, wsGeral, 'Consolidado');
        }
        nomeArquivo = `Validade_Selecionadas_${dataHoje.replace(/\//g,'-')}.xlsx`;

    } else if (modo === 'tudo') {
        let todasLinhas = [];
        state.categorias.forEach(cat => {
            const linhas = adicionarAba(cat.id);
            if (linhas) todasLinhas = todasLinhas.concat(linhas);
        });
        if (todasLinhas.length === 0) { alert('Não há produtos cadastrados para exportar.'); return; }
        const wsGeral = XLSX.utils.json_to_sheet(todasLinhas);
        aplicarEstilos(wsGeral, todasLinhas);
        XLSX.utils.book_append_sheet(wb, wsGeral, 'Todos os Produtos');
        nomeArquivo = `Controle_Validade_Completo_${dataHoje.replace(/\//g,'-')}.xlsx`;
    }

    if (wb.SheetNames.length === 0) { alert('Nada para exportar.'); return; }
    XLSX.writeFile(wb, nomeArquivo);
}

function aplicarEstilos(ws, linhas) {
    if (!linhas.length) return;

    const range = XLSX.utils.decode_range(ws['!ref']);

    ws['!cols'] = [
        { wch: 20 }, { wch: 22 }, { wch: 38 },
        { wch: 14 }, { wch: 16 }, { wch: 16 },
    ];

    const rows = [];
    for (let r = 0; r <= range.e.r; r++) rows.push({ hpt: r === 0 ? 24 : 18 });
    ws['!rows'] = rows;

    const FAIXA_COR = {
        'Vencido':    'FFD1D5DB',
        '< 3 meses':  'FFFECACA',
        '3–6 meses':  'FFFFEDD5',
        '6–9 meses':  'FFFEF9C3',
        '9–12 meses': 'FFDBEAFE',
        '> 12 meses': 'FFDCFCE7',
    };

    const borda = {
        top:    { style: 'thin', color: { rgb: 'FFB0B8C4' } },
        bottom: { style: 'thin', color: { rgb: 'FFB0B8C4' } },
        left:   { style: 'thin', color: { rgb: 'FFB0B8C4' } },
        right:  { style: 'thin', color: { rgb: 'FFB0B8C4' } },
    };

    const bordaCab = {
        top:    { style: 'medium', color: { rgb: 'FF1E3A5F' } },
        bottom: { style: 'medium', color: { rgb: 'FF1E3A5F' } },
        left:   { style: 'medium', color: { rgb: 'FF1E3A5F' } },
        right:  { style: 'medium', color: { rgb: 'FF1E3A5F' } },
    };

    for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[addr]) ws[addr] = { t: 's', v: '' };
        ws[addr].s = {
            font:      { bold: true, sz: 12, color: { rgb: 'FF1E3A5F' }, name: 'Calibri' },
            fill:      { patternType: 'solid', fgColor: { rgb: 'FFD6E4F7' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border:    bordaCab,
        };
    }

    for (let r = 1; r <= range.e.r; r++) {
        const statusCell = ws[XLSX.utils.encode_cell({ r, c: 5 })];
        const statusVal  = statusCell ? statusCell.v : '';
        const bg = FAIXA_COR[statusVal] || (r % 2 === 0 ? 'FFF5F7FA' : 'FFFFFFFF');

        for (let c = range.s.c; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            if (!ws[addr]) ws[addr] = { t: 's', v: '' };
            ws[addr].s = {
                font:      { sz: 11, name: 'Calibri', bold: false },
                fill:      { patternType: 'solid', fgColor: { rgb: bg } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border:    borda,
            };
        }
    }
}
