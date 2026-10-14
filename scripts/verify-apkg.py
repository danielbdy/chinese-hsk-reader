"""Imports an .apkg into a fresh Anki collection with Anki's own importer and prints what landed.

Usage: pip install anki && python scripts/verify-apkg.py sample.apkg
"""
import sys
import tempfile
from pathlib import Path

from anki.collection import Collection, ImportAnkiPackageOptions, ImportAnkiPackageRequest

apkg = Path(sys.argv[1]).resolve()
with tempfile.TemporaryDirectory() as tmp:
    col = Collection(str(Path(tmp) / "test.anki2"))
    for round_ in (1, 2):  # importing twice must update, not duplicate
        col.import_anki_package(
            ImportAnkiPackageRequest(package_path=str(apkg), options=ImportAnkiPackageOptions())
        )
        print(f"import {round_}: {col.note_count()} notes, {col.card_count()} cards")
    deck = col.decks.by_name("HSK Reader")
    assert deck, "deck 'HSK Reader' missing"
    for nid in col.find_notes('"deck:HSK Reader"'):
        note = col.get_note(nid)
        card = note.cards()[0]
        print(dict(note.items()))
        print("  question:", card.question()[-160:].replace("\n", " "))
    col.close()
