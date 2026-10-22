# Campus Customs: HW4

A storefront for Yale gear with a shop-assistant chatbot.

- **Frontend:** React + Vite + TypeScript (`frontend/`)
- **Backend:** Python FastAPI (`backend/main.py`)
- **Agent:** a PydanticAI agent behind the chat route, with tools that read the product database (`backend/agent.py`, `backend/tools.py`, `backend/models.py`, `backend/prompts/prompt.md`)
- **Features:** product browsing and product pages, account creation and login, a chat assistant that answers price and stock questions and puts matching products on the page, saved chat history for signed-in shoppers, Buy now order requests, an append-only audit trail

Documentation is in `output/`: `harness.md` (how the whole system works), `usability.md`, `design.md`, `app_check.html` (open it in a browser) and `audit_trail.json`. The prompts I gave the AI coder are in `AI_prompts.md`.

## Not included in this repository

These are kept out on purpose (see `.gitignore`):

- `.env`: real keys. Copy `.env.example` to `.env` and fill in your own values.
- `data/campus_customs.db`: the course database.
- `data/products/`: the product images.

To run the app, put the course's `campus_customs.db` at `data/campus_customs.db` and the product images in `data/products/`.

## Run it

Needs Python 3.14 and Node 24 (other recent versions should work).

1. `cp .env.example .env`, then set `PORTKEY_API_KEY`, `OPENAI_MODEL` and `AUTH_SECRET` (a long random string).
2. Backend, from `backend/`:
   ```
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   .venv/bin/uvicorn main:app --reload --port 8000
   ```
3. Frontend, from `frontend/`:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:5173. The seeded test account is `test@campuscustoms.yale.edu` with password `password`.
