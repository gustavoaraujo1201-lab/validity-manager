// ============================================
// CADASTRO DE UNIDADES
// ============================================
// Antes vivia como <script> solto dentro do index.html.
// Comportamento idêntico, só movido para um módulo próprio.

import { state } from '../state.js';
import { escaparHTML } from '../components/escaparHTML.js';
import { getUnidades, salvarUnidades } from '../storage/unidadesStorage.js';

export function carregarUnidades() {
    const unidades = getUnidades();
    const lista = document.getElementById('lista-unidades');
    if (!lista) return;
    if (unidades.length === 0) {
        lista.innerHTML = '<p class="lista-vazia">Nenhuma unidade cadastrada ainda.</p>';
        return;
    }
    lista.innerHTML = unidades.map((u, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border-color);">
            <div>
                <strong style="color:var(--text-primary);font-size:0.95rem">🏪 ${escaparHTML(u.nome)}</strong>
                ${u.apelido ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px">🏷️ ${escaparHTML(u.apelido)}</div>` : ''}
            </div>
            <div style="display:flex;gap:6px;">
                <button onclick="abrirModalUnidade(${i})" style="background:none;border:1px solid #2563eb;color:#2563eb;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.78rem;">✏️ Editar</button>
                <button onclick="excluirUnidade(${i})" style="background:none;border:1px solid #dc2626;color:#dc2626;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.78rem;">Excluir</button>
            </div>
        </div>
    `).join('');
}

export function abrirModalUnidade(idx) {
    state.idEditandoUnidade = (idx !== undefined) ? idx : null;
    const unidades = getUnidades();

    if (state.idEditandoUnidade !== null) {
        const u = unidades[state.idEditandoUnidade];
        document.getElementById('modal-unidade-titulo').textContent = '🏪 Editar Unidade';
        document.getElementById('input-unidade-nome').value = u.nome || '';
        document.getElementById('input-unidade-apelido').value = u.apelido || '';
    } else {
        document.getElementById('modal-unidade-titulo').textContent = '🏪 Nova Unidade';
        document.getElementById('input-unidade-nome').value = '';
        document.getElementById('input-unidade-apelido').value = '';
    }

    document.getElementById('overlay-modal-unidade').classList.remove('escondido');
    document.getElementById('modal-unidade').classList.remove('escondido');
    document.getElementById('input-unidade-nome').focus();
}

export function fecharModalUnidade() {
    document.getElementById('overlay-modal-unidade').classList.add('escondido');
    document.getElementById('modal-unidade').classList.add('escondido');
    state.idEditandoUnidade = null;
}

export function salvarUnidade() {
    const nome = document.getElementById('input-unidade-nome').value.trim();
    const apelido = document.getElementById('input-unidade-apelido').value.trim();
    if (!nome) { alert('Informe o nome da unidade.'); return; }

    const unidades = getUnidades();

    if (state.idEditandoUnidade !== null) {
        unidades[state.idEditandoUnidade] = { nome, apelido };
    } else {
        unidades.push({ nome, apelido });
    }

    salvarUnidades(unidades);
    fecharModalUnidade();
    carregarUnidades();
}

export function excluirUnidade(idx) {
    if (!confirm('Excluir esta unidade?')) return;
    const unidades = getUnidades();
    unidades.splice(idx, 1);
    salvarUnidades(unidades);
    carregarUnidades();
}
