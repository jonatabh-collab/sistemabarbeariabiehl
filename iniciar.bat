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
    echo  [ERRO] Node.js nao encontrado!
    echo.
    echo  Por favor instale o Node.js em:
    echo  https://nodejs.org
    echo.
    echo  Baixe a versao LTS e instale normalmente.
    echo  Depois feche esta janela e abra novamente.
    echo.
    pause
    start https://nodejs.org
    exit
)

echo  Node.js encontrado:
node --version
echo.

:: Instalar dependencias se necessario
IF NOT EXIST "backend\node_modules" (
    echo  Instalando dependencias (primeira vez, aguarde)...
    echo.
    call npm run install:all
    echo.
    echo  Dependencias instaladas!
    echo.
)

echo  Iniciando os servicos...
echo.

:: Iniciar Backend
start "API Backend - Barbearia Biehl" cmd /k "cd backend && npm run dev"

:: Aguardar backend subir
timeout /t 4 /nobreak >nul

:: Iniciar Admin
start "Admin - Barbearia Biehl" cmd /k "cd admin && npm run dev"

:: Iniciar Cliente
start "Cliente - Barbearia Biehl" cmd /k "cd client && npm run dev -- --port 5174"

:: Aguardar apps subirem
echo  Aguardando inicializacao...
timeout /t 6 /nobreak >nul

echo.
echo  ================================================
echo    Sistema iniciado com sucesso!
echo  ================================================
echo.
echo  Abrindo no navegador...
echo.
echo  - Admin (Gestao): http://localhost:5173
echo    Login: admin@barbeariabiehl.com
echo    Senha: admin123
echo.
echo  - App do Cliente: http://localhost:5174
echo.
echo  ================================================
echo.

:: Abrir no navegador
start http://localhost:5173

echo  Para encerrar o sistema, feche as 3 janelas pretas.
echo.
pause
