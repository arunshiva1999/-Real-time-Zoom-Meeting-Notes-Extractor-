# backend/app_ui.py
import sys
from pathlib import Path

PARENT = Path(__file__).resolve().parent.parent
sys.path.append(str(PARENT))

# backend/app_ui.py
from flask import Flask, request, jsonify, send_file
import time
from zoom_meet_extractor import extract_attendees, extract_action_items, extract_decisions, write_markdown

app = Flask(__name__, static_folder="../frontend", template_folder="../frontend")
ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "live_output"
OUTPUT.mkdir(exist_ok=True)

TRANSCRIPT_FILE = OUTPUT / "live_transcript.txt"
SUMMARY_MD = OUTPUT / "meeting_summary.md"

@app.route('/')
def index():
    # Serve frontend/index.html (static folder set to ../frontend)
    return app.send_static_file('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    data = request.get_json(force=True)
    text = data.get('text', '').strip()
    if not text:
        return jsonify({"error":"no text provided"}), 400

    # append captured text with timestamp
    with TRANSCRIPT_FILE.open("a", encoding="utf-8") as f:
        f.write(f"\n\n--- COPIED AT {time.asctime()} ---\n")
        f.write(text + "\n")

    # re-run extractor on entire transcript
    full_text = TRANSCRIPT_FILE.read_text(encoding='utf-8')
    attendees = extract_attendees(full_text)
    actions = extract_action_items(full_text)
    decisions = extract_decisions(full_text)
    write_markdown(attendees, decisions, actions, OUTPUT)

    return jsonify({"status":"ok"})

@app.route('/summary', methods=['GET'])
def summary():
    md = SUMMARY_MD.read_text(encoding='utf-8') if SUMMARY_MD.exists() else ""
    transcript = TRANSCRIPT_FILE.read_text(encoding='utf-8') if TRANSCRIPT_FILE.exists() else ""
    return jsonify({"markdown": md, "transcript": transcript})

@app.route('/download/transcript', methods=['GET'])
def download_transcript():
    if TRANSCRIPT_FILE.exists():
        return send_file(str(TRANSCRIPT_FILE), as_attachment=True, download_name="live_transcript.txt")
    return jsonify({"error":"transcript not found"}), 404

@app.route('/download/summary', methods=['GET'])
def download_summary():
    if SUMMARY_MD.exists():
        return send_file(str(SUMMARY_MD), as_attachment=True, download_name="meeting_summary.md")
    return jsonify({"error":"summary not found"}), 404

if __name__ == '__main__':
    # Use port 8000
    print("Starting backend UI on http://0.0.0.0:8000")
    app.run(host='0.0.0.0', port=8000, debug=False)
