#!/bin/bash
set -euo pipefail

REPO="https://api.upsk.to/download"
VERSION="v0.1.16"

echo "Installing upsk CLI..."

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64) PLATFORM="darwin-arm64" ;;
      x86_64) PLATFORM="darwin-amd64" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  Linux)
    case "$ARCH" in
      x86_64|amd64) PLATFORM="linux-amd64" ;;
      aarch64|arm64)
        echo "Linux ARM64 binary is not published yet."
        echo "Install manually: cargo install upsk"
        exit 1
        ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  MINGW*|MSYS*|CYGWIN*)
    PLATFORM="windows-amd64"
    ;;
  *)
    echo "Unsupported OS: $OS"
    echo "Install manually: cargo install upsk"
    exit 1
    ;;
esac

SYSTEM_INSTALL_DIR="${SYSTEM_INSTALL_DIR:-/usr/local/bin}"
INSTALL_DIR="${SYSTEM_INSTALL_DIR}"
BINARY="upsk"
URL="${REPO}/${PLATFORM}"

echo "Downloading upsk for ${PLATFORM}..."
TMPFILE="$(mktemp)"
if command -v curl > /dev/null 2>&1; then
  curl -fsSL "$URL" -o "$TMPFILE"
elif command -v wget > /dev/null 2>&1; then
  wget -q "$URL" -O "$TMPFILE"
else
  echo "Neither curl nor wget found. Install manually: cargo install upsk"
  exit 1
fi

chmod +x "$TMPFILE"

install_to() {
  local dir="$1"
  mkdir -p "$dir" 2>/dev/null && mv "$TMPFILE" "${dir}/${BINARY}" 2>/dev/null
}

path_contains_dir() {
  local dir="$1"
  case ":$PATH:" in
    *":${dir}:"*) return 0 ;;
    *) return 1 ;;
  esac
}

persist_path_for_shell() {
  local dir="$1"
  local shell_name rc_file path_line

  shell_name="$(basename "${SHELL:-}")"
  case "$shell_name" in
    zsh)
      rc_file="${HOME}/.zshrc"
      ;;
    bash)
      if [ -f "${HOME}/.bash_profile" ] || [ ! -f "${HOME}/.profile" ]; then
        rc_file="${HOME}/.bash_profile"
      else
        rc_file="${HOME}/.profile"
      fi
      ;;
    *)
      rc_file="${HOME}/.profile"
      ;;
  esac

  path_line="export PATH=\"${dir}:\$PATH\""
  mkdir -p "$(dirname "$rc_file")" 2>/dev/null || true
  touch "$rc_file" 2>/dev/null || return 1

  if ! grep -Fqx "$path_line" "$rc_file" 2>/dev/null; then
    printf '\n%s\n' "$path_line" >> "$rc_file"
  fi

  printf '%s' "$rc_file"
}

INSTALLED=false

# Try system-wide first
if [ -w "$INSTALL_DIR" ] && install_to "$INSTALL_DIR"; then
  INSTALLED=true
fi

# Try user-local
if [ "$INSTALLED" = false ]; then
  INSTALL_DIR="${HOME}/.local/bin"
  if install_to "$INSTALL_DIR"; then
    INSTALLED=true
    USER_LOCAL_ON_PATH=false
    if path_contains_dir "$INSTALL_DIR"; then
      USER_LOCAL_ON_PATH=true
    else
      export PATH="${INSTALL_DIR}:$PATH"
      RC_FILE="$(persist_path_for_shell "$INSTALL_DIR" || true)"
      if [ -n "${RC_FILE:-}" ]; then
        echo "Persisted ${INSTALL_DIR} in ${RC_FILE}"
      else
        echo "Could not update your shell startup file automatically."
        echo "Run: export PATH=\"${INSTALL_DIR}:\$PATH\""
      fi
    fi

    hash -r 2>/dev/null || true
    rehash 2>/dev/null || true
  fi
fi

# Fall back to project-local .bin/ (works in sandboxed environments like Codex)
if [ "$INSTALLED" = false ]; then
  INSTALL_DIR="$(pwd)/.bin"
  if install_to "$INSTALL_DIR"; then
    INSTALLED=true
    export PATH="${INSTALL_DIR}:$PATH"
    echo "Installed to ${INSTALL_DIR} (sandbox mode)"
    echo "Run with: PATH=\"${INSTALL_DIR}:\$PATH\" upsk"
  fi
fi

if [ "$INSTALLED" = false ]; then
  echo "Could not install upsk. Install manually: cargo install upsk"
  rm -f "$TMPFILE"
  exit 1
fi

echo ""
echo "upsk installed successfully!"
"${INSTALL_DIR}/${BINARY}" --version
echo "Installed to ${INSTALL_DIR}/${BINARY}"

CURRENT_UPSK_PATH="$(command -v "$BINARY" 2>/dev/null || true)"
if [ -n "$CURRENT_UPSK_PATH" ] && [ "$CURRENT_UPSK_PATH" != "${INSTALL_DIR}/${BINARY}" ]; then
  echo "Existing upsk command still points to ${CURRENT_UPSK_PATH}."
  echo "Use ${INSTALL_DIR}/${BINARY} for now, then run hash -r or open a new shell."
fi
