#!/usr/bin/env bash
# KairOS Connect — Instalador macOS
# Duplo clique neste arquivo para instalar.
set -euo pipefail

# ── Cores ────────────────────────────────────────────────────────────────────
GRN='\033[0;32m'; CYN='\033[0;36m'; YLW='\033[1;33m'
RED='\033[0;31m'; WHT='\033[1;37m'; DIM='\033[2m'; RST='\033[0m'

log()  { echo -e "  ${GRN}[✔]${RST} $*"; }
info() { echo -e "  ${CYN}[→]${RST} $*"; }
err()  { echo -e "  ${RED}[✖]${RST} $*"; echo ""; read -rp "  Pressione Enter para fechar..." _; exit 1; }

# ── Banner ───────────────────────────────────────────────────────────────────
clear
cat << 'BANNER'

  ██╗  ██╗ █████╗ ██╗██████╗  ██████╗ ███████╗
  ██║ ██╔╝██╔══██╗██║██╔══██╗██╔═══██╗██╔════╝
  █████╔╝ ███████║██║██████╔╝██║   ██║███████╗
  ██╔═██╗ ██╔══██║██║██╔══██╗██║   ██║╚════██║
  ██║  ██╗██║  ██║██║██║  ██║╚██████╔╝███████║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
         C O N N E C T  —  Instalador  v1.0

BANNER
echo -e "  ${DIM}──────────────────────────────────────────────${RST}"
echo ""

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/Library/Application Support/KairOS-Connect"
DESKTOP="$HOME/Desktop"

# ── 1. Verificar Node.js ──────────────────────────────────────────────────────
echo -e "  ${WHT}[1/3]${RST} Verificando Node.js..."

if ! command -v node &>/dev/null; then
  err "Node.js não encontrado.\n\n  Instale em: https://nodejs.org (versão 18+)\n  Ou via Homebrew: brew install node"
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  err "Node.js $(node -v) encontrado, mas é necessário v18+.\n  Atualize em: https://nodejs.org"
fi

log "Node.js $(node -v) detectado"

# ── 2. Copiar arquivos ────────────────────────────────────────────────────────
echo ""
echo -e "  ${WHT}[2/3]${RST} Instalando em: $DEST"
echo ""

mkdir -p "$DEST/dist"
cp -R "$SRC/dist/." "$DEST/dist/"
cp "$SRC/server.js"  "$DEST/server.js"

if [ -f "$SRC/.env" ]; then
  cp "$SRC/.env" "$DEST/.env"
elif [ -f "$SRC/.env.example" ]; then
  cp "$SRC/.env.example" "$DEST/.env"
fi

log "Arquivos copiados"

# ── 3. Criar atalho na Area de Trabalho ──────────────────────────────────────
echo ""
echo -e "  ${WHT}[3/3]${RST} Criando atalho na Área de Trabalho..."

LAUNCHER="$DESKTOP/KairOS Connect.command"

cat > "$LAUNCHER" << LAUNCHER_SCRIPT
#!/usr/bin/env bash
# KairOS Connect — Iniciar
clear
echo ""
echo "  KairOS Connect iniciando..."
echo "  Aguarde o navegador abrir automaticamente."
echo ""
cd "$DEST"
node "$DEST/server.js"
echo ""
read -rp "  Pressione Enter para fechar..." _
LAUNCHER_SCRIPT

chmod +x "$LAUNCHER"
log "Atalho criado na Área de Trabalho: 'KairOS Connect.command'"

# Remover quarentena do macOS para evitar bloqueio de segurança
xattr -dr com.apple.quarantine "$LAUNCHER" 2>/dev/null || true

# ── Concluído ─────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${GRN}╔══════════════════════════════════════════════╗${RST}"
echo -e "  ${GRN}║   KairOS Connect instalado com sucesso!     ║${RST}"
echo -e "  ${GRN}╚══════════════════════════════════════════════╝${RST}"
echo ""
echo -e "  Use ${CYN}'KairOS Connect'${RST} na Área de Trabalho para abrir."
echo ""
echo -e "  ${WHT}Credenciais de acesso:${RST}"
echo -e "    E-mail : ${CYN}admin@admin.com${RST}"
echo -e "    Senha  : ${CYN}admin${RST}"
echo ""

if [ -t 0 ]; then
  read -rp "  Deseja iniciar o KairOS Connect agora? [s/N]: " RESP
  case "$RESP" in
    [sS]|[yY])
      echo ""
      cd "$DEST"
      node "$DEST/server.js"
      ;;
    *)
      echo ""
      echo -e "  ${DIM}Ok! Clique duas vezes em 'KairOS Connect' na Área de Trabalho.${RST}"
      ;;
  esac
fi

echo ""
read -rp "  Pressione Enter para fechar..." _
