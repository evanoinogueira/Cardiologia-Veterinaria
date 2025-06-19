const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

const app = express();
const port = 3000;

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'segredo123', 
    resave: false,
    saveUninitialized: true
}));

// Rotas públicas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/servicos', (req, res) => res.sendFile(path.join(__dirname, 'public/servicos.html')));
app.get('/sobre', (req, res) => res.sendFile(path.join(__dirname, 'public/sobre.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'public/contato.html')));
app.get('/cadastro', (req, res) => res.sendFile(path.join(__dirname, 'public/cadastro.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));


// Middleware para proteger a página de marcação
function autenticar(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Página protegida
app.get('/marcacao', autenticar, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/marcacao.html'));
});

// Verificar se o arquivo de contatos existe
if (!fs.existsSync('contatos.json')) {
    fs.writeFileSync('contatos.json', '[]');
}

// Rota para receber formulário de contato
app.post('/enviar-contato', (req, res) => {
    const { nome, email, mensagem } = req.body;
    const contatos = JSON.parse(fs.readFileSync('contatos.json', 'utf8') || '[]');

    contatos.push({
        nome,
        email,
        mensagem,
        data: new Date().toLocaleString()
    });

    fs.writeFileSync('contatos.json', JSON.stringify(contatos, null, 2));

    res.send(`<h1>Mensagem enviada com sucesso!</h1><a href="/contato">Voltar</a>`);
});


// Cadastro de usuário
app.post('/cadastrar', (req, res) => {
    const { nome, email, senha } = req.body;
    const usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8') || '[]');

    const existe = usuarios.find(u => u.email === email);
    if (existe) {
        return res.send('<h1>Email já cadastrado!</h1><a href="/cadastro">Voltar</a>');
    }

    usuarios.push({ nome, email, senha });
    fs.writeFileSync('usuarios.json', JSON.stringify(usuarios));

    res.send('<h1>Cadastro realizado com sucesso!</h1><a href="/login">Fazer Login</a>');
});

// Login de usuário
app.post('/logar', (req, res) => {
    const { email, senha } = req.body;
    const usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8') || '[]');

    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    if (usuario) {
        req.session.usuario = usuario;
        res.redirect('/marcacao');
    } else {
        res.send('<h1>Login inválido!</h1><a href="/login">Tentar novamente</a>');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Receber agendamento
app.post('/agendar', autenticar, (req, res) => {
    const { nomePet, tipo, data, horario } = req.body;
    const consultas = JSON.parse(fs.readFileSync('consultas.json', 'utf8') || '[]');

    consultas.push({
        usuario: req.session.usuario.email,
        nomePet,
        tipo,
        data,
        horario
    });

    fs.writeFileSync('consultas.json', JSON.stringify(consultas));

    res.send('<h1>Consulta/Exame agendado com sucesso!</h1><a href="/marcacao">Voltar</a>');
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
