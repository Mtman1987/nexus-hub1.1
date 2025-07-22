
# Apollo Station: Developer Notes & Testing Checklist

This document provides a quick overview of the project structure, key configuration files, and a testing checklist.

---

## Project File Structure

```
.
├── src/
│   ├── app/
│   │   ├── dashboard/          # Main dashboard page
│   │   ├── access-control/     # Standalone "Access Control" page
│   │   ├── spacemountain/      # Standalone "Website Viewer" page
│   │   ├── launcher-ui/        # App entry point and launcher
│   │   ├── popout/             # Logic for pop-out module windows
│   │   ├── api/                # API routes for webhooks (Discord, etc.)
│   │   ├── globals.css         # Main stylesheet (theming and colors)
│   │   └── layout.tsx          # Root layout of the application
│   ├── components/
│   │   ├── dashboard/          # All dashboard widget components
│   │   ├── layout/             # Reusable layout components (Header, Sidebar)
│   │   └── ui/                 # ShadCN UI components
│   ├── ai/
│   │   └── flows/              # Core AI logic for each feature
│   ├── services/               # Service layer abstracting AI calls
│   └── lib/                    # Utility functions, configs (Firebase, sites)
├── .env                        # Local environment variables (for Python bot)
├── vault.config.json           # Optional file for hard-locking the vault password
├── bot.py                      # Standalone Python bot for Discord relay
└── DEV_NOTES.md                # This file
```

---

## Architectural Note: Why a Separate Discord Bot?

You might wonder why the Discord message relay isn't built directly into the Next.js application. Here’s the reasoning:

*   **Stability:** A Discord bot requires a stable, persistent connection to Discord's servers. The Next.js development server, with its hot-reloading feature, would constantly disconnect the bot.
*   **Deployment:** The main application is designed for serverless platforms (like Vercel or Firebase App Hosting), which are not suited for running long-lived background processes.
*   **Decoupling:** Keeping the bot separate ensures that the web UI and the bot can be developed, deployed, and scaled independently.

---

## Configuration Cheat Sheet

-   **Theming & Colors**: `src/app/globals.css`
-   **Dashboard Modules**: `src/app/dashboard/page.tsx` - Add, remove, or reorder modules in `ALL_MODULES_CONFIG`.
-   **API Keys & Endpoints**: `src/components/dashboard/api-settings.tsx` - The main configuration hub. Use the vault to manage all secret keys and service connections.
-   **Vault Password (Hard Lock)**: `vault.config.json` - Set a password here to lock it from being changed in the UI.
-   **Bot Personalities**: `src/components/dashboard/bot-personality.tsx` - Create, edit, and share AI personas.
-   **Setup Wizard UI**: `src/components/dashboard/setup-dialog.tsx` - The multi-step UI for first-time setup.
-   **AI Logic**: All AI calls are routed through `src/services/ai.ts` to their respective flows in `src/ai/flows/`.

---

## Testing Checklist

### General UI & Responsiveness
- [ ] **First-Time Setup**: Clear all browser local storage. On startup, verify the Setup Wizard appears automatically.
- [ ] **Vault Password Setup**: Complete the first step of the wizard to set a vault password.
-   **Dashboard**: After setup, verify the dashboard loads correctly.
-   **Module Drag & Drop**: Rearrange modules on the dashboard and verify the new layout is saved after clicking "Save Layout".
-   **Module Visibility**: Use the "Hide" button on a module. Verify it moves to the "Hidden Modules" section at the bottom.
-   **Mobile View**: Resize the browser. Does the sidebar collapse? Does the dashboard grid reflow correctly?

### Core Features
-   **API Key Vault**: Test the lock/unlock functionality. Use the password you set during setup. Does it automatically lock after 5 minutes?
-   **Bot Personality**: Create a new personality. Save it. Switch back to COSMO. Does the correct prompt load each time?
-   **Unified Chat**: Send a message to "AI Bot". Does the chat history update correctly?
-   **Cipher (Code Helper)**: Enter an instruction (e.g., "create a JavaScript function to get a random number") and verify code is generated.
-   **Image Generator**: Enter a prompt and verify an image is generated.
-   **Translator**: Test all three tabs: text translation, text-to-speech, and audio file transcription.
-   **Log Viewer**: Check that logs from various actions appear correctly. Click a log to see details.
-   **Discord Relay**: Run the `bot.py` script. Send a message in your Discord server that `@mentions` the bot. Does it appear in the Unified Chat? Send a message *from* the Unified Chat with "Discord" selected. Does it appear in your Discord channel?

---
## Python Bot Code (`bot.py`)

For convenience, here is the full code for the `bot.py` file.

```python
# This is a Python script to connect to Discord and relay messages.
# Save this file as `bot.py` in your main project folder.
# It will only relay messages where the bot is @mentioned.

import os
import requests
import discord
from dotenv import load_dotenv

# --- Configuration ---
# This loads variables from your .env file
load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')
WEBHOOK_URL = os.getenv('APOLLO_STATION_WEBHOOK_URL', 'http://localhost:9002/api/discord-relay')
BOT_NAME = os.getenv('BOT_NAME', 'Apollo Station') # Optional: Set a fallback bot name

# --- Bot Setup ---
# You must enable the "Message Content Intent" in the Discord Developer Portal
intents = discord.Intents.default()
intents.messages = True
intents.message_content = True 
client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'Logged in as {client.user}. Ready to relay messages to {WEBHOOK_URL}.')
    # Try to get the bot's name from the server, otherwise use the one from .env
    try:
        app_info = await client.application_info()
        global BOT_NAME
        BOT_NAME = app_info.name
        print(f"Bot name set to: {BOT_NAME}")
    except Exception as e:
        print(f"Could not fetch bot application info, using default name. Error: {e}")


@client.event
async def on_message(message):
    # Ignore messages from the bot itself
    if message.author == client.user:
        return

    # Check if the bot is mentioned
    is_mentioned = client.user in message.mentions

    if is_mentioned:
        # Clean the message content by removing the mention
        # This gives us just the user's prompt
        clean_content = message.content.replace(f'<@!{client.user.id}>', '').replace(f'<@{client.user.id}>', '').strip()
        
        print(f"Received @mention from {message.author.name}: {clean_content}")

        # Prepare the data to send to your Apollo Station app
        payload = {
            'content': clean_content,
            'author': message.author.name,
        }

        # Send the message to your Apollo Station webhook
        try:
            response = requests.post(WEBHOOK_URL, json=payload, timeout=5)
            response.raise_for_status() # Raises an exception for bad status codes
            print(f"Successfully relayed message to Apollo Station. Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"Error relaying message to Apollo Station: {e}")

# --- Run the Bot ---
if TOKEN:
    client.run(TOKEN)
else:
    print("Error: DISCORD_TOKEN not found. Please add it to your .env file.")
```
