import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

from database import get_connection, init_database, is_postgres

load_dotenv()

app = FastAPI()
init_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://ai-lead-assistant-p04y5awgq-shashank-ae03.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


class LeadRequest(BaseModel):
    message: str


class LeadAnalysis(BaseModel):
    lead_status: str
    priority: str
    service: str
    business_type: str
    budget: str
    timeline: str
    missing_information: list[str]
    summary: str
    suggested_response: str


@app.get("/")
def root():
    return {
        "message": "AI Lead Assistant backend is running!"
    }

@app.get("/api/leads")
def get_leads():
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT
            id,
            customer_message,
            lead_status,
            priority,
            service,
            business_type,
            budget,
            timeline,
            missing_information,
            summary,
            suggested_response,
            created_at
        FROM leads
        ORDER BY id DESC
        """
    ).fetchall()

    connection.close()

    leads = []

    for row in rows:
        lead = dict(row)

        lead["missing_information"] = json.loads(
            lead["missing_information"]
        )

        leads.append(lead)

    return {
        "success": True,
        "count": len(leads),
        "leads": leads
    }

from fastapi import FastAPI, HTTPException

@app.post("/api/analyze-lead")
def analyze_lead(lead: LeadRequest):

    prompt = f"""
You are an AI lead qualification assistant.

Analyze the following customer inquiry and extract useful business information.

Customer inquiry:
{lead.message}

Return the analysis using exactly this JSON structure:

{{
    "lead_status": "Qualified / Needs Information / Not Qualified",
    "priority": "High / Medium / Low",
    "service": "string",
    "business_type": "string",
    "budget": "string",
    "timeline": "string",
    "missing_information": [],
    "summary": "string",
    "suggested_response": "string"
}}

Rules:
- Do not add extra fields.
- Keep missing_information as an array of strings.
- If information is not mentioned, use "Not specified".
- Base the analysis only on the customer inquiry.
"""

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    raw_analysis = json.loads(response.text)

    analysis = LeadAnalysis(**raw_analysis)

    connection = get_connection()

    values = (
        lead.message,
        analysis.lead_status,
        analysis.priority,
        analysis.service,
        analysis.business_type,
        analysis.budget,
        analysis.timeline,
        json.dumps(analysis.missing_information),
        analysis.summary,
        analysis.suggested_response,
    )

    if is_postgres():
        cursor = connection.execute(
            """
            INSERT INTO leads (
                customer_message,
                lead_status,
                priority,
                service,
                business_type,
                budget,
                timeline,
                missing_information,
                summary,
                suggested_response
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            values,
        )

        lead_id = cursor.fetchone()["id"]

    else:
        cursor = connection.execute(
            """
            INSERT INTO leads (
                customer_message,
                lead_status,
                priority,
                service,
                business_type,
                budget,
                timeline,
                missing_information,
                summary,
                suggested_response
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            values,
        )

        lead_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return {
        "success": True,
        "lead_id": lead_id,
        "customer_message": lead.message,
        "analysis": analysis.model_dump()
    }

@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int):
    connection = get_connection()

    if is_postgres():
        cursor = connection.execute(
            "DELETE FROM leads WHERE id = %s",
            (lead_id,)
        )
    else:
        cursor = connection.execute(
            "DELETE FROM leads WHERE id = ?",
            (lead_id,)
        )

    connection.commit()
    deleted = cursor.rowcount
    connection.close()

    if deleted == 0:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    return {
        "success": True,
        "message": "Lead deleted successfully"
    }