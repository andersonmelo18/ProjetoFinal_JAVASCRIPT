const MENSAGENS_KEY = 'lista_mensagens';
const USUARIOS_KEY = 'lista_usuarios';

function getAdminGeralSenha() {
    return '1234';
}

// --- STORAGE ---
function _getMensagensStorage() {
    try {
        const mensagens = localStorage.getItem(MENSAGENS_KEY);
        return mensagens ? JSON.parse(mensagens) : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

function _setMensagensStorage(mensagens) {
    try {
        localStorage.setItem(MENSAGENS_KEY, JSON.stringify(mensagens));
    } catch (e) {
        console.error(e);
    }
}

function _getUsuariosStorage() {
    try {
        const usuarios = localStorage.getItem(USUARIOS_KEY);
        return usuarios ? JSON.parse(usuarios) : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

function _setUsuariosStorage(usuarios) {
    try {
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
    } catch (e) {
        console.error(e);
    }
}

// --- MENSAGENS ---
function inserirMensagem(nome, email, mensagemTexto) {
    let mensagens = _getMensagensStorage();
    const novaMensagem = {
        nome: nome || 'Anônimo',
        email: email || 'Sem e-mail',
        mensagem: mensagemTexto || '',
        visualizada: true // padrão: já visualizada (não negrito)
    };
    mensagens.push(novaMensagem);
    _setMensagensStorage(mensagens);
}

function obterMensagens() {
    return _getMensagensStorage();
}

function excluirMensagem(index) {
    let mensagens = _getMensagensStorage();
    if (index >= 0 && index < mensagens.length) {
        mensagens.splice(index, 1);
        _setMensagensStorage(mensagens);
    }
}

// --- USUÁRIOS ---
function cadastrarUsuario(objCadastro) {
    let usuarios = _getUsuariosStorage();
    const usuarioExistente = usuarios.find(u => u.email === objCadastro.email);
    if (usuarioExistente) throw new Error("Este e-mail já está cadastrado.");
    const novoUsuario = {
        email: objCadastro.email,
        senha: objCadastro.senha,
        aprovado: false,
        nivel: objCadastro.nivel || 'visitante'
    };
    usuarios.push(novoUsuario);
    _setUsuariosStorage(usuarios);
}

function obterTodosUsuarios() {
    return _getUsuariosStorage();
}

function aprovarUsuario(email) {
    let usuarios = _getUsuariosStorage();
    const index = usuarios.findIndex(u => u.email === email);
    if (index !== -1) {
        usuarios[index].aprovado = true;
        _setUsuariosStorage(usuarios);
        return true;
    }
    return false;
}

function mudarNivelAcesso(email, novoNivel) {
    let usuarios = _getUsuariosStorage();
    const index = usuarios.findIndex(u => u.email === email);
    if (index !== -1) {
        usuarios[index].nivel = novoNivel;
        _setUsuariosStorage(usuarios);
        return true;
    }
    return false;
}

function excluirUsuarioSeguro(email, senhaAdminGeral) {
    if (senhaAdminGeral !== getAdminGeralSenha()) throw new Error("Senha do Admin Geral inválida.");
    if (email === 'admin@admin.com') throw new Error("O Admin Geral não pode ser excluído.");
    let usuarios = _getUsuariosStorage();
    const index = usuarios.findIndex(u => u.email === email);
    if (index !== -1) {
        usuarios.splice(index, 1);
        _setUsuariosStorage(usuarios);
        return true;
    }
    throw new Error("Usuário não encontrado.");
}

function validarUsuario(objLoginSenha) {
    const usuarios = _getUsuariosStorage();
    if (objLoginSenha.email === 'admin@admin.com' && objLoginSenha.senha === '1234') return true;
    const usuario = usuarios.find(u => u.email === objLoginSenha.email && u.senha === objLoginSenha.senha);
    return usuario && usuario.aprovado === true;
}

// --- VISUALIZAÇÃO DE MENSAGENS ---
const LS_KEY = 'mensagens_visualizadas';

function getStatusVisualizacaoLocal() {
    try {
        const status = localStorage.getItem(LS_KEY);
        return status ? JSON.parse(status) : {};
    } catch (e) {
        console.error(e);
        return {};
    }
}

function setStatusVisualizacaoLocal(status) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(status));
    } catch (e) {
        console.error(e);
    }
}

function carregarMensagens() {
    const $tbody = $('#tabelaMensagens tbody');
    $tbody.empty();
    const listaMensagens = obterMensagens();
    const statusVisualizacao = getStatusVisualizacaoLocal();

    if (!listaMensagens || listaMensagens.length === 0) {
        $tbody.append('<tr><td colspan="5" class="text-center">Nenhuma mensagem recebida.</td></tr>');
        return;
    }

    listaMensagens.forEach((mensagem, index) => {
        const isNaoVisualizada = statusVisualizacao[index] === true; // agora o negrito é quando NÃO visualizada
        const rowClass = isNaoVisualizada ? 'nao-visualizada' : 'visualizada';
        const newRow = `
            <tr id="mensagem-${index}" class="${rowClass}">
                <td class="text-center">${index}</td>
                <td>${mensagem.nome}</td>
                <td>${mensagem.email}</td>
                <td>${mensagem.mensagem}</td>
                <td>
                    <button class="btnVisualizar btn btn-sm btn-info me-2" data-index="${index}">
                        ${isNaoVisualizada ? 'Visualizada' : 'Não Visualizada'}
                    </button>
                    <button class="btnExcluir btn btn-sm btn-danger" data-index="${index}">Excluir</button>
                </td>
            </tr>
        `;
        $tbody.append(newRow);
    });
}

$(document).on('click', '.btnVisualizar', function() {
    const index = $(this).data('index');
    const status = getStatusVisualizacaoLocal();
    const atual = status[index] === true;
    // agora clicando alterna: se estava visualizada, marca como não visualizada (negrito)
    status[index] = !atual;
    setStatusVisualizacaoLocal(status);
    carregarMensagens();
});

$(document).on('click', '.btnExcluir', function() {
    const index = $(this).data('index');
    if (confirm('Deseja realmente excluir esta mensagem?')) {
        excluirMensagem(index);
        const status = getStatusVisualizacaoLocal();
        delete status[index];
        setStatusVisualizacaoLocal(status);
        carregarMensagens();
    }
});

// --- USUÁRIOS ---
function carregarUsuariosPendentes() {
    const $tbodyUsuarios = $('#tabelaUsuarios tbody');
    $tbodyUsuarios.empty();
    const listaUsuarios = obterTodosUsuarios();
    const pendentes = listaUsuarios.filter(u => !u.aprovado);
    if (pendentes.length === 0) {
        $tbodyUsuarios.append('<tr><td colspan="4" class="text-center text-success">Nenhuma solicitação de acesso pendente.</td></tr>');
        return;
    }
    pendentes.forEach(usuario => {
        const newRow = `
            <tr>
                <td>${usuario.email}</td>
                <td>${usuario.nivel.toUpperCase()}</td>
                <td class="text-danger">Pendente</td>
                <td>
                    <button class="btnAprovar btn btn-sm btn-success" data-email="${usuario.email}">Aprovar</button>
                </td>
            </tr>
        `;
        $tbodyUsuarios.append(newRow);
    });
}

function carregarTodosUsuarios() {
    const $tbodyTodos = $('#tabelaTodosUsuarios tbody');
    $tbodyTodos.empty();
    const listaUsuarios = obterTodosUsuarios();
    if (listaUsuarios.length === 0) {
        $tbodyTodos.append('<tr><td colspan="4" class="text-center text-muted">Nenhum usuário cadastrado.</td></tr>');
        return;
    }
    listaUsuarios.forEach(usuario => {
        const isAprovado = usuario.aprovado ? 
            `<span class="badge bg-success">Aprovado</span>` : 
            `<span class="badge bg-warning text-dark">Pendente</span>`;
        const nivelAtual = usuario.nivel || 'visitante';
        const isAdminGeral = usuario.email === 'admin@admin.com';
        const acoes = isAdminGeral ?
            `<span class="badge bg-danger">Admin Geral</span>` :
            `
            <select class="form-select form-select-sm nivel-select mb-1" data-email="${usuario.email}">
                <option value="admin" ${nivelAtual === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="visitante" ${nivelAtual === 'visitante' ? 'selected' : ''}>Visitante</option>
            </select>
            <button class="btnExcluirUsuario btn btn-sm btn-danger" data-email="${usuario.email}">Excluir</button>
            `;
        const newRow = `
            <tr>
                <td>${usuario.email}</td>
                <td>${isAprovado}</td>
                <td>${nivelAtual.toUpperCase()}</td>
                <td>${acoes}</td>
            </tr>
        `;
        $tbodyTodos.append(newRow);
    });
}

$(document).on('change', '.nivel-select', function() {
    const email = $(this).data('email');
    const novoNivel = $(this).val();
    if (confirm(`Tem certeza que deseja mudar o nível de acesso de ${email} para ${novoNivel.toUpperCase()}?`)) {
        mudarNivelAcesso(email, novoNivel);
        alert(`Nível de acesso de ${email} alterado para ${novoNivel.toUpperCase()}.`);
    } else {
        carregarTodosUsuarios();
    }
});

$(document).on('click', '.btnExcluirUsuario', function() {
    const email = $(this).data('email');
    if (confirm(`Tem certeza que deseja EXCLUIR permanentemente o usuário ${email}? Esta ação exige a senha do Admin Geral.`)) {
        const senhaAdmin = prompt("Digite a senha do Admin Geral (admin@admin.com) para confirmar:");
        if (senhaAdmin) {
            try {
                excluirUsuarioSeguro(email, senhaAdmin);
                carregarUsuariosPendentes();
                carregarTodosUsuarios();
                alert(`Usuário ${email} excluído com sucesso!`);
            } catch (error) {
                alert(error.message);
            }
        } else {
            alert("Exclusão cancelada.");
        }
    }
});

$(document).on('click', '.btnAprovar', function() {
    const email = $(this).data('email');
    if (confirm(`Tem certeza que deseja APROVAR o acesso para o e-mail: ${email}?`)) {
        aprovarUsuario(email);
        carregarUsuariosPendentes();
        carregarTodosUsuarios();
        alert(`Usuário ${email} aprovado com sucesso!`);
    }
});

$(document).ready(function() {
    carregarMensagens();
    carregarUsuariosPendentes();
    carregarTodosUsuarios();
});
