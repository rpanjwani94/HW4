# Usability improvements

Two frontend improvements (product pictures and a friendlier website) and two agent/backend improvements (clean replies and faster replies). Everything below is visible in the running app (frontend at http://localhost:5173, API at http://127.0.0.1:8000).

## Frontend

### 1. Pictures of the products

- **What was added:** pictures now appear next to the product links on the Home page. The six gear categories (water bottles, totes and bags, tumblers and mugs, journals, pens and sticky pads) are picture cards, each with a bold name and a "Shop now" prompt. The Home page also shows real photos of featured hoodies, and every product in the shop has its photo on its card.
- **How it helps a customer:** shoppers can see what the store sells at a glance instead of reading a list of words. A picture makes it easier to recognize the item they want and to choose between items.
- **How it helps the business:** a page full of pictures looks like a real store, not a plain list, so visitors trust it more and click into products more often, which leads to more sales.
- **Note:** the catalogue has photos only for the clothing. The gear categories use original illustrations in Yale blue (`frontend/src/components/Art.tsx`), so there are no image files to license.
- **Where to see it:** the Home page, sections "Yale pride on the go" and "Desk and office"; the Products page for the photo cards.

### 2. A friendlier customer website

- **What was added:**
  - The Yale Y logo in the top bar, the Home banner, the footer and the browser tab, so the site feels like Yale from the first second.
  - A friendly bulldog mascot in the style of Handsome Dan, with a Yale-blue blanket, strolling along the bottom of every page.
  - Warm wording and a calmer, inviting look: cream background, Yale blue, a Times-style serif font, and clear sections such as "Come visit us".
  - A friendlier shop assistant: a bulldog avatar, one-tap starter questions, and a Buy now button on the products it suggests.
- **How it helps a customer:** the site feels welcoming and easy to use. Shoppers know where they are, what to do next, and where to ask for help, so they are less likely to leave confused.
- **How it helps the business:** a friendly, recognizably Yale site builds trust and brand recognition. A memorable mascot and a helpful assistant give shoppers a reason to stay longer and come back.
- **Note:** the Y is a stand-in drawn for this project, not the official licensed artwork (`frontend/src/components/YaleY.tsx`). The mascot holds still for shoppers who have reduced motion turned on.
- **Where to see it:** every page (logo in the top bar and footer, bulldog along the bottom edge); open the chat button to see the assistant.

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
