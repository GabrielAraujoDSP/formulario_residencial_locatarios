# Ficha Cadastral de Locatário Residencial

| Arquivo | Descrição |
|---|---|
| `formulario.html` | Formulário público preenchido pelo inquilino |
| `painel.html` | Painel administrativo com login, cards e geração de PDF |
| `backend.gs` | Google Apps Script — salva dados no Sheets e arquivos no Drive |

---

## Passo a Passo de Configuração

### 1. Criar a Planilha no Google Sheets

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma nova planilha.
2. Dê qualquer nome (ex: "Fichas Cadastrais de Locação").
3. Copie o **ID da planilha** da URL:
   ```
   https://docs.google.com/spreadsheets/d/  <<< ESTE_TRECHO >>>  /edit
   ```
4. Cole esse ID na constante `SHEET_ID` do `backend.gs`.

---

### 2. Criar a Pasta no Google Drive

1. Acesse [drive.google.com](https://drive.google.com) e crie uma pasta (ex: "Fichas — Documentos").
2. Abra a pasta e copie o **ID** da URL:
   ```
   https://drive.google.com/drive/folders/  <<< ESTE_TRECHO >>>
   ```
3. Cole esse ID na constante `FOLDER_ID` do `backend.gs`.

---

### 3. Publicar o Apps Script

1. Acesse [script.google.com](https://script.google.com) → **"Novo projeto"**.
2. Apague o código padrão e cole **todo o conteúdo** de `backend.gs`.
3. Substitua `SHEET_ID` e `FOLDER_ID` pelos valores obtidos acima.
4. Salve (Ctrl+S).
5. Clique em **"Implantar"** → **"Nova implantação"**.
6. Configure:
   - **Tipo:** App da Web
   - **Executar como:** Eu (seu e-mail)
   - **Quem tem acesso:** Qualquer pessoa
7. Clique em **"Implantar"** e autorize as permissões solicitadas.
8. Copie a **URL gerada** (termina em `/exec`).

> Toda vez que alterar o `backend.gs`, crie uma **nova implantação** — não edite a existente, senão as mudanças não entram em vigor.

---

### 4. Colar a URL nos HTMLs

Abra `formulario.html` e `painel.html` e substitua o valor da variável em cada arquivo:

```javascript
const APPS_SCRIPT_URL = 'COLE_AQUI_A_URL_DO_APPS_SCRIPT';
// ↓ troque por algo como:
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/XXXXXXX/exec';
```

---

### 5. Alterar a Senha do Painel

Em `painel.html`, localize:

```javascript
const SENHA_ADMIN = 'admin123'; // ← altere aqui
```

---

### 6. Hospedar no Netlify Drop

> ⚠️ **Importante:** não arraste os arquivos individualmente — o Netlify transformará um em `index.html` e sobrescreverá o outro. Arraste uma **pasta**.

1. Crie uma pasta no seu computador com o nome que quiser (ex: `formulario-locacao`).
2. Coloque os dois arquivos `formulario.html` e `painel.html` dentro dessa pasta.
3. Acesse [app.netlify.com/drop](https://app.netlify.com/drop).
4. **Arraste a pasta inteira** para a área de drop.
5. O Netlify hospedará os dois arquivos com suas URLs próprias:
   - `https://xxxxx.netlify.app/formulario.html` → compartilhe com os inquilinos
   - `https://xxxxx.netlify.app/painel.html` → uso administrativo interno

---

## Dados salvos por ficha

Cada envio gera automaticamente:

- **Uma linha** na aba `Fichas` da planilha, com todos os campos e URLs dos documentos.
- **Uma subpasta** no Drive nomeada com o protocolo e o nome do locatário, contendo todos os arquivos enviados (identidade, comprovante de residência, documentos de adicionais).

---

## Status das fichas

| Status | Significado |
|---|---|
| `nova` | Recém-enviada, aguardando análise |
| `analise` | Em processo de análise |
| `concluida` | Processo encerrado |

---

## Observações técnicas

- Os arquivos são convertidos para Base64 no browser e enviados como JSON com `Content-Type: text/plain`, evitando bloqueios de CORS preflight no Google Apps Script.
- O Apps Script cria automaticamente a aba `Fichas` com cabeçalho formatado se ela não existir.
- Limite prático por envio: arquivos de até ~7 MB cada (o payload total não deve ultrapassar 40 MB).
