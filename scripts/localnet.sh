#!/usr/bin/env bash
#
# scripts/localnet.sh
#
# Simple, flexible localnet helper for the "bataranetwork" project.
#
# Features:
# - "compose" mode: if docker-compose.yml / docker-compose.yaml exists you can use `./scripts/localnet.sh compose up|down|logs`
# - Native mode: attempts to use a local node binary (default: $BINARY -> bataranetworkd)
#   Supports basic commands: generate, start, stop, clean, status, logs
#
# NOTE:
# - This is a template. Adjust BINARY, GEN_ACCOUNT_MNEMONIC, chain-id and other params to match your project's CLI.
# - Tested with Unix-like shells (Linux / macOS). Make executable: chmod +x scripts/localnet.sh
#
set -euo pipefail

# =========================
# Configuration (change as needed)
# =========================
# Name of the project binary (override by env var BINARY)
BINARY="${BINARY:-bataranetworkd}"

# Chain ID
CHAIN_ID="${CHAIN_ID:-batara-localnet}"

# Number of validator nodes to run
NUM_NODES="${NUM_NODES:-4}"

# Base ports (will offset per node)
P2P_PORT_BASE="${P2P_PORT_BASE:-26656}"
RPC_PORT_BASE="${RPC_PORT_BASE:-26657}"
PROF_PORT_BASE="${PROF_PORT_BASE:-6060}"

# Data root directory
DATA_DIR="${DATA_DIR:-./localnet}"

# Docker compose file name (if present, compose mode will be available)
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# Default gentx amount (if using a Cosmos-SDK style binary)
GEN_TOKENS="${GEN_TOKENS:-100000000stake}"

# Extra args passed to node when starting
NODE_EXTRA_ARGS="${NODE_EXTRA_ARGS:-}"

# PID file directory
PID_DIR="${PID_DIR:-$DATA_DIR/pids}"

# =========================
# Helpers
# =========================
log() { printf '%s\n' "$*"; }
err() { printf 'ERROR: %s\n' "$*" >&2; }

exists() { command -v "$1" >/dev/null 2>&1; }

# Compose mode helper
has_compose_file() {
  [[ -f "$COMPOSE_FILE" || -f docker-compose.yaml ]]
}

usage() {
  cat <<EOF
Usage: $0 <mode> [command]

Modes (auto-detected):
  compose   Use docker-compose/docker compose if a compose file is present.
  native    Use the local binary ($BINARY)

Native commands:
  generate    Generate node dirs, keys and genesis (idempotent)
  start       Start all nodes (background, writes pids to $PID_DIR)
  stop        Stop nodes started by this script
  clean       Remove $DATA_DIR entirely
  status      Show status (running PIDs)
  logs [n]    Show logs for node number n (or all if omitted)

Compose commands:
  up          docker compose up -d
  down        docker compose down
  logs        docker compose logs -f

Examples:
  $0 generate
  $0 start
  $0 stop
  $0 compose up

Customize by exporting env vars:
  BINARY, CHAIN_ID, NUM_NODES, DATA_DIR, P2P_PORT_BASE, RPC_PORT_BASE

EOF
}

# =========================
# Native-mode implementations
# =========================
init_dirs() {
  mkdir -p "$DATA_DIR"
  mkdir -p "$PID_DIR"
  for i in $(seq 1 "$NUM_NODES"); do
    mkdir -p "$DATA_DIR/node$i"
  done
}

# Basic generation logic for Cosmos-SDK like binaries.
# If your project CLI differs, replace the commands below.
generate_native() {
  if ! exists "$BINARY"; then
    err "Binary '$BINARY' not found in PATH. Either install it or run in compose mode."
    exit 1
  fi

  init_dirs
  log "Generating $NUM_NODES nodes in $DATA_DIR (chain-id: $CHAIN_ID)..."

  # Init the first node to create genesis
  if [[ ! -d "$DATA_DIR/node1/config" ]]; then
    log "Initializing node1..."
    "$BINARY" init "node1" --chain-id "$CHAIN_ID" --home "$DATA_DIR/node1" >/dev/null
  else
    log "Node1 already initialized, skipping init."
  fi

  # Create keys and add genesis accounts
  for i in $(seq 1 "$NUM_NODES"); do
    NODE_HOME="$DATA_DIR/node$i"
    KEY_NAME="node${i}key"

    if ! "$BINARY" keys show "$KEY_NAME" --home "$NODE_HOME" >/dev/null 2>&1; then
      log "Adding key $KEY_NAME..."
      # create a key with no passphrase (dev use only) - adapt as needed
      echo -e "test\n" | "$BINARY" keys add "$KEY_NAME" --home "$NODE_HOME" >/dev/null
    else
      log "Key $KEY_NAME exists, skipping."
    fi

    # Add genesis account to node1's genesis
    ADDR=$("$BINARY" keys show "$KEY_NAME" -a --home "$NODE_HOME")
    if ! grep -q "$ADDR" "$DATA_DIR/node1/config/genesis.json"; then
      log "Adding genesis account for $KEY_NAME ($ADDR) with tokens $GEN_TOKENS"
      "$BINARY" add-genesis-account "$ADDR" "$GEN_TOKENS" --home "$DATA_DIR/node1" >/dev/null
    else
      log "Genesis account for $KEY_NAME already present."
    fi
  done

  # Generate gentxs (simple single-node gentx flow)
  if [[ ! -d "$DATA_DIR/gentxs" ]]; then
    mkdir -p "$DATA_DIR/gentxs"
  fi

  for i in $(seq 1 "$NUM_NODES"); do
    NODE_HOME="$DATA_DIR/node$i"
    KEY_NAME="node${i}key"
    if [[ ! -f "$NODE_HOME/config/gentx-${i}.json" && ! -f "$NODE_HOME/config/gentx.json" ]]; then
      log "Creating gentx for $KEY_NAME..."
      "$BINARY" gentx "$KEY_NAME" 1000000stake --chain-id "$CHAIN_ID" --home "$NODE_HOME" >/dev/null || {
        err "gentx failed for node $i — you may need to adapt the script for your project."
      }
      # copy gentx to node1's gentx folder
      cp "$NODE_HOME/config/gentx"* "$DATA_DIR/node1/config/gentx/" 2>/dev/null || true
    else
      log "Gentx for node $i" "already exists or was created."
    fi
  done

  # Collect gentxs into genesis (using node1)
  log "Collecting gentxs and validating genesis..."
  "$BINARY" collect-gentxs --home "$DATA_DIR/node1" >/dev/null || log "collect-gentxs returned non-zero; continuing..."
  "$BINARY" validate-genesis --home "$DATA_DIR/node1" >/dev/null || log "validate-genesis returned non-zero; continue with caution."

  # Distribute genesis and config to other nodes and patch ports
  for i in $(seq 1 "$NUM_NODES"); do
    NODE_HOME="$DATA_DIR/node$i"

    cp "$DATA_DIR/node1/config/genesis.json" "$NODE_HOME/config/genesis.json"

    # adjust ports in config files (simple sed replacements; may need tuning per project)
    P2P_PORT=$((P2P_PORT_BASE + i - 1))
    RPC_PORT=$((RPC_PORT_BASE + i - 1))
    PROF_PORT=$((PROF_PORT_BASE + i - 1))

    if [[ -f "$NODE_HOME/config/config.toml" ]]; then
      sed -i.bak -E "s/^(laddr *= *\"tcp:\/\/127.0.0.1:)[0-9]+(\")/\1${P2P_PORT}\2/" "$NODE_HOME/config/config.toml" || true
    fi

    if [[ -f "$NODE_HOME/config/app.toml" ]]; then
      sed -i.bak -E "s/^(address *= *\"tcp:\/\/127.0.0.1:)[0-9]+(\")/\1${RPC_PORT}\2/" "$NODE_HOME/config/app.toml" || true
      sed -i.bak -E "s/^(pprof_laddr *= *\"localhost:)[0-9]+(\")/\1${PROF_PORT}\2/" "$NODE_HOME/config/app.toml" || true
    fi
  done

  log "Generation complete. Data written to $DATA_DIR."
  log "Start the network with: $0 start"
}

start_native() {
  if ! exists "$BINARY"; then
    err "Binary '$BINARY' not found in PATH. Aborting start."
    exit 1
  fi

  if [[ ! -d "$DATA_DIR" ]]; then
    err "Data directory $DATA_DIR not found. Run '$0 generate' first."
    exit 1
  fi

  mkdir -p "$PID_DIR"

  for i in $(seq 1 "$NUM_NODES"); do
    NODE_HOME="$DATA_DIR/node$i"
    P2P_PORT=$((P2P_PORT_BASE + i - 1))
    RPC_PORT=$((RPC_PORT_BASE + i - 1))

    LOGFILE="$DATA_DIR/node${i}.log"
    if [[ -f "$PID_DIR/node${i}.pid" ]]; then
      pid=$(cat "$PID_DIR/node${i}.pid")
      if kill -0 "$pid" >/dev/null 2>&1; then
        log "Node $i already running (pid $pid)"
        continue
      else
        rm -f "$PID_DIR/node${i}.pid"
      fi
    fi

    log "Starting node $i (home=$NODE_HOME) -> p2p:$P2P_PORT rpc:$RPC_PORT"
    nohup "$BINARY" start --home "$NODE_HOME" $NODE_EXTRA_ARGS >"$LOGFILE" 2>&1 &
    pid=$!
    echo "$pid" >"$PID_DIR/node${i}.pid"
    # give the node a short moment to initialize
    sleep 0.4
  done

  log "All start commands issued. Use '$0 status' to check running PIDs. Logs are at $DATA_DIR/*.log"
}

stop_native() {
  if [[ ! -d "$PID_DIR" ]]; then
    log "No PID dir ($PID_DIR). Nothing to stop."
    return
  fi

  local stopped=0
  for pidfile in "$PID_DIR"/node*.pid 2>/dev/null || true; do
    [[ -e "$pidfile" ]] || continue
    pid=$(cat "$pidfile")
    if kill -0 "$pid" >/dev/null 2>&1; then
      log "Stopping pid $pid (from $pidfile)..."
      kill "$pid"
      sleep 0.2
      if kill -0 "$pid" >/dev/null 2>&1; then
        log "PID $pid didn't exit, sending SIGKILL..."
        kill -9 "$pid" || true
      fi
      stopped=$((stopped + 1))
    else
      log "PID $pid not running, removing $pidfile"
    fi
    rm -f "$pidfile"
  done

  if (( stopped == 0 )); then
    log "No running nodes were stopped."
  else
    log "Stopped $stopped nodes."
  fi
}

status_native() {
  if [[ ! -d "$PID_DIR" ]]; then
    log "No PID dir ($PID_DIR). No running nodes known."
    return
  fi

  for i in $(seq 1 "$NUM_NODES"); do
    pidfile="$PID_DIR/node${i}.pid"
    if [[ -f "$pidfile" ]]; then
      pid=$(cat "$pidfile")
      if kill -0 "$pid" >/dev/null 2>&1; then
        log "node$i: running (pid $pid)"
      else
        log "node$i: pidfile exists but process $pid not running"
      fi
    else
      log "node$i: not running (no pidfile)"
    fi
  done
}

logs_native() {
  if [[ $# -ge 1 ]]; then
    i="$1"
    logfile="$DATA_DIR/node${i}.log"
    if [[ -f "$logfile" ]]; then
      tail -n 200 -f "$logfile"
    else
      err "Log file $logfile not found."
      return 1
    fi
  else
    ls -1 "$DATA_DIR"/node*.log 2>/dev/null || {
      err "No logs found in $DATA_DIR"
      return 1
    }
    tail -n 200 -f "$DATA_DIR"/node*.log
  fi
}

clean_native() {
  log "Stopping any running nodes..."
  stop_native
  if [[ -d "$DATA_DIR" ]]; then
    log "Removing $DATA_DIR..."
    rm -rf "$DATA_DIR"
  fi
  log "Clean complete."
}

# =========================
# Compose mode
# =========================
compose_up() {
  if exists docker-compose; then
    docker-compose -f "$COMPOSE_FILE" up -d
  elif exists docker && docker --help | grep -q "compose"; then
    docker compose -f "$COMPOSE_FILE" up -d
  else
    err "docker-compose or docker compose not available on PATH."
    exit 1
  fi
}

compose_down() {
  if exists docker-compose; then
    docker-compose -f "$COMPOSE_FILE" down
  elif exists docker && docker --help | grep -q "compose"; then
    docker compose -f "$COMPOSE_FILE" down
  else
    err "docker-compose or docker compose not available on PATH."
    exit 1
  fi
}

compose_logs() {
  if exists docker-compose; then
    docker-compose -f "$COMPOSE_FILE" logs -f
  elif exists docker && docker --help | grep -q "compose"; then
    docker compose -f "$COMPOSE_FILE" logs -f
  else
    err "docker-compose or docker compose not available on PATH."
    exit 1
  fi
}

# =========================
# CLI
# =========================
if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

MODE="$1"; shift || true

if [[ "$MODE" == "compose" || ( "$MODE" != "native" && has_compose_file ) ]]; then
  # If user explicitly asked compose or compose file exists and mode not explicitly native
  sub="${1:-}"
  case "$sub" in
    up)
      compose_up
      ;;
    down)
      compose_down
      ;;
    logs)
      compose_logs
      ;;
    "")
      usage
      exit 1
      ;;
    *)
      err "Unknown compose command: $sub"
      usage
      exit 1
      ;;
  esac
  exit 0
fi

# Native mode
case "$MODE" in
  generate)
    generate_native
    ;;
  start)
    start_native
    ;;
  stop)
    stop_native
    ;;
  clean)
    clean_native
    ;;
  status)
    status_native
    ;;
  logs)
    logs_native "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    err "Unknown command: $MODE"
    usage
    exit 1
    ;;
esac

exit 0
