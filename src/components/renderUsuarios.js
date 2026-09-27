// ============================================
// RENDER — Tabela de Usuários
// ============================================

import { state } from '../state.js';
import { escaparHTML } from './escaparHTML.js';
import { carregarUsuarios } from '../storage/usuariosStorage.js';
import { getUnidades } from '../storage/unidadesStorage.js';

export function renderizarTabelaUsuarios() {
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
        const euMesmo = u.id === state.sessaoAtual.id;
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
        const souAdminRaiz   = state.sessaoAtual.id === 1;
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
                <div><strong>${escaparHTML(u.nome || u.usuario)}</strong>${badgeEu}</div>
                <div style="color:#6b7280;font-size:0.82rem">${escaparHTML(u.usuario)}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary)">${escaparHTML(nomeLoja)}</div>
                <div>${badgePerfil}</div>
                <div><span style="color:#16a34a;font-size:0.78rem;font-weight:600">● Ativo</span></div>
                <div>${acoes}</div>
            </div>`;
    });

    el.innerHTML = html;
}
