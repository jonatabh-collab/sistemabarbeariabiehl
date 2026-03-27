@echo off
title Barbearia Biehl - Iniciando...
color 0A
cls

echo.
echo  ================================================
echo    BARBEARIA BIEHL - Sistema de Gestao
echo  ================================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    cls
    echo.
    echo  ================================================
    echo    ERRO: Node.js nao instalado!
    echo  ================================================
    echo.
    echo  Voce precisa instalar o Node.js primeiro.
    echo.
    echo  1. Acesse: https://nodejs.org
    echo  2. Baixe a versao LTS (botao verde grande)
    echo  3. Instale normalmente (next, next, finish)
    echo  4. REINICIE o computador
    echo  5. Clique duas vezes no iniciar.bat novamente
    echo.
    echo  ================================================
    echo.
    echo  Pressione qualquer tecla para abrir o site do Node.js...
    pause >nul
    start https://nodejs.org
    echo.
    echo  Pressione qualquer tecla para fechar...
    pause >nul
    exit
)

echo  Node.js OK:
node --version
echo.

:: Verificar se esta na pasta correta
IF NOT EXIST "backend\package.json" (
    color 0C
    echo.
    echo  ERRO: Pasta incorreta!
    echo.
    echo  O arquivo iniciar.bat deve estar dentro da pasta
    echo  do projeto (sistemabarbeariabiehl-main).
    echo.
    echo  Certifique-se de que na mesma pasta existem as
    echo  pastas: backend, admin, client
    echo.
    pause
    exit
)

:: Instalar dependencias se necessario
IF NOT EXIST "backend\node_modules" (
    echo  Instalando dependencias pela primeira vez...
    echo  (isso pode demorar 3-5 minutos, aguarde)
    echo.
    call npm run install:all
    IF %ERRORLEVEL% NEQ 0 (
        echo.
        echo  ERRO ao instalar dependencias!
        echo  Verifique sua conexao com a internet.
        pause
        exit
    )
    echo.
    echo  Dependencias instaladas com sucesso!
    echo.
)

echo  Iniciando os servicos...
echo.

:: Iniciar Backend
start "API Backend - Barbearia Biehl" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Aguardar backend subir
timeout /t 4 /nobreak >nul

:: Iniciar Admin
start "Admin - Barbearia Biehl" cmd /k "cd /d "%~dp0admin" && npm run dev"

:: Iniciar Cliente
start "Cliente - Barbearia Biehl" cmd /k "cd /d "%~dp0client" && npm run dev -- --port 5174"

:: Aguardar apps subirem
echo  Aguardando inicializacao (10 segundos)...
timeout /t 10 /nobreak >nul

echo.
echo  ================================================
echo    Sistema iniciado! Abrindo no navegador...
echo  ================================================
echo.
echo  - ADMIN:   http://localhost:5173
echo    Login:   admin@barbeariabiehl.com
echo    Senha:   admin123
echo.
echo  - CLIENTE: http://localhost:5174
echo.
echo  NAO feche as 3 janelas pretas!
echo  ================================================
echo.

start http://localhost:5173

echo  Pressione qualquer tecla para fechar esta janela...
pause >nul
