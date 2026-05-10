// ============================================
// TEMA — Claro / Escuro
// ============================================

function aplicarTema(tema) {
    const icone = document.getElementById('tema-icone-topo');
    if (tema === 'claro') {
        document.documentElement.classList.add('tema-claro');
        if (icone) icone.textContent = '🌙';
    } else {
        document.documentElement.classList.remove('tema-claro');
        if (icone) icone.textContent = '☀️';
    }
}

function alterarTema() {
    const isClaro = document.documentElement.classList.contains('tema-claro');
    const novoTema = isClaro ? 'escuro' : 'claro';
    localStorage.setItem('cv_tema', novoTema);
    aplicarTema(novoTema);
}

// Aplica tema salvo IMEDIATAMENTE ao carregar
(function() {
    const temaSalvo = localStorage.getItem('cv_tema') || 'escuro';
    aplicarTema(temaSalvo);
})();

// ============================================
// AUTH — Sessão e Permissões
// ============================================

let sessaoAtual = null;

function verificarSessao() {
    const raw = sessionStorage.getItem('cv_sessao');
    if (!raw) { window.location.href = '/login'; return; }
    sessaoAtual = JSON.parse(raw);
    document.body.style.visibility = 'visible';

    // Exibe nome no topo (usa nome completo se existir, senão usuário)
    const nomeExibir = sessaoAtual.nome || sessaoAtual.usuario;
    document.getElementById('topo-nome-usuario').textContent = '👤 ' + nomeExibir;

    // Mostra aba Usuários só para admin
    if (sessaoAtual.perfil === 'admin') {
        document.querySelectorAll('.aba-admin').forEach(el => el.classList.remove('escondido'));
    }

    aplicarPermissoes();
}

function aplicarPermissoes() {
    if (sessaoAtual.perfil === 'admin') return; // admin vê tudo

    // Colaborador: esconde exportar e excluir
    document.querySelectorAll('.btn-exportar').forEach(b => b.style.display = 'none');
    document.querySelectorAll('.painel-acoes-export').forEach(b => b.style.display = 'none');

    // Colaborador: esconde botão de nova categoria
    document.querySelectorAll('.btn-nova-categoria').forEach(b => b.style.display = 'none');
}

function fazerLogout() {
    if (!confirm('Deseja sair do sistema?')) return;
    sessionStorage.removeItem('cv_sessao');
    window.location.href = '/login';
}

function isAdmin() {
    return sessaoAtual && sessaoAtual.perfil === 'admin';
}

// ============================================
// GESTÃO DE USUÁRIOS
// ============================================

let idEditandoUsuario = null;

function carregarUsuarios() {
    return JSON.parse(localStorage.getItem('cv_usuarios') || '[]');
}

function salvarUsuarios(lista) {
    localStorage.setItem('cv_usuarios', JSON.stringify(lista));
}

// Retorna lista de unidades cadastradas (uso interno do script.js)
function getUnidades() {
    return JSON.parse(localStorage.getItem('cv_unidades') || '[]');
}

function renderizarTabelaUsuarios() {
    const usuarios  = carregarUsuarios();
    const unidades  = getUnidades();
    const el        = document.getElementById('tabela-usuarios');

    let html = `
        <div class="tabela-usuarios-header">
            <span>Nome</span>
            <span>Usuário</span>
            <span>Loja</span>
            <span>Perfil</span>
            <span>Status</span>
            <span>Ações</span>
        </div>`;

    usuarios.forEach(u => {
        const euMesmo = u.id === sessaoAtual.id;
        const badgePerfil = u.perfil === 'admin'
            ? '<span class="badge-admin">Admin</span>'
            : '<span class="badge-colab">Colaborador</span>';
        const badgeEu = euMesmo ? '<span class="badge-eu">Você</span>' : '';

        // Busca nome da loja vinculada
        let nomeLoja = '—';
        if (u.unidadeIdx !== undefined && u.unidadeIdx !== null && u.unidadeIdx !== '') {
            const loja = unidades[u.unidadeIdx];
            nomeLoja = loja ? loja.nome : '—';
        }

        const adminRaiz      = u.id === 1;
        const souAdminRaiz   = sessaoAtual.id === 1;
        const outroAdmin     = u.perfil === 'admin' && !euMesmo && !adminRaiz;

        let acoes;
        if (adminRaiz) {
            // Admin raiz: completamente bloqueado para todos
            acoes = '<span style="font-size:0.75rem;color:#9ca3af" title="Conta protegida">🔒 Protegido</span>';
        } else if (euMesmo) {
            // Eu mesmo: posso editar e trocar minha senha, mas não me excluir
            acoes = `<div class="acoes">
                <button class="btn-editar" onclick="abrirModalUsuario(${u.id})" title="Editar meu perfil">✏️</button>
                <button class="btn-reset"  onclick="abrirModalReset(${u.id})"   title="Trocar minha senha">🔑</button>
               </div>`;
        } else if (outroAdmin && !souAdminRaiz) {
            // Outro admin sendo visto por um admin comum: bloqueado
            acoes = '<span style="font-size:0.75rem;color:#9ca3af" title="Outro administrador não pode ser editado">🔒</span>';
        } else {
            // Colaborador (qualquer admin), ou outro admin sendo visto pelo admin raiz
            acoes = `<div class="acoes">
                <button class="btn-editar"  onclick="abrirModalUsuario(${u.id})" title="Editar">✏️</button>
                <button class="btn-reset"   onclick="abrirModalReset(${u.id})"   title="Redefinir senha">🔑</button>
                <button class="btn-excluir" onclick="excluirUsuario(${u.id})"    title="Excluir">🗑️</button>
               </div>`;
        }

        html += `
            <div class="usuario-item ${euMesmo ? 'eu' : ''}">
                <div><strong>${u.nome || u.usuario}</strong>${badgeEu}</div>
                <div style="color:#6b7280;font-size:0.82rem">${u.usuario}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary)">${nomeLoja}</div>
                <div>${badgePerfil}</div>
                <div><span style="color:#16a34a;font-size:0.78rem;font-weight:600">● Ativo</span></div>
                <div>${acoes}</div>
            </div>`;
    });

    el.innerHTML = html;
}

function popularSelectLojas(valorAtual) {
    const sel = document.getElementById('mu-unidade');
    if (!sel) return;
    const unidades = getUnidades();
    sel.innerHTML = '<option value="">— Sem loja vinculada —</option>';
    unidades.forEach((u, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = u.nome;
        sel.appendChild(opt);
    });
    if (valorAtual !== undefined && valorAtual !== null && valorAtual !== '') {
        sel.value = valorAtual;
    }
}

function abrirModalUsuario(id) {
    if (id === 1) { alert('⛔ O administrador raiz não pode ser editado pela interface.'); return; }
    const usuarios = carregarUsuarios();
    const alvo = usuarios.find(x => x.id === id);
    if (alvo && alvo.perfil === 'admin' && id !== sessaoAtual.id && sessaoAtual.id !== 1) {
        alert('⛔ Você não pode editar outro administrador.');
        return;
    }
    idEditandoUsuario = id || null;
    const overlay = document.getElementById('overlay-modal-usuario');
    const modal   = document.getElementById('modal-usuario');

    document.getElementById('mu-nome').value    = '';
    document.getElementById('mu-usuario').value = '';
    document.getElementById('mu-senha').value   = '';
    document.getElementById('mu-perfil').value  = 'colaborador';
    popularSelectLojas('');

    if (idEditandoUsuario) {
        const usuarios = carregarUsuarios();
        const u = usuarios.find(x => x.id === id);
        if (u) {
            document.getElementById('modal-usuario-titulo').textContent = 'Editar usuário';
            document.getElementById('mu-nome').value    = u.nome || '';
            document.getElementById('mu-usuario').value = u.usuario;
            document.getElementById('mu-perfil').value  = u.perfil;
            document.getElementById('mu-senha').placeholder = 'Deixe em branco para não alterar';
            popularSelectLojas(u.unidadeIdx !== undefined ? u.unidadeIdx : '');
        }
    } else {
        document.getElementById('modal-usuario-titulo').textContent = 'Novo usuário';
        document.getElementById('mu-senha').placeholder = 'Mínimo 4 caracteres';
    }

    overlay.classList.remove('escondido');
    modal.classList.remove('escondido');
    document.getElementById('mu-nome').focus();
}

function fecharModalUsuario() {
    document.getElementById('overlay-modal-usuario').classList.add('escondido');
    document.getElementById('modal-usuario').classList.add('escondido');
    idEditandoUsuario = null;
}

function capitalizarPalavras(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

function salvarUsuario() {
    const nome    = capitalizarPalavras(document.getElementById('mu-nome').value.trim());
    const usuario = capitalizarPalavras(document.getElementById('mu-usuario').value.trim());
    const senha   = document.getElementById('mu-senha').value;
    const perfil  = document.getElementById('mu-perfil').value;
    const selLoja = document.getElementById('mu-unidade');
    const unidadeIdx = selLoja && selLoja.value !== '' ? Number(selLoja.value) : null;

    if (!nome)    { alert('⚠️ Informe o nome do colaborador!'); document.getElementById('mu-nome').focus(); return; }
    if (!usuario) { alert('⚠️ Informe o usuário de login!'); document.getElementById('mu-usuario').focus(); return; }

    let usuarios = carregarUsuarios();

    const duplicado = usuarios.find(u => u.usuario === usuario && u.id !== idEditandoUsuario);
    if (duplicado) { alert('⚠️ Este usuário já existe! Escolha outro.'); return; }

    if (idEditandoUsuario) {
        const idx = usuarios.findIndex(u => u.id === idEditandoUsuario);
        if (idx !== -1) {
            usuarios[idx].nome       = nome;
            usuarios[idx].usuario    = usuario;
            usuarios[idx].perfil     = perfil;
            usuarios[idx].unidadeIdx = unidadeIdx;
            if (senha) {
                if (senha.length < 4) { alert('⚠️ A senha deve ter pelo menos 4 caracteres!'); return; }
                usuarios[idx].senha = senha;
            }
        }
    } else {
        if (!senha || senha.length < 4) { alert('⚠️ Defina uma senha com pelo menos 4 caracteres!'); return; }
        const novoId = Date.now();
        usuarios.push({ id: novoId, nome, usuario, senha, perfil, unidadeIdx });
    }

    salvarUsuarios(usuarios);
    fecharModalUsuario();
    renderizarTabelaUsuarios();
}

function excluirUsuario(id) {
    if (id === 1) { alert('⛔ O administrador raiz não pode ser excluído pela interface.'); return; }
    let usuarios = carregarUsuarios();
    const u = usuarios.find(x => x.id === id);
    if (!u) return;
    if (u.perfil === 'admin' && sessaoAtual.id !== 1) { alert('⛔ Apenas o administrador raiz pode excluir outros administradores.'); return; }
    if (!confirm('Excluir o usuário "' + (u.nome || u.usuario) + '"? Esta ação não pode ser desfeita.')) return;
    usuarios = usuarios.filter(x => x.id !== id);
    salvarUsuarios(usuarios);
    renderizarTabelaUsuarios();
}

// ============================================
// RESET DE SENHA — Somente Admin
// ============================================

let idResetandoUsuario = null;

function abrirModalReset(id) {
    if (id === 1) { alert('⛔ A senha do administrador raiz não pode ser alterada pela interface.'); return; }
    const usuarios = carregarUsuarios();
    const alvo = usuarios.find(x => x.id === id);
    if (alvo && alvo.perfil === 'admin' && id !== sessaoAtual.id && sessaoAtual.id !== 1) {
        alert('⛔ Você não pode alterar a senha de outro administrador.');
        return;
    }
    if (!isAdmin()) { alert('⛔ Apenas administradores podem redefinir senhas.'); return; }
    const u = usuarios.find(x => x.id === id);
    if (!u) return;

    idResetandoUsuario = id;

    document.getElementById('reset-descricao').textContent =
        (u.nome || u.usuario) + ' · @' + u.usuario;
    document.getElementById('reset-nova-senha').value      = '';
    document.getElementById('reset-confirmar-senha').value = '';
    document.getElementById('reset-msg-erro').classList.add('escondido');
    document.getElementById('reset-msg-erro').textContent  = '';

    document.getElementById('overlay-modal-reset').classList.remove('escondido');
    document.getElementById('modal-reset').classList.remove('escondido');
    document.getElementById('reset-nova-senha').focus();
}

function fecharModalReset() {
    document.getElementById('overlay-modal-reset').classList.add('escondido');
    document.getElementById('modal-reset').classList.add('escondido');
    idResetandoUsuario = null;
}

function confirmarReset() {
    if (!isAdmin()) { alert('⛔ Sem permissão.'); return; }

    const nova     = document.getElementById('reset-nova-senha').value;
    const confirma = document.getElementById('reset-confirmar-senha').value;
    const msgErro  = document.getElementById('reset-msg-erro');

    msgErro.classList.add('escondido');
    msgErro.textContent = '';

    if (!nova) {
        msgErro.textContent = '⚠️ Digite a nova senha.';
        msgErro.classList.remove('escondido');
        document.getElementById('reset-nova-senha').focus();
        return;
    }
    if (nova.length < 4) {
        msgErro.textContent = '⚠️ A senha deve ter pelo menos 4 caracteres.';
        msgErro.classList.remove('escondido');
        return;
    }
    if (nova !== confirma) {
        msgErro.textContent = '⚠️ As senhas não coincidem.';
        msgErro.classList.remove('escondido');
        document.getElementById('reset-confirmar-senha').value = '';
        document.getElementById('reset-confirmar-senha').focus();
        return;
    }

    let usuarios = carregarUsuarios();
    const idx = usuarios.findIndex(x => x.id === idResetandoUsuario);
    if (idx === -1) { fecharModalReset(); return; }

    usuarios[idx].senha = nova;
    salvarUsuarios(usuarios);
    fecharModalReset();

    alert('✅ Senha de "' + (usuarios[idx].nome || usuarios[idx].usuario) + '" redefinida com sucesso!');
}

// ============================================
// script.js — Versão com Abas: Cadastro | Categorias
// ============================================

// ===== ELEMENTOS =====
const inputCodigo    = document.getElementById('input-codigo');
const inputNome      = document.getElementById('input-nome');
const inputValidade  = document.getElementById('input-validade');
const selectCategoria = document.getElementById('select-categoria');
const btnCadastrar   = document.getElementById('btn-cadastrar');
const listaEl        = document.getElementById('lista-produtos');
const inputCatNome   = document.getElementById('input-categoria-nome');

// ===== ESTADO =====
let categorias     = [];
let produtos       = {};
let categoriaAtual = null;  // categoria aberta no painel
let idEditando     = null;
let idEditandoCat  = null;

// ===== localStorage =====
function carregarDados() {
    const catSalvas  = localStorage.getItem('categorias');
    const prodSalvos = localStorage.getItem('produtos');
    categorias = catSalvas  ? JSON.parse(catSalvas)  : [];
    produtos   = prodSalvos ? JSON.parse(prodSalvos) : {};
}

function salvarDados() {
    localStorage.setItem('categorias', JSON.stringify(categorias));
    localStorage.setItem('produtos',   JSON.stringify(produtos));
}

// ===== NAVEGAÇÃO POR ABAS =====
let categoriasExportSelecionadas = new Set();

function mudarAba(aba) {
    document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));

    document.getElementById('aba-' + aba).classList.add('ativa');
    document.getElementById('secao-' + aba).classList.add('ativa');

    if (aba === 'categorias') renderizarGridCategorias();
    if (aba === 'cadastro')   renderizarSelectCategorias();
    if (aba === 'exportar')   renderizarGridExport();
    if (aba === 'usuarios')   renderizarTabelaUsuarios();
}

// ===== FILTRO DE CATEGORIAS POR SESSÃO =====
// Para colaborador: filtra por donoId E por loja (unidadeIdx)
function categoriasDeSessao() {
    if (isAdmin()) return categorias;

    // Colaborador: vê categorias atribuídas a ele
    // Se o colaborador tiver loja vinculada, também filtra categorias dessa loja
    return categorias.filter(c => {
        const ehDono = c.donoId === sessaoAtual.id;
        return ehDono;
    });
}

function renderizarSelectCategorias() {
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
}

// ===== GRID DE CATEGORIAS (aba Categorias) =====
function renderizarGridCategorias() {
    const grid = document.getElementById('grid-categorias');

    // Fecha painel ao re-renderizar grid
    document.getElementById('painel-produtos').classList.add('escondido');
    grid.classList.remove('escondido');

    const lista = categoriasDeSessao();

    if (lista.length === 0) {
        grid.innerHTML = '<div class="cat-vazia">Nenhuma categoria criada ainda.</div>';
        atualizarBadgeAbaCategorias();
        return;
    }

    const usuarios  = carregarUsuarios();
    const unidades  = getUnidades();

    let html = '';
    lista.forEach(cat => {
        const prods   = produtos[cat.id] || [];
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
                        if (loja) lojaTag = ` · 🏪 ${loja.nome}`;
                    }
                    tagDono = `<span class="cat-tag-dono">👤 ${dono.nome || dono.usuario}${lojaTag}</span>`;
                }
            } else {
                tagDono = `<span class="cat-tag-dono cat-tag-sem-dono">⚠️ Sem colaborador</span>`;
            }
        }

        html += `
        <div class="${temAlerta}" onclick="abrirPainel('${cat.id}')">
            <div class="card-cat-topo">
                <span class="card-cat-nome">${cat.nome}</span>
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
    atualizarBadgeAbaCategorias();
}

function atualizarBadgeAbaCategorias() { /* badge removido */ }

// ===== PAINEL DE PRODUTOS (dentro da aba Categorias) =====
function abrirPainel(id) {
    categoriaAtual = id;
    const cat = categorias.find(c => c.id === id);

    document.getElementById('grid-categorias').classList.add('escondido');
    document.getElementById('painel-produtos').classList.remove('escondido');

    document.getElementById('painel-titulo').textContent = cat ? cat.nome : '';
    renderizarListaPainel();
}

function fecharPainel() {
    categoriaAtual = null;
    document.getElementById('painel-produtos').classList.add('escondido');
    document.getElementById('grid-categorias').classList.remove('escondido');
}

function renderizarListaPainel() {
    if (!categoriaAtual) return;
    const lista = produtos[categoriaAtual] || [];

    // Contadores por faixa
    const contadores = { vencido:0, critico:0, alerta:0, atencao:0, proximo:0, ok:0 };

    const total = lista.length;
    document.getElementById('painel-contador').textContent = total + (total === 1 ? ' produto' : ' produtos');

    if (lista.length === 0) {
        listaEl.innerHTML = '<p class="lista-vazia">Nenhum produto nesta categoria ainda.<br><small>Vá em <strong>Cadastro</strong> para adicionar produtos.</small></p>';
        document.getElementById('p-total').textContent    = 0;
        document.getElementById('p-aviso').textContent    = 0;
        document.getElementById('p-vencidos').textContent = 0;
        return;
    }

    // Ordena: mais urgentes primeiro
    const ordenados = [...lista].sort((a, b) => diasParaVencer(a.validade) - diasParaVencer(b.validade));

    let html = `
        <div class="cabecalho-lista">
            <span>Cód. Barras</span>
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
        if (dias < 0)        diasTexto = `<span class="dias-texto vencido">${Math.abs(dias)}d atrás</span>`;
        else if (dias === 0) diasTexto = `<span class="dias-texto critico">Hoje!</span>`;
        else                 diasTexto = `<span class="dias-texto ${faixa}">${dias} dias</span>`;

        const badge = `<span class="badge ${cfg.classe}">${cfg.label}</span>`;

        html += `
            <div class="produto-item faixa-${faixa}">
                <div class="produto-codigo-col">${produto.codigo}</div>
                <div class="produto-nome-col">${produto.nome}</div>
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
    document.getElementById('p-total').textContent    = lista.length;
    document.getElementById('p-aviso').textContent    = contadores.critico;
    document.getElementById('p-vencidos').textContent = contadores.alerta + contadores.atencao;
    atualizarResumoGlobal();
}

// ===== EDITAR PRODUTO (vai para aba Cadastro) =====
function editarProduto(id) {
    const lista = produtos[categoriaAtual] || [];
    const produto = lista.find(p => p.id === id);
    if (!produto) return;

    // Muda para aba de cadastro
    mudarAba('cadastro');

    // Preenche o formulário
    selectCategoria.value   = categoriaAtual;
    inputCodigo.value       = produto.codigo;
    inputNome.value         = produto.nome;
    inputValidade.value     = produto.validade;

    idEditando = id;

    btnCadastrar.textContent = '💾 Salvar alterações';
    btnCadastrar.classList.add('btn-editando');
    document.getElementById('btn-cancelar').style.display = 'block';
    document.getElementById('banner-editando').classList.remove('escondido');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    inputCodigo.focus();
}

// ===== REMOVER PRODUTO =====
function removerProduto(id) {
    if (idEditando === id) cancelarEdicao();
    produtos[categoriaAtual] = (produtos[categoriaAtual] || []).filter(p => p.id !== id);
    salvarDados();
    renderizarListaPainel();
    renderizarGridCategorias();
    // Re-abre o painel (renderizarGridCategorias fecha)
    abrirPainel(categoriaAtual);
}

// ===== SALVAR PRODUTO =====
function salvarProduto() {
    const catId    = selectCategoria.value;
    const codigo   = inputCodigo.value.trim();
    const nome     = inputNome.value.trim();
    const validade = inputValidade.value;

    if (!catId)   { alert('⚠️ Selecione uma categoria!'); selectCategoria.focus(); return; }
    if (!codigo)  { alert('⚠️ Informe o código de barras!'); inputCodigo.focus(); return; }
    if (!nome)    { alert('⚠️ Informe o nome do produto!'); inputNome.focus(); return; }
    if (!validade){ alert('⚠️ Informe a data de validade!'); inputValidade.focus(); return; }

    // ── 1. BLOQUEIA PRODUTO VENCIDO ─────────────────────────────
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const dataVal = new Date(validade + 'T00:00:00');
    if (dataVal <= hoje) {
        alert('🚫 PRODUTO VENCIDO\n\nA data informada está vencida ou vence hoje.\nNão é permitido cadastrar. Verifique a validade!');
        inputValidade.style.borderColor = '#dc2626';
        inputValidade.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.25)';
        inputValidade.focus();
        return;
    }
    inputValidade.style.borderColor = '';
    inputValidade.style.boxShadow = '';

    if (!produtos[catId]) produtos[catId] = [];

    // ── 2. DUPLICATA: mesmo código + mesmo nome → soma quantidade ─
    const inputQtd = document.getElementById('input-quantidade');
    const quantidade = parseInt(inputQtd ? inputQtd.value : '1') || 1;

    if (idEditando === null) {
        const duplicado = (produtos[catId] || []).find(
            p => p.codigo.trim() === codigo && p.nome.trim().toLowerCase() === nome.toLowerCase()
        );
        if (duplicado) {
            const qtdAtual = parseInt(duplicado.quantidade) || 1;
            duplicado.quantidade = qtdAtual + quantidade;
            salvarDados();
            limparFormulario();
            atualizarResumoGlobal();
            mostrarSucessoDuplicata(qtdAtual + quantidade, duplicado.nome);
            return;
        }
        produtos[catId].push({ id: Date.now(), codigo, nome, validade, quantidade });
    } else {
        // Se mudou de categoria durante edição
        const catOrigem = Object.keys(produtos).find(k => produtos[k].some(p => p.id === idEditando));
        if (catOrigem && catOrigem !== catId) {
            produtos[catOrigem] = produtos[catOrigem].filter(p => p.id !== idEditando);
            produtos[catId].push({ id: idEditando, codigo, nome, validade });
        } else {
            const idx = produtos[catId].findIndex(p => p.id === idEditando);
            if (idx !== -1) {
                produtos[catId][idx] = { id: idEditando, codigo, nome, validade };
            }
        }
        idEditando = null;
    }

    salvarDados();
    limparFormulario();
    atualizarResumoGlobal();

    // Feedback visual
    mostrarSucesso();
}

function mostrarSucesso() {
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
function mostrarErroCampo(campo, idErro, mensagem) {
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

function esconderErroCampo(campo, idErro) {
    campo.style.borderColor = '';
    campo.style.boxShadow = '';
    const el = document.getElementById(idErro);
    if (el) el.style.display = 'none';
}

// Feedback quando produto duplicado é somado
function mostrarSucessoDuplicata(novaQtd, nomeProduto) {
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
function cancelarEdicao() {
    idEditando = null;
    limparFormulario();
}

// ===== LIMPAR FORMULÁRIO =====
function limparFormulario() {
    inputCodigo.value   = '';
    inputNome.value     = '';
    inputValidade.value = '';
    const inputQtd = document.getElementById('input-quantidade');
    if (inputQtd) inputQtd.value = 1;
    esconderErroCampo(inputValidade, 'erro-vencido-inline');
    btnCadastrar.textContent = '✅ Cadastrar produto';
    btnCadastrar.classList.remove('btn-editando');
    document.getElementById('btn-cancelar').style.display = 'none';
    document.getElementById('banner-editando').classList.add('escondido');
}

// ===== MODAL CATEGORIA =====
function abrirModalCategoria(idCat) {
    if (!isAdmin()) return; // apenas admin cria/renomeia categorias
    idEditandoCat = idCat || null;

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

    if (idEditandoCat) {
        const cat = categorias.find(c => c.id === idEditandoCat);
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

function fecharModalCategoria() {
    document.getElementById('modal-categoria').classList.add('escondido');
    document.getElementById('overlay-modal').classList.add('escondido');
    idEditandoCat = null;
}

function salvarCategoria() {
    const nome = inputCatNome.value.trim();
    if (!nome) { alert('Digite um nome para a categoria!'); return; }

    const selColab = document.getElementById('select-cat-colaborador');
    const donoIdRaw = selColab ? selColab.value : '';
    const donoId = donoIdRaw ? (isNaN(donoIdRaw) ? donoIdRaw : Number(donoIdRaw)) : null;

    if (idEditandoCat) {
        const idx = categorias.findIndex(c => c.id === idEditandoCat);
        if (idx !== -1) {
            categorias[idx].nome   = nome;
            categorias[idx].donoId = donoId;
        }
    } else {
        const novoId = 'cat_' + Date.now();
        categorias.push({ id: novoId, nome, donoId });
        produtos[novoId] = [];
    }

    salvarDados();
    fecharModalCategoria();
    renderizarSelectCategorias();
    renderizarGridCategorias();
    atualizarResumoGlobal();
}

function excluirCategoria(id) {
    const cat = categorias.find(c => c.id === id);
    const qtd = (produtos[id] || []).length;
    const msg = qtd > 0
        ? `Excluir "${cat.nome}" e seus ${qtd} produto(s)? Não pode ser desfeito.`
        : `Excluir a categoria "${cat.nome}"?`;
    if (!confirm(msg)) return;

    categorias = categorias.filter(c => c.id !== id);
    delete produtos[id];

    if (categoriaAtual === id) fecharPainel();

    salvarDados();
    renderizarSelectCategorias();
    renderizarGridCategorias();
    atualizarResumoGlobal();
}

// ===== RESUMO GLOBAL =====
function atualizarResumoGlobal() {
    let total = 0, prox3 = 0, prox6 = 0;
    const minhascats = categoriasDeSessao();
    minhascats.forEach(cat => {
        (produtos[cat.id] || []).forEach(p => {
            total++;
            const dias = diasParaVencer(p.validade);
            if (dias >= 0 && dias <= 90)  prox3++;  // até 3 meses
            if (dias > 90 && dias <= 270) prox6++;  // entre 3 e 9 meses
        });
    });
    document.getElementById('g-total').textContent  = total;
    document.getElementById('g-prox3').textContent  = prox3;
    document.getElementById('g-prox6').textContent  = prox6;
    document.getElementById('g-cats').textContent   = categoriasDeSessao().length;
    atualizarBadgeAbaCategorias();
}

// ===== UTILITÁRIOS =====

// Retorna o número de dias até o vencimento (negativo = vencido)
function diasParaVencer(dataValidade) {
    const hoje   = new Date();
    hoje.setHours(0,0,0,0);
    const dataVal = new Date(dataValidade + 'T00:00:00');
    return Math.ceil((dataVal - hoje) / (1000 * 60 * 60 * 24));
}

/*
  FAIXAS DE ALERTA:
  vencido   → dias < 0         → cinza escuro
  critico   → 0–90 dias        → vermelho   (<3 meses)
  alerta    → 91–180 dias      → laranja    (3–6 meses)
  atencao   → 181–270 dias     → amarelo    (6–9 meses)
  proximo   → 271–365 dias     → azul       (9–12 meses)
  ok        → > 365 dias       → verde      (>12 meses)
*/
function calcularFaixa(dataValidade) {
    const dias = diasParaVencer(dataValidade);
    if (dias < 0)    return 'vencido';
    if (dias <= 90)  return 'critico';
    if (dias <= 180) return 'alerta';
    if (dias <= 270) return 'atencao';
    if (dias <= 365) return 'proximo';
    return 'ok';
}

// Mantido para compatibilidade com renderizarGridCategorias
function calcularStatus(dataValidade) {
    const faixa = calcularFaixa(dataValidade);
    if (faixa === 'vencido') return 'vencido';
    if (faixa === 'critico' || faixa === 'alerta') return 'aviso';
    return 'ok';
}

const FAIXA_CONFIG = {
    vencido: { label: '✗ Vencido',       classe: 'badge-vencido',  cor: '#6b7280' },
    critico: { label: '🔴 < 3 meses',    classe: 'badge-critico',  cor: '#dc2626' },
    alerta:  { label: '🟠 3–6 meses',    classe: 'badge-alerta',   cor: '#ea580c' },
    atencao: { label: '🟡 6–9 meses',    classe: 'badge-atencao',  cor: '#ca8a04' },
    proximo: { label: '🔵 9–12 meses',   classe: 'badge-proximo',  cor: '#2563eb' },
    ok:      { label: '🟢 > 12 meses',   classe: 'badge-ok',       cor: '#16a34a' },
};

function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ===== GRID DE EXPORTAÇÃO =====
function renderizarGridExport() {
    const grid = document.getElementById('export-grid-cats');
    categoriasExportSelecionadas = new Set();
    atualizarBarraSel();

    if (categorias.length === 0) {
        grid.innerHTML = '<p class="lista-vazia">Nenhuma categoria cadastrada ainda.</p>';
        return;
    }

    let html = '';
    categorias.forEach(cat => {
        const lista    = produtos[cat.id] || [];
        const total    = lista.length;
        let aviso = 0, vencidos = 0;
        lista.forEach(p => {
            const f = calcularFaixa(p.validade);
            if (f === 'critico' || f === 'alerta' || f === 'atencao') aviso++;
            if (f === 'vencido') vencidos++;
        });

        html += `
        <div class="export-cat-card" id="expcard-${cat.id}" onclick="toggleSelecaoExport('${cat.id}')">
            <div class="export-cat-check" id="expcheck-${cat.id}">
                <span class="check-box">☐</span>
            </div>
            <div class="export-cat-info">
                <div class="export-cat-nome">${cat.nome}</div>
                <div class="export-cat-stats">
                    <span>${total} produto${total !== 1 ? 's' : ''}</span>
                    ${vencidos > 0 ? `<span class="pill pill-vencido">${vencidos} vencido${vencidos > 1 ? 's' : ''}</span>` : ''}
                    ${aviso > 0    ? `<span class="pill pill-aviso">${aviso} em alerta</span>` : ''}
                </div>
            </div>
            <button class="btn-export-rapido" onclick="event.stopPropagation(); exportarExcel('categoria-id', '${cat.id}')"
                title="Exportar só esta categoria">
                📊 Exportar
            </button>
        </div>`;
    });

    grid.innerHTML = html;
}

function toggleSelecaoExport(id) {
    const card  = document.getElementById('expcard-' + id);
    const check = document.getElementById('expcheck-' + id).querySelector('.check-box');

    if (categoriasExportSelecionadas.has(id)) {
        categoriasExportSelecionadas.delete(id);
        card.classList.remove('selecionado');
        check.textContent = '☐';
    } else {
        categoriasExportSelecionadas.add(id);
        card.classList.add('selecionado');
        check.textContent = '☑';
    }
    atualizarBarraSel();
}

function atualizarBarraSel() {
    const barra = document.getElementById('export-barra-sel');
    const qtd   = document.getElementById('export-qtd-sel');
    const n = categoriasExportSelecionadas.size;
    if (n > 0) {
        barra.classList.remove('escondido');
        qtd.textContent = n;
    } else {
        barra.classList.add('escondido');
    }
}

function limparSelecaoExport() {
    categoriasExportSelecionadas.forEach(id => {
        const card  = document.getElementById('expcard-' + id);
        const check = document.getElementById('expcheck-' + id);
        if (card)  card.classList.remove('selecionado');
        if (check) check.querySelector('.check-box').textContent = '☐';
    });
    categoriasExportSelecionadas = new Set();
    atualizarBarraSel();
}

function exportarSelecionadas() {
    if (categoriasExportSelecionadas.size === 0) return;
    const ids = [...categoriasExportSelecionadas];
    exportarExcel('selecao', null, ids);
}

// ===== EXPORTAR PARA EXCEL =====
function exportarExcel(modo, catIdDirecto, idsSelecao) {
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
        const lista = (produtos[catId] || []);
        const cat   = categorias.find(c => c.id === catId);
        return [...lista]
            .sort((a, b) => diasParaVencer(a.validade) - diasParaVencer(b.validade))
            .map(p => ({
                'Categoria':      cat ? cat.nome : '',
                'Cód. Barras':    p.codigo,
                'Produto':        p.nome,
                'Validade':       formatarData(p.validade),
                'Dias Restantes': diasParaVencer(p.validade),
                'Status':         FAIXA_LABEL[calcularFaixa(p.validade)] || '',
            }));
    }

    function adicionarAba(catId) {
        const cat    = categorias.find(c => c.id === catId);
        const linhas = montarLinhas(catId);
        if (linhas.length === 0) return null;
        const ws = XLSX.utils.json_to_sheet(linhas);
        aplicarEstilos(ws, linhas);
        XLSX.utils.book_append_sheet(wb, ws, (cat ? cat.nome : 'Cat').substring(0, 31));
        return linhas;
    }

    let nomeArquivo = '';

    if (modo === 'categoria' && categoriaAtual) {
        const cat    = categorias.find(c => c.id === categoriaAtual);
        const linhas = montarLinhas(categoriaAtual);
        if (linhas.length === 0) { alert('Esta categoria não tem produtos para exportar.'); return; }
        const ws = XLSX.utils.json_to_sheet(linhas);
        aplicarEstilos(ws, linhas);
        XLSX.utils.book_append_sheet(wb, ws, (cat ? cat.nome : 'Produtos').substring(0, 31));
        nomeArquivo = `Validade_${cat ? cat.nome : 'Categoria'}_${dataHoje.replace(/\//g,'-')}.xlsx`;

    } else if (modo === 'categoria-id' && catIdDirecto) {
        const cat    = categorias.find(c => c.id === catIdDirecto);
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
        categorias.forEach(cat => {
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

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    // Enter navegação
    const _inputCodigo   = document.getElementById('input-codigo');
    const _inputNome     = document.getElementById('input-nome');
    const _inputValidade = document.getElementById('input-validade');
    const _inputCatNome  = document.getElementById('input-categoria-nome');

    if (_inputCodigo)   _inputCodigo.addEventListener('keydown',   e => { if (e.key === 'Enter') _inputNome.focus(); });
    if (_inputNome)     _inputNome.addEventListener('keydown',     e => { if (e.key === 'Enter') _inputValidade.focus(); });
    if (_inputValidade) _inputValidade.addEventListener('keydown', e => { if (e.key === 'Enter') salvarProduto(); });
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

    verificarSessao();
    carregarDados();
    renderizarSelectCategorias();
    atualizarResumoGlobal();
});
