#!/usr/bin/env python3
"""Extract an MTG Arena card collection from a Player.log file.

The MTG Arena client writes the player's full collection into Player.log
when "Detailed Logs (Plugin Support)" is enabled. This script finds the
collection payload (a mapping of Arena card IDs to owned counts), resolves
each Arena ID to real card data via Scryfall, and writes:

  collection_full.csv      - every owned card, all attributes
  collection_standard.csv  - only cards currently legal in Standard
  collection_manabox.csv   - ManaBox collection import format (CSV)
  collection_manabox.txt   - "4 Card Name (SET) 123" lines for text importers
  unresolved_ids.csv       - Arena IDs Scryfall could not resolve (if any)

Usage:
  python3 parse_mtga_collection.py PLAYER_LOG [--out-dir DIR] [--offline]

Only the Python standard library is required. Scryfall lookups are cached
in <out-dir>/scryfall_cache.json so re-runs are instant and offline-safe.
"""

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

SCRYFALL_SEARCH_URL = (
    "https://api.scryfall.com/cards/search?q=game%3Aarena&unique=prints"
)
SCRYFALL_ARENA_URL = "https://api.scryfall.com/cards/arena/{}"
REQUEST_DELAY_S = 0.15   # Scryfall asks for 50-100ms between requests
USER_AGENT = "mtga-collection-skill/1.0 (Claude Code skill; personal collection export)"

CSV_COLUMNS = [
    "count", "name", "set", "collector_number", "rarity", "mana_cost",
    "cmc", "type_line", "colors", "color_identity", "standard_legal",
    "arena_id", "oracle_text",
]


def looks_like_collection(obj):
    """A collection payload is a large dict of numeric-string keys -> int counts."""
    if not isinstance(obj, dict) or len(obj) < 20:
        return False
    items = list(obj.items())
    return all(
        isinstance(k, str) and k.isdigit() and isinstance(v, int) and 0 <= v <= 999
        for k, v in items
    )


def iter_json_objects(line):
    """Yield every parseable JSON object embedded in a log line."""
    decoder = json.JSONDecoder()
    idx = line.find("{")
    while idx != -1:
        try:
            obj, end = decoder.raw_decode(line[idx:])
        except ValueError:
            idx = line.find("{", idx + 1)
            continue
        yield obj
        idx = line.find("{", idx + end)


def find_collections_in_obj(obj, found):
    """Recursively collect collection-shaped dicts (and grpId/count lists)."""
    if looks_like_collection(obj):
        found.append({int(k): v for k, v in obj.items()})
        return
    if isinstance(obj, dict):
        for v in obj.values():
            find_collections_in_obj(v, found)
    elif isinstance(obj, list):
        # Some client versions log [{"grpId": N, "count": M}, ...]
        if len(obj) >= 20 and all(
            isinstance(e, dict) and "grpId" in e and "count" in e for e in obj[:5]
        ):
            try:
                found.append({int(e["grpId"]): int(e["count"]) for e in obj})
                return
            except (KeyError, TypeError, ValueError):
                pass
        for v in obj:
            find_collections_in_obj(v, found)


def extract_collection(log_text):
    """Return the most recent collection dict {arena_id: count} in the log."""
    keywords = ("GetPlayerCards", "PlayerInventory", "grpId", "Collection")
    candidates = []
    for line in log_text.splitlines():
        if "{" not in line:
            continue
        interesting = any(k in line for k in keywords)
        # Pure-payload lines: the collection dict on its own line after a
        # "<== PlayerInventory.GetPlayerCardsV3" header.
        if not interesting and not re.match(r'\s*\{"\d+":', line):
            continue
        for obj in iter_json_objects(line):
            found = []
            find_collections_in_obj(obj, found)
            candidates.extend(found)
    if not candidates:
        return None
    # The last (most recent) and largest payload is the live collection.
    return max(reversed(candidates), key=len)


def http_get_json(url):
    req = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    attempts = 5
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return None
            if attempt == attempts - 1:
                raise
            if exc.code == 429:
                delay = int(exc.headers.get("Retry-After") or 0) or 20 * (attempt + 1)
            else:
                delay = 2 ** (attempt + 1)
            print(f"  retrying in {delay}s after error: {exc}", file=sys.stderr)
            time.sleep(delay)
        except Exception as exc:  # noqa: BLE001 - retry transient network failures
            if attempt == attempts - 1:
                raise
            print(f"  retrying after error: {exc}", file=sys.stderr)
            time.sleep(2 ** (attempt + 1))


def scryfall_lookup(arena_ids, cache_path, offline=False):
    """Resolve Arena IDs to card data. Returns (resolved: {id: card}, missing: [id]).

    Scryfall's batch endpoint doesn't accept arena_id identifiers, so on first
    run this pages through every Arena-legal printing (search q=game:arena,
    ~120 pages) to build an arena_id -> card map, then falls back to
    /cards/arena/:id for any stragglers. The map is cached on disk.
    """
    state = {"full_list_fetched": False, "cards": {}}
    if cache_path.exists():
        state = json.loads(cache_path.read_text())
    # Cards known to be unresolvable are cached as null so re-runs never
    # refetch them.
    cards = {int(k): v for k, v in state["cards"].items()}
    todo = [i for i in arena_ids if i not in cards]

    if todo and not offline and not state["full_list_fetched"]:
        url, page = SCRYFALL_SEARCH_URL, 1
        while url:
            data = http_get_json(url)
            for card in data.get("data", []):
                aid = card.get("arena_id")
                if aid is not None:
                    cards[aid] = slim_card(card)
            url = data.get("next_page") if data.get("has_more") else None
            if page % 10 == 0 or not url:
                print(f"  Scryfall card list: page {page} fetched",
                      file=sys.stderr)
                # Checkpoint so an interrupted fetch doesn't start from zero.
                state["cards"] = {str(k): v for k, v in cards.items()}
                cache_path.write_text(json.dumps(state))
            page += 1
            time.sleep(REQUEST_DELAY_S)
        state["full_list_fetched"] = True
        todo = [i for i in arena_ids if i not in cards]

    if todo and not offline:
        for n, aid in enumerate(todo, 1):
            cards[aid] = http_get_json(SCRYFALL_ARENA_URL.format(aid))
            if cards[aid] is not None:
                cards[aid] = slim_card(cards[aid])
            if n % 25 == 0 or n == len(todo):
                print(f"  Scryfall by-id fallback: {n}/{len(todo)}",
                      file=sys.stderr)
            time.sleep(REQUEST_DELAY_S)

    state["cards"] = {str(k): v for k, v in cards.items()}
    cache_path.write_text(json.dumps(state))
    resolved = {i: cards[i] for i in arena_ids if cards.get(i) is not None}
    missing = [i for i in arena_ids if i not in resolved]
    return resolved, missing


def slim_card(card):
    faces = card.get("card_faces") or []
    oracle = card.get("oracle_text") or " // ".join(
        f.get("oracle_text", "") for f in faces
    )
    mana = card.get("mana_cost") or " // ".join(
        f.get("mana_cost", "") for f in faces
    )
    return {
        "scryfall_id": card.get("id", ""),
        "name": card.get("name", ""),
        "set": card.get("set", "").upper(),
        "collector_number": card.get("collector_number", ""),
        "rarity": card.get("rarity", ""),
        "mana_cost": mana,
        "cmc": card.get("cmc", ""),
        "type_line": card.get("type_line", ""),
        "colors": "".join(card.get("colors") or card.get("color_identity") or []),
        "color_identity": "".join(card.get("color_identity") or []),
        "standard_legal": card.get("legalities", {}).get("standard") == "legal",
        "oracle_text": oracle,
    }


def write_csv(path, rows):
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


MANABOX_COLUMNS = [
    "Name", "Set code", "Collector number", "Quantity", "Foil",
    "Condition", "Language", "Scryfall ID",
]


def write_manabox(out_dir, rows):
    """Write ManaBox collection-import CSV plus a plain text list.

    The CSV matches ManaBox's own export headers so its column mapping is
    automatic; Scryfall ID pins the exact printing. Arena's log doesn't
    distinguish foils, so everything is exported as normal/near mint.
    """
    with (out_dir / "collection_manabox.csv").open(
        "w", newline="", encoding="utf-8"
    ) as fh:
        writer = csv.writer(fh)
        writer.writerow(MANABOX_COLUMNS)
        for r in rows:
            writer.writerow([
                r["name"], r["set"].lower(), r["collector_number"],
                r["count"], "normal", "near_mint", "en",
                r.get("scryfall_id", ""),
            ])
    with (out_dir / "collection_manabox.txt").open("w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(
                f'{r["count"]} {r["name"]} ({r["set"]}) {r["collector_number"]}\n'
            )


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("log", type=Path, help="Path to MTG Arena Player.log")
    ap.add_argument("--out-dir", type=Path, default=Path("mtga_collection"))
    ap.add_argument("--offline", action="store_true",
                    help="Skip Scryfall network calls; use cache only")
    args = ap.parse_args()

    text = args.log.read_text(encoding="utf-8", errors="replace")
    collection = extract_collection(text)
    if not collection:
        sys.exit(
            "No collection payload found in the log.\n"
            "Make sure Detailed Logs (Plugin Support) is enabled in MTG Arena\n"
            "(Options > Account), then RESTART Arena, log in, wait for the home\n"
            "screen, and grab a fresh copy of Player.log."
        )
    collection = {aid: n for aid, n in collection.items() if n > 0}
    print(f"Found collection: {len(collection)} unique cards, "
          f"{sum(collection.values())} total copies", file=sys.stderr)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    resolved, missing = scryfall_lookup(
        sorted(collection), args.out_dir / "scryfall_cache.json", args.offline
    )

    rows = []
    for aid, count in collection.items():
        card = resolved.get(aid)
        if not card:
            continue
        rows.append({"count": count, "arena_id": aid, **card})
    rows.sort(key=lambda r: (not r["standard_legal"], r["name"]))

    write_csv(args.out_dir / "collection_full.csv", rows)
    std_rows = [r for r in rows if r["standard_legal"]]
    write_csv(args.out_dir / "collection_standard.csv", std_rows)
    write_manabox(args.out_dir, rows)
    if missing:
        with (args.out_dir / "unresolved_ids.csv").open("w") as fh:
            fh.write("arena_id,count\n")
            for aid in missing:
                fh.write(f"{aid},{collection.get(aid, 0)}\n")

    by_rarity = {}
    for r in std_rows:
        by_rarity[r["rarity"]] = by_rarity.get(r["rarity"], 0) + r["count"]
    print(json.dumps({
        "unique_cards": len(rows),
        "total_copies": sum(r["count"] for r in rows),
        "standard_unique": len(std_rows),
        "standard_copies": sum(r["count"] for r in std_rows),
        "standard_by_rarity": by_rarity,
        "unresolved_arena_ids": len(missing),
        "out_dir": str(args.out_dir),
    }, indent=2))


if __name__ == "__main__":
    main()
