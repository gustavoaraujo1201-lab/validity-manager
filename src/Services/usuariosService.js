// ============================================
// GESTÃO DE USUÁRIOS
// ============================================

import { state } from '../state.js';
import { carregarUsuarios, salvarUsuarios } from '../storage/usuariosStorage.js';
import { getUnidades } from '../storage/unidadesStorage.js';
import { renderizarTabelaUsuarios } from '../components/renderUsuarios.js';
import { isAdmin } from './sessaoService.js';

export function popularSelectLojas(valorAtual) {
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

export function abrirModalUsuario(id) {
    if (id === 1) { alert('⛔ O administrador raiz não pode ser editado pela interface.'); return; }
    const usuarios = carregarUsuarios();
    const alvo = usuarios.find(x => x.id === id);
    if (alvo && alvo.perfil === 'admin' && id !== state.sessaoAtual.id && state.sessaoAtual.id !== 1) {
        alert('⛔ Você não pode editar outro administrador.');
        return;
    }
    state.idEditandoUsuario = id || null;
    const overlay = document.getElementById('overlay-modal-usuario');
    const modal   = document.getElementById('modal-usuario');

    document.getElementById('mu-nome').value    = '';
    document.getElementById('mu-usuario').value = '';
    document.getElementById('mu-senha').value   = '';
    document.getElementById('mu-perfil').value  = 'colaborador';
    popularSelectLojas('');

    if (state.idEditandoUsuario) {
        const usuarios2 = carregarUsuarios();
        const u = usuarios2.find(x => x.id === id);
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

export function fecharModalUsuario() {
    document.getElementById('overlay-modal-usuario').classList.add('escondido');
    document.getElementById('modal-usuario').classList.add('escondido');
    state.idEditandoUsuario = null;
}

export function capitalizarPalavras(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function salvarUsuario() {
    const nome    = capitalizarPalavras(document.getElementById('mu-nome').value.trim());
    const usuario = capitalizarPalavras(document.getElementById('mu-usuario').value.trim());
    const senha   = document.getElementById('mu-senha').value;
    const perfil  = document.getElementById('mu-perfil').value;
    const selLoja = document.getElementById('mu-unidade');
    const unidadeIdx = selLoja && selLoja.value !== '' ? Number(selLoja.value) : null;

    if (!nome)    { alert('⚠️ Informe o nome do colaborador!'); document.getElementById('mu-nome').focus(); return; }
    if (!usuario) { alert('⚠️ Informe o usuário de login!'); document.getElementById('mu-usuario').focus(); return; }

    let usuarios = carregarUsuarios();

    const duplicado = usuarios.find(u => u.usuario === usuario && u.id !== state.idEditandoUsuario);
    if (duplicado) { alert('⚠️ Este usuário já existe! Escolha outro.'); return; }

    if (state.idEditandoUsuario) {
        const idx = usuarios.findIndex(u => u.id === state.idEditandoUsuario);
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

export function excluirUsuario(id) {
    if (id === 1) { alert('⛔ O administrador raiz não pode ser excluído pela interface.'); return; }
    let usuarios = carregarUsuarios();
    const u = usuarios.find(x => x.id === id);
    if (!u) return;
    if (u.perfil === 'admin' && state.sessaoAtual.id !== 1) { alert('⛔ Apenas o administrador raiz pode excluir outros administradores.'); return; }
    if (!confirm('Excluir o usuário "' + (u.nome || u.usuario) + '"? Esta ação não pode ser desfeita.')) return;
    usuarios = usuarios.filter(x => x.id !== id);
    salvarUsuarios(usuarios);
    renderizarTabelaUsuarios();
}

// ============================================
// RESET DE SENHA — Somente Admin
// ============================================

export function abrirModalReset(id) {
    if (id === 1) { alert('⛔ A senha do administrador raiz não pode ser alterada pela interface.'); return; }
    const usuarios = carregarUsuarios();
    const alvo = usuarios.find(x => x.id === id);
    if (alvo && alvo.perfil === 'admin' && id !== state.sessaoAtual.id && state.sessaoAtual.id !== 1) {
        alert('⛔ Você não pode alterar a senha de outro administrador.');
        return;
    }
    if (!isAdmin()) { alert('⛔ Apenas administradores podem redefinir senhas.'); return; }
    const u = usuarios.find(x => x.id === id);
    if (!u) return;

    state.idResetandoUsuario = id;

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

export function fecharModalReset() {
    document.getElementById('overlay-modal-reset').classList.add('escondido');
    document.getElementById('modal-reset').classList.add('escondido');
    state.idResetandoUsuario = null;
}

export function confirmarReset() {
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
    const idx = usuarios.findIndex(x => x.id === state.idResetandoUsuario);
    if (idx === -1) { fecharModalReset(); return; }

    usuarios[idx].senha = nova;
    salvarUsuarios(usuarios);
    fecharModalReset();

    alert('✅ Senha de "' + (usuarios[idx].nome || usuarios[idx].usuario) + '" redefinida com sucesso!');
}
