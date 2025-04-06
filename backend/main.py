from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from matcher import match_resumes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/review")
async def review(jd: str = Form(...), resumesData: str = Form(...)):
    resumes = json.loads(resumesData)
    # Text is already extracted in the frontend, no need to process PDFs again
    results = match_resumes(jd, resumes)
    return results

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)