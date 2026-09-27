// ============================================
// PONTO DE ENTRADA — index.html
// ============================================
// O HTML usa muitos atributos onclick="funcao(...)" inline. Como
// módulos ES têm escopo próprio (diferente de scripts clássicos,
// que compartilham o escopo global), este arquivo importa a "API
// pública" de cada módulo de funcionalidade e a expõe explicitamente
// em window — assim o HTML continua funcionando sem precisar ser
// reescrito para addEventListener.

import { inputNome, inputFabricante, inputCatNome, inputValidade } from './dom.js';
import { state } from './state.js';

import { alterarTema } from './navigation/tema.js';
import { mudarAba } from './navigation/abas.js';

import { verificarSessao, fazerLogout } from './services/sessaoService.js';
import { carregarDados } from './storage/produtosStorage.js';

import { renderizarSelectCategorias, preencherClassificacao } from './components/renderCategorias.js';
import { renderizarProxValidade } from './components/renderProdutos.js';

import {
    abrirPainel, fecharPainel, editarProduto, removerProduto, salvarProduto,
    cancelarEdicao, atualizarResumoGlobal,
} from './services/produtosService.js';

import {
    abrirModalCategoria, fecharModalCategoria, salvarCategoria, excluirCategoria,
} from './services/categoriasService.js';

import {
    abrirModalUsuario, fecharModalUsuario, salvarUsuario, excluirUsuario,
    abrirModalReset, fecharModalReset, confirmarReset,
} from './services/usuariosService.js';

import {
    carregarUnidades, abrirModalUnidade, fecharModalUnidade, salvarUnidade, excluirUnidade,
} from './services/unidadesService.js';

import {
    importarResetar, importDragOver, importDragLeave, importDrop, importLerArquivo,
    importConfirmar, importCancelar, importNovaImportacao, exportarExcel,
} from './services/excelService.js';

import {
    contagemBuscar, contagemSelecionarProduto, contagemLancar, contagemCancelar,
} from './services/contagemService.js';

// ===== EXPÕE A API PÚBLICA PARA OS onclick="..." DO HTML =====
Object.assign(window, {
    alterarTema,
    mudarAba,
    fazerLogout,
    renderizarProxValidade,
    preencherClassificacao,
    abrirPainel, fecharPainel, editarProduto, removerProduto, salvarProduto, cancelarEdicao,
    abrirModalCategoria, fecharModalCategoria, salvarCategoria, excluirCategoria,
    abrirModalUsuario, fecharModalUsuario, salvarUsuario, excluirUsuario,
    abrirModalReset, fecharModalReset, confirmarReset,
    abrirModalUnidade, fecharModalUnidade, salvarUnidade, excluirUnidade,
    importDragOver, importDragLeave, importDrop, importLerArquivo,
    importConfirmar, importCancelar, importNovaImportacao, exportarExcel,
    contagemBuscar, contagemSelecionarProduto, contagemLancar, contagemCancelar,
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    // Enter navegação
    const _inputCodigo   = document.getElementById('input-codigo');
    const _inputNome     = document.getElementById('input-nome');
    const _inputValidade = document.getElementById('input-validade');
    const _inputFab      = document.getElementById('input-fabricante');
    const _inputCatNome  = document.getElementById('input-categoria-nome');

    if (_inputNome) _inputNome.addEventListener('keydown', e => { if (e.key === 'Enter') { if (_inputFab) _inputFab.focus(); else salvarProduto(); } });
    if (_inputFab)  _inputFab.addEventListener('keydown',  e => { if (e.key === 'Enter') salvarProduto(); });
    if (_inputValidade) _inputValidade.addEventListener('change', () => {
        const erroBanner = document.getElementById('erro-vencido');
        if (!erroBanner) return;
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const val = _inputValidade.value;
        if (!val || new Date(val + 'T00:00:00') >= hoje) {
            erroBanner.classList.add('escondido');
            _inputValidade.style.borderColor = '';
            _inputValidade.style.boxShadow = '';
        }
    });
    if (_inputCatNome)  _inputCatNome.addEventListener('keydown',  e => { if (e.key === 'Enter') salvarCategoria(); });

    // Cadastro de unidades — antes vivia solto dentro do index.html
    const btnUnidade = document.getElementById('aba-unidade');
    if (btnUnidade) {
        btnUnidade.addEventListener('click', function () {
            setTimeout(carregarUnidades, 50);
        });
    }

    verificarSessao();
    carregarDados();
    renderizarSelectCategorias();
    atualizarResumoGlobal();
});
