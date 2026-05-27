@echo off
setlocal enabledelayedexpansion
title KairOS Connect — Instalador
color 0A
cls

echo.
echo  ██╗  ██╗ █████╗ ██╗██████╗  ██████╗ ███████╗
echo  ██║ ██╔╝██╔══██╗██║██╔══██╗██╔═══██╗██╔════╝
echo  █████╔╝ ███████║██║██████╔╝██║   ██║███████╗
echo  ██╔═██╗ ██╔══██║██║██╔══██╗██║   ██║╚════██║
echo  ██║  ██╗██║  ██║██║██║  ██║╚██████╔╝███████║
echo  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
echo          C O N N E C T  —  Instalador  v1.0
echo.
echo  ──────────────────────────────────────────────
echo.

:: ── 1. Verificar Node.js ─────────────────────────────────────────────────────
echo  [1/3]  Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERRO] Node.js nao encontrado no sistema.
    echo.
    echo  Baixe e instale em: https://nodejs.org
    echo  Versao minima exigida: 18
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK]   Node.js !NODE_VER! detectado

:: ── 2. Copiar arquivos ────────────────────────────────────────────────────────
set "SRC=%~dp0"
set "DEST=%LOCALAPPDATA%\KairOS-Connect"

echo.
echo  [2/3]  Instalando em: !DEST!
echo.

if not exist "!DEST!" mkdir "!DEST!"
if not exist "!DEST!\dist" mkdir "!DEST!\dist"

robocopy "!SRC!dist" "!DEST!\dist" /E /NFL /NDL /NJH /NJS >nul 2>&1
copy /Y "!SRC!server.js" "!DEST!\server.js" >nul

if exist "!SRC!.env" (
    copy /Y "!SRC!.env" "!DEST!\.env" >nul
) else if exist "!SRC!.env.example" (
    copy /Y "!SRC!.env.example" "!DEST!\.env" >nul
)

echo  [OK]   Arquivos copiados

:: ── 3. Criar atalho na Area de Trabalho ───────────────────────────────────────
echo.
echo  [3/3]  Criando atalho na Area de Trabalho...

set "LAUNCHER=!DEST!\KairOS-Connect-Launcher.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\KairOS Connect.lnk"

:: Criar o arquivo .bat que o atalho vai chamar
(
    echo @echo off
    echo title KairOS Connect
    echo color 0A
    echo cd /d "!DEST!"
    echo cls
    echo echo.
    echo echo   KairOS Connect iniciando...
    echo echo   Aguarde o navegador abrir automaticamente.
    echo echo.
    echo node "!DEST!\server.js"
    echo pause
) > "!LAUNCHER!"

:: Criar .lnk via PowerShell (atalho com icone profissional)
powershell -NoProfile -Command ^
  "$WS = New-Object -ComObject WScript.Shell; " ^
  "$SC = $WS.CreateShortcut('%USERPROFILE%\Desktop\KairOS Connect.lnk'); " ^
  "$SC.TargetPath = '!LAUNCHER!'; " ^
  "$SC.WorkingDirectory = '!DEST!'; " ^
  "$SC.Description = 'KairOS Connect - Monitoramento Industrial'; " ^
  "$SC.IconLocation = 'shell32.dll,23'; " ^
  "$SC.Save();" >nul 2>&1

if exist "!SHORTCUT!" (
    echo  [OK]   Atalho criado na Area de Trabalho
) else (
    :: Fallback: copiar o .bat direto para a area de trabalho
    copy /Y "!LAUNCHER!" "%USERPROFILE%\Desktop\KairOS Connect.bat" >nul
    echo  [OK]   Launcher criado na Area de Trabalho
)

:: ── Concluido ─────────────────────────────────────────────────────────────────
echo.
echo  ══════════════════════════════════════════════
echo.
echo    KairOS Connect instalado com sucesso!
echo.
echo    Use o atalho "KairOS Connect" na
echo    Area de Trabalho para abrir o app.
echo.
echo    Credenciais de acesso:
echo      E-mail : admin@admin.com
echo      Senha  : admin
echo.
echo  ══════════════════════════════════════════════
echo.

set /p "INICIAR=  Deseja iniciar o KairOS Connect agora? [S/N]: "
if /i "!INICIAR!"=="S" (
    cd /d "!DEST!"
    node "!DEST!\server.js"
)

echo.
pause
endlocal
