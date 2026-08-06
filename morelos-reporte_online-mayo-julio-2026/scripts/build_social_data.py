#!/usr/bin/env python3
"""Regenera data/social-data.json y data/social-data.js desde los exports fuente."""
from __future__ import annotations

import csv
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
META_SOURCE = ROOT / "data/source/social_meta_export.txt"
TIKTOK_SOURCE = ROOT / "data/source/tiktok_posts.csv"
JSON_OUT = ROOT / "data/social-data.json"
JS_OUT = ROOT / "data/social-data.js"
NORMALIZED_OUT = ROOT / "data/source/social_posts_normalized.csv"

DATE_RE = re.compile(r"^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (May|Jun|Jul) (\d{1,2}), (\d{1,2}):(\d{2})(am|pm)$")
NUM_RE = re.compile(r"^-?\d[\d,]*(?:\.\d+)?$")
FROM_ADS_RE = re.compile(r"^([\d,]+) from ads$")
FORMATS = {"Reel": "Reel", "Photo": "Photo", "Carousel": "Carousel", "Multi media": "Carousel", "Text": "Text"}
IGNORE = {"Crossposted", "High-quality creative", "Ad completed", "recently completed ad"}
PLATFORMS = {"Instagram", "Facebook"}
MONTHS = {"May": 5, "Jun": 6, "Jul": 7}
KNOWN_ACCOUNTS = [
    "supermercados morelos", "supermercadomorelos", "tulsalatinaleadership",
    "tango_pr", "angeles_tulsa", "okcfestivalvidaymuerte",
]


def parse_num(value: str) -> int | float:
    clean = value.replace(",", "")
    return float(clean) if "." in clean else int(clean)


def looks_account(value: str) -> bool:
    if not value or value in PLATFORMS or value in FORMATS or value in IGNORE:
        return False
    if re.fullmatch(r"\d+:\d{2}", value) or DATE_RE.match(value) or NUM_RE.match(value) or FROM_ADS_RE.match(value):
        return False
    return len(value) < 100 and any(account in value.lower() for account in KNOWN_ACCOUNTS)


def parse_meta() -> list[dict]:
    lines = [line.replace("\u200b", "").strip() for line in META_SOURCE.read_text(encoding="utf-8", errors="replace").splitlines()]
    posts: list[dict] = []
    index = 16
    while index < len(lines):
        date_index = index
        while date_index < len(lines) and not DATE_RE.match(lines[date_index]):
            date_index += 1
        if date_index >= len(lines):
            break

        match = DATE_RE.match(lines[date_index])
        assert match
        meta = [line for line in lines[index:date_index] if line]
        metric_index = date_index + 1
        values: list[int | float] = []
        paid: list[int | float] = []

        while metric_index < len(lines) and len(values) < 6:
            value = lines[metric_index]
            if not value:
                metric_index += 1
                continue
            if NUM_RE.match(value):
                values.append(parse_num(value))
                metric_index += 1
                if metric_index < len(lines):
                    paid_match = FROM_ADS_RE.match(lines[metric_index])
                    if paid_match:
                        paid.append(parse_num(paid_match.group(1)))
                        metric_index += 1
                    else:
                        paid.append(0)
            elif FROM_ADS_RE.match(value):
                metric_index += 1
            else:
                if value in PLATFORMS or DATE_RE.match(value):
                    break
                metric_index += 1

        if len(values) < 6:
            index = max(metric_index, date_index + 1)
            continue
        while len(paid) < 6:
            paid.append(0)

        platforms: list[str] = []
        for value in meta:
            if value in PLATFORMS and value not in platforms:
                platforms.append(value)
        if set(platforms) == {"Facebook", "Instagram"}:
            platform = "Facebook + Instagram"
        else:
            platform = " + ".join(platforms) if platforms else "Meta crossposted"

        format_name = next((FORMATS[value] for value in reversed(meta) if value in FORMATS), "Other")
        account = next((value for value in reversed(meta) if looks_account(value)), "")
        captions = [
            value for value in meta
            if value not in PLATFORMS
            and value not in FORMATS
            and value not in IGNORE
            and not re.fullmatch(r"\d+:\d{2}", value)
            and value != account
        ]
        caption = max(captions, key=len) if captions else "Post sin caption"

        date = datetime(2026, MONTHS[match.group(2)], int(match.group(3)))
        views, reach, shares, likes, comments, saves = values
        paid_views, paid_reach, paid_shares, paid_likes, paid_comments, paid_saves = paid
        engagement = shares + likes + comments + saves
        paid_engagement = paid_shares + paid_likes + paid_comments + paid_saves

        posts.append({
            "Date": date.strftime("%Y-%m-%d"),
            "Month": date.strftime("%Y-%m"),
            "Platform": platform,
            "Platforms": platforms,
            "Format": format_name,
            "Caption": caption,
            "Account": account,
            "Views": views,
            "Reach": reach,
            "Shares": shares,
            "Likes": likes,
            "Comments": comments,
            "Saves": saves,
            "Engagement": engagement,
            "EngagementRate": engagement / views if views else 0,
            "PaidViews": paid_views,
            "PaidReach": paid_reach,
            "PaidShares": paid_shares,
            "PaidLikes": paid_likes,
            "PaidComments": paid_comments,
            "PaidSaves": paid_saves,
            "PaidEngagement": paid_engagement,
            "OrganicViews": max(0, views - paid_views),
            "OrganicReach": max(0, reach - paid_reach),
            "OrganicEngagement": max(0, engagement - paid_engagement),
            "Crossposted": len(platforms) > 1 or "Crossposted" in meta,
        })
        index = metric_index
    return posts


def parse_tiktok() -> list[dict]:
    posts: list[dict] = []
    with TIKTOK_SOURCE.open(encoding="utf-8-sig", newline="") as file:
        for row in csv.DictReader(file):
            views = int(float(row["Views"]))
            likes = int(float(row["Likes"]))
            comments = int(float(row["Comments"]))
            saves = int(float(row["Saves"]))
            shares = int(float(row["Shares"]))
            engagement = likes + comments + saves + shares
            posts.append({
                "Date": row["Date"],
                "Month": row["Date"][:7],
                "Platform": "TikTok",
                "Platforms": ["TikTok"],
                "Format": "Video",
                "Caption": row["Caption"],
                "Account": "Supermercados Morelos",
                "Views": views,
                "Reach": 0,
                "Shares": shares,
                "Likes": likes,
                "Comments": comments,
                "Saves": saves,
                "Engagement": engagement,
                "EngagementRate": engagement / views if views else 0,
                "SourceEngagementRate": float(row.get("Source Engagement Rate") or 0),
                "PaidViews": 0,
                "PaidReach": 0,
                "PaidShares": 0,
                "PaidLikes": 0,
                "PaidComments": 0,
                "PaidSaves": 0,
                "PaidEngagement": 0,
                "OrganicViews": views,
                "OrganicReach": 0,
                "OrganicEngagement": engagement,
                "Crossposted": False,
            })
    return posts


def main() -> None:
    posts = sorted(parse_meta() + parse_tiktok(), key=lambda row: (row["Date"], row["Platform"]))
    data = {
        "meta": {
            "period": "Mayo–Julio 2026",
            "engagementRateDefinition": "(likes + comments + saves + shares) / views",
            "multimediaRule": "Facebook Multi media is normalized to Carousel",
            "crosspostNote": "Rows exported jointly for Facebook and Instagram remain labeled Facebook + Instagram to avoid double counting.",
        },
        "posts": posts,
    }
    JSON_OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    JS_OUT.write_text("window.SOCIAL_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")

    fields = [
        "Date", "Month", "Platform", "Format", "Caption", "Account", "Views", "Reach",
        "Likes", "Comments", "Saves", "Shares", "Engagement", "EngagementRate",
        "PaidViews", "PaidReach", "PaidEngagement", "OrganicViews", "OrganicReach",
        "OrganicEngagement", "Crossposted",
    ]
    with NORMALIZED_OUT.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for post in posts:
            writer.writerow({field: post.get(field, "") for field in fields})

    print(f"Generated {len(posts)} social posts")


if __name__ == "__main__":
    main()
