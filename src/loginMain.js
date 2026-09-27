// ============================================
// PONTO DE ENTRADA — login.html
// ============================================
import { iniciarCeuEstrelado } from './components/ceuEstrelado.js';
import { inicializarUsuarios, fazerLogin } from './services/sessaoService.js';

// A tela usa onclick="fazerLogin()" no botão — como módulos ES têm
// escopo próprio (não global), expomos explicitamente essa função
// no window para o atributo inline continuar funcionando sem
// precisar reescrever o HTML.
window.fazerLogin = fazerLogin;

iniciarCeuEstrelado();

inicializarUsuarios();

document.getElementById('l-usuario').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('l-senha').focus();
    }
});

document.getElementById('l-senha').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        fazerLogin();
    }
});

if (sessionStorage.getItem('cv_sessao')) {
    window.location.href = '/';
}
