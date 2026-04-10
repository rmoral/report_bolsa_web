#!/bin/bash
# ============================================================
# Social Media Automation - Setup Script
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     Social Media Automation System - Setup           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check Python 3.10+
PYTHON=$(command -v python3 || command -v python)
PY_VERSION=$($PYTHON --version 2>&1 | awk '{print $2}')
echo "Python found: $PY_VERSION"
PY_MAJOR=$($PYTHON -c "import sys; print(sys.version_info.major)")
PY_MINOR=$($PYTHON -c "import sys; print(sys.version_info.minor)")
if [ "$PY_MAJOR" -lt 3 ] || ([ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 10 ]); then
    echo "ERROR: Python 3.10+ required. Found $PY_VERSION"
    exit 1
fi

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment…"
    $PYTHON -m venv .venv
fi

echo "Activating virtual environment…"
source .venv/bin/activate

echo "Installing dependencies…"
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo ""
echo "✅ Dependencies installed."

# Create .env from example if not present
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "📋 Created .env from .env.example"
    echo "   → IMPORTANT: Edit .env and fill in your API credentials before running."
else
    echo "   .env already exists, skipping."
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                 Next Steps                           ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  1. Edit social_automation/.env with your API keys  ║"
echo "║  2. Test connectivity:                               ║"
echo "║     cd social_automation                             ║"
echo "║     source .venv/bin/activate                        ║"
echo "║     python -c 'from config import config; print(config)' ║"
echo "║  3. Start the system:                                ║"
echo "║     python main.py                                   ║"
echo "║  4. (Optional) Install as service:                   ║"
echo "║     sudo cp social-automation.service /etc/systemd/  ║"
echo "║     sudo systemctl enable social-automation          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
