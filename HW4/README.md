# Campus Customs: HW4

A storefront for Yale gear with a shop-assistant chatbot.

- **Frontend:** React + Vite + TypeScript, in `frontend/`.
- **Backend:** Python FastAPI, in `backend/main.py` (the file you run with uvicorn).
- **Agent:** a PydanticAI agent behind the chat route. It lives in four files under `backend/`:
  - `backend/prompts/prompt.md`: the system prompt (voice, truth rules, tool use, safety rules)
  - `backend/agent.py`: the agent entry wiring (prompt, model, tools, streaming, audit trail)
  - `backend/tools.py`: the tools the agent can call (`search_products`, `get_product`, `check_stock`, `catalogue_overview`)
  - `backend/models.py`: the structured types (chat replies, product cards, tool results, audit entries)
- **Features:** product browsing and product pages, account creation and login, a chat assistant that answers price and stock questions and puts matching products on the page, saved chat history for signed-in shoppers, Buy now order requests, and an append-only audit trail.

Documentation is in `output/`: `harness.md` (how the whole system works), `usability.md`, `design.md`, `app_check.html` (double-click to open) and `audit_trail.json`. The prompts I gave the AI coder are in `AI_prompts.md`.

## Not included in this repository

These are kept out on purpose (see `.gitignore`):

- `.env`: real keys. You create your own from `.env.example`.
- `data/campus_customs.db` and `data/products/`: the database and product images from the course data pack.

## Run it

Needs Python 3.14 and Node 24 (other recent versions should work). Run every command from the `HW4/` folder unless it says otherwise.

### 1. Place the data pack

Unzip the course `data.zip` inside the `HW4/` folder (next to `backend/` and `frontend/`). It creates the `data/` folder, and you should end up with:

```
HW4/
  data/
    campus_customs.db
    products/            (the product images, e.g. basic-hoodie-big-yale.jpg)
```

### 2. Create `.env`

```
cp .env.example .env
```

Open `.env` and fill in:

- `PORTKEY_API_KEY`: your Portkey key (all AI calls go through Portkey)
- `OPENAI_MODEL`: the model name to use (the example file has a default)
- `AUTH_SECRET`: any long random string, used to sign login cookies

The other lines are optional.

### 3. Start the backend (terminal 1)

```
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload --port 8000
```

The API is then at http://127.0.0.1:8000 (for example `/api/products`).

### 4. Start the frontend (terminal 2)

```
cd frontend
npm install
npm run dev
```

### 5. Open the site

Go to http://localhost:5173. The seeded test account is `test@campuscustoms.yale.edu` with password `password`, or create your own on the Create Account page. Open the chat button at the bottom right and ask, for example, "What hoodies do you have?"

If the frontend shows "We couldn't load the products", the backend is not running on port 8000 or the data pack is not in `data/`.
