# Prompt — Sistema de Ficha Cadastral de Locatário Residencial

Crie um sistema completo de Ficha Cadastral de Locatário Residencial com três arquivos: `formulario.html`, `painel.html` e `backend.gs`.

**formulario.html** — formulário público com:
- Seções: Dados da Locação, Locatário Principal, Documentos, Cônjuge (condicional), Locatários Adicionais, Assinatura, Declaração Final
- Loop dinâmico: dropdown "Quantos locatários adicionais?" de 0 a 10 — para cada número selecionado, gerar um bloco de campos completo (nome, CPF, nascimento, estado civil, nacionalidade, profissão, e-mail, celular, endereço completo, CEP, cidade, contato de emergência, upload de RG/CNH e comprovante de residência)
- Cônjuge condicional: se "Sim", mostrar campos de cônjuge; se "Não", ocultar
- Campos do locatário principal: nome, CPF (máscara 000.000.000-00), nascimento, estado civil, nacionalidade, profissão, e-mail, celular (máscara), tel. secundário, endereço completo, CEP (máscara), cidade, contato de emergência (nome, telefone, parentesco)
- Uploads (PDF/JPG/PNG): documento de identificação, comprovante de residência, aprovação de seguro (opcional)
- Aviso no topo sobre documentos legíveis
- Envio via POST para URL do Apps Script (variável configurável)
- Layout responsivo, mobile-first, visual profissional

**painel.html** — painel administrativo com:
- Login por senha (configurável no código)
- Cards de fichas com status: Nova, Em análise, Concluída
- Badge de novas fichas no topo
- Busca por nome/CPF e filtro por status
- Botão para marcar todas como lidas (muda para "Em análise")
- Modal de detalhe com todos os dados da ficha
- Botões de mudar status dentro do modal
- Botão de download de PDF formatado com todos os dados da ficha (usar jsPDF via CDN)
- Dados carregados via GET do Apps Script

**backend.gs** — Google Apps Script com:
- `doPost`: recebe o formulário, salva dados no Google Sheets (uma linha por ficha, status inicial "nova"), salva arquivos em subpasta no Google Drive organizada por nome do locatário
- `doGet`: ação `listar` retorna JSON com todas as fichas; ação `status` atualiza status de uma ficha por ID
- Constantes `SHEET_ID` e `FOLDER_ID` configuráveis no topo do arquivo
- Instruções de publicação como App da Web nos comentários

Incluir no final um `README.md` com passo a passo de configuração: criar planilha, criar pasta no Drive, publicar o Apps Script, colar a URL nos HTMLs, hospedar no Netlify Drop.
