#!/usr/bin/env python3
"""Validate dashboard source integrity before deployment."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOLERANCE = 0.01


def load_json(relative_path: str) -> dict:
    with (ROOT / relative_path).open(encoding="utf-8") as source:
        return json.load(source)


def assert_close(actual: float, expected: float, label: str) -> None:
    if abs(actual - expected) > TOLERANCE:
        raise AssertionError(f"{label}: {actual:.2f} != {expected:.2f}")


def validate_soi() -> None:
    soi = load_json("config/soi-reference.json")
    expected_groups = soi["campaign_groups"]
    if len(expected_groups) != 5 or len(set(expected_groups)) != 5:
        raise AssertionError("SOI must define exactly five unique business groups")

    for month_key, month in soi["months"].items():
        date.fromisoformat(f"{month_key}-01")
        names = [row["name"] for row in month["blocks"]]
        if names != expected_groups:
            raise AssertionError(f"{month_key}: block order/names differ from campaign_groups")
        assert_close(sum(row["budget"] for row in month["blocks"]), month["budget"], f"{month_key} budget")
        assert_close(sum(row["actual"] for row in month["blocks"]), month["actual"], f"{month_key} actual")

        known_actual = [value for value in month["channels_actual"].values() if value is not None]
        if len(known_actual) == len(month["channels_actual"]):
            assert_close(sum(known_actual), month["actual"], f"{month_key} channel close")

    june = soi["months"]["2026-06"]
    july = soi["months"]["2026-07"]
    assert_close(june["actual"], 7015.11, "June SOI control")
    assert_close(july["actual"], 11808.10, "July SOI control")
    assert_close(june["actual"] + july["actual"], 18823.21, "June–July SOI control")
    if sum(row["actual"] > 0 for row in june["blocks"]) != 4:
        raise AssertionError("June must have four funded business blocks")
    if sum(row["actual"] > 0 for row in july["blocks"]) != 5:
        raise AssertionError("July must have five funded business blocks")


def validate_dashboard_data() -> None:
    data = load_json("data/dashboard-data.json")
    for key in ("metadata", "paid", "social", "analytics"):
        if key not in data:
            raise AssertionError(f"dashboard-data.json missing {key}")

    export_start = date.fromisoformat(data["metadata"]["export_start"])
    export_end = date.fromisoformat(data["metadata"]["export_end"])
    if export_start > export_end:
        raise AssertionError("export_start is after export_end")

    daily = data["analytics"]["daily"]
    if not daily:
        raise AssertionError("GA4 daily series is empty")
    dates = [date.fromisoformat(row["date"]) for row in daily]
    if min(dates) != export_start or max(dates) != export_end:
        raise AssertionError("GA4 daily coverage does not match dashboard metadata")

    for row in data["social"]["content"]:
        date.fromisoformat(row["date"])
        for metric in ("views", "reach", "interactions", "boosted_views", "boosted_reach"):
            value = row.get(metric)
            if value is not None and value < 0:
                raise AssertionError(f"Negative social metric in {row.get('url', row['date'])}")


def main() -> None:
    validate_soi()
    validate_dashboard_data()
    print("PASS: SOI reconciles and dashboard source coverage is valid.")


if __name__ == "__main__":
    main()
