#!/usr/bin/env bash
# KairOS Connect — Instalador Linux
# Execute: bash instalar-linux.sh
set -euo pipefail

# ── Cores ────────────────────────────────────────────────────────────────────
GRN='\033[0;32m'; CYN='\033[0;36m'; YLW='\033[1;33m'
RED='\033[0;31m'; WHT='\033[1;37m'; DIM='\033[2m'; RST='\033[0m'

log()  { echo -e "  ${GRN}[✔]${RST} $*"; }
info() { echo -e "  ${CYN}[→]${RST} $*"; }
err()  { echo -e "\n  ${RED}[✖]${RST} $*\n"; exit 1; }

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
DEST="$HOME/.local/share/kairos-connect"
DESKTOP_DIR="$HOME/Desktop"

# ── 1. Verificar Node.js ──────────────────────────────────────────────────────
echo -e "  ${WHT}[1/3]${RST} Verificando Node.js..."

if ! command -v node &>/dev/null; then
  err "Node.js não encontrado.\n\n  Instale via gerenciador de pacotes:\n    Ubuntu/Debian: sudo apt install nodejs\n    Fedora:        sudo dnf install nodejs\n    Arch:          sudo pacman -S nodejs\n\n  Ou via nvm: https://github.com/nvm-sh/nvm"
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  err "Node.js $(node -v) detectado, mas é necessário v18+."
fi

log "Node.js $(node -v) detectado"

# ── 2. Copiar arquivos ────────────────────────────────────────────────────────
echo ""
echo -e "  ${WHT}[2/3]${RST} Instalando em: $DEST"
echo ""

mkdir -p "$DEST/dist"
cp -R "$SRC/dist/." "$DEST/dist/"
cp "$SRC/server.js" "$DEST/server.js"

if [ -f "$SRC/.env" ]; then
  cp "$SRC/.env" "$DEST/.env"
elif [ -f "$SRC/.env.example" ]; then
  cp "$SRC/.env.example" "$DEST/.env"
fi

# Script de inicialização
cat > "$DEST/iniciar.sh" << 'INIT'
#!/usr/bin/env bash
cd "$(dirname "$0")"
node server.js
INIT
chmod +x "$DEST/iniciar.sh"

log "Arquivos copiados"

# ── 3. Criar atalho na Área de Trabalho ──────────────────────────────────────
echo ""
echo -e "  ${WHT}[3/3]${RST} Criando atalho na Área de Trabalho..."

NODE_PATH="$(command -v node)"

# Detectar emulador de terminal disponível
TERM_CMD=""
for t in gnome-terminal konsole xterm xfce4-terminal lxterminal mate-terminal tilix; do
  if command -v "$t" &>/dev/null; then
    TERM_CMD="$t"
    break
  fi
done

mkdir -p "$DESKTOP_DIR"

DESKTOP_FILE="$DESKTOP_DIR/kairos-connect.desktop"
cat > "$DESKTOP_FILE" << DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=KairOS Connect
Comment=Monitoramento Industrial KairOS
Exec=bash -c 'cd "$DEST" && $NODE_PATH "$DEST/server.js"; read -rp "Pressione Enter para fechar..." _'
Terminal=true
Icon=network-wired
Categories=Science;Engineering;
StartupNotify=true
DESKTOP

chmod +x "$DESKTOP_FILE"

# Tentar marcar como confiável (GNOME)
if command -v gio &>/dev/null; then
  gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
fi

# Criar também atalho global no PATH
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/kairos-connect" << GLOBAL_CMD
#!/usr/bin/env bash
cd "$DEST"
node "$DEST/server.js"
GLOBAL_CMD
chmod +x "$HOME/.local/bin/kairos-connect"

log "Atalho '.desktop' criado na Área de Trabalho"
log "Comando global: kairos-connect"

# ── Concluído ─────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${GRN}╔══════════════════════════════════════════════╗${RST}"
echo -e "  ${GRN}║   KairOS Connect instalado com sucesso!     ║${RST}"
echo -e "  ${GRN}╚══════════════════════════════════════════════╝${RST}"
echo ""
echo -e "  ${WHT}Para abrir:${RST}"
echo -e "    • Clique duas vezes em ${CYN}'KairOS Connect'${RST} na Área de Trabalho"
echo -e "    • Ou no terminal: ${CYN}kairos-connect${RST}"
echo ""
echo -e "  ${WHT}Credenciais de acesso:${RST}"
echo -e "    E-mail : ${CYN}admin@admin.com${RST}"
echo -e "    Senha  : ${CYN}admin${RST}"
echo ""

if [ -t 0 ]; then
  read -rp "  Deseja iniciar agora? [s/N]: " RESP
  case "$RESP" in
    [sS]|[yY])
      echo ""
      exec node "$DEST/server.js"
      ;;
    *)
      echo -e "\n  ${DIM}Ok! Use o atalho na Área de Trabalho quando quiser.${RST}\n"
      ;;
  esac
fi
