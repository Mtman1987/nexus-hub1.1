
# Apollo Station: Developer Notes & Testing Checklist

This document provides a quick overview of the project structure, key configuration files, and a checklist for Phase 1 testing.

---

## Project File Structure

Here is a simplified tree of the most important files and directories you'll be working with:

```
.
├── public/
│   └── manifest.json       # PWA (Progressive Web App) configuration
├── src/
│   ├── ai/
│   │   └── flows/          # AI logic functions (the core AI logic)
│   │       ├── intelligent-fallback.ts
│   │       ├── setup-assistant.ts
│   │       └── unified-chat-flow.ts
│   ├── app/
│   │   ├── access-control/ # "Access Control" page components
│   │   ├── spacemountain/  # "Website Viewer" page components
│   │   ├── globals.css     # Main stylesheet (theming and colors)
│   │   ├── layout.tsx      # Root layout of the application
│   │   └── page.tsx        # The main dashboard page
│   ├── components/
│   │   ├── dashboard/      # All dashboard widget components
│   │   ├── icons/          # Custom SVG icons
│   │   ├── layout/         # Reusable layout components (Header, Sidebar)
│   │   └── ui/             # ShadCN UI components (Button, Card, etc.)
│   ├── hooks/
│   │   └── use-toast.ts    # Custom hook for showing notifications
│   ├── services/
│   │   └── ai.ts           # Centralized service for all AI API calls
│   └── lib/
│       ├── sites.ts        # Website module configuration
│       └── utils.ts        # Utility functions
├── .env                    # Local environment variables for Python bot
├── DEV_NOTES.md            # This file
├── package.json            # Project dependencies and scripts
└── README.md               # Project setup and user guide
```

---

## Architectural Note: Why a Separate Discord Bot?

You might wonder why the Discord message relay isn't built directly into the Next.js application. Here’s the reasoning:

*   **Stability:** A Discord bot requires a stable, persistent connection to Discord's servers. The Next.js development server, with its hot-reloading feature, would constantly disconnect the bot.
*   **Deployment:** The main application is designed for serverless platforms (like Vercel or Firebase App Hosting), which are not suited for running long-lived background processes.
*   **Decoupling:** Keeping the bot separate ensures that the web UI and the bot can be developed, deployed, and scaled independently.

The `bot.py` script provided in the `README.md` is designed to be a simple, standalone process that handles this persistent connection reliably.

---

## Configuration Cheat Sheet

-   **Theming & Colors**: `src/app/globals.css` - Edit CSS variables like `--primary` and `--accent`.
-   **Dashboard Modules**: `src/app/page.tsx` - Add, remove, or reorder `ModuleCard` components.
-   **Website Module**: `src/lib/sites.ts` - Configure website names and URLs.
-   **User Roles**: `src/components/dashboard/user-roles.tsx` - Edit the `initialUsers` array for placeholder data.
-   **API Keys & Bot Name**: `src/components/dashboard/api-settings.tsx` - This is the main configuration hub. Use the accordions to open sections for each service. You can set API keys, select models, and enable/disable fallback providers here.
-   **Setup Wizard UI**: `src/components/dashboard/setup-dialog.tsx` - This is the multi-step UI for first-time setup.
-   **AI Logic**: All AI calls are routed through `src/services/ai.ts`. You can modify the provider URLs, default prompts, and fallback logic there.
-   **Setup Wizard AI Logic**: `src/ai/flows/setup-assistant.ts` - This function builds the prompt for the AI helper in the setup wizard.
-   **Streamer.bot Port**: The recommended port is `9003`. This is configured in the API Key Vault. Ensure Streamer.bot's WebSocket Server is set to the same port.

---

## Phase 1 Testing Checklist

### General UI & Responsiveness
- [ ] **First-Time Setup**: Clear browser local storage. On startup, verify the Setup Wizard dialog appears automatically.
- [ ] **AI Help in Wizard**: In the setup wizard, test the "Need help?" accordion. Ask a question and verify the AI responds.
- [ ] **Dashboard**: After setup, verify all default modules load correctly on the main page.
- [ ] **Module Visibility**: Use the settings (gear) icon to hide and show different modules.
- [ ] **Dynamic Bot Name**: Change the "Chat Bot Name" in the API Key Vault and verify the name updates on the corresponding module card.
- [ ] **Mobile View**: Resize the browser or use a real device. Does the sidebar collapse into a hamburger menu?
- [ ] **PWA Install**: Check for the "Install App" icon in the browser's address bar and test the installation.

### Core Features
- [ ] **Access Control**: Navigate to the "Access Control" page. Change a user's role in the dropdown.
- [ ] **Website Viewer**: Navigate to the "Website" page. Verify the iframe loads the configured website.
- [ ] **Unified Chat**: Send a message to "AI Bot". Does the chat history update correctly?
- [ ] **Intelligent Fallback**: Enter text into the fields and get a recommendation from the AI.
- [ ] **Log Viewer**: Check that the placeholder logs are displayed correctly.
- [ ] **Discord Relay**: Run the `bot.py` script. Send a message in your Discord server that `@mentions` the bot. Does it appear in the Unified Chat? Send a message *from* the Unified Chat with "Discord" selected. Does it appear in your Discord channel?
- [ ] **Streamer.bot Integration**: Configure Streamer.bot's WebSocket Server to use port `9003`. Send a message from the Unified Chat with "Streamer.bot" selected. Does the action trigger in Streamer.bot?

### Configuration & Setup
- [ ] **Manual Setup Wizard**: Click the "Setup Wizard" button in the API Key Vault. Does the dialog open correctly?
- [ ] **API Vault Accordions**: Verify all sections in the API Key Vault are collapsible.
- [ ] **Provider Toggles**: In the API Vault, add a key for Google/OpenAI/Groq and verify you can enable and disable them with the toggle switch.
- [ ] **README**: Read through the `README.md`. Are the setup instructions clear for a new user?
- [ ] **Custom Module**: Enable the "Custom Service" module from the settings menu. Does it appear on the dashboard?

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
WEBHOOK_URL = os.getenv('NEXUS_HUB_WEBHOOK_URL', 'http://localhost:9002/api/discord-relay')
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
