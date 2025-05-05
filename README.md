# PedeMais1 🍽️

Sistema web para gestão de pedidos em restaurantes. Desenvolvido como projeto
acadêmico na disciplina de Processos de Software na UNIRV.

## 🚀 Funcionalidades

- Cadastro e login de usuários (com autenticação JWT)
- Registro e listagem de pedidos
- Consulta e filtros por status, cliente e data
- Gestão de cardápio (CRUD de produtos)
- Integração entre front-end e back-end
- Layout responsivo com Bootstrap

## 🛠️ Tecnologias Utilizadas

### Front-end

- HTML
- CSS
- JavaScript
- Bootstrap

### Back-end

- Node.js
- Express.js

### Banco de Dados

- Supabase (PostgreSQL)

### Deploy

- Vercel (Front-end)

## 📁 Estrutura do Projeto

```
pedeMais1/
├── public/               # Arquivos estáticos (HTML, CSS, JS)
├── controllers/          # Lógica de controle (MVC)
├── models/               # Modelos de dados
├── routes/               # Rotas da API Express
├── views/                # Páginas HTML e modais
├── utils/                # Funções auxiliares
├── services/             # Integração com Supabase
├── app.js                # Arquivo principal do Express
└── supabase.js           # Configuração do cliente Supabase
```

## 🔐 Autenticação

- Utiliza JWT (JSON Web Token)
- Tokens são armazenados em `localStorage`
- Rotas protegidas com verificação de token
- Distinção entre usuários comuns e admins via campo `papel`

## ▶️ Como Executar Localmente

1. Clone o repositório:

```
git clone https://github.com/seuusuario/pedemais1.git
```

2. Instale as dependências:

```
npm install
```

3. Configure as variáveis de ambiente em um arquivo `.env`:

```
SUPABASE_URL=...
SUPABASE_KEY=...
JWT_SECRET=...
```

4. Inicie o servidor:

```
node app.js
```

5. Acesse `http://localhost:5000` no navegador (ou pelo Vercel para o front-end).

## 📦 Deploy

- O front-end é hospedado no Vercel.
- O back-end pode ser executado localmente ou implantado no Render.

## 👨‍🎓 Projeto Acadêmico

Este projeto foi desenvolvido como parte da disciplina de **Processos de
Software**, do curso de **Engenharia de Software** da **UNIRV**.

## 📈 Melhorias Futuras

- Painel administrativo completo
- Geração de relatórios em PDF
- Recuperação de senha
- Integração com métodos de pagamento
- Internacionalização (i18n)

---

Desenvolvido como um MVP funcional e didático.
