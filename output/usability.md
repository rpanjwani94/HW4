# Usability improvements

Two frontend improvements and two agent/backend improvements. Everything below is visible in the running app (frontend at http://localhost:5173, API at http://127.0.0.1:8000).

## Frontend

### 1. Pictures on the Home page categories (looks like a store, not a spreadsheet)

- **What was added:** every category link on the Home page is now a product card with a picture, a bold name and a "Shop now" prompt: Water bottles, Totes and bags, Tumblers and mugs (shown together), Journals, Pens and Sticky pads. The cards lift slightly on hover.
- **Why it helps:** before, the categories were plain text boxes, so the page looked like a form rather than a shop. Pictures let a shopper recognize what we sell at a glance and make the cards inviting to click, which sends more visitors into the catalogue.
- **How it was built:** the catalogue database has no photos of these items, so the pictures are original flat illustrations in Yale blue (`frontend/src/components/Art.tsx`). They are drawn in code, so there are no image files to license or to keep out of git. Each has a text alternative for screen readers.
- **Where to see it:** Home page, sections "Yale pride on the go" and "Desk and office essentials".

### 2. Authentic Yale identity: the Y logo and a redesigned bulldog

- **What was added:**
  - A serif Yale-style "Y" mark in the top navigation next to the store name (it also takes shoppers home), large in the Home page banner, in the footer, and as the browser tab icon. The same Y appears on the illustrated gear.
  - A new bulldog mascot strolling along the bottom of every page, modeled on Yale's Handsome Dan: a calm, white, stocky English bulldog with a brown patch over one eye, a gentle smile, and a Yale-blue blanket with a white Y. He walks at an easy pace with a slow, relaxed gait. It replaces an earlier blue silhouette that looked weak, and a second version that looked too fierce and frantic. He holds still for shoppers who have reduced motion turned on.
- **Why it helps:** the Y and the bulldog tell shoppers right away that this is a Yale shop, which builds trust and brand recognition. A friendly, recognizable mascot gives the store personality that a generic store does not have.
- **Note:** the Y is a stand-in drawn for this project (`frontend/src/components/YaleY.tsx`), not the official licensed artwork. Swap in the official file if the store has a license.
- **Where to see it:** every page (logo in the top bar and footer, bulldog along the bottom edge); the large Y is on Home.

## Agent / backend

### 3. Clean plain-text replies (no stray asterisks)

- **What was added:** the agent now writes plain text. The prompt (`backend/prompts/prompt.md`) forbids asterisks, bold, headings, backticks and tables and asks for lists as lines starting with "- ". As a guaranteed backstop, `clean_reply()` in `backend/agent.py` strips any markdown that slips through, both on new replies (including while they stream) and on older saved messages when history is loaded.
- **Why it helps:** the chat bubble does not render markdown, so shoppers were seeing text like `**$68**`. Plain, readable answers look professional and are easier to scan on a phone, which keeps shoppers reading.
- **Where to see it:** ask the assistant "What hoodies do you have under $50?" and the reply is clean text with a tidy list. Your earlier saved chats are cleaned too.

### 4. Faster replies

- **What was added:**
  - **Lower reasoning effort:** the model runs at `OPENAI_REASONING_EFFORT=low` (set in `.env`, documented in `.env.example`). In my test, a stock question went from about 10.3 seconds to about 8.0 seconds with this setting alone.
  - **No tool call for the page you are on:** on a product page the agent is handed that product's price, colors and stock by size, read from the database just now, so questions like "is medium in stock?" need no lookup round trip.
  - **Live progress and streaming:** the chat uses `POST /api/chat/stream`. The bubble shows "Thinking…", then what the agent is doing ("Searching the catalogue…", "Checking stock…"), then the answer appears as it is written.
  - **Agent built at startup:** the first chat after the server starts is no slower than the rest.
- **Why it helps:** shoppers who wait with no feedback leave. Typical answers now arrive in about 4 to 5 seconds, a status message shows within 2 to 3 seconds, and the shopper always sees progress. Lower reasoning effort also lowers the cost of each chat.
- **Honest note:** a question that needs two lookups in a row, such as price plus exact quantities for each size, can still take around 10 seconds.
- **Where to see it:** open the chat and ask any question; watch the status line change before the answer streams in.

## Also added: Buy now in the shop assistant

- **What was added:** every product card the assistant shows has a "Buy now" button (or "Sold out"). It opens that product's page at a size picker, where sold-out sizes are disabled. Choosing a size and pressing "Buy now" opens an email to `orderdept@campuscustoms.com` filled in with the item, size, price shown and the shopper's name and email, so the order team can complete the order. Online checkout does not exist yet, and the page says so.
- **Why it helps:** a shopper who is told "the hoodie is in stock in M" can act on it in one click instead of hunting for how to order, which turns chat questions into orders for the business.
- **Where to see it:** ask the assistant about any product, press Buy now on a card, then pick a size.
