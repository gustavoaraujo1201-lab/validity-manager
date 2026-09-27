// ============================================
// AUTH — Sessão e Permissões
// ============================================

import { state } from '../state.js';

export function verificarSessao() {
    const raw = sessionStorage.getItem('cv_sessao');
    if (!raw) { window.location.href = '/login'; return; }
    state.sessaoAtual = JSON.parse(raw);
    document.body.style.visibility = 'visible';

    // Exibe nome no topo (usa nome completo se existir, senão usuário)
    const nomeExibir = state.sessaoAtual.nome || state.sessaoAtual.usuario;
    document.getElementById('topo-nome-usuario').textContent = '👤 ' + nomeExibir;

    // Mostra aba Usuários só para admin
    if (state.sessaoAtual.perfil === 'admin') {
        document.querySelectorAll('.aba-admin').forEach(el => el.classList.remove('escondido'));
    }

    aplicarPermissoes();
}

export function aplicarPermissoes() {
    if (state.sessaoAtual.perfil === 'admin') return; // admin vê tudo

    // Colaborador: esconde exportar e excluir
    document.querySelectorAll('.btn-exportar').forEach(b => b.style.display = 'none');
    document.querySelectorAll('.painel-acoes-export').forEach(b => b.style.display = 'none');

    // Colaborador: esconde botão de nova categoria
    document.querySelectorAll('.btn-nova-categoria').forEach(b => b.style.display = 'none');
}

export function fazerLogout() {
    if (!confirm('Deseja sair do sistema?')) return;
    sessionStorage.removeItem('cv_sessao');
    window.location.href = '/login';
}

export function isAdmin() {
    return state.sessaoAtual && state.sessaoAtual.perfil === 'admin';
}

// ===== LOGIN (usado em login.html) =====

// IMPORTANTE: só cria o admin raiz se ele não existir (localStorage vazio/corrompido).
// Antes, esta função sobrescrevia o admin com usuario/admin a CADA carregamento da
// tela de login, tornando impossível manter uma senha alterada. Corrigido (mantido
// aqui exatamente como estava — não é uma mudança desta refatoração).
export function inicializarUsuarios() {
    let usuarios = JSON.parse(localStorage.getItem('cv_usuarios') || '[]');
    const idxAdmin = usuarios.findIndex(u => u.id === 1);
    if (idxAdmin === -1) {
        usuarios.unshift({ id: 1, usuario: 'Admin', senha: 'admin', perfil: 'admin' });
        localStorage.setItem('cv_usuarios', JSON.stringify(usuarios));
    }
}

export function fazerLogin() {
    const usuario = document.getElementById('l-usuario').value.trim();
    const senha   = document.getElementById('l-senha').value;
    const erro    = document.getElementById('msg-erro');
    const uInput  = document.getElementById('l-usuario');
    const sInput  = document.getElementById('l-senha');

    erro.classList.remove('visivel');
    uInput.classList.remove('erro');
    sInput.classList.remove('erro');

    if (!usuario || !senha) {
        erro.textContent = '⚠️ Preencha usuário e senha.';
        erro.classList.add('visivel');
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem('cv_usuarios') || '[]');
    const encontrado = usuarios.find(u => u.usuario === usuario && u.senha === senha);

    if (!encontrado) {
        erro.textContent = '❌ Usuário ou senha incorretos.';
        erro.classList.add('visivel');
        uInput.classList.add('erro');
        sInput.classList.add('erro');
        sInput.value = '';
        return;
    }

    sessionStorage.setItem('cv_sessao', JSON.stringify({
        id: encontrado.id,
        usuario: encontrado.usuario,
        nome: encontrado.nome || encontrado.usuario,
        perfil: encontrado.perfil
    }));

    window.location.href = '/';
}
