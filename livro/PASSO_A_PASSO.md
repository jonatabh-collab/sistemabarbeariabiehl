# Guia Completo — Como Publicar e Vender O Barbeiro Engenheiro
> Feito para quem não é programador. Siga cada etapa na ordem.

---

## ETAPA 1 — Baixar o arquivo da landing page

1. Acesse o repositório no GitHub:
   `https://github.com/jonatabh-collab/sistemabarbeariabiehl`
2. Clique na pasta **`livro`**
3. Clique no arquivo **`index.html`**
4. Clique no botão **"Download raw file"** (ícone de seta para baixo, canto direito)
5. Salve o arquivo em uma pasta no seu computador — por exemplo: `Documentos/livro-biehl/`

---

## ETAPA 2 — Editar o arquivo (colocar seus dados reais)

> Você vai usar o **Bloco de Notas** do Windows (ou qualquer editor de texto simples).

1. Abra a pasta onde salvou o arquivo
2. Clique com o **botão direito** no arquivo `index.html`
3. Escolha **"Abrir com" → "Bloco de Notas"**
4. Use o atalho **Ctrl + H** para abrir a função "Localizar e Substituir"

Faça as seguintes substituições (uma de cada vez):

### Substituição 1 — Link da Amazon
- **Localizar:** `SEU_LINK_AMAZON_AQUI`
- **Substituir por:** o link do seu livro na Amazon (você vai pegar esse link na Etapa 4)
- Clique em **"Substituir tudo"**

### Substituição 2 — Link do Clube dos Autores
- **Localizar:** `SEU_LINK_CLUBE_AUTORES_AQUI`
- **Substituir por:** o link do seu livro no Clube dos Autores (você vai pegar na Etapa 5)
- Clique em **"Substituir tudo"**

### Substituição 3 — Seu número de WhatsApp
- **Localizar:** `55SEUNUMERO`
- **Substituir por:** seu número com DDI e DDD, sem espaços ou traços
  - Exemplo: se seu número é **(51) 99999-0000**, escreva `5551999990000`
- Clique em **"Substituir tudo"**

5. Salve o arquivo: **Ctrl + S**

---

## ETAPA 3 — Publicar a landing page no Netlify (gratuito)

> O Netlify é um site que hospeda sua página gratuitamente. É simples como arrastar uma pasta.

1. Acesse **https://www.netlify.com**
2. Clique em **"Sign up"** e crie uma conta gratuita (pode usar o Google)
3. Após fazer login, você vai ver a tela principal do Netlify
4. Role até o final da página — você vai ver uma área que diz **"Want to deploy a new site without connecting to Git?"**
5. **Arraste** a pasta `livro-biehl` (que contém o `index.html`) para essa área
6. Aguarde alguns segundos — o Netlify vai publicar sua página
7. Você vai receber um link automático, tipo: `https://nome-aleatório.netlify.app`

### Para usar o domínio jonata-biehl.netlify.app (que você já tem):
1. No painel do Netlify, clique no site que você acabou de criar
2. Vá em **"Site settings" → "General" → "Site name"**
3. Clique em **"Change site name"**
4. Digite: `jonata-biehl`
5. Clique em **"Save"**
6. Pronto — seu site estará em `https://jonata-biehl.netlify.app`

> ⚠️ Se o nome `jonata-biehl` já estiver em uso por outro site seu no Netlify, você precisa primeiro excluir o site antigo ou renomeá-lo.

---

## ETAPA 4 — Publicar na Amazon (KDP)

> O Amazon KDP (Kindle Direct Publishing) permite publicar livros físicos e digitais. Para livro físico, use o **KDP Print**.

1. Acesse **https://kdp.amazon.com** e crie uma conta (pode usar sua conta Amazon normal)
2. Clique em **"Criar"** → **"Título de livro em papel"**
3. Preencha:
   - **Título:** O Barbeiro Engenheiro
   - **Subtítulo:** Como fazer tudo errado para dar tudo certo
   - **Autor:** Jonata Biehl
   - **Descrição:** Use o texto abaixo ⬇️

```
"A história real de um homem que saiu de Engenharia, tomou as decisões que ninguém entendia,
enfrentou o fracasso e a pressão social — e descobriu seu propósito atrás de uma cadeira de barbeiro.

Este não é um livro de autoajuda com fórmulas prontas. É uma história crua e honesta sobre
escolhas, coragem, reinvenção e mentalidade empreendedora.

Se você já questionou seu caminho, se sentiu preso numa carreira que não é sua, ou se teve medo
de mudar por causa do julgamento dos outros — esse livro foi escrito para você."
```

4. Faça o upload do arquivo do livro (PDF ou Word formatado)
5. Faça o upload da capa (imagem em alta resolução)
6. Defina o preço (sugestão: **R$ 39,90 a R$ 59,90** para livro físico)
7. Clique em **"Publicar"** — a Amazon revisa em até 72 horas
8. Após aprovado, copie o link da página do livro na Amazon e use na Etapa 2

---

## ETAPA 5 — Publicar no Clube dos Autores

> O Clube dos Autores é uma plataforma brasileira especializada em livros independentes, com print-on-demand (imprime só quando alguém compra).

1. Acesse **https://www.clubedeautores.com.br**
2. Clique em **"Seja um autor"** e crie sua conta
3. Clique em **"Publicar livro"**
4. Preencha as informações do livro (título, autor, descrição — use o mesmo texto da Amazon)
5. Faça o upload do miolo do livro (PDF formatado para impressão)
6. Faça o upload da capa
7. Defina o preço e margem de lucro
8. Publique e copie o link para usar na Etapa 2

---

## ETAPA 6 — Configurar o WhatsApp Business

> O WhatsApp Business tem recursos extras para vendas, como catálogo, respostas automáticas e link direto.

1. Baixe o app **WhatsApp Business** no celular (gratuito, na App Store ou Google Play)
2. Configure com o número que você vai usar para vendas
3. Em **"Configurações" → "Ferramentas comerciais" → "Mensagem de saudação"**, ative e edite:
```
Olá! 👋 Obrigado por entrar em contato sobre o livro *O Barbeiro Engenheiro*.
Me conta: você já conhecia minha história ou chegou agora?
```
4. Em **"Mensagem de ausência"**, coloque:
```
Oi! No momento estou atendendo outros clientes, mas respondo em breve.
Enquanto isso, você pode conhecer mais sobre o livro em: https://jonata-biehl.netlify.app
```
5. Para gerar seu link de WhatsApp para a landing page:
   - Acesse **https://wa.me/55SEUNUMERO** (substitua pelo seu número)
   - Teste se funciona no celular
   - Esse é o link que já está configurado na sua página

---

## ETAPA 7 — Gerar tráfego (como atrair visitantes para a landing page)

### Opção A — Orgânico (gratuito, começa hoje)

**Instagram / TikTok:**
1. Grave um vídeo curto (30–60 segundos) contando UM ponto da sua história
2. Use como legenda um dos ganchos abaixo:
   - *"Larguei a Engenharia para virar barbeiro. Todo mundo achou que eu tinha enlouquecido."*
   - *"A decisão mais 'errada' da minha vida me levou ao melhor lugar que já estive."*
   - *"Você também sente que está no caminho errado mas tem medo de mudar?"*
3. No final do vídeo diga: *"Escrevi tudo isso num livro. Link na bio."*
4. Coloque o link `https://jonata-biehl.netlify.app` na bio do Instagram
5. Poste todos os dias por 30 dias — consistência é o segredo

### Opção B — Tráfego pago (Meta Ads / Instagram Ads)

> Só comece isso depois que a landing page estiver no ar e os links da Amazon/Clube dos Autores estiverem funcionando.

1. Acesse **https://business.facebook.com** e crie uma conta
2. Crie uma campanha com objetivo **"Tráfego"**
3. Destino: o link da sua landing page
4. Público: pessoas de 20–45 anos, Brasil, interesses em empreendedorismo, barbearia, desenvolvimento pessoal
5. Criativo: use um vídeo seu falando sobre o livro ou uma foto da capa com uma frase forte
6. Orçamento inicial: **R$ 15–20 por dia** por 7 dias para testar

---

## CHECKLIST FINAL — Ordem de execução

- [ ] **Baixar** o arquivo `index.html` da pasta `livro` no GitHub
- [ ] **Editar** o arquivo com seus dados (Etapa 2)
- [ ] **Publicar** no Netlify com o link jonata-biehl.netlify.app (Etapa 3)
- [ ] **Publicar** o livro na Amazon KDP (Etapa 4) e pegar o link
- [ ] **Publicar** no Clube dos Autores (Etapa 5) e pegar o link
- [ ] **Atualizar** o HTML com os links reais da Amazon e Clube dos Autores
- [ ] **Republicar** no Netlify (arrastar novamente a pasta atualizada)
- [ ] **Configurar** o WhatsApp Business (Etapa 6)
- [ ] **Começar** a postar conteúdo no Instagram/TikTok (Etapa 7)
- [ ] **Testar** tudo: clicar nos botões da landing page e ver se funcionam

---

## Dúvidas frequentes

**"Preciso pagar hospedagem?"**
Não. O Netlify tem plano gratuito mais que suficiente para uma landing page.

**"Preciso de CNPJ para vender na Amazon?"**
Não para começar. Você pode usar CPF no KDP e depois migrar para CNPJ.

**"Quanto tempo leva para aparecer na Amazon?"**
Após o envio, a Amazon revisa em até 72 horas. Depois disso, o livro fica disponível para compra.

**"E se alguém comprar pelo WhatsApp, como eu entrego?"**
Você combina o envio pelos Correios. Guarde os Correios mais próximo de você e use PAC ou SEDEX.
