import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../contents/ui/peak.js", import.meta.url), "utf8")
    .replace(/^\.pragma library\s*$/m, "");

const Peak = {};
vm.createContext(Peak);
vm.runInContext(source, Peak);

const utc = (iso) => Date.parse(iso);
const MINUTE = 60000;

test("IST offset is UTC+05:30", () => {
    assert.equal(Peak.IST_OFFSET_MS, 5.5 * 60 * 60 * 1000);
});

test("peak windows match the published 6:30-9:30 and 11:30-15:30 IST slots", () => {
    const windows = [...Peak.PEAK_WINDOWS].map((w) => [w.start, w.end]);
    assert.deepEqual(windows, [[390, 570], [690, 930]]);
});

test("Monday boundaries switch exactly on the half hour (IST)", () => {
    const cases = [
        ["2026-09-14T00:29:00Z", false], // Mon 05:59 IST
        ["2026-09-14T00:59:00Z", false], // Mon 06:29 IST - last off-peak minute
        ["2026-09-14T01:00:00Z", true],  // Mon 06:30 IST - peak opens
        ["2026-09-14T03:59:00Z", true],  // Mon 09:29 IST - last peak minute
        ["2026-09-14T04:00:00Z", false], // Mon 09:30 IST - mid-day off-peak
        ["2026-09-14T05:59:00Z", false], // Mon 11:29 IST
        ["2026-09-14T06:00:00Z", true],  // Mon 11:30 IST - peak reopens
        ["2026-09-14T09:59:00Z", true],  // Mon 15:29 IST - last peak minute
        ["2026-09-14T10:00:00Z", false], // Mon 15:30 IST - evening off-peak
        ["2026-09-14T18:30:00Z", false]  // Mon 00:00 IST (next day)
    ];
    for (const [iso, expected] of cases) {
        assert.equal(Peak.isPeakAt(utc(iso)), expected, `${iso} should be ${expected ? "peak" : "off-peak"}`);
    }
});

test("weekends are off-peak all day", () => {
    for (let hour = 0; hour < 24; ++hour) {
        for (const day of ["2026-09-12", "2026-09-13"]) { // Saturday, Sunday
            const iso = `${day}T${String(hour).padStart(2, "0")}:00:00+05:30`;
            assert.equal(Peak.isPeakAt(Date.parse(iso)), false, `${iso} should be off-peak`);
        }
    }
});

test("next transition lands on the next boundary", () => {
    const cases = [
        ["2026-09-14T00:59:00Z", "2026-09-14T01:00:00Z"], // 06:29 IST -> peak opens
        ["2026-09-14T01:00:00Z", "2026-09-14T04:00:00Z"], // in peak -> 09:30 IST
        ["2026-09-14T04:00:00Z", "2026-09-14T06:00:00Z"], // mid-day -> 11:30 IST
        ["2026-09-14T06:00:00Z", "2026-09-14T10:00:00Z"], // in peak -> 15:30 IST
        ["2026-09-14T10:00:00Z", "2026-09-15T01:00:00Z"], // after peak -> Tue 06:30 IST
        ["2026-09-11T10:00:00Z", "2026-09-14T01:00:00Z"], // Fri 15:30 IST -> Mon 06:30 IST
        ["2026-09-12T06:30:00Z", "2026-09-14T01:00:00Z"]  // Sat midday -> Mon 06:30 IST
    ];
    for (const [from, expected] of cases) {
        assert.equal(Peak.nextTransition(utc(from)), utc(expected), `transition from ${from}`);
    }
});

test("the mid-day gap between the two windows is off-peak for every minute", () => {
    const gapStart = Date.parse("2026-09-14T09:30:00+05:30");
    for (let minute = 0; minute < 120; ++minute) { // 09:30 -> 11:29 IST
        assert.equal(Peak.isPeakAt(gapStart + minute * MINUTE), false,
            `minute ${minute} of the mid-day gap`);
    }
    assert.equal(Peak.isPeakAt(gapStart + 120 * MINUTE), true, "11:30 IST reopens peak pricing");
});

test("transitions only ever occur at the four IST boundaries", () => {
    const boundaries = new Set(["06:30", "09:30", "11:30", "15:30"]);
    let cursor = utc("2026-09-07T00:00:00Z"); // Monday
    const weekEnd = utc("2026-09-14T00:00:00Z");
    let transitions = 0;
    for (;;) {
        const next = Peak.nextTransition(cursor);
        if (next >= weekEnd) {
            break;
        }
        const ist = Peak.istDate(next);
        const clock = `${Peak.pad(ist.getUTCHours())}:${Peak.pad(ist.getUTCMinutes())}`;
        assert.ok(boundaries.has(clock), `unexpected transition at ${clock} IST`);
        assert.notEqual(Peak.isPeakAt(cursor), Peak.isPeakAt(next), "a transition must flip the state");
        cursor = next;
        transitions += 1;
    }
    assert.equal(transitions, 4 * 5, "four flips on each of the five weekdays");
    assert.equal(Peak.nextTransition(cursor), utc("2026-09-14T01:00:00Z"),
        "Friday evening leads straight into Monday morning");
});

test("a weekday contains seven peak hours", () => {
    let peakMinutes = 0;
    for (let minute = 0; minute < 7 * 24 * 60; ++minute) {
        if (Peak.isPeakAt(utc("2026-09-07T00:00:00Z") + minute * MINUTE)) {
            peakMinutes += 1;
        }
    }
    assert.equal(peakMinutes, 5 * 7 * 60);
});

test("duration formatting stays compact", () => {
    assert.equal(Peak.formatDuration(0), "0s");
    assert.equal(Peak.formatDuration(45000), "45s");
    assert.equal(Peak.formatDuration(90000), "1m 30s");
    assert.equal(Peak.formatDuration(59 * MINUTE), "59m 00s");
    assert.equal(Peak.formatDuration(3600000), "1h 0m");
    assert.equal(Peak.formatDuration(2 * 3600000 + 5 * MINUTE), "2h 5m");
    assert.equal(Peak.formatDuration(-5000), "0s");
});

test("schedule text renders the published windows", () => {
    assert.equal(Peak.scheduleText(), "06:30\u201309:30  \u00b7  11:30\u201315:30");
});
