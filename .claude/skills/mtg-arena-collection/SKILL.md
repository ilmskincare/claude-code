---
name: mtg-arena-collection
description: Extract and catalogue the user's full MTG Arena card collection so they can build decks from it. Use whenever the user wants to export, extract, screenshot, list, or catalogue their MTG Arena collection, parse an Arena Player.log, or build a deck (e.g. Standard) from the cards they actually own.
version: 1.0.0
---

# MTG Arena Collection Extractor

## Overview

MTG Arena has no built-in collection export, and screenshotting/OCR-ing hundreds
of collection pages is slow and error-prone (and impossible from a remote
session). The reliable route — the same one trackers like 17Lands and
Untapped.gg use — is Arena's own log file: when **Detailed Logs** is enabled,
the client writes the player's complete collection (Arena card ID → copies
owned) into `Player.log` every time they log in.

This skill parses that log with `scripts/parse_mtga_collection.py`, resolves
every Arena ID to real card data via Scryfall, and produces a catalogue the
user can browse and build decks from.

## Workflow

There are two input routes: the **Player.log** (preferred — exact and
complete, needs a PC or Mac once) and **collection screenshots** (for
iPad/mobile-only users — Apple sandboxes the app's log so it cannot be
reached from the device itself).

### Step 1 — Get the Player.log from the user

Ask the user to do this on their gaming machine (one-time setup):

1. Open MTG Arena → gear icon (Options) → **Account** → tick
   **Detailed Logs (Plugin Support)**.
2. **Fully restart Arena** and log in — the collection is written to the log
   during login. Wait until the home screen loads, then Arena can be closed.
3. Find `Player.log` (NOT `Player-prev.log`, unless the current one is empty):
   - **Windows:** `%USERPROFILE%\AppData\LocalLow\Wizards Of The Coast\MTGA\Player.log`
     (paste that into File Explorer's address bar)
   - **macOS:** `~/Library/Logs/Wizards Of The Coast/MTGA/Player.log`
4. Upload/attach that file to the session (drag and drop works). It is a plain
   text file, typically 5–50 MB.

If running locally on the same machine as Arena, skip the upload and pass the
path directly.

### Step 1 (alternative) — Collection screenshots (iPad/mobile only)

If the user genuinely has no access to any PC or Mac, extract from
screenshots instead:

1. In Arena on the iPad: **Decks → Collection**. Set the **CRAFT toggle off /
   owned filter on** so only owned cards show, and if the goal is a Standard
   deck, apply the **Standard** format filter to cut the page count.
2. Screenshot every page of the grid (side button + volume up), swiping
   through in order. Batches of 10–20 screenshots per message are fine.
3. Read each screenshot carefully: record every card's **name** and its
   **owned count** (the ×2/×3/×4 badge on the card; no badge with a single
   art frame means 1 copy). Watch for split/adventure cards — record the
   full name. Aggregate across images, deduplicate (pages can overlap),
   and confirm the total unique count with the user against what Arena's
   collection counter shows.
4. Write the results to a headerless CSV of `name,count` lines and run:

   ```bash
   python3 scripts/parse_mtga_collection.py --names-csv cards.csv --out-dir mtga_collection
   ```

   This resolves names via Scryfall fuzzy lookup (cached in
   `scryfall_name_cache.json`), writes the same output files as the log
   route, and lists any unmatched names in `unresolved_names.txt` — show
   those to the user for correction rather than dropping them.

Caveats to state up front: screenshot extraction is only as complete as the
pages captured, and exact printings/set codes are Scryfall's best guess since
the screenshots don't reliably show them (counts and names are what matter
for deck building).

### Step 2 — Parse it

```bash
python3 scripts/parse_mtga_collection.py /path/to/Player.log --out-dir mtga_collection
```

The script (stdlib only, Python 3.8+):

- Finds the collection payload in the log. It handles several client log
  formats: `PlayerInventory.GetPlayerCardsV3` responses, `grpId`/`count`
  lists, and bare `{"<arenaId>": count, ...}` payload lines.
- Resolves Arena IDs in batches of 75 via Scryfall's `POST /cards/collection`
  endpoint (rate-limited, retried, and cached in
  `<out-dir>/scryfall_cache.json` so re-runs make no network calls).
- Writes:
  - `collection_full.csv` — every owned card: count, name, set, rarity, mana
    cost, cmc, type line, colors, Standard legality, oracle text.
  - `collection_standard.csv` — only cards currently Standard-legal.
  - `collection_manabox.csv` — ManaBox collection import (headers match
    ManaBox's own export; includes Scryfall IDs so printings map exactly).
  - `collection_manabox.txt` — plain `4 Card Name (SET) 123` lines for
    text-based importers (ManaBox deck import, Moxfield, Archidekt).
  - `unresolved_ids.csv` — any Arena IDs Scryfall doesn't know (usually
    cosmetic variants or brand-new set cards); report these to the user
    rather than silently dropping them.
- Prints a JSON summary (unique cards, total copies, Standard counts by
  rarity).

If the script exits with "No collection payload found", the log predates
Detailed Logs being enabled — the user must restart Arena, log in again, and
send a fresh log.

### Step 3 — Deliver the catalogue

Send the user `collection_full.csv` and `collection_standard.csv` (via
SendUserFile or equivalent) and summarise: unique cards, total copies,
Standard-legal counts by rarity and colour. Offer a nicer format (spreadsheet,
sortable HTML artifact) if useful.

If the user wants the collection in **ManaBox**: send `collection_manabox.csv`
and tell them to open ManaBox → Collection tab → import (⤓) → **Import from
CSV** and pick the file — its "text or link" prompt is the *deck* importer,
which is the wrong tool for a large collection (though `collection_manabox.txt`
pasted there works for smaller lists or single decks).

### Step 4 — Deck building (if asked)

When the user wants a deck built from the collection:

1. Work **only** from `collection_standard.csv` for Standard decks — never
   suggest a card the user doesn't own without flagging it as a wildcard
   craft, and never exceed the owned `count` (max 4 per card, basic lands
   unlimited).
2. Web-search the current Standard metagame and rotation state — Standard
   rotates and the model's knowledge is stale. Verify set legality against
   the `standard_legal` column, which reflects live Scryfall data.
3. Produce a 60-card main deck + optional 15-card sideboard in Arena import
   format (`4 Card Name (SET) 123`) so the user can paste it straight into
   Arena's deck builder.
4. List any recommended cards the user lacks as a separate "wildcard
   shopping list" with rarities.

## Notes and limitations

- The log contains card IDs and counts only — no gold/gem/wildcard balances
  are extracted by this skill.
- Arena IDs for cards released in the last few days may be missing from
  Scryfall; they land in `unresolved_ids.csv`.
- The screenshot/OCR approach is deliberately not used: the log is complete,
  exact, and takes seconds.
- Player.log can contain the user's account identifiers. Don't commit it or
  the generated outputs to git; keep them in scratch space and clean up after
  the outputs have been delivered.
