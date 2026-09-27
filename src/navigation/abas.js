// ===== NAVEGAÇÃO POR ABAS =====
// As chamadas às funções de renderização de cada aba são resolvidas
// em runtime (import dinâmico) para evitar dependência circular entre
// este módulo e os módulos de serviço/componentes, que por sua vez
// não precisam conhecer a navegação.

import { renderizarGridCategorias, renderizarSelectCategorias } from '../components/renderCategorias.js';
import { renderizarTabelaUsuarios } from '../components/renderUsuarios.js';
import { renderizarProxValidade } from '../components/renderProdutos.js';
import { importarResetar } from '../services/excelService.js';

export function mudarAba(aba) {
    document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));

    document.getElementById('aba-' + aba).classList.add('ativa');
    document.getElementById('secao-' + aba).classList.add('ativa');

    if (aba === 'categorias') renderizarGridCategorias();
    if (aba === 'cadastro')   renderizarSelectCategorias();
    if (aba === 'usuarios')   renderizarTabelaUsuarios();
    if (aba === 'importar')   importarResetar();
    if (aba === 'proxvalidade') renderizarProxValidade();
}
