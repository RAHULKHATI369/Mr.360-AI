import os
import time
import json
import random
from typing import Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

app = FastAPI(title="Mr. 360 AI Engine - KKR vs SRH Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.environ.get("GOOGLE_API_KEY")
has_api_key = False
if api_key:
    genai.configure(api_key=api_key)
    has_api_key = True
else:
    print("WARNING: GOOGLE_API_KEY not set. Running in MOCK SIMULATION mode for UI demonstration.")

def get_mock_data(feature_type: str) -> Dict[str, Any]:
    time.sleep(1.5) # Simulate API latency
    if feature_type == 'shot-insights':
        zones = ["Good Length", "Yorker", "Short", "Full Toss", "Bouncer", "Wide Outside Off"]
        return {
            "shot_efficiency": f"{random.randint(60, 99)}%",
            "pitch_zone": random.choice(zones),
            "predicted_runs": random.choice([0, 1, 2, 4, 6])
        }
    elif feature_type == 'live-voice':
        commentaries = [
            "Shreyas Iyer with a beautiful cover drive! Hyderabad ki garmi mein SRH ke pasine chhoot rahe hain!",
            "Pat Cummins steamrolls in... Oof! Beaten by pace. KKR needs to hold their nerves here.",
            "What a shot! Ekdum rocket ki tarah boundary ke bahar. Pin-drop silence in the Rajiv Gandhi Stadium!",
            "Huge appeal by Cummins! Umpire says no. The Hyderabad crowd is roaring!"
        ]
        return {"commentary": random.choice(commentaries)}
    elif feature_type == 'gate-guide':
        gates = [
            "Gate 4: Smooth entry (5 min wait).",
            "Gate 7: Overcrowded (35 min wait) - Move to Gate 3 immediately.",
            "Gate 1: Moderate crowd (15 min wait). Safe to proceed.",
            "Gate 3: Temporary VVIP movement. Hold position."
        ]
        return {
            "gate_status": random.choice(gates),
            "density_percentage": random.randint(20, 95)
        }
    elif feature_type == 'food-meter':
        comments = [
            "Fresh, piping hot Hyderabadi Biryani. Excellent aroma and perfect portion size.",
            "Samosas look a bit dry, but acceptable for standard stadium fare.",
            "Perfectly chilled beverage. Highly recommended for this Hyderabad heat.",
            "Snack combo looks slightly stale. Quality score reduced."
        ]
        return {
            "quality_score": random.randint(5, 10),
            "comments": random.choice(comments)
        }
    return {"status": "mocked"}

def analyze_with_gemini(image_bytes: bytes, feature_type: str) -> Dict[str, Any]:
    if not has_api_key:
        return get_mock_data(feature_type)

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    if feature_type == 'shot-insights':
        task_prompt = "Identify the frame-by-frame movement of the bat and ball. Output JSON with keys: 'shot_efficiency' (percentage string like '85%'), 'pitch_zone' (string e.g. 'Good Length', 'Yorker', 'Short'), and 'predicted_runs' (integer 0-6)."
    elif feature_type == 'live-voice':
        task_prompt = "Act as a witty Hinglish cricket commentator. Mention the intense Hyderabad heat and the KKR vs SRH rivalry. Output JSON with a single 'commentary' key containing a 1-2 sentence lively commentary."
    elif feature_type == 'gate-guide':
        task_prompt = "Analyze crowd density from image. Cross-reference with Rajiv Gandhi Stadium gate map. Issue live advisory. Output JSON with 'gate_status' (string advisory, e.g., 'Gate 4: Overcrowded (30 min wait) - Move to Gate 7'), and 'density_percentage' (integer 0-100)."
    elif feature_type == 'food-meter':
        task_prompt = "Rate this stadium food image (assume Hyderabad Biryani or snacks). Compare it to standard stadium hospitality benchmarks. Output JSON with 'quality_score' (1-10) and 'comments' (string evaluation of freshness and presentation)."
    else:
        task_prompt = "Analyze the image. Output JSON."

    system_prompt = f"""
    You are Mr. 360 AI, an advanced cricket intelligence engine.
    Context: Live Match: KKR vs SRH at Rajiv Gandhi International Stadium, Hyderabad.
    
    Task: {task_prompt}
    
    CRITICAL: Ensure output is ONLY valid JSON, with NO markdown formatting, NO backticks. Do not include any text outside the JSON object.
    """

    image_parts = [{"mime_type": "image/jpeg", "data": image_bytes}]
    
    response = model.generate_content([system_prompt, image_parts[0]])
    result_text = response.text.strip()
    
    if result_text.startswith("```json"):
        result_text = result_text.replace("```json", "", 1)
    if result_text.endswith("```"):
        result_text = result_text[::-1].replace("```", "", 1)[::-1]
    result_text = result_text.strip()

    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON", "raw_output": result_text}

def process_with_retry(image_bytes: bytes, feature_type: str, max_retries: int = 3):
    retries = 0
    while retries < max_retries:
        try:
            return analyze_with_gemini(image_bytes, feature_type)
        except Exception as e:
            err_msg = str(e).lower()
            if "429" in err_msg or "503" in err_msg or "exhausted" in err_msg or "quota" in err_msg:
                retries += 1
                if retries >= max_retries:
                    raise HTTPException(status_code=503, detail="AI Service unavailable after retries.")
                print(f"Rate limited or Service Unavailable (429/503). Retrying in 15 seconds... (Attempt {retries}/{max_retries})")
                time.sleep(15)
            else:
                raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-360")
async def process_360(
    feature_type: str = Form(...),
    frame: UploadFile = File(...)
):
    try:
        contents = await frame.read()
        result = process_with_retry(contents, feature_type)
        return {"success": True, "feature": feature_type, "data": result}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}
