<div align="center">
  <img src="https://firebasestudio.com/static/images/projects/apollo-station/community-logo.png" alt="Apollo Station Community Logo" width="256"/>
</div>

# Apollo Station

Welcome to Apollo Station, a powerful, local-first, modular mission control center for all your online services and AI tools. Built with Next.js, it features a customizable dashboard that connects to external services like Discord and Streamer.bot, and integrates with a wide range of AI providers for tasks like chat, code generation, image creation, and more.

## Acknowledgment

This project was a collaborative effort between **mtman1987** and Google's AI assistant, **Gemini**.

## Connect with the Creator

- **Website**: [YOUR_WEBSITE_HERE](https://your-website.com)
- **Discord**: [YOUR_DISCORD_INVITE_HERE](https://discord.gg/your-invite)
- **Twitch**: [YOUR_TWITCH_CHANNEL_HERE](https://twitch.tv/your-channel)

---

## Core Features

- **Draggable & Resizable Dashboard**: A fully customizable grid layout to arrange your modules exactly how you want.
- **AI-Powered Setup Wizard**: A guided setup process with an integrated AI assistant (COSMO) to help you find API keys and configure services.
- **Unified Chat**: Send messages to your AI bot, Discord, Streamer.bot, and other connected users from a single interface.
- **Bot Personality Store**: Create, save, and switch between different AI personas. Share and import personalities from a shared community store powered by Firebase.
- **Secure API Key Vault**: A local, password-protected vault to securely store all your API keys and credentials. Features an optional file-based lock for enhanced local security.
- **Modular Component System**:
  - **Cipher (Code Helper)**: Generate code snippets in various languages from natural language instructions.
  - **Stargate Imagery**: Create images from text prompts using providers like OpenAI's DALL-E or Stability AI.
  - **Translator**: A multi-tool for text translation, text-to-speech, and speech-to-text transcription.
  - **And more...**: Including a Website Viewer, Log Viewer, Resume Parser, and Access Control panel.
- **PWA Ready**: Install the app on your desktop or mobile device for a native-like experience.

## Local Development Setup

### 1. Prerequisites
- **Node.js**: Version 18 or later.
- **npm**: Comes with Node.js.
- **Python**: (Optional) Required only for the Discord Bot integration.

### 2. Installation
Clone the repository and install the necessary dependencies.
```bash
git clone <repository_url>
cd <repository_name>
npm install
```

### 3. Configuration
The application requires API keys to function. On first launch, a Setup Wizard will guide you through this process.

1.  **Run the App**: Start the development server.
    ```bash
    npm run dev
    ```
    This will start the web server, typically on **`http://localhost:9002`**.

2.  **Setup Wizard**: When you open the app for the first time, a setup dialog will appear.
    *   **Step 1: Vault Password**: Create a master password to secure your API Key Vault. This is stored locally in your browser.
    *   **Step 2: Eden AI Key**: This is the **primary required key**. Get a key from [Eden AI](https://www.edenai.co/). It acts as a gateway to multiple AI providers (OpenAI, Google, Anthropic, etc.).
    *   **Optional Keys**: Add keys for other services like Discord or a direct Google AI key for fallback purposes.

### 4. Enhanced Local Security (Optional)
For an added layer of security, you can lock your vault password in a configuration file. This prevents the password from being changed through the UI and ensures it persists even if browser data is cleared.

1.  Open the `vault.config.json` file in the root of your project.
2.  Add a password:
    ```json
    {
      "password": "your-super-secret-password-here"
    }
    ```
3.  Restart the application (`npm run dev`). The API Key Vault will now be permanently locked with this password.

## Discord Bot Integration (Optional)
To relay messages from a Discord server into the Unified Chat, you need to run a separate Python bot.

### Step 1: Install Python Dependencies
```bash
pip install discord.py python-dotenv requests
```

### Step 2: Create a Discord Bot
1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Create a **New Application**.
3.  Go to the **"Bot"** tab, reset the token to get your `DISCORD_TOKEN`, and **enable the "Message Content Intent"**.
4.  Go to **"OAuth2" -> "URL Generator"**, select the `bot` scope, and grant `Send Messages` and `Read Message History` permissions.
5.  Use the generated URL to invite the bot to your server.

### Step 3: Create `bot.py`
Create a file named `bot.py` in the root of your project and paste the code from `DEV_NOTES.md` into it.

### Step 4: Add Token to `.env`
Create a `.env` file in the project root and add your keys. The Python bot and the Next.js app share this file.
```
# .env file
EDEN_AI_API_KEY=YOUR_EDEN_AI_KEY
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
```
*Note: Other keys are managed in the app's API Key Vault.*

### Step 5: Run the Bot
Open a **new, separate terminal** (keep the `npm run dev` terminal running) and run the bot:
```bash
python bot.py
```
This bot must be running at the same time as your main app for the relay to work.
