#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PLUGIN_ID="$(sed -n 's/.*"Id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' metadata.json | head -1)"

if [[ -z "$PLUGIN_ID" ]]; then
    echo "error: could not read KPlugin.Id from metadata.json" >&2
    exit 1
fi

PACKAGE="${1:-}"
if [[ -z "$PACKAGE" ]]; then
    ./build.sh
    PACKAGE="$(ls -t dist/*.plasmoid | head -1)"
fi

if kpackagetool6 --type Plasma/Applet --list | grep -qx "$PLUGIN_ID"; then
    echo "Upgrading ${PLUGIN_ID}..."
    kpackagetool6 --type Plasma/Applet --upgrade "$PACKAGE"
else
    echo "Installing ${PLUGIN_ID}..."
    kpackagetool6 --type Plasma/Applet --install "$PACKAGE"
fi

echo
echo "Done. Add it from the panel: right-click the panel > Add Widgets... > search \"DeepSeek\"."
echo "If it does not show up yet, restart the shell:  kquitapp6 plasmashell && kstart plasmashell"
echo "To remove it:  kpackagetool6 --type Plasma/Applet --remove ${PLUGIN_ID}"
