# 📦 Controle de Validade

Sistema web para controle de validade de produtos, com autenticação por perfil (admin / colaborador), gestão de categorias, exportação para Excel e tema claro/escuro.

**Deploy:** [validity-manager.vercel.app](https://validity-manager.vercel.app)

---

## 🗂️ Estrutura do projeto

```
/
├── index.html        # Aplicação principal (requer sessão ativa)
├── login.html        # Tela de autenticação
├── script.js         # Lógica da aplicação
├── styles.css        # Estilos globais
├── vercel.json       # Configuração de deploy e headers de segurança
└── README.md         # Este arquivo
```

---

## 🚀 Como fazer deploy

1. Faça push dos arquivos para o repositório GitHub vinculado à Vercel.
2. A Vercel detecta automaticamente o projeto como **Static Site**.
3. Nenhuma variável de ambiente é necessária (dados ficam no `localStorage` do navegador).

---

## 🔐 Credenciais padrão

> ⚠️ **Altere o usuário e a senha padrão antes de disponibilizar o sistema para outros usuários.**

| Campo   | Valor     |
|---------|-----------|
| Usuário | `admin`   |
| Senha   | `admin`   |
| Perfil  | `admin`   |

As credenciais padrão são recriadas automaticamente no `localStorage` se forem removidas (`inicializarUsuarios()` em `login.html`).

---

## 👥 Perfis de acesso

| Perfil        | Permissões                                                      |
|---------------|-----------------------------------------------------------------|
| `admin`       | Tudo: categorias, produtos, usuários, exportação, reset de senha |
| `colaborador` | Cadastrar e visualizar produtos apenas nas categorias atribuídas |

---

## 🛡️ Segurança (vercel.json)

O arquivo `vercel.json` aplica os seguintes headers HTTP em todas as rotas:

| Header                      | Valor / Efeito                                      |
|-----------------------------|-----------------------------------------------------|
| `Strict-Transport-Security` | Força HTTPS por 2 anos (HSTS + preload)             |
| `X-Frame-Options`           | `DENY` — impede carregamento em iframes             |
| `X-Content-Type-Options`    | `nosniff` — bloqueia MIME sniffing                  |
| `X-XSS-Protection`          | Ativa proteção contra XSS no navegador              |
| `Referrer-Policy`           | Limita informações enviadas ao navegar para fora     |
| `Permissions-Policy`        | Desativa câmera, microfone, geolocalização e payment|
| `Content-Security-Policy`   | Permite scripts apenas de `self` e `cdn.jsdelivr.net`|

---

## 📊 Funcionalidades

- ✅ Cadastro de produtos com código de barras, nome e validade
- 🗂️ Organização por categorias com atribuição de colaborador
- 🎨 Faixas de alerta por cor: vencido / < 3m / 3–6m / 6–9m / 9–12m / > 12m
- 📤 Exportação para Excel (por categoria, seleção ou tudo)
- 👥 Gestão de usuários com reset de senha (admin)
- 🌙 Tema claro / escuro persistido

---

## 🗄️ Armazenamento

Todos os dados são salvos no **`localStorage`** do navegador do usuário:

| Chave           | Conteúdo                  |
|-----------------|---------------------------|
| `cv_usuarios`   | Lista de usuários         |
| `cv_categorias` | Lista de categorias       |
| `cv_produtos`   | Produtos por categoria    |
| `cv_tema`       | Preferência de tema       |

A sessão ativa fica no **`sessionStorage`** (`cv_sessao`) e é apagada ao fechar o navegador.

> ℹ️ Por usar `localStorage`, os dados ficam apenas no dispositivo/navegador do usuário. Não há sincronização entre dispositivos.

---

## 📝 Licença

Uso interno. Todos os direitos reservados.
