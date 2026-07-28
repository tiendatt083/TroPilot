#!/usr/bin/env bash
# render.sh — compile 1 file .d2 → .svg (mặc định) và .png (nếu --png).
# Layout ELK (đường vuông góc, gom máng, ít đè) — khác dagre mặc định của Mermaid.
# Dùng bởi skill /d2. AI KHÔNG cần nhớ đường dẫn d2/Chrome — gọi script này.
#
#   ./render.sh <file.d2>            → sinh <file>.svg
#   ./render.sh <file.d2> --png      → sinh thêm <file>.png (qua Chrome puppeteer-cache)
#
# Exit != 0 nếu compile fail (skill phải báo user, KHÔNG ghi diagram hỏng).

set -euo pipefail

SRC="${1:?Cần đường dẫn file .d2}"
WANT_PNG="${2:-}"

# d2 cài qua install.sh vào ~/.local/bin
D2_BIN="$HOME/.local/bin/d2"
[ -x "$D2_BIN" ] || D2_BIN="$(command -v d2 || true)"
[ -n "$D2_BIN" ] || { echo "❌ Chưa cài d2. Cài: curl -fsSL https://d2lang.com/install.sh | sh -s --"; exit 1; }

SVG="${SRC%.d2}.svg"

# --layout elk: layout đẹp cho flow nhiều nhánh. --theme 1: neutral gray sạch cho BA doc.
"$D2_BIN" --layout elk --theme 1 --pad 40 "$SRC" "$SVG"
echo "✅ SVG: $SVG"

if [ "$WANT_PNG" = "--png" ]; then
  # The cache directory is optional.  With `set -e -o pipefail`, a missing
  # directory must not stop the fallback checks for a system browser.
  CHROME="$(find "$HOME/.puppeteer-cache/chrome" -name 'Google Chrome for Testing' -type f 2>/dev/null | head -1 || true)"
  [ -n "$CHROME" ] || CHROME="$(command -v google-chrome-stable || command -v chromium || true)"
  # Windows / Git Bash: locate a standard Chrome or Edge installation.
  if [ -z "$CHROME" ]; then
    for CANDIDATE in \
      "/c/Program Files/Google/Chrome/Application/chrome.exe" \
      "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
      "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"; do
      # Git Bash can report Windows .exe files as non-executable even when they
      # can be launched normally, so test for the file rather than its Unix mode.
      if [ -f "$CANDIDATE" ]; then
        CHROME="$CANDIDATE"
        break
      fi
    done
  fi
  if [ -z "$CHROME" ]; then
    echo "⚠️  Không thấy Chrome để render PNG — chỉ có SVG. (SVG mở được bằng browser/IDE.)"
    exit 0
  fi

  # D2 native `d2 file.d2 file.png` đòi Playwright driver tự tải — hay bị 404 offline/CDN đổi.
  # Dùng Chrome sẵn có (đã cài cho export PDF/Mermaid) chụp SVG, nhưng PHẢI đọc đúng kích thước
  # thật từ viewBox thẻ <svg> gốc D2 sinh ra — window-size cố định sẽ crop/thừa trắng tuỳ diagram.
  VIEWBOX="$(grep -o 'viewBox="[0-9. ]*"' "$SVG" | head -1 | sed -E 's/viewBox="([0-9. ]*)"/\1/')"
  W="$(echo "$VIEWBOX" | awk '{print int($3+0.5)}')"
  H="$(echo "$VIEWBOX" | awk '{print int($4+0.5)}')"
  if [ -z "$W" ] || [ -z "$H" ] || [ "$W" -le 0 ] || [ "$H" -le 0 ]; then
    echo "⚠️  Không đọc được viewBox từ $SVG — fallback 1600x2200 (có thể bị crop/thừa trắng)."
    W=1600; H=2200
  fi

  PNG="${SRC%.d2}.png"
  # Chrome is a native Windows process under Git Bash.  Convert both paths so
  # the input is a proper file URL and the output lands in the project folder.
  SVG_TARGET="$SVG"
  PNG_TARGET="$PNG"
  if command -v cygpath >/dev/null 2>&1; then
    SVG_NATIVE="$(cygpath -am "$SVG")"
    PNG_TARGET="$(cygpath -am "$PNG")"
    SVG_TARGET="file:///${SVG_NATIVE}"
  fi

  "$CHROME" --headless --disable-gpu --allow-file-access-from-files --screenshot="$PNG_TARGET" \
    --window-size="${W},${H}" --default-background-color=FFFFFFFF "$SVG_TARGET"
  echo "✅ PNG: $PNG (${W}x${H}, khớp viewBox thật)"
fi
