# Zoom/Meet Data Extractor

## Problem
I hate manually reading long meeting transcripts to find attendees, decisions, and action items.  
This tool automatically extracts structured data from any meeting transcript.

## Features
- Extracts Attendees
- Extracts Decisions
- Extracts Action Items with Assignee & Deadline
- Generates Markdown, CSV, and JSON output

## How to Run
1. Install Python 3.8+
2. Open terminal in this folder
3. Run:
4. Results will appear inside the `output/` folder.

## Files Included
- `zoom_meet_extractor.py` → main script  
- `sample_transcript.txt` → sample transcript  
- `/.kiro/steering.yaml` → automation file required for AI for Bharat  
- `output/` → generated results

## License
MIT
# Zoom/Meet Live Transcript Extractor

**One-line:** Real-time Zoom meeting transcript auto-capture (Chrome extension) + backend extractor → live action items, decisions and attendees.

## What it does
This project automatically captures Zoom Web Client live transcript (captions) and sends it to a local Flask backend which extracts Attendees, Decisions and Action Items and serves a live summary UI. Works without Zoom developer API — participants install a Chrome extension and start capture.

## Features
- Chrome extension auto-captures Zoom Web Client transcript DOM (no copy/paste once started).
- Flask backend receives transcripts (`/upload`), runs extractor and writes:
  - `live_output/meeting_summary.md`
  - `live_output/meeting_data.json`
  - `live_output/action_items.csv`
  - `live_output/live_transcript.txt`
- Frontend UI (`http://localhost:8000`) shows live Markdown summary and allows download.
- Fallback/manual paste: paste transcript into UI and click **Send to Server**.
- Simple to run locally; can be exposed with `ngrok` for remote participants.

## Quickstart (local)
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
