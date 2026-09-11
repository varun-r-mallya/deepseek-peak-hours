#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PLUGIN_ID="$(sed -n 's/.*"Id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' metadata.json | head -1)"
VERSION="$(sed -n 's/.*"Version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' metadata.json | head -1)"

if [[ -z "$PLUGIN_ID" || -z "$VERSION" ]]; then
    echo "error: could not read KPlugin.Id / KPlugin.Version from metadata.json" >&2
    exit 1
fi

ARCHIVE="dist/deepseek-peak-hours-${VERSION}.plasmoid"

rm -rf dist
mkdir -p dist

zip -q -r "$ARCHIVE" metadata.json contents

echo "Built $ARCHIVE (${PLUGIN_ID} ${VERSION})"
