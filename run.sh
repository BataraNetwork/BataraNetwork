#!/usr/bin/env bash
# run.sh - Generic runner for the bataranetwork project
# - multi-stack support: Node.js, Python, Go, Docker, Docker Compose
# - commands: build, start, stop, restart, logs, status, test, help
# - places itself at project root (assumes this script lives in repo root)
#
# Usage:
#   ./run.sh <command> [--detached] [--port=PORT] [--env-file=.env]
#
# Examples:
#   ./run.sh run                 # build (if needed) and start in foreground
#   ./run.sh start --detached    # start in background (if supported)
#   ./run.sh logs                # stream logs (compose/docker only)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="bataranetwork"
ENV_FILE=".env"

# Helpers
info()  { printf "\e[34m[INFO]\e[0m %s\n" "$*"; }
warn()  { printf "\e[33m[WARN]\e[0m %s\n" "$*"; }
error() { printf "\e[31m[ERROR]\e[0m %s\n" "$*"; }
die()   { error "$*"; exit 1; }

# Defaults
DETACHED=false
PORT="${PORT:-8000}"
COMMAND="${1:-help}"

# parse simple args
shift_if_consumed() { if [[ $# -gt 0 ]]; then shift; fi; }
while [[ "${1:-}" =~ ^- ]]; do
  case "$1" in
    --detached|-d) DETACHED=true; shift ;;
    --port=*) PORT="${1#*=}"; shift ;;
    --env-file=*) ENV_FILE="${1#*=}"; shift ;;
    --help|-h) COMMAND="help"; shift ;;
    *) die "Unknown option: $1" ;;
  esac
done

# detect project type
detect_type() {
  if [[ -f "docker-compose.yml" ]] || [[ -f "docker-compose.yaml" ]]; then
    echo "compose"
    return
  fi
  if [[ -f "Dockerfile" ]]; then
    echo "docker"
    return
  fi
  if [[ -f "package.json" ]]; then
    echo "node"
    return
  fi
  if [[ -f "go.mod" ]]; then
    echo "go"
    return
  fi
  if [[ -f "pyproject.toml" ]] || [[ -f "requirements.txt" ]] || [[ -f "Pipfile" ]]; then
    echo "python"
    return
  fi
  echo "unknown"
}

PROJECT_TYPE="$(cd "$SCRIPT_DIR" && detect_type)"

# actions for each type
build_node() {
  info "Detected Node.js project"
  if [[ -f package-lock.json ]]; then
    npm ci
  elif [[ -f yarn.lock ]]; then
    if command -v yarn >/dev/null 2>&1; then yarn install; else npm install; fi
  else
    npm install
  fi
  if jq -e '.scripts.build' package.json >/dev/null 2>&1; then
    npm run build
  fi
}

start_node() {
  # prefer npm start; otherwise try node index.js or serve via package.json start script
  if [[ "${DETACHED}" == true ]]; then
    if npm run --silent start >/dev/null 2>&1 & then
      info "Started node app in background (via npm start)"
    else
      nohup node "${NODE_ENTRY:-index.js}" >/dev/null 2>&1 &
      info "Started node app in background (via node entry)"
    fi
  else
    if npm run --silent start >/dev/null 2>&1; then
      npm start
    else
      node "${NODE_ENTRY:-index.js}"
    fi
  fi
}

stop_node() {
  pkill -f "node .*${PROJECT_NAME}" || true
  pkill -f "node index.js" || true
  info "Requested node processes to stop (may require manual cleanup)"
}

build_python() {
  info "Detected Python project"
  python_cmd=python3
  if ! command -v $python_cmd >/dev/null 2>&1; then python_cmd=python; fi
  $python_cmd -m venv .venv || true
  # shellcheck disable=SC1091
  source .venv/bin/activate
  if [[ -f requirements.txt ]]; then
    pip install -r requirements.txt
  elif [[ -f pyproject.toml ]]; then
    pip install .
  fi
  deactivate || true
}

start_python() {
  python_cmd=.venv/bin/python
  if [[ ! -x "$python_cmd" ]]; then
    python_cmd=python3
  fi
  ENTRY="app.py"
  [[ -f main.py ]] && ENTRY="main.py"
  [[ -f wsgi.py ]] && ENTRY="wsgi.py"
  if [[ "${DETACHED}" == true ]]; then
    nohup "$python_cmd" "$ENTRY" >/dev/null 2>&1 &
    info "Started python app in background (entry: $ENTRY)"
  else
    "$python_cmd" "$ENTRY"
  fi
}

stop_python() {
  pkill -f "python .*${PROJECT_NAME}" || true
  info "Requested python processes to stop (may require manual cleanup)"
}

build_go() {
  info "Detected Go project"
  go build -o bin/${PROJECT_NAME} ./...
}

start_go() {
  if [[ ! -x bin/${PROJECT_NAME} ]]; then
    build_go
  fi
  if [[ "${DETACHED}" == true ]]; then
    nohup ./bin/${PROJECT_NAME} >/dev/null 2>&1 &
    info "Started go binary in background"
  else
    ./bin/${PROJECT_NAME}
  fi
}

stop_go() {
  pkill -f "bin/${PROJECT_NAME}" || true
  info "Requested go process to stop"
}

build_docker() {
  info "Detected Dockerfile"
  docker build -t ${PROJECT_NAME}:latest .
}

start_docker() {
  IMAGE=${PROJECT_NAME}:latest
  if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    build_docker
  fi
  # default port mapping; allow override via PORT env
  HOST_PORT="${PORT:-8000}"
  CONTAINER_PORT="${CONTAINER_PORT:-8000}"
  if [[ "${DETACHED}" == true ]]; then
    docker run -d --rm --name ${PROJECT_NAME} --env-file "${ENV_FILE}" -p "${HOST_PORT}:${CONTAINER_PORT}" "$IMAGE"
  else
    docker run --rm --name ${PROJECT_NAME} --env-file "${ENV_FILE}" -p "${HOST_PORT}:${CONTAINER_PORT}" "$IMAGE"
  fi
}

stop_docker() {
  docker stop ${PROJECT_NAME} >/dev/null 2>&1 || true
  docker rm -f ${PROJECT_NAME} >/dev/null 2>&1 || true
  info "Stopped and removed container ${PROJECT_NAME}"
}

start_compose() {
  COMPOSE="docker compose"
  if ! command -v docker >/dev/null 2>&1; then die "docker is required for compose"; fi
  if command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose"; fi
  if [[ "${DETACHED}" == true ]]; then
    $COMPOSE up -d
  else
    $COMPOSE up
  fi
}

stop_compose() {
  COMPOSE="docker compose"
  if command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose"; fi
  $COMPOSE down
}

logs_compose() {
  COMPOSE="docker compose"
  if command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose"; fi
  $COMPOSE logs -f
}

status_compose() {
  COMPOSE="docker compose"
  if command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose"; fi
  $COMPOSE ps
}

# High-level dispatch
case "$COMMAND" in
  help)
    cat <<-EOF
    run.sh - helper for bataranetwork project

    Commands:
      build       Build project's artifacts (if supported)
      start       Start the project (build first if needed)
      run|up      Build then start in foreground (or background with --detached)
      stop        Stop the running service(s)
      restart     Stop then start
      logs        Stream logs (compose/docker)
      status      Show status (compose or processes)
      test        Run tests if common test commands detected (npm test, go test, pytest)
      help        Show this message

    Options:
      --detached      Start services in background (where supported)
      --port=PORT     Override host port mapping (default: ${PORT})
      --env-file=FILE Use an envfile when running containers (default: ${ENV_FILE})

    Tips:
      - Make script executable: chmod +x run.sh
      - Edit CONTAINER_PORT in script if your Dockerfile expects a different internal port.
      - Adjust Python/Node entrypoint detection if your project uses non-standard filenames.
EOF
    ;;

  build)
    cd "$SCRIPT_DIR"
    case "$PROJECT_TYPE" in
      node) build_node ;;
      python) build_python ;;
      go) build_go ;;
      docker) build_docker ;;
      compose) info "Compose handles build on up (use docker compose build)";;
      *) die "Unknown project type: $PROJECT_TYPE. Cannot build automatically." ;;
    esac
    ;;

  start)
    cd "$SCRIPT_DIR"
    case "$PROJECT_TYPE" in
      node) start_node ;;
      python) start_python ;;
      go) start_go ;;
      docker) start_docker ;;
      compose) start_compose ;;
      *) die "Unknown project type: $PROJECT_TYPE. Cannot start automatically." ;;
    esac
    ;;

  run|up)
    cd "$SCRIPT_DIR"
    case "$PROJECT_TYPE" in
      node) build_node; start_node ;;
      python) build_python; start_python ;;
      go) build_go; start_go ;;
      docker) build_docker; start_docker ;;
      compose) start_compose ;;
      *) die "Unknown project type: $PROJECT_TYPE. Cannot run automatically." ;;
    esac
    ;;

  stop)
    cd "$SCRIPT_DIR"
    case "$PROJECT_TYPE" in
      node) stop_node ;;
      python) stop_python ;;
      go) stop_go ;;
      docker) stop_docker ;;
      compose) stop_compose ;;
      *) die "Unknown project type: $PROJECT_TYPE. Cannot stop automatically." ;;
    esac
    ;;

  restart)
    "$0" stop
    sleep 1
    "$0" start
    ;;

  logs)
    cd "$SCRIPT_DIR"
    case "$PROJECT_TYPE" in
      compose) logs_compose ;;
      docker)
        docker logs -f ${PROJECT_NAME} || die "No logs: container may not be running"
        ;;
      node|python|go)
        warn "Log streaming is not implemented for process-based projects. Use stdout or a process manager (pm2, systemd) for better logs."
        ;;
      *)
        die "Unknown project type: $PROJECT_TYPE. Cannot show logs."
        ;;
    esac
    ;;

  status)
    cd "$SCRIPT_DIR"
    case "$PROJECT_TYPE" in
      compose) status_compose ;;
      docker)
        docker ps --filter "name=${PROJECT_NAME}"
        ;;
      node|python|go)
        ps aux | grep -E "${PROJECT_NAME}|node|python|bin/${PROJECT_NAME}" | grep -v grep || info "No matching processes found"
        ;;
      *)
        die "Unknown project type: $PROJECT_TYPE. Cannot show status."
        ;;
    esac
    ;;

  test)
    cd "$SCRIPT_DIR"
    if [[ -f package.json ]] && jq -e '.scripts.test' package.json >/dev/null 2>&1; then
      npm test
    elif [[ -d tests ]] || [[ -f pytest.ini ]]; then
      if command -v pytest >/dev/null 2>&1; then pytest -q; else die "pytest not installed"; fi
    elif [[ -f go.mod ]]; then
      go test ./...
    else
      die "No test harness detected"
    fi
    ;;

  *)
    die "Unknown command: $COMMAND. Run ./run.sh help"
    ;;
esac
