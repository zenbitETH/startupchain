#!/usr/bin/env bash
set -euo pipefail

# Looks up the ENS owner for a given name on mainnet or Sepolia.
# Usage:
#   CHAIN_ID=11155111 SEPOLIA_RPC_URL=... ./scripts/get-ens-owner.sh myname.eth

NAME="${1:-}"
CHAIN_ID="${CHAIN_ID:-11155111}"
RPC_URL="${RPC_URL:-${SEPOLIA_RPC_URL:-}}"

if [[ -z "$NAME" ]]; then
  echo "Usage: CHAIN_ID=11155111 SEPOLIA_RPC_URL=... $0 <ens-name>" >&2
  exit 1
fi

if [[ -z "$RPC_URL" ]]; then
  echo "RPC_URL or SEPOLIA_RPC_URL is required" >&2
  exit 1
fi

case "$CHAIN_ID" in
  1|11155111)
    ENS_REGISTRY="${ENS_REGISTRY:-0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e}"
    ;;
  *)
    if [[ -z "${ENS_REGISTRY:-}" ]]; then
      echo "Unsupported CHAIN_ID '$CHAIN_ID'. Provide ENS_REGISTRY manually." >&2
      exit 1
    fi
    ;;
esac

NAMEHASH="$(cast namehash "$NAME")"
OWNER="$(cast call "$ENS_REGISTRY" "owner(bytes32)(address)" "$NAMEHASH" --rpc-url "$RPC_URL")"

echo "Chain ID: $CHAIN_ID"
echo "ENS name: $NAME"
echo "Owner: $OWNER"
