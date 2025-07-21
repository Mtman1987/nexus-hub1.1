
# Space Mountain OS

Space Mountain OS is a centralized, modular system by mtman1987 to manage all your online services, powered by Next.js and Google AI.

## Features

- **Responsive Dashboard**: A clean UI to monitor and control your services.
- **Configurable Service Modules**: Individual components for services like Discord, Twitch, and a customizable template module. You can toggle the visibility of any module to create a personalized dashboard.
- **AI-Powered Tools**: Features like Intelligent Fallback, Unified Chat, and an AI Setup Assistant leverage Genkit and Google AI.
- **AI-Powered Setup Wizard**: On first launch (or anytime from the settings), a guided wizard with integrated AI help makes configuration simple for anyone.
- **Dynamic Bot Name**: Personalize the application by giving your chatbot its own custom name.
- **Access Control**: Manage user roles and permissions.
- **PWA Ready**: Install the app on your desktop or mobile device for a native-like experience.

## Local Development Setup

To get this project running on your local machine, follow these steps.

### 1. Prerequisites

Make sure you have the following software installed:
- **Node.js**: Version 18 or later. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: This comes automatically with Node.js.

### 2. Installation

First, navigate to the project directory and install the necessary dependencies.

```bash
npm install
```

### 3. Configuration

The application uses Google AI for its generative features. You will need to provide an API key.

1.  Create a new file named `.env` in the root of the project.
2.  Add your Google AI API key to this file:

    ```
    GOOGLE_API_KEY=YOUR_API_KEY_HERE
    ```
    
    You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

    **Note**: If you run the app without this key, a **Setup Wizard** will automatically pop up to guide you through the process.

### 4. Running the Application

With the new Genkit integration, you only need to run a single command to start the entire application, including both the frontend and the AI backend.

- **To run the Next.js app (frontend & AI backend):**

  ```bash
  npm run dev
  ```
  This will start the web server. Once running, open your browser to: **`http://localhost:9002`**

## Hybrid Architecture: Local Hub with Cloud Remote (Optional)

You can run Space Mountain OS locally to connect to services like Streamer.bot and simultaneously access it from your phone using a deployed version of the app. This is achieved using a tunneling service.

1.  **Run Locally**: Start the app on your main computer with `npm run dev`. This is your "engine".
2.  **Install a Tunnel**: Download and set up a tunneling service like [ngrok](https://ngrok.com/download). This will expose your local server to the internet.
3.  **Start the Tunnel**: In a new terminal, run the command to expose your local port (9002).
    ```bash
    ngrok http 9002
    ```
4.  **Get Public URL**: ngrok will give you a public "Forwarding" URL (e.g., `https://random-string.ngrok.io`). Copy this URL.
5.  **Deploy to Cloud**: Deploy a second instance of Space Mountain OS to a service like Vercel or Firebase App Hosting. This will be your "remote control".
6.  **Configure Remote**: Open your deployed cloud app. Go to `API Key Vault` -> `Remote Access` and paste the ngrok Forwarding URL into the "Remote Hub Address" field and save.

Now, when you use the Unified Chat on your deployed cloud app (e.g., on your phone), it will securely send the commands to your local machine for execution.

## Discord Bot Integration (Optional)

To relay messages from a Discord server into the Unified Chat, you need to run a separate Python bot. This requires Python to be installed on your system.

**Why a separate bot?** The main Next.js app is a web server, which restarts frequently during development. A Discord bot needs a stable, persistent connection. A separate script is the most reliable way to achieve this.

### Step 1: Create the Discord Bot and Get Credentials

Before you can run the bot, you need to create it in the Discord Developer Portal.

1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **"New Application"**.
2.  Give your bot a name and click **"Create"**.
3.  Go to the **"Bot"** tab on the left menu.
    *   Click **"Reset Token"** to get your **Bot Token**. Copy this somewhere safe. **This is your `DISCORD_TOKEN`**.
    *   Enable the **"Message Content Intent"** toggle under "Privileged Gateway Intents". This is required for the bot to read messages.
4.  Go to the **"OAuth2" -> "General"** tab.
    *   Copy your **"Client ID"**. You'll need this in the next step to invite the bot.

### Step 2: Invite The Bot to Your Server

1.  While still in the Discord Developer Portal, go to **"OAuth2" -> "URL Generator"**.
2.  Under **"Scopes"**, check the box for **`bot`**.
3.  A new box called **"Bot Permissions"** will appear below. Check the following permissions:
    *   `Send Messages`
    *   `Read Message History`
4.  A URL will be generated at the bottom of the page. Copy this URL.
5.  Paste the URL into your browser, select the server you want to add the bot to, and click **"Authorize"**. Your bot will now appear in your server's member list.

### Step 3: Install Python Dependencies

Open your terminal in the project folder and run this command. This only needs to be done once.

```bash
pip install discord.py python-dotenv requests
```
**Note:** Do not include a period `.` at the end of the command.

### Step 4: Create the Bot File

Create a new file named `bot.py` in the root of your project directory. Copy and paste the entire code block below into that file.

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
BOT_NAME = os.getenv('BOT_NAME', 'Space Mountain OS') # Optional: Set a fallback bot name

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

        # Prepare the data to send to your app
        payload = {
            'content': clean_content,
            'author': message.author.name,
        }

        # Send the message to your webhook
        try:
            response = requests.post(WEBHOOK_URL, json=payload, timeout=5)
            response.raise_for_status() # Raises an exception for bad status codes
            print(f"Successfully relayed message to Space Mountain OS. Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"Error relaying message to Space Mountain OS: {e}")

# --- Run the Bot ---
if TOKEN:
    client.run(TOKEN)
else:
    print("Error: DISCORD_TOKEN not found. Please add it to your .env file.")

```

### Step 5: Add Your Bot Token to the `.env` File

Add your Discord Bot Token to your **existing `.env` file** (the same one used by the main app). The Python bot will read from this same file. 

```
# This is your .env file
GOOGLE_API_KEY=YOUR_API_KEY_HERE
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
# The Discord Webhook for sending messages FROM the app can be set in the API Key Vault
```

### Step 6: Run the Bot

Open a **new, separate terminal** (keep the `npm run dev` terminal running) and run this command:
```bash
python bot.py
```
This bot must be running at the same time as your main `npm run dev` process for the chat relay to work.

### Step 7: Configure Streamer.bot (Optional)

To send messages *to* Streamer.bot (e.g., from the Unified Chat), you need to configure its WebSocket server.

1.  In Streamer.bot, navigate to `Servers/Clients` -> `WebSocket Server`.
2.  Ensure the server is **Active**.
3.  Set the IP to `127.0.0.1`.
4.  Set the Port to `9003`.
5.  If you get a "port in use" error, you can change the port, but you must enter the same port number into the API Key Vault.
6.  Save these settings in both Streamer.bot and Space Mountain OS.

    