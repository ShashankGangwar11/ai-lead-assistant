# AI Lead Assistant

A full-stack web application that uses Google Gemini to analyze customer inquiries and turn them into structured lead records.

Enter a customer's message to identify the service they need, their budget and timeline, the lead's status and priority, missing information, and a suggested response. Leads are saved in SQLite so they can be reviewed later.

## Features

- AI-powered customer inquiry analysis
- Lead status classification: Qualified, Needs Information, or Not Qualified
- Priority classification: High, Medium, or Low
- Extraction of service, business type, budget, and timeline
- Missing information detection
- AI-generated lead summaries and suggested responses
- SQLite storage for analyzed leads
- Dashboard with total, qualified, high-priority, and follow-up counts
- Search leads by business type, service, or customer message
- Filter leads by priority and status
- Lead details view with original inquiry and analysis
- Copy suggested responses
- Delete leads with confirmation
- Responsive dashboard layout

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- FastAPI
- SQLite
- Google Gemini API
- `google-genai`
- `python-dotenv`

## Architecture

```text
Customer Inquiry
       |
       v
React Frontend
       |
       v
FastAPI Backend
       |
       v
Google Gemini API
       |
       v
Structured Lead Analysis
       |
       +------> SQLite Database
       |
       v
Lead Dashboard and Details
```

## What the Assistant Produces

### Lead Information

Extracts the service required, business type, budget, and expected timeline from the customer's message.

### Lead Status and Priority

Classifies the inquiry by status and assigns a priority to help decide which leads may need attention first.

### Missing Information

Lists details that may be useful to collect before moving forward with the lead.

### Summary and Suggested Response

Creates a short summary of the inquiry and drafts a response that can be copied for follow-up.

## Project Structure

```text
ai-lead-assistant/
|
├── backend/
│   ├── main.py
│   ├── database.py
│   └── .env                 # Create locally; not committed
|
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
|
├── .gitignore
└── README.md
```

The local SQLite database (`backend/leads.db`) is created on the developer's machine and is excluded from Git.

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/ShashankGangwar11/ai-lead-assistant.git
cd ai-lead-assistant
```

### 2. Create and activate a virtual environment

On Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install backend dependencies

```powershell
pip install fastapi uvicorn google-genai python-dotenv
```

### 4. Configure the Gemini API

Create a file named `.env` inside the `backend` directory:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Do not commit your actual API key to GitHub.

### 5. Initialize the database and start the backend

From the project root, run:

```powershell
cd backend
python -c "from database import init_database; init_database()"
uvicorn main:app --reload
```

The backend runs at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

### 6. Install and start the frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at the local URL shown by Vite, usually:

`http://localhost:5173`

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key used by the backend for inquiry analysis |

The API key belongs in `backend/.env`. The `.env` file and local database are excluded from Git using `.gitignore`.

## API

### Health Check

```http
GET /
```

Returns a message confirming that the backend is running.

### Get Leads

```http
GET /api/leads
```

Returns saved leads from the SQLite database, ordered by newest first.

### Analyze a Lead

```http
POST /api/analyze-lead
Content-Type: application/json
```

Example request:

```json
{
  "message": "I run a small clothing brand and need social media marketing. My budget is around ₹25,000 per month and I want to start next month."
}
```

The response includes the lead ID and analysis fields such as status, priority, service, business type, budget, timeline, missing information, summary, and suggested response. The analyzed lead is saved to SQLite.

### Delete a Lead

```http
DELETE /api/leads/{lead_id}
```

Deletes the specified lead from the database.

## Use Case

A small business can use the app to review incoming inquiries, understand what a potential customer needs, spot missing details, and prepare a first response without manually organizing every message.

## Responsive Design

The dashboard includes layout adjustments for smaller screens as well as the desktop layout.

## Future Improvements

- Deploy the frontend and backend
- Add editing for saved lead details
- Add pagination for larger lead lists
- Add email or WhatsApp follow-up integrations
- Add user authentication and shared workspaces
- Add automated tests and more robust API error handling

## Screenshots

Screenshots will be added here after the project UI is finalized.

## Author

**Shashank Gangwar**

Built as a portfolio project to explore AI-powered lead qualification and full-stack application development.
