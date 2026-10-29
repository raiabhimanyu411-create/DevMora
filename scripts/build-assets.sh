#!/usr/bin/env bash
# Rebuilds the minified CSS/JS the pages load. Run after editing
# assets/css/style.css or assets/js/main.js, then bump ?v= in the HTML.
set -euo pipefail
cd "$(dirname "$0")/.."
npx --yes clean-css-cli@5 -O1 -o assets/css/style.min.css assets/css/style.css
npx --yes terser@5 assets/js/main.js -c -m -o assets/js/main.min.js
echo "Built assets/css/style.min.css and assets/js/main.min.js"
