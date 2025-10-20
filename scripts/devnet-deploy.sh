#!/usr/bin/env bash
#
# scripts/devnet.deploy.sh
#
# Deploy helper for the "bataranetwork" project devnet.
# - Can build a docker image for the node, push to a registry (optional),
#   deploy with docker compose locally or to remote hosts over SSH.
# - Intended as a sensible, opinionated starting point. Adapt paths, image
#   names and compose files to your project's layout.
#
# Usage:
#   ./scripts/devnet.deploy.sh build         # build docker image locally
#   ./scripts/devnet.deploy.sh push          # push image to registry (requires $REGISTRY)
#   ./scripts/devnet.deploy.sh local         # docker compose up -d locally
#   ./scripts/devnet.deploy.sh remote        # deploy to remote hosts (requires $HOSTS)
#   ./scripts/devnet.deploy.sh down local    # docker compose down locally
#   ./scripts/devnet.deploy.sh down remote   # stop remote compose on hosts
#   ./scripts/devnet.deploy.sh clean remote  # clean remote dir and stop containers
#
# Environment / config (override by exporting before running):
#   IMAGE_NAME     - image name (default: bataranetwork/node)
#   TAG            - image tag (default: dev)
#   REGISTRY       - optional registry prefix (example: ghcr.io/your-org)
#   COMPOSE_FILE   - docker-compose file to use (default: ./docker-compose.yml)
#   HOSTS          - remote hosts (space or comma separated), e.g. "host1 host2" or "host1,host2"
#   SSH_USER       - ssh user for remote hosts (default: ubuntu)
#   SSH_PORT       - ssh port (default: 22)
#   SSH_KEY        - path to private key for ssh/scp (optional)
#   REMOTE_DIR     - remote directory to deploy compose (default: /opt/bataranetwork/devnet)
#   SKIP_BUILD     - if set to "1", skip local docker build step on remote deploy
#   EXTRA_FILES    - additional local files to copy to remote (space-separated list, relative to repo root)
#
set -euo pipefail

# -------------------------
# Defaults (customize if needed)
# -------------------------
IMAGE_NAME="${IMAGE_NAME:-bataranetwork/node}"
TAG="${TAG:-dev}"
REGISTRY="${REGISTRY:-}"          # e.g. ghcr.io/BataraNetwork
COMPOSE_FILE="${COMPOSE_FILE:-./docker-compose.yml}"
HOSTS="${HOSTS:-}"                # e.g. "host1 host2" or "host1,host2"
SSH_USER="${SSH_USER:-ubuntu}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-}"            # e.g. ~/.ssh/id_rsa
REMOTE_DIR="${REMOTE_DIR:-/opt/bataranetwork/devnet}"
SKIP_BUILD="${SKIP_BUILD:-0}"
EXTRA_FILES="${EXTRA_FILES:-}"    # e.g. "node-configs/.env .env"
DRY_RUN="${DRY_RUN:-0}"

# Derived
if [[ -n "$REGISTRY" ]]; then
  IMAGE="${REGISTRY%/}/${IMAGE_NAME}:${TAG}"
else
  IMAGE="${IMAGE_NAME}:${TAG}"
fi

SSH_OPTS=(-o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -p "$SSH_PORT")
if [[ -n "$SSH_KEY" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY")
fi

log() { printf '%s\n' "$*"; }
err() { printf 'ERROR: %s\n' "$*" >&2; }

usage() {
  cat <<EOF
Usage: $0 <action> [scope]

Actions:
  build        Build the docker image locally
  push         Push the image to registry (requires REGISTRY)
  local        Deploy locally using docker compose (COMPOSE_FILE)
  remote       Deploy to remote hosts (requires HOSTS)
  down         Stop compose (scope: local|remote|all)
  clean        Remove remote deployment dir and stop containers on hosts

Environment:
  IMAGE_NAME, TAG, REGISTRY, COMPOSE_FILE, HOSTS, SSH_USER, SSH_PORT, SSH_KEY,
  REMOTE_DIR, SKIP_BUILD, EXTRA_FILES, DRY_RUN

Examples:
  IMAGE_NAME=bataranetwork/node TAG=ci ./scripts/devnet.deploy.sh build
  REGISTRY=ghcr.io/BataraNetwork HOSTS="host1,host2" ./scripts/devnet.deploy.sh remote
EOF
}

# -------------------------
# Helpers
# -------------------------
require_file() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    err "Required file not found: $f"
    exit 2
  fi
}

is_dry() {
  [[ "$DRY_RUN" == "1" ]]
}

run() {
  if is_dry; then
    log "[dry-run] $*"
  else
    eval "$@"
  fi
}

normalize_hosts() {
  local raw="$1"
  # replace commas with spaces, collapse multi-space
  raw="${raw//,/ }"
  # trim
  raw="$(echo "$raw" | xargs)"
  echo "$raw"
}

scp_to_host() {
  local host="$1"
  local src="$2"
  local dst="$3"
  log "Copying $src -> ${SSH_USER}@${host}:${dst}"
  if is_dry; then
    log "[dry-run] scp ${SSH_OPTS[*]} \"$src\" ${SSH_USER}@${host}:\"$dst\""
    return
  fi
  scp "${SSH_OPTS[@]}" -r "$src" "${SSH_USER}@${host}:$dst"
}

ssh_cmd() {
  local host="$1"
  shift
  local cmd="$*"
  if is_dry; then
    log "[dry-run] ssh ${SSH_OPTS[*]} ${SSH_USER}@${host} \"$cmd\""
    return 0
  fi
  ssh "${SSH_OPTS[@]}" "${SSH_USER}@${host}" "$cmd"
}

# -------------------------
# Actions
# -------------------------
action_build() {
  log "Building docker image: $IMAGE"
  require_file "$COMPOSE_FILE" || true  # compose not strictly necessary to build, keep gentle

  # If project provides a Dockerfile at project root, use it. Otherwise, look into docker/node or ./docker
  if [[ -f Dockerfile ]]; then
    log "Using Dockerfile at project root"
    run "docker build -t \"$IMAGE\" ."
  elif [[ -f docker/Dockerfile ]]; then
    log "Using docker/Dockerfile"
    run "docker build -t \"$IMAGE\" -f docker/Dockerfile ."
  else
    err "No Dockerfile found (looked for ./Dockerfile and ./docker/Dockerfile). Provide a Dockerfile or customize this script."
    exit 3
  fi

  log "Built $IMAGE"
}

action_push() {
  if [[ -z "$REGISTRY" ]]; then
    err "REGISTRY is not set. Set REGISTRY to push (e.g. ghcr.io/BataraNetwork)"
    exit 4
  fi
  log "Pushing image $IMAGE"
  run "docker push \"$IMAGE\""
  log "Push complete."
}

action_local() {
  require_file "$COMPOSE_FILE"
  log "Deploying locally with compose file: $COMPOSE_FILE"
  run "docker compose -f \"$COMPOSE_FILE\" up -d --remove-orphans"
  log "Local compose up issued."
}

action_down_local() {
  require_file "$COMPOSE_FILE"
  log "Stopping local compose"
  run "docker compose -f \"$COMPOSE_FILE\" down"
  log "Local compose stopped."
}

action_remote() {
  if [[ -z "$HOSTS" ]]; then
    err "HOSTS is empty. Set HOSTS to a space- or comma-separated list of hosts."
    exit 5
  fi

  local hosts
  hosts="$(normalize_hosts "$HOSTS")"

  # Optional: build & push if registry is set and SKIP_BUILD != 1
  if [[ "$SKIP_BUILD" != "1" && -z "$REGISTRY" ]]; then
    log "No REGISTRY set; we'll build locally and then save/load image on remote hosts."
  fi

  # Ensure compose file exists locally
  require_file "$COMPOSE_FILE"

  # Create a tar of the image if registry not set (for transport)
  local image_tar=""
  if [[ -z "$REGISTRY" && "$SKIP_BUILD" != "1" ]]; then
    log "Saving local image to tar for transfer to remotes."
    image_tar="/tmp/${IMAGE_NAME//\//_}_${TAG}.tar"
    run "docker save -o \"$image_tar\" \"$IMAGE\""
  fi

  # Files to copy: compose file + extras
  tmp_cp_files=()
  tmp_cp_files+=("$COMPOSE_FILE")
  if [[ -n "$EXTRA_FILES" ]]; then
    # split by spaces (user must ensure no spaces inside filenames)
    for f in $EXTRA_FILES; do
      if [[ -e "$f" ]]; then
        tmp_cp_files+=("$f")
      else
        err "Warning: EXTRA file not found: $f (skipping)"
      fi
    done
  fi
  if [[ -n "$image_tar" ]]; then
    tmp_cp_files+=("$image_tar")
  fi

  for host in $hosts; do
    log "Deploying to host: $host"

    # create remote dir
    ssh_cmd "$host" "mkdir -p \"$REMOTE_DIR\" && chmod 755 \"$REMOTE_DIR\""

    # copy files
    for src in "${tmp_cp_files[@]}"; do
      scp_to_host "$host" "$src" "$REMOTE_DIR/"
    done

    # If registry set and SKIP_BUILD !=1, instruct remote to pull
    if [[ -n "$REGISTRY" && "$SKIP_BUILD" != "1" ]]; then
      log "Pulling image on remote $host: $IMAGE"
      ssh_cmd "$host" "docker pull \"$IMAGE\" || (echo 'docker pull failed for $IMAGE' && exit 1)"
    elif [[ -n "$image_tar" ]]; then
      # load tar on remote
      log "Loading image tar on remote $host"
      ssh_cmd "$host" "docker load -i \"$REMOTE_DIR/$(basename "$image_tar")\""
    else
      log "Skipping image transfer/pull for $host (SKIP_BUILD=$SKIP_BUILD, REGISTRY=${REGISTRY:-unset})"
    fi

    # run docker compose up
    log "Starting compose on remote $host"
    ssh_cmd "$host" "cd \"$REMOTE_DIR\" && docker compose -f \"$(basename "$COMPOSE_FILE")\" up -d --remove-orphans"
    log "Remote deploy issued for $host"
  done

  # cleanup image tar locally unless DRY_RUN
  if [[ -n "$image_tar" && ! is_dry ]]; then
    rm -f "$image_tar" || true
  fi

  log "Remote deploy finished for all hosts."
}

action_down_remote() {
  if [[ -z "$HOSTS" ]]; then
    err "HOSTS is empty. Set HOSTS to a space- or comma-separated list of hosts."
    exit 6
  fi
  local hosts
  hosts="$(normalize_hosts "$HOSTS")"
  for host in $hosts; do
    log "Stopping compose on remote $host"
    ssh_cmd "$host" "if [[ -d \"$REMOTE_DIR\" ]]; then cd \"$REMOTE_DIR\" && docker compose -f \"$(basename "$COMPOSE_FILE")\" down || true; else echo 'REMOTE_DIR not found: $REMOTE_DIR'; fi"
    log "Stopped on $host"
  done
}

action_clean_remote() {
  if [[ -z "$HOSTS" ]]; then
    err "HOSTS is empty. Set HOSTS to a space- or comma-separated list of hosts."
    exit 7
  fi
  local hosts
  hosts="$(normalize_hosts "$HOSTS")"
  for host in $hosts; do
    log "Cleaning remote $host: stopping compose and removing $REMOTE_DIR"
    ssh_cmd "$host" "if [[ -d \"$REMOTE_DIR\" ]]; then cd \"$REMOTE_DIR\" && docker compose -f \"$(basename "$COMPOSE_FILE")\" down || true; rm -rf \"$REMOTE_DIR\"; else echo 'REMOTE_DIR not found: $REMOTE_DIR'; fi"
    log "Cleaned $host"
  done
}

# -------------------------
# CLI dispatch
# -------------------------
if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

ACTION="$1"; shift || true
SCOPE="${1:-}"

case "$ACTION" in
  build)
    action_build
    ;;
  push)
    action_push
    ;;
  local)
    action_local
    ;;
  remote)
    action_remote
    ;;
  down)
    case "$SCOPE" in
      local) action_down_local ;;
      remote) action_down_remote ;;
      all)
        action_down_local
        action_down_remote
        ;;
      "")
        err "Please provide scope for 'down': local|remote|all"
        usage
        exit 1
        ;;
      *)
        err "Unknown scope for down: $SCOPE"
        usage
        exit 1
        ;;
    esac
    ;;
  clean)
    case "$SCOPE" in
      remote) action_clean_remote ;;
      *)
        err "clean only supports scope 'remote'"
        usage
        exit 1
        ;;
    esac
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    err "Unknown action: $ACTION"
    usage
    exit 1
    ;;
esac

exit 0
