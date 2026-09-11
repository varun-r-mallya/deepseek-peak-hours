pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import org.kde.kirigami as Kirigami
import org.kde.plasma.components as PlasmaComponents3
import org.kde.plasma.plasmoid
import "peak.js" as Peak

PlasmoidItem {
    id: root

    property double nowMs: 0
    property double nextChangeMs: 0
    property bool isPeak: false

    readonly property int remainingMs: Math.max(0, nextChangeMs - nowMs)
    readonly property color statusColor: isPeak ? Kirigami.Theme.negativeTextColor : Kirigami.Theme.positiveTextColor
    readonly property string statusLabel: isPeak ? "Peak" : "Off-Peak"
    readonly property string countdownLabel: (isPeak ? "Off-peak" : "Peak") + " in " + Peak.formatDuration(remainingMs)
    readonly property string istClock: Peak.pad(Peak.istDate(nowMs).getUTCHours()) + ":"
        + Peak.pad(Peak.istDate(nowMs).getUTCMinutes()) + ":"
        + Peak.pad(Peak.istDate(nowMs).getUTCSeconds())
    readonly property string istDay: ["Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"][Peak.istDate(nowMs).getUTCDay()]

    toolTipMainText: "DeepSeek API: " + statusLabel
    toolTipSubText: countdownLabel + "\n" + istClock + " IST, " + istDay

    function refresh() {
        const now = Date.now();
        nowMs = now;
        if (now >= nextChangeMs) {
            isPeak = Peak.isPeakAt(now);
            nextChangeMs = Peak.nextTransition(now);
        }
    }

    Timer {
        interval: 1000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: root.refresh()
    }

    compactRepresentation: MouseArea {
        id: compact

        implicitWidth: compactRow.implicitWidth + Kirigami.Units.smallSpacing * 2
        implicitHeight: compactRow.implicitHeight + Kirigami.Units.smallSpacing

        onClicked: root.expanded = !root.expanded

        RowLayout {
            id: compactRow

            anchors.centerIn: parent
            spacing: Kirigami.Units.smallSpacing

            Rectangle {
                Layout.alignment: Qt.AlignVCenter
                implicitWidth: Math.round(Kirigami.Units.gridUnit * 0.6)
                implicitHeight: implicitWidth
                radius: width / 2
                color: root.statusColor

                Behavior on color {
                    ColorAnimation {
                        duration: Kirigami.Units.longDuration
                    }
                }
            }

            PlasmaComponents3.Label {
                Layout.alignment: Qt.AlignVCenter
                text: root.statusLabel
                color: root.statusColor
                font.weight: Font.DemiBold

                Behavior on color {
                    ColorAnimation {
                        duration: Kirigami.Units.longDuration
                    }
                }
            }
        }
    }

    fullRepresentation: ColumnLayout {
        Layout.preferredWidth: Kirigami.Units.gridUnit * 16
        Layout.preferredHeight: implicitHeight
        spacing: Kirigami.Units.smallSpacing

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: banner.implicitHeight + Kirigami.Units.largeSpacing * 2
            radius: Kirigami.Units.smallSpacing
            color: Qt.rgba(root.statusColor.r, root.statusColor.g, root.statusColor.b, 0.18)
            border.width: 1
            border.color: root.statusColor

            ColumnLayout {
                id: banner

                anchors.centerIn: parent
                spacing: Math.round(Kirigami.Units.smallSpacing / 2)

                PlasmaComponents3.Label {
                    Layout.alignment: Qt.AlignHCenter
                    text: root.statusLabel.toUpperCase()
                    color: root.statusColor
                    font.weight: Font.Bold
                    font.pointSize: Math.round(Kirigami.Theme.defaultFont.pointSize * 1.4)
                }

                PlasmaComponents3.Label {
                    Layout.alignment: Qt.AlignHCenter
                    text: root.countdownLabel
                    opacity: 0.85
                }
            }
        }

        GridLayout {
            Layout.fillWidth: true
            Layout.topMargin: Kirigami.Units.smallSpacing
            columns: 2
            columnSpacing: Kirigami.Units.largeSpacing
            rowSpacing: Kirigami.Units.smallSpacing

            PlasmaComponents3.Label {
                text: "Time in IST"
                opacity: 0.7
            }
            PlasmaComponents3.Label {
                Layout.fillWidth: true
                text: root.istClock + "  ·  " + root.istDay
                horizontalAlignment: Text.AlignRight
                font.weight: Font.DemiBold
            }

            PlasmaComponents3.Label {
                text: "Peak windows"
                opacity: 0.7
            }
            PlasmaComponents3.Label {
                Layout.fillWidth: true
                text: Peak.scheduleText()
                horizontalAlignment: Text.AlignRight
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.topMargin: Kirigami.Units.smallSpacing
            Layout.preferredHeight: 1
            color: Kirigami.Theme.textColor
            opacity: 0.2
        }

        PlasmaComponents3.Label {
            Layout.fillWidth: true
            text: "Peak pricing applies Monday to Friday during the windows above. "
                + "Weekends and all other hours are off-peak."
            wrapMode: Text.WordWrap
            opacity: 0.7
            font.pointSize: Kirigami.Theme.smallFont.pointSize
        }
    }
}
