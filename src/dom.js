// ============================================
// CACHE DE ELEMENTOS DO DOM — Formulário de Cadastro
// ============================================
// Estes elementos são referenciados por vários módulos
// (produtosService, renderProdutos). Centralizamos aqui em vez
// de repetir `document.getElementById` em cada arquivo.
// Como este módulo é importado só depois que o HTML já foi
// parseado (scripts type="module" são carregados no fim do body,
// com comportamento equivalente a `defer`), os elementos já
// existem no DOM no momento desta leitura.

export const inputCodigo        = document.getElementById('input-codigo');
export const inputNome          = document.getElementById('input-nome');
export const inputValidade      = document.getElementById('input-validade');
export const inputClassificacao = document.getElementById('input-classificacao');
export const inputFabricante    = document.getElementById('input-fabricante');
export const selectCategoria    = document.getElementById('select-categoria');
export const btnCadastrar       = document.getElementById('btn-cadastrar');
export const listaEl            = document.getElementById('lista-produtos');
export const inputCatNome       = document.getElementById('input-categoria-nome');
