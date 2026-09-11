.pragma library

// India Standard Time is UTC+05:30 and never observes DST.
var IST_OFFSET_MS = 19800000;

// DeepSeek peak windows as minutes from midnight in IST, Monday to Friday only:
// 06:30-09:30 and 11:30-15:30. Everything else, including weekends, is off-peak.
var PEAK_WINDOWS = [
    { start: 390, end: 570 },
    { start: 690, end: 930 }
];

function istDate(ms) {
    return new Date(ms + IST_OFFSET_MS);
}

function pad(value) {
    return value < 10 ? "0" + value : "" + value;
}

function isPeakAt(ms) {
    var ist = istDate(ms);
    var day = ist.getUTCDay();
    if (day === 0 || day === 6) {
        return false;
    }
    var minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
    for (var i = 0; i < PEAK_WINDOWS.length; ++i) {
        if (minutes >= PEAK_WINDOWS[i].start && minutes < PEAK_WINDOWS[i].end) {
            return true;
        }
    }
    return false;
}

// Earliest instant after fromMs at which peak pricing starts or stops.
function nextTransition(fromMs) {
    var minuteMs = 60000;
    var dayMs = 86400000;
    var istMidnightMs = Math.floor((fromMs + IST_OFFSET_MS) / dayMs) * dayMs - IST_OFFSET_MS;
    for (var day = 0; day <= 8; ++day) {
        for (var i = 0; i < PEAK_WINDOWS.length; ++i) {
            var boundaries = [PEAK_WINDOWS[i].start, PEAK_WINDOWS[i].end];
            for (var j = 0; j < boundaries.length; ++j) {
                var candidateMs = istMidnightMs + day * dayMs + boundaries[j] * minuteMs;
                if (candidateMs > fromMs
                        && isPeakAt(candidateMs - minuteMs) !== isPeakAt(candidateMs + minuteMs)) {
                    return candidateMs;
                }
            }
        }
    }
    return fromMs + minuteMs;
}

function formatDuration(ms) {
    var totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    if (hours > 0) {
        return hours + "h " + minutes + "m";
    }
    if (minutes > 0) {
        return minutes + "m " + pad(seconds) + "s";
    }
    return seconds + "s";
}

function formatWindow(window) {
    return pad(Math.floor(window.start / 60)) + ":" + pad(window.start % 60)
        + "\u2013" + pad(Math.floor(window.end / 60)) + ":" + pad(window.end % 60);
}

function scheduleText() {
    var parts = [];
    for (var i = 0; i < PEAK_WINDOWS.length; ++i) {
        parts.push(formatWindow(PEAK_WINDOWS[i]));
    }
    return parts.join("  \u00b7  ");
}
