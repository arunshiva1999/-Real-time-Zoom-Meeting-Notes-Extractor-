import re
from pathlib import Path
import json
import csv

# -----------------------------
# Extract attendees
# -----------------------------
def extract_attendees(text):
    attendees = set()

    # Find lines like: "Attendees: Alice, Bob, Charlie"
    attendees_match = re.search(r"Attendees\s*:\s*(.*)", text, re.IGNORECASE)
    if attendees_match:
        names = attendees_match.group(1).split(",")
        attendees.update([n.strip() for n in names if n.strip()])

    # Detect names before ":" (e.g., "Alice: Hello team")
    lines = text.split("\n")
    for line in lines:
        if ":" in line:
            name = line.split(":")[0].strip()
            if len(name.split()) <= 3 and name[0].isupper():
                attendees.add(name)

    return list(attendees)


# -----------------------------
# Extract action items
# -----------------------------
def extract_action_items(text):
    actions = []

    # Detect "Action Item:"
    pattern = r"(Action Item[:\-]?\s*)(.*)"
    matches = re.findall(pattern, text, re.IGNORECASE)

    for _, item in matches:
        actions.append(item.strip())

    # Detect sentences with verbs like: "Alice will do X", "Bob needs to X"
    fallback_matches = re.findall(
        r"([A-Z][a-zA-Z]+)\s+(will|needs to|must|should)\s+(.*?)(\.|$)",
        text
    )
    for name, _, task, _ in fallback_matches:
        actions.append(f"{name}: {task.strip()}")

    return actions


# -----------------------------
# Extract decisions
# -----------------------------
def extract_decisions(text):
    decisions = []

    pattern = r"(Decision[:\-]?\s*)(.*)"
    matches = re.findall(pattern, text, re.IGNORECASE)

    for _, item in matches:
        decisions.append(item.strip())

    return decisions


# -----------------------------
# Write Markdown Summary
# -----------------------------
def write_markdown(attendees, decisions, actions, output_dir: Path):
    output_dir.mkdir(exist_ok=True)
    md_file = output_dir / "meeting_summary.md"

    with md_file.open("w", encoding="utf-8") as f:
        f.write("# Meeting Summary\n\n")

        f.write("## Attendees\n")
        for a in attendees:
            f.write(f"- {a}\n")
        f.write("\n")

        f.write("## Decisions\n")
        if decisions:
            for d in decisions:
                f.write(f"- {d}\n")
        else:
            f.write("- No decisions detected\n")
        f.write("\n")

        f.write("## Action Items\n")
        if actions:
            for a in actions:
                f.write(f"- {a}\n")
        else:
            f.write("- No action items detected\n")

    # Also save JSON and CSV
    json_data = {
        "attendees": attendees,
        "decisions": decisions,
        "actions": actions
    }
    with (output_dir / "meeting_data.json").open("w", encoding="utf-8") as jf:
        json.dump(json_data, jf, indent=4)

    with (output_dir / "action_items.csv").open("w", newline="", encoding="utf-8") as cf:
        w = csv.writer(cf)
        w.writerow(["Action Item"])
        for a in actions:
            w.writerow([a])
