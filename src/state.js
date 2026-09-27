// ============================================
// ESTADO GLOBAL DA APLICAÇÃO
// ============================================
// Antes, estas variáveis eram `let` soltos no topo do script.js
// monolítico. Em módulos ES cada arquivo tem seu próprio escopo,
// então centralizamos aqui um único objeto mutável, importado por
// quem precisar. A referência ao objeto nunca muda — só as
// propriedades dentro dele — por isso pode ser importado com
// `import { state } from '../state.js'` em qualquer módulo e lido
// ou escrito livremente (`state.categorias = [...]`), exatamente
// como antes, só que centralizado em vez de espalhado.

export const state = {
    // sessão / auth
    sessaoAtual: null,

    // produtos / categorias (aba Cadastro, Categorias, Próx. Validade)
    categorias: [],
    produtos: {},
    categoriaAtual: null,   // categoria aberta no painel
    idEditando: null,       // produto sendo editado no cadastro
    idEditandoCat: null,    // categoria sendo editada no modal

    // usuários
    idEditandoUsuario: null,
    idResetandoUsuario: null,

    // unidades
    idEditandoUnidade: null,

    // importação de Excel
    importDados: [],
    importClassificacoes: [],

    // contagem de produtos
    contagemProdutoSelecionado: null,
};
