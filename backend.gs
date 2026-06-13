/**
 * ═══════════════════════════════════════════════════════════════════
 *  FICHA CADASTRAL DE LOCATÁRIO RESIDENCIAL — Google Apps Script
 * ═══════════════════════════════════════════════════════════════════
 *
 *  COMO PUBLICAR COMO APP DA WEB:
 *  1. Abra o projeto no Google Apps Script (script.google.com)
 *  2. Cole este código inteiro substituindo o conteúdo padrão
 *  3. Clique em "Implantar" → "Nova implantação"
 *  4. Tipo: "App da Web"
 *  5. Executar como: "Eu (seu e-mail)"
 *  6. Quem tem acesso: "Qualquer pessoa"
 *  7. Copie a URL gerada (termina em /exec) e cole nos dois HTMLs
 *
 *  ATENÇÃO: Sempre que alterar o código, crie uma NOVA implantação.
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Configurações — altere aqui ───────────────────────────────────
var SHEET_ID   = '1dy3gQq8bPE4C8ODpZSf2Hv9x4_Q2-g6SjPDXqrdgygw';
var FOLDER_ID  = '1xHIZomIVqtFTx8OWRNC3ZpoJa9yLjfO-';
var SHEET_NAME = 'Fichas';

// ── Colunas fixas (locatários adicionais são adicionados abaixo) ──
var COLUNAS_BASE = [
  'id', 'data_envio', 'status',
  'corretor', 'codigo_imovel', 'tem_vaga', 'qtd_vagas', 'tipo_garantia',
  'nome', 'cpf', 'nascimento', 'estado_civil', 'nacionalidade', 'profissao', 'email', 'celular',
  'endereco_atual', 'cep_atual', 'cidade_atual', 'estado_atual',
  'emerg_nome', 'emerg_cel', 'emerg_parentesco',
  'tem_conjuge', 'conj_nome', 'conj_cpf', 'conj_nascimento',
  'conj_nacionalidade', 'conj_profissao', 'conj_email', 'conj_celular',
  'qtd_locatarios'
];

var COLUNAS_LOC_SUFIXOS = [
  '_nome', '_cpf', '_nascimento', '_estado_civil',
  '_nacionalidade', '_profissao', '_email', '_celular',
  '_endereco', '_cep', '_cidade', '_uf',
  '_emerg_nome', '_emerg_cel', '_emerg_parentesco',
  '_doc_id_url', '_comp_res_url'
];

var COLUNAS_FINAL = [
  'doc_identificacao_url', 'comprovante_residencia_url', 'conj_doc_url',
  'tipo_assinatura', 'aceite_declaracao'
];

function obterColunas() {
  var cols = COLUNAS_BASE.slice();
  for (var i = 1; i <= 10; i++) {
    for (var j = 0; j < COLUNAS_LOC_SUFIXOS.length; j++) {
      cols.push('loc' + i + COLUNAS_LOC_SUFIXOS[j]);
    }
  }
  for (var k = 0; k < COLUNAS_FINAL.length; k++) {
    cols.push(COLUNAS_FINAL[k]);
  }
  return cols;
}

// ── doPost — recebe ficha ou edição ──────────────────────────────
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return resposta({ status: 'erro', message: 'Nenhum dado recebido. Verifique se a URL está correta.' });
    }

    var dados = JSON.parse(e.postData.contents);

    // ── Ação: editar ──────────────────────────────────────────────
    if (dados.acao === 'editar' || (e.parameter && e.parameter.acao === 'editar')) {
      var idEdit   = dados.id || '';
      var novos    = dados.dados || {};
      if (!idEdit) return resposta({ status: 'erro', message: 'ID obrigatório para edição' });

      var sheetEd  = obterOuCriarAba();
      var dadosEd  = sheetEd.getDataRange().getValues();
      var cabEd    = dadosEd[0];
      var colIdEd  = cabEd.indexOf('id');

      for (var re = 1; re < dadosEd.length; re++) {
        if (dadosEd[re][colIdEd] === idEdit) {
          for (var ce = 0; ce < cabEd.length; ce++) {
            var campo = cabEd[ce];
            if (campo === 'id' || campo === 'data_envio' || campo === 'status') continue;
            if (novos[campo] !== undefined) {
              sheetEd.getRange(re + 1, ce + 1).setValue(novos[campo]);
            }
          }
          return resposta({ status: 'ok' });
        }
      }
      return resposta({ status: 'erro', message: 'ID não encontrado para edição' });
    }

    var protocolo = gerarProtocolo();
    var agora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');

    // Subpasta no Drive
    var pastaRaiz = DriveApp.getFolderById(FOLDER_ID);
    var nomePasta = protocolo + ' — ' + String(dados.nome || 'sem-nome').substring(0, 40);
    var subpasta  = pastaRaiz.createFolder(nomePasta);

    // Campos de arquivo a processar
    var qtdLoc = parseInt(dados.qtd_locatarios) || 0;
    var camposArquivo = ['doc_identificacao', 'comprovante_residencia', 'conj_doc'];
    for (var i = 1; i <= qtdLoc; i++) {
      camposArquivo.push('loc' + i + '_doc_id');
      camposArquivo.push('loc' + i + '_comp_res');
    }

    // Salvar arquivos base64 → Drive
    for (var a = 0; a < camposArquivo.length; a++) {
      var campo = camposArquivo[a];
      var b64   = dados[campo + '_b64'];
      if (b64) {
        try {
          var nome  = dados[campo + '_nome'] || campo + '.bin';
          var tipo  = dados[campo + '_tipo'] || 'application/octet-stream';
          var bytes = Utilities.base64Decode(b64);
          var blob  = Utilities.newBlob(bytes, tipo, nome);
          var arq   = subpasta.createFile(blob);
          arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          dados[campo + '_url'] = arq.getUrl();
        } catch (fileErr) {
          Logger.log('Erro ao salvar ' + campo + ': ' + fileErr.message);
        }
      }
      delete dados[campo + '_b64'];
      delete dados[campo + '_nome'];
      delete dados[campo + '_tipo'];
    }

    // Montar linha na ordem das colunas
    var colunas = obterColunas();
    var linha   = [];
    for (var c = 0; c < colunas.length; c++) {
      var col = colunas[c];
      if (col === 'id')         { linha.push(protocolo); continue; }
      if (col === 'data_envio') { linha.push(agora);     continue; }
      if (col === 'status')     { linha.push('nova');    continue; }
      linha.push(dados[col] !== undefined ? dados[col] : '');
    }

    // Salvar na planilha
    var sheet = obterOuCriarAba();
    sheet.appendRow(linha);

    return resposta({ status: 'ok', protocolo: protocolo });

  } catch (err) {
    Logger.log('Erro doPost: ' + err.message + '\n' + (err.stack || ''));
    return resposta({ status: 'erro', message: err.message });
  }
}

// ── doGet — listar fichas / atualizar status ──────────────────────
function doGet(e) {
  try {
    var acao = (e && e.parameter && e.parameter.acao) ? e.parameter.acao : 'listar';

    if (acao === 'listar') {
      var sheet = obterOuCriarAba();
      var dados = sheet.getDataRange().getValues();
      if (dados.length <= 1) return resposta({ fichas: [] });

      var cabecalho = dados[0];
      var fichas    = [];
      for (var r = 1; r < dados.length; r++) {
        var obj = {};
        for (var c = 0; c < cabecalho.length; c++) {
          obj[cabecalho[c]] = dados[r][c];
        }
        fichas.push(obj);
      }
      return resposta({ fichas: fichas });
    }

    if (acao === 'status') {
      var id     = e.parameter.id     || '';
      var status = e.parameter.status || '';
      if (!id || !status) {
        return resposta({ status: 'erro', message: 'Parâmetros id e status são obrigatórios' });
      }

      var sheet2 = obterOuCriarAba();
      var dados2 = sheet2.getDataRange().getValues();
      var colId  = dados2[0].indexOf('id');
      var colSt  = dados2[0].indexOf('status');

      for (var row = 1; row < dados2.length; row++) {
        if (dados2[row][colId] === id) {
          sheet2.getRange(row + 1, colSt + 1).setValue(status);
          return resposta({ status: 'ok' });
        }
      }
      return resposta({ status: 'erro', message: 'ID não encontrado' });
    }

    // ── Ação: excluir ─────────────────────────────────────────────
    if (acao === 'excluir') {
      var idExcl = e.parameter.id || '';
      if (!idExcl) return resposta({ status: 'erro', message: 'Parâmetro id obrigatório' });

      var sheetE = obterOuCriarAba();
      var dadosE = sheetE.getDataRange().getValues();
      var colIdE = dadosE[0].indexOf('id');

      for (var re = 1; re < dadosE.length; re++) {
        if (dadosE[re][colIdE] === idExcl) {
          sheetE.deleteRow(re + 1);
          return resposta({ status: 'ok' });
        }
      }
      return resposta({ status: 'erro', message: 'ID não encontrado' });
    }

    // ── Ação: dashboard ───────────────────────────────────────────
    if (acao === 'dashboard') {
      var sheetD = obterOuCriarAba();
      var dadosD = sheetD.getDataRange().getValues();
      if (dadosD.length <= 1) return resposta({ fichas: [], agregados: {} });

      var cabD   = dadosD[0];
      var fichasD = [];

      for (var rd = 1; rd < dadosD.length; rd++) {
        var obj = {};
        for (var cd = 0; cd < cabD.length; cd++) {
          obj[cabD[cd]] = dadosD[rd][cd];
        }
        fichasD.push(obj);
      }

      // Filtros opcionais
      var puxarTudo  = (e.parameter.puxar_tudo || '') === '1';
      if (!puxarTudo) {
        var deStr     = e.parameter.de      || '';
        var ateStr    = e.parameter.ate     || '';
        var corretores = e.parameter.corretor ? e.parameter.corretor.split(',') : [];
        var codImovel  = (e.parameter.codigo_imovel || '').toLowerCase();

        fichasD = fichasD.filter(function(f) {
          // Filtro de data
          if (deStr || ateStr) {
            var dataFicha = parseDateGS(String(f.data_envio || ''));
            if (deStr) {
              var de = new Date(deStr); de.setHours(0,0,0,0);
              if (!dataFicha || dataFicha < de) return false;
            }
            if (ateStr) {
              var ate = new Date(ateStr); ate.setHours(23,59,59,999);
              if (!dataFicha || dataFicha > ate) return false;
            }
          }
          // Filtro de corretor
          if (corretores.length > 0 && corretores[0] !== '') {
            if (corretores.indexOf(String(f.corretor || '')) === -1) return false;
          }
          // Filtro código imóvel
          if (codImovel) {
            if (String(f.codigo_imovel || '').toLowerCase().indexOf(codImovel) === -1) return false;
          }
          return true;
        });
      }

      // Agrega por status, corretor, garantia, assinatura, mês
      var agg = {
        porStatus:    {},
        porCorretor:  {},
        porGarantia:  {},
        porAssinatura:{},
        porMes:       {}
      };

      for (var fa = 0; fa < fichasD.length; fa++) {
        var fi = fichasD[fa];
        var st = String(fi.status || 'nova');
        var co = String(fi.corretor || '—');
        var ga = String(fi.tipo_garantia || '—');
        var as = String(fi.tipo_assinatura || '—');
        var dm = mesAno(String(fi.data_envio || ''));

        agg.porStatus[st]     = (agg.porStatus[st]     || 0) + 1;
        agg.porCorretor[co]   = (agg.porCorretor[co]   || 0) + 1;
        agg.porGarantia[ga]   = (agg.porGarantia[ga]   || 0) + 1;
        agg.porAssinatura[as] = (agg.porAssinatura[as] || 0) + 1;
        if (dm) agg.porMes[dm] = (agg.porMes[dm] || 0) + 1;
      }

      return resposta({ fichas: fichasD, agregados: agg });
    }

    return resposta({ status: 'erro', message: 'Ação inválida: ' + acao });

  } catch (err) {
    Logger.log('Erro doGet: ' + err.message);
    return resposta({ status: 'erro', message: err.message });
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function gerarProtocolo() {
  var ts   = new Date().getTime().toString(36).toUpperCase();
  var rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return 'LC-' + ts + '-' + rand;
}

function obterOuCriarAba() {
  var ss      = SpreadsheetApp.openById(SHEET_ID);
  var sheet   = ss.getSheetByName(SHEET_NAME);
  var colunas = obterColunas();

  if (!sheet) {
    return criarAba(ss, colunas);
  }

  // Verifica se o cabeçalho bate com o schema atual
  var ultimaCol  = sheet.getLastColumn();
  var headerAtual = ultimaCol > 0
    ? sheet.getRange(1, 1, 1, ultimaCol).getValues()[0]
    : [];

  var schemaOk = (headerAtual.length === colunas.length && headerAtual[0] === colunas[0] && headerAtual[8] === colunas[8]);

  if (!schemaOk) {
    // Renomeia a aba antiga como backup e cria uma nova com schema correto
    var nomeBackup = SHEET_NAME + '_backup_' + new Date().getTime();
    sheet.setName(nomeBackup);
    return criarAba(ss, colunas);
  }

  return sheet;
}

function criarAba(ss, colunas) {
  var sheet = ss.insertSheet(SHEET_NAME);
  sheet.appendRow(colunas);

  var hr = sheet.getRange(1, 1, 1, colunas.length);
  hr.setBackground('#1a3c6e')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(9);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 90);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(9, 200);
  return sheet;
}

// Converte "dd/MM/yyyy HH:mm" → Date
function parseDateGS(str) {
  var m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
}

// Retorna "MM/yyyy" para agrupamento por mês
function mesAno(str) {
  var m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return m[2] + '/' + m[3];
}

function resposta(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
