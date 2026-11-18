#!/bin/sh
# Builds the app in Release and installs it as ~/Applications/Dual N-Back.app,
# quitting a running copy first.
set -eu
cd "$(dirname "$0")/.."

xcodebuild -project NBack.xcodeproj -scheme NBack -configuration Release \
    -destination 'generic/platform=macOS' -derivedDataPath build/DerivedData -quiet build

if pgrep -xq "Dual N-Back"; then
    osascript -e 'tell application id "net.rrogerc.nback" to quit'
    for _ in 1 2 3 4 5 6 7 8 9 10; do
        pgrep -xq "Dual N-Back" || break
        sleep 0.5
    done
fi

dest="$HOME/Applications/Dual N-Back.app"
mkdir -p "$HOME/Applications"
rm -rf "$dest"
ditto "build/DerivedData/Build/Products/Release/Dual N-Back.app" "$dest"
echo "Installed $dest"
