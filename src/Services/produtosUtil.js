// ============================================
// UTILITÁRIOS — Cálculo de validade / faixas
// ============================================
// Funções puras (sem DOM, sem estado global) — dado o mesmo input,
// sempre devolvem o mesmo output. Isolar isso facilita testar e
// reutilizar em qualquer lugar do sistema.

// Retorna o número de dias até o vencimento (negativo = vencido)
export function diasParaVencer(dataValidade) {
    if (!dataValidade) return Infinity;
    const hoje   = new Date();
    hoje.setHours(0,0,0,0);
    const dataVal = new Date(dataValidade + 'T00:00:00');
    if (isNaN(dataVal.getTime())) return Infinity;
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
export function calcularFaixa(dataValidade) {
    if (!dataValidade) return 'sem-data';
    const dias = diasParaVencer(dataValidade);
    if (dias === Infinity) return 'sem-data';
    if (dias < 0)    return 'vencido';
    if (dias <= 90)  return 'critico';
    if (dias <= 180) return 'alerta';
    if (dias <= 270) return 'atencao';
    if (dias <= 365) return 'proximo';
    return 'ok';
}

// Mantido para compatibilidade com renderizarGridCategorias
// Corrigido: a faixa "atencao" (6–9 meses, amarelo) não entrava como "aviso",
// então uma categoria só com produtos nessa faixa aparecia no grid como se
// estivesse tudo certo (sem borda/pill de alerta), embora essa faixa já seja
// tratada como alerta em todo o resto do sistema (aba "Próximos a vencer").
export function calcularStatus(dataValidade) {
    const faixa = calcularFaixa(dataValidade);
    if (faixa === 'vencido') return 'vencido';
    if (faixa === 'critico' || faixa === 'alerta' || faixa === 'atencao') return 'aviso';
    return 'ok';
}

export const FAIXA_CONFIG = {
    vencido:  { label: '✗ Vencido',       classe: 'badge-vencido',  cor: '#6b7280' },
    critico:  { label: '🔴 < 3 meses',    classe: 'badge-critico',  cor: '#dc2626' },
    alerta:   { label: '🟠 3–6 meses',    classe: 'badge-alerta',   cor: '#ea580c' },
    atencao:  { label: '🟡 6–9 meses',    classe: 'badge-atencao',  cor: '#ca8a04' },
    proximo:  { label: '🔵 9–12 meses',   classe: 'badge-proximo',  cor: '#2563eb' },
    ok:       { label: '🟢 > 12 meses',   classe: 'badge-ok',       cor: '#16a34a' },
    'sem-data':{ label: '⬜ Sem validade', classe: 'badge-semdata',  cor: '#64748b' },
};

export function formatarData(dataISO) {
    if (!dataISO) return '<span style="opacity:.4">Sem data</span>';
    const parts = dataISO.split('-');
    if (parts.length !== 3) return '<span style="opacity:.4">—</span>';
    const [ano, mes, dia] = parts;
    if (!ano || !mes || !dia) return '<span style="opacity:.4">—</span>';
    return `${dia}/${mes}/${ano}`;
}
