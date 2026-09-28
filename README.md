# Data Analysis Monorepo

Ambiente local de análise de dados com Python 3.11+, FastAPI, pandas, openpyxl, TanStack Start, React, Vite e Tailwind CSS 4.

## Pré-requisitos

- Node.js 22.12+ (recomendado Node 24) e npm 11+ (a instalação inicial foi validada com npm 11).
- Python 3.11+ disponível como `python`.

## Iniciar

Na raiz do projeto:

```sh
npm run setup
npm run dev
```

O setup instala os workspaces npm e cria um ambiente Python isolado em `.venv`.
Não é necessário ativar o ambiente manualmente. Encerre os serviços com Ctrl+C.

- Frontend: http://localhost:3000
- API / Swagger: http://127.0.0.1:8000/docs
- Saúde: http://127.0.0.1:8000/api/health

Envie `data/exemplo.csv` pela interface para testar.

## Estrutura

```text
apps/
  api/                FastAPI, processamento e testes
    app/main.py
    tests/
    pyproject.toml
  web/                TanStack Start, React e Tailwind
    src/pages/
    src/styles/
scripts/              Instalação e execução multiplataforma
data/exemplo.csv       Dados de exemplo
```

O npm gerencia o workspace frontend e os comandos da raiz. O backend mantém suas dependências no pyproject.toml e ambiente virtual próprio.

## Comandos

| Comando | Finalidade |
| --- | --- |
| npm run setup | Instalar todas as dependências |
| npm run dev | Iniciar frontend e backend com reload |
| npm run dev:web | Iniciar somente TanStack Start |
| npm run dev:api | Iniciar somente FastAPI |
| npm run check | Verificar TypeScript do TanStack Start |
| npm run lint | Executar as regras do Biome no frontend |
| npm run format | Formatar o frontend com Biome |
| npm run check:code | Verificar formatação, lint e imports com Biome |
| npm run fix | Corrigir formatação, lint seguro e imports com Biome |
| npm run build | Gerar o cliente e servidor do TanStack Start em apps/web/dist |
| npm test | Testar a API |

Após o primeiro setup, `npm ci` instala as versões do package-lock.json. O setup Python usa requirements.lock.txt quando presente; esse arquivo fixa as versões do ambiente validado no Windows/Python 3.11.

## API

`POST /api/analyze` recebe multipart/form-data com campo `file` e retorna:
nome do arquivo, quantidade de linhas/colunas, total de valores ausentes, tipos das colunas,
prévia de até 20 registros e estatísticas das colunas numéricas.

CSV: UTF-8, separador detectado automaticamente. XLSX: primeira aba, primeira linha como cabeçalho.
Limite do conteúdo: 10 MB; XLSX descompactado: 100 MB. Arquivos são processados sem persistência pela aplicação.
Este exemplo carrega os dados em memória e destina-se ao desenvolvimento local; não é um serviço de processamento de grandes arquivos.

O frontend usa caminhos relativos /api. O Vite encaminha essas requisições ao backend durante o desenvolvimento,
sem necessidade de CORS. Para produção, sirva o build estático e encaminhe /api ao FastAPI por um proxy reverso;
o comando astro preview não oferece esse proxy.

## Referências

- [FastAPI: uploads](https://fastapi.tiangolo.com/tutorial/request-files/)
- [TanStack Start: build from scratch](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)
