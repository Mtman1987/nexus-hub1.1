
# Nexus Hub

Nexus Hub is a centralized, modular system to manage all your online services, powered by Next.js and direct AI provider integrations.

## Features

- **Responsive Dashboard**: A clean UI to monitor and control your services.
- **Configurable Service Modules**: Individual components for services like Discord, Twitch, and a customizable template module. You can toggle the visibility of any module to create a personalized dashboard.
- **Direct AI Integration**: Features like Intelligent Fallback, Unified Chat, and an AI Setup Assistant use direct API calls to providers like Eden AI, with a configurable fallback system.
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

The application uses AI for its generative features. You will need to provide an API key. The primary provider is Eden AI.

1.  If you have one, you can create a `.env` file and add your key, but this is not required.
    ```
    # .env is not required, as keys are stored in browser's local storage via the UI.
    ```
2.  Run the application. A **Setup Wizard** will automatically pop up to guide you through adding your primary Eden AI key and any optional fallback provider keys.

### 4. Running the Application

- **To run the Next.js app:**

  ```bash
  npm run dev
  ```
  This will start the web server. Once running, open your browser to: **`http://localhost:9002`**

## Service Integrations (Optional)

### Discord Bot Integration

To relay messages from a Discord server into the Unified Chat, you need to run a separate Python bot. This requires Python to be installed on your system.

**Why a separate bot?** The main Next.js app is a web server, which restarts frequently during development. A Discord bot needs a stable, persistent connection. A separate script is the most reliable way to achieve this.

1.  **Get Credentials**: Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications) and get its **Bot Token**. Make sure to enable the **Message Content Intent**.
2.  **Add Token via UI**: In the Nexus Hub app, go to `API Key Vault` -> `Discord Integration` and add your **Bot Token**. This is what the Python bot will use.
3.  **Install Dependencies**: Run `pip install discord.py python-dotenv requests` in your terminal.
4.  **Create `bot.py`**: Create a file named `bot.py` in the project root and copy the code from `DEV_NOTES.md`.
5.  **Create `.env` for Python bot**: The Python bot needs its own `.env` file to read the token. Create a `.env` file in the root of the project and add your token:
    ```
    DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
    ```
6.  **Run the Bot**: Open a **new terminal** and run `python bot.py`.

### Streamer.bot Integration

To have Streamer.bot send events (like follows, cheers, raids, etc.) into the Unified Chat, you need to configure a **Webhook** action in Streamer.bot. This allows Streamer.bot to send data *to* Nexus Hub.

1.  **Get the Webhook URL**: Run the Nexus Hub app (`npm run dev`) and go to the **API Key Vault**. Find the **Streamer.bot Integration** section. It will display a read-only URL (e.g., `http://localhost:9002/api/streamerbot-relay`). Copy this URL.
2.  **Create an Action in Streamer.bot**:
    *   Go to the `Actions` tab in Streamer.bot.
    *   Create a new action (e.g., "Send Follow to Nexus Hub").
    *   Add a new sub-action: `Network` -> `Webhook`.
3.  **Configure the Webhook**:
    *   **Method**: `POST`
    *   **URL**: Paste the URL you copied from the API Key Vault.
    *   **Body (Optional)**: You can send data about the event as JSON. For example, to announce a new follow, you could use:
        ```json
        { "event": "New Follow", "user": "%user%" }
        ```
        The text from this will appear in the Unified Chat.
4.  **Add a Trigger**: Assign this action to a trigger in Streamer.bot, such as `Twitch` -> `Follow`.
5.  **Configure WebSocket Server (for sending messages *to* Streamer.bot)**:
    * In Streamer.bot, go to `Servers/Clients` -> `WebSocket Server`.
    * Ensure it is **Active**. Set the IP to `127.0.0.1` and Port to `9003`.
    * If you get a "port in use" error, you can change the port, but make sure to update it in the Nexus Hub API Key Vault to match.

Now, whenever that event happens, Streamer.bot will send the information to Nexus Hub, and it will appear in your chat log.
