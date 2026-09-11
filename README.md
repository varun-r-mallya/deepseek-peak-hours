# DeepSeek Peak Hours

A KDE Plasma 6 panel widget that tells you at a glance whether DeepSeek API
pricing is currently **peak** (red) or **off-peak** (green).

DeepSeek's off-peak discount applies outside the published peak windows, so
green means "cheaper right now" and red means "full price right now".

| | Window (IST, Mon–Fri) | Window (UTC) |
|---|---|---|
| Peak 1 | 06:30 – 09:30 | 01:00 – 04:00 |
| Peak 2 | 11:30 – 15:30 | 06:00 – 10:00 |

Everything else — all other weekday hours, plus **all of Saturday and Sunday** —
is off-peak. India Standard Time is UTC+05:30 and never observes DST, so the
window is fixed year round.

## What you get

- A colored status dot plus `Peak` / `Off-Peak` text in the panel.
- Clicking it expands a popup with the countdown to the next switch, the
  current IST clock, and the peak window schedule.
- A tooltip with the same information on hover.
- Colors follow your Plasma color scheme (`negativeTextColor` when peak,
  `positiveTextColor` when off-peak), so it stays readable in light and dark
  themes.

## Requirements

To **run** the widget you need only:

- **KDE Plasma 6** (Plasma 5 is not supported — the QML API differs).
  This includes `kpackagetool6` and the Kirigami / Plasma Components QML modules.
- A system clock. That's it — no network access, no API key, no account, no root.
  The widget computes everything locally from IST, which has no DST.

To **build from source** (`build.sh`) you additionally need `bash` and `zip`.
To **run the test suite** you need Node.js (`node --test`); this is development
only and not needed to install or use the widget.

## Install

Requires KDE Plasma 6 (`kpackagetool6`). No root needed — it installs into your
user directory.

```bash
git clone https://github.com/varun-r-mallya/deepseek-peak-hours.git
cd deepseek-peak-hours
./install.sh
```

Then right-click your panel → **Add Widgets…** → search `DeepSeek` → drag it in.

If it does not appear in the widget list right away, restart the shell:

```bash
kquitapp6 plasmashell && kstart plasmashell
```

### From a downloaded `.plasmoid` file

```bash
./build.sh
kpackagetool6 --type Plasma/Applet --install dist/deepseek-peak-hours-1.0.0.plasmoid
```

Or install straight from the source directory:

```bash
kpackagetool6 --type Plasma/Applet --install .
```

## Update

```bash
git pull
./install.sh
```

`install.sh` detects an existing installation and upgrades it in place.

## Uninstall

```bash
kpackagetool6 --type Plasma/Applet --remove io.github.varunrmallya.deepseekpeak
```

## Development

The peak/off-peak math lives in `contents/ui/peak.js` and is shared by the
widget and the test suite, so tests exercise the exact logic that ships.

```bash
node --test tests/    # 10 tests: boundaries, weekends, transitions, formatting
./build.sh            # produces dist/deepseek-peak-hours-<version>.plasmoid
qmllint contents/ui/main.qml
```

Layout:

```
metadata.json            plasmoid manifest
contents/ui/main.qml     panel widget (compact + expanded views)
contents/ui/peak.js      peak-hour logic (IST windows, next transition)
tests/peak.test.mjs      node:test suite for peak.js
build.sh                 packages the .plasmoid archive
install.sh               builds and installs/upgrades via kpackagetool6
```

To change the windows, edit `PEAK_WINDOWS` in `contents/ui/peak.js`. The values
are minutes from midnight IST, and the tests will tell you if you break the
boundary handling.

## Accuracy note

The windows here reflect DeepSeek's published off-peak discount schedule, where
06:30–09:30 and 11:30–15:30 IST on weekdays are billed at standard (peak) rates.
DeepSeek can change pricing windows at any time — check their pricing page
before making billing decisions, and update `PEAK_WINDOWS` in
`contents/ui/peak.js` if it changes.

## License

MIT
