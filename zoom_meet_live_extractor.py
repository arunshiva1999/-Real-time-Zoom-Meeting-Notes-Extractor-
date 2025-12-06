import time
import pyperclip
from pathlib import Path
from zoom_meet_extractor import (
    extract_attendees,
    extract_action_items,
    extract_decisions,
    write_markdown
)

print("🔴 Real-Time Zoom Transcript Extractor Started")
print("👉 Copy any transcript text from Zoom, I will update automatically.")

previous_text = ""
output_path = Path("live_output")
output_path.mkdir(exist_ok=True)

while True:
    try:
        current_text = pyperclip.paste()

        # Skip empty or unchanged text
        if current_text == previous_text or len(current_text.strip()) < 10:
            time.sleep(1)
            continue

        print("🟢 New transcript detected… extracting data…")

        # Extract structured data
        attendees = extract_attendees(current_text)
        actions = extract_action_items(current_text)
        decisions = extract_decisions(current_text)

        # Generate summary file
        write_markdown(attendees, decisions, actions, output_path)

        print("✨ Summary updated! Check live_output/meeting_summary.md")

        previous_text = current_text
        time.sleep(1)

    except Exception as e:
        print("Error:", e)
        time.sleep(1)
