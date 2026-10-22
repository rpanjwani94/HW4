# AI Prompts

## Problem 1: Vibe Coder Prompts

**Prompt 1**

```
yes, problem 1: vibe coder prompts, is create AI_prompts.md in homework4.
```

**Follow-up prompt:** TODO (only if needed)

**What was lacking after the first prompt:** TODO

## Problem 2: Analyze the Database

**Prompt 1**

```
Problem 2: analyze the database. I've uploaded the database called data/college_customs.db, and I want you to look at the database and understand the fields of each table. At a minimum, I should understand three sections, three fields called catalog, inventory, and users. Now start the file called output/harness.md, and then I want you to write down each table and its fields, in one short line, on why each field matters for the shop or the chatbot. We're going to keep growing this harness file in later problems: content, models, tools, safety, specs.
```

**Follow-up prompt:** TODO (only if needed)

**What was lacking after the first prompt:** TODO

## Problem 3: Build a Canvas Customs Website

**Prompt 1**

```
Problem 3: Build a Canvas Customs website. Scaffold a React + Vite + TypeScript frontend for Canvas Customs. Put a navigation bar at the top that links to the main pages: Home, Products, About Us, Login, Create Account. Then I also want you to pull campus custom style wording from the website yalebulldogblue.com for Home and About Us, but write these pages in my own voice. Don't copy the original site text. 

Looking at the Yalebulldogblue.com website, their home website has a picture of the front of the store that says, "Come visit us," with the address on the bottom. They also have some popular merchandise for Yale Pride on the go, things like a water bottle, two totes, and a tumbler that has stock photos of students wearing their apparel. Then there are some office essentials, like a journal, a pen, or a sticky pad, and each item has a link for Quick Shop, Purchase Items, or Choose Options. On the side, there's also a chatbot. 

Of note, there is also a home section in the menu that is related to home items that we might want, so pillowcases and pillows and stuff like that. But I don't think that's what the professor meant.
```

**Follow-up prompt**

```
They don't have a specific About Us website or About Us section on their website. What they do have is a contact page. On the contact page, it has a quick note that says, "For help with your order, please use their chat feature or send us an email at their email address."
```

**Continuation prompt**

```
On the products page of the website, I want you to show product images from the catalog (you'll see image paths in the database in the folder that's inside the over four folder), with basic product info, for example, name, price, short description.

Then I want you to make each product open a single item page (so a larger image on one side with full product text on the other, with a description, price, sizes, stock, and when we'll have them). Clicking a card on products should take the shopper there.

Then I also want you to add a chat interface in the bottom right of the site, a floating chat panel is fine. It doesn't need to talk to an agent yet, but a stub that I'll call the backend later is enough for this problem.

Then we'll also need to make a small API soon to read the database. It's fine to start a simple fast API app in a file called backend/main.py just to serve products and images, then grow it into the agent backend in problem 5.
```

**Follow-up prompt (theme)**

```
Also, I don't want you to use the Tomorrow Midnight Blue themes that we've used for past problems. I want you to use Yale University blue colors and embody the theme of yalebulldog.com, but I want you to make it a little more personalized. Maybe have a bulldog running around or something.
```

**What was lacking after the first prompt:** TODO

## Problem 4: Create Account and Login

**Prompt 1**

```
Problem 4: Create account and login.

We have to build a normal create account and login flow. On the create account page, customers should have the ability to create an account with their first name, last name, email, password, and make sure that they confirm their password, and then have an option to log in with their email and password. New accounts can go into the "users" table, and make sure to store passwords securely so hackers, whether they're human or AI, can't access them.
```

**Follow-up prompt**

```
In continuation of problem 4, the seed database already has a test user that we can use while building. The email for the test user is going to be test@campuscustoms.yale.edu, and the password is going to be password. The hash function is going to be PBKDF2-HMAC-SHA256, with 120,000 iterations (stored as pbkdf2_sha256$salt$hash).

Have the login. We'll check the password:

* We never unhash the stored value, we just rehash what the user types and compare, read the salt out of the stored string (the middle piece), and - do not make a new one at login.
* Hash the typed password with the same salt, and compare to the stored hash.
* Use a constant-time compare.
* Sign-up and login use the same hash settings (same function, same salt and blank, same iteration count).
* If they differ, even the right password will not match.

 The surest check: login as a seeded test user and as a brand-new account you just created in your own app (which it seems like you did for me already). Confirm that I can log in as that user and that a brand-new account I create also works. Then update the file output/harness.md with how authorization works (what you store for a user and how passwords are protected).
```

**What was lacking after the first prompt:** TODO

## Problem 5: Pedantic AI Agent Backend

**Prompt 1**

```
Problem 5: Pedantic AI Agent Backend.

Now, for this problem, we have to build the shop chatbot as a pedantic AI agent behind Fast API, plugged into the frontend chat widget. We have to put the API app into the Python file called backend/main.py, and that's the file that we can run with uvicorn. We're going to keep the agent with these four files next to it (same idea as homework 3).:

* backend/prompts/prompt.md (this is the system prompt, and this will grow in the same file later),
* backend/agent.py (this is the agent entry wiring),
* backend/tools.py (this is the tools that the agent can call),
* backend/models.py and (pedantic/pedantic AI structured types).

 In the file main.py, we're going to expose a chat route so a message from the website returns a reply from the agent and whatever else we need for products and authorization. We'll have to use the AI model API key for the agent. I think I'll use ChatGPT, sol

1. We're going to have to put campus customs, voice, and safety basics into the file called prompts/prompt.md (we're going to have to expand tools and safety later).
2. Start or update types in the file called models.py for chat replies and product cards as needed.
3. In the file output/harness.md, I want you to note how the frontend talks to Fast API and how the agent is loaded (prod file + model +).
4. Make sure the backend runs from the backend/ folder like this: uvicorn main:app --reload --port 8000
```

**Follow-up prompt:** TODO (only if needed)

**What was lacking after the first prompt:** TODO

## Problem 6: Tools: Product Info and Stock

**Prompt 1**

```
Problem 6: Tools: product info and stock.  
  
In this problem, we have to give the agent tools that look up real information from the database file called campus_customs.db for price, description, and how near in stock (by size when the customer asks). The agent has to use the database. It shouldn't invent prices or quantities. If the size is out of stock, it has to say so clearly.  
  
We have to expand the file prompts/prop.md so that the agent knows to call these tools for price and stock questions. We have to add our updated return types in the Python file models.py. In the file output/harness.md, we have to list each tool and explain which model fields I chose for lookup results and why.
```

**Follow-up prompt:** TODO (only if needed)

**What was lacking after the first prompt:** TODO

## Problem 7: Chat Search That Updates the Page

**Prompt 1**

```
For problem 7, call chat search that updates the page. Now we'll have to add a neat feature to the site. When a customer asks about a type of item - for example, "What hoodies do you have?" - the agent has to be able to search the catalog. The website should dynamically show any matching items as product cards with image, name, price, short info. 

After the dynamic product cards are loaded by our new feature, we're going to make sure the single item page behavior that we built in problem 3 still works. Each product card, including the one on the step the chat just put on the page, should still open that detail view (large image plus full info) when clicked. Then update the files prompts/prompt.md and output/harness.md so it's clear how search results reach the page.
```

**Follow-up prompt:** TODO (only if needed)

**What was lacking after the first prompt:** TODO

## Problem 8: Customer Memory

**Prompt 1**

```
Problem 8 is customer memory. When a shopper is logged in, they save their chat history in the database in an appropriate table and reload it when they return. The agent should know who is chatting (like their name, their email) and put that in agent deps or equivalent clear pattern, and/or tools the agent can collaborate with. Additionally, there should be enough page context passed in if someone's on a product page. Do we have this in pink? The agent should know which item they mean (this code can be put into the agent context). 

The guests can still chat, but history only needs to persist for logged-in users. Document in output/harness.md how the user chat history is stored, customer fields, agencies, and how page context is passed.
```

**Follow-up prompt:** TODO (only if needed)

**What was lacking after the first prompt:** TODO

## Problem 9: Usability Improvements

**Prompt 1**

```
Problem 9 is usability improvements. Now that the core shop works, it's time to improve it. We have to choose and implement two frontend usability improvements and two agent backend usability improvements.

Frontend improvements are things that make the site look better and make it easier to use. Agent / backend improvements are things that make the agent output better and more accurate, or safer. These could be new agent tools or things that make the agent run faster or cheaper. Write the file output/usability.md before or as I build. For each of the improvements, I'm going to tell you what I added and why it helps campus customs, shoppers, or the business. Then make sure all the improvements actually show up in the running app. my graders will read their write-up and look for the features. 

so show me the app so that i can do problem 9
```

**Follow-up prompt**

```
Okay, things to improve for the frontend: I want you to include pictures of the water bottles, totes and bags, tumblers and mugs, journals, pens, and sticky pads that you have links to. Right now, it doesn't look like a store's website. It almost looks like an accountant's page. Also, I don't really like the bulldog. Looks sort of pathetic. Can you fix that? Additionally, can you include the Yale Y logo somewhere on the website to make it more authentically Yale?
```

**Follow-up prompt 2**

```
I don't like the way the Bulldog is running. He looks like he's struggling. and he looks to fierce. not like dan the handsome
```

**Follow-up prompt 3**

```
So far with the backend, I haven't had any problems. For example, it's returning the search queries I have. I just don't like how many asterisks it uses in its responses. What are other backend improvements that could occur? Something that I should think about ?
```

**Follow-up prompt 4**

```
So, definitely number one. It would be nicer if the response could be a lot faster. I think it would help the business if there was a "Buy Now" button inside the shop assistant.
```

**What was lacking after the first prompt:** TODO

## Problem 10: Style the Website

**Prompt 1**

```
For problem 10: we have to style the website. We have to add a creative design so that the site feels like a real campus custom storefront with:  
\- fonts  
\- color  
\- hierarchy  
\- emotion  
\- product presentation  
\- comment chat  
\- pillar  
You will get more points for imagination and innovative design. Then we have to write the file output/design.md: what we changed and why it should help customers stick around and buy. Keep it concrete and short.
```

**Follow-up prompt**

```
Truthfully, I already did this in problem 9 because I asked the AI to add  images (next t the hyperliks), and I asked the vibecoder to add the Y Yale symbol. I also asked you to make Dan the bulldog a little bit better. I think that's right. Probably failed, but I'll keep working on that.
```

**Follow-up prompt 2**

```
Yeah, I think for problem 10, I have to tell you to do it, so let me know what you recommend. It seems like you recommend a distinctive type pairing, stronger hero sections, and better product cards in the branded chat window. Yeah, I think for visual hierarchy, things look good for fonts. Can you make it more Times New Roman style, something more Yale-esque?
```

**What was lacking after the first prompt:** TODO

## Problem 11: App Check

**Prompt 1**

```
Problem 11 in site testing (we're going to do an app check). I'm going to test the live site and document it in output/app_check.html (a page that I can double-click and open). Include clear screenshots and short captions for:

1. Check inventory level of an item (get stock/price from the database).
2. The dynamic search result cards appearing after a category question (e.g., hoodies).
3. One of the usability features that I added in problem number 9.
```

**Follow-up prompt**

```
Make the HTML easy to grade. Make sure that there's a heading for each check. Screenshot one or two sentences on what the screenshot proves. Put the screenshot image files in output/app_check_images/ and link them from app_check.html with relative paths. For example: app_check_images/inventory.png
```

**What was lacking after the first prompt:** TODO

## Problem 12: Audit Trail, Safety, Finish Harness

**Prompt 1**

```
Problem 12 is audit trail, safety, finish harness. We have to keep it in an append-only JSON file called output/audit_trail.json: activity (time, tool name, short args, results, stop reason). Don't wipe it between the runs. Also, think of some safety rules to give to the agent. Put them in prompts/prompt.md. Finish output/harness.md so it's clear how the system works. Model fields in models.py and why I chose them. Tools and abilities, safety rules and specs (loop limits, result caps, models, how to run front + back).
```

**Follow-up prompt:** TODO (only if needed)

**What was lacking after the first prompt:** TODO
