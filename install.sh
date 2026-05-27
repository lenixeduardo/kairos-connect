#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# KairOS Connect — Instalador
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Cores ────────────────────────────────────────────────────────────────────
GRN='\033[0;32m'; CYN='\033[0;36m'; YLW='\033[1;33m'
RED='\033[0;31m'; WHT='\033[1;37m'; DIM='\033[2m'; RST='\033[0m'

log()  { echo -e "${GRN}[✔]${RST} $*"; }
info() { echo -e "${CYN}[→]${RST} $*"; }
warn() { echo -e "${YLW}[!]${RST} $*"; }
err()  { echo -e "${RED}[✖]${RST} $*" >&2; exit 1; }
step() { echo -e "\n${WHT}${DIM}─────────────────────────────────────────${RST}\n${WHT}$*${RST}\n"; }

# ── Banner ───────────────────────────────────────────────────────────────────
clear
cat << 'EOF'

  ██╗  ██╗ █████╗ ██╗██████╗  ██████╗ ███████╗
  ██║ ██╔╝██╔══██╗██║██╔══██╗██╔═══██╗██╔════╝
  █████╔╝ ███████║██║██████╔╝██║   ██║███████╗
  ██╔═██╗ ██╔══██║██║██╔══██╗██║   ██║╚════██║
  ██║  ██╗██║  ██║██║██║  ██║╚██████╔╝███████║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
           C O N N E C T  —  Instalador v1.0.0

EOF

echo -e "  ${DIM}Plataforma de Monitoramento Industrial${RST}\n"
echo -e "  ${DIM}──────────────────────────────────────${RST}\n"

# ── Detecção de SO ────────────────────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
  Linux*)  OS_NAME="Linux"  ;;
  Darwin*) OS_NAME="macOS"  ;;
  CYGWIN*|MINGW*|MSYS*) OS_NAME="Windows" ;;
  *) err "Sistema operacional não suportado: $OS" ;;
esac
info "Sistema detectado: $OS_NAME"

# ── Configurações ─────────────────────────────────────────────────────────────
INSTALL_DIR="${KAIROS_INSTALL_DIR:-$HOME/.kairos-connect}"
PORT="${KAIROS_PORT:-3000}"
NODE_MIN_VERSION=18

# ── Verificação de dependências ───────────────────────────────────────────────
step "1/5  Verificando pré-requisitos"

# Node.js
if ! command -v node &>/dev/null; then
  err "Node.js não encontrado. Instale em https://nodejs.org (versão $NODE_MIN_VERSION ou superior)."
fi

NODE_VER=$(node -e "process.exit(parseInt(process.versions.node.split('.')[0]) < $NODE_MIN_VERSION ? 1 : 0)" 2>/dev/null && node -e "process.stdout.write(process.versions.node)" || true)
NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt "$NODE_MIN_VERSION" ]; then
  err "Node.js v$(node -v) encontrado, mas é necessário v${NODE_MIN_VERSION}+. Atualize em https://nodejs.org"
fi
log "Node.js $(node -v) detectado"

# npm
if ! command -v npm &>/dev/null; then
  err "npm não encontrado. Reinstale o Node.js para obter o npm."
fi
log "npm $(npm -v) detectado"

# Git (opcional, mas necessário para clonar)
if ! command -v git &>/dev/null; then
  warn "git não encontrado. A instalação usará apenas os arquivos locais."
  HAS_GIT=false
else
  log "git $(git --version | awk '{print $3}') detectado"
  HAS_GIT=true
fi

# ── Diretório de instalação ───────────────────────────────────────────────────
step "2/5  Preparando diretório de instalação"
info "Destino: $INSTALL_DIR"

if [ -d "$INSTALL_DIR" ]; then
  warn "Diretório existente detectado. Atualizando instalação..."
else
  mkdir -p "$INSTALL_DIR"
  log "Diretório criado: $INSTALL_DIR"
fi

# ── Cópia/clone dos arquivos ──────────────────────────────────────────────────
step "3/5  Obtendo arquivos do KairOS Connect"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Se estamos executando a partir de uma cópia do repositório, copiar de lá
if [ -f "$SCRIPT_DIR/package.json" ] && grep -q '"kairos-connect"' "$SCRIPT_DIR/package.json" 2>/dev/null; then
  info "Copiando arquivos do repositório local..."
  rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' \
        "$SCRIPT_DIR/" "$INSTALL_DIR/"
  log "Arquivos copiados para $INSTALL_DIR"
elif $HAS_GIT; then
  info "Clonando repositório..."
  REPO_URL="https://github.com/lenixeduardo/kairos-connect.git"
  if [ -d "$INSTALL_DIR/.git" ]; then
    git -C "$INSTALL_DIR" pull --quiet origin main
    log "Repositório atualizado"
  else
    git clone --quiet "$REPO_URL" "$INSTALL_DIR"
    log "Repositório clonado"
  fi
else
  err "Não foi possível obter os arquivos. Execute este script a partir do diretório do projeto."
fi

cd "$INSTALL_DIR"

# ── Configuração de ambiente ──────────────────────────────────────────────────
step "4/5  Configurando ambiente"

if [ ! -f ".env" ]; then
  info "Criando arquivo .env a partir do exemplo..."
  cp .env.example .env
  log "Arquivo .env criado"
  echo ""
  echo -e "  ${YLW}Credenciais padrão criadas:${RST}"
  echo -e "  ${DIM}  E-mail:  ${WHT}admin@admin.com${RST}"
  echo -e "  ${DIM}  Senha:   ${WHT}admin${RST}"
  echo ""
  warn "Altere as credenciais em ${INSTALL_DIR}/.env antes de usar em produção!"
else
  log "Arquivo .env já existe, mantendo configuração atual"
fi

# ── Build de produção ─────────────────────────────────────────────────────────
info "Instalando dependências (pode levar alguns minutos)..."
npm install --silent
log "Dependências instaladas"

info "Compilando aplicação para produção..."
npm run build --silent
log "Build concluído → $INSTALL_DIR/dist"

# ── Servidor ──────────────────────────────────────────────────────────────────
step "5/5  Configurando servidor"

# Instalar 'serve' se necessário
if ! command -v serve &>/dev/null && ! npm list -g serve &>/dev/null 2>&1; then
  info "Instalando 'serve' para hospedar a aplicação..."
  npm install -g serve --silent
  log "serve instalado globalmente"
fi

# Criar script de inicialização
cat > "$INSTALL_DIR/start.sh" << STARTSCRIPT
#!/usr/bin/env bash
# KairOS Connect — Script de inicialização
PORT="\${KAIROS_PORT:-$PORT}"
echo ""
echo "  ● KairOS Connect iniciando na porta \$PORT..."
echo "  ● Acesse: http://localhost:\$PORT"
echo "  ● Pressione Ctrl+C para encerrar."
echo ""
cd "$INSTALL_DIR"
npx serve dist -p "\$PORT" -s
STARTSCRIPT
chmod +x "$INSTALL_DIR/start.sh"
log "Script de inicialização criado: $INSTALL_DIR/start.sh"

# Criar atalho global (apenas em Unix)
if [ "$OS_NAME" != "Windows" ]; then
  LINK_PATH="/usr/local/bin/kairos-connect"
  if [ -w "/usr/local/bin" ]; then
    ln -sf "$INSTALL_DIR/start.sh" "$LINK_PATH"
    log "Atalho global criado: kairos-connect"
  else
    warn "Sem permissão para criar atalho em /usr/local/bin."
    warn "Para criar manualmente: sudo ln -sf $INSTALL_DIR/start.sh /usr/local/bin/kairos-connect"
  fi
fi

# ── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GRN}╔══════════════════════════════════════════════╗${RST}"
echo -e "${GRN}║   ✔  KairOS Connect instalado com sucesso!  ║${RST}"
echo -e "${GRN}╚══════════════════════════════════════════════╝${RST}"
echo ""
echo -e "  ${WHT}Diretório:${RST}    $INSTALL_DIR"
echo -e "  ${WHT}Porta padrão:${RST} $PORT"
echo ""
echo -e "  ${WHT}Para iniciar:${RST}"
echo -e "  ${CYN}  bash $INSTALL_DIR/start.sh${RST}"
if command -v kairos-connect &>/dev/null 2>&1; then
  echo -e "  ${CYN}  kairos-connect${RST}   (atalho global)"
fi
echo ""
echo -e "  ${WHT}Para personalizar credenciais:${RST}"
echo -e "  ${DIM}  Edite $INSTALL_DIR/.env${RST}"
echo ""
echo -e "  ${DIM}Credenciais padrão: admin@admin.com / admin${RST}"
echo ""

# ── Oferta de inicialização imediata ─────────────────────────────────────────
if [ -t 0 ]; then
  echo -e "${YLW}Deseja iniciar o KairOS Connect agora? [s/N]${RST} "
  read -r -t 10 RESP || RESP="n"
  case "$RESP" in
    [sS]|[yY]) exec bash "$INSTALL_DIR/start.sh" ;;
    *) echo -e "\n  ${DIM}Ok! Execute ${CYN}bash $INSTALL_DIR/start.sh${DIM} quando quiser iniciar.${RST}\n" ;;
  esac
fi
