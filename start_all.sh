#!/bin/bash

# Ensure we are in the script's directory
cd "$(dirname "$0")"

echo "=========================================="
echo "Starting Netra Intelligent Traffic System!"
echo "=========================================="
echo ""
echo "Dashboards will be available at:"
echo " - React Dashboard: http://localhost:3000"
echo " - Streamlit Panel: http://localhost:8501"
echo ""
echo "Press Ctrl+C at any time to stop all services cleanly."
echo "=========================================="
echo ""

# Use concurrently via npx to run everything in a single terminal with color-coded logs
npx --yes concurrently \
    --kill-others \
    --names "FastAPI,Flask,Streamlit,React" \
    --prefix-colors "blue.bold,green.bold,yellow.bold,magenta.bold" \
    "cd Accident_detection && source ../.venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8000" \
    "cd emerygency-control-unit && source ../.venv/bin/activate && python3 app.py" \
    "cd control-panel && source ../.venv/bin/activate && streamlit run dashboard.py --server.port 8501" \
    "cd netra-dashboard && if [ ! -d \"node_modules\" ]; then npm install --no-audit --no-fund; fi && npm run dev -- --port 3000"
