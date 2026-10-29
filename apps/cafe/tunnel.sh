#!/usr/bin/env bash
# ==============================================================================
# tunnel.sh - Expose Synapsee Café publicly for TinyFish remote browser visits
# ==============================================================================

PORT=${1:-3000}

echo "========================================================================"
echo "☕ Exposing Synapsee Café (Port $PORT) for TinyFish Remote Browser Access"
echo "========================================================================"
echo "Note: A localhost address cannot be reached by TinyFish's cloud browsers."
echo "Starting public tunnel via localtunnel..."
echo ""

npx --yes localtunnel --port "$PORT"
