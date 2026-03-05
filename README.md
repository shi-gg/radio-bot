[![](https://img.shields.io/discord/828676951023550495?color=5865F2&logo=discord&logoColor=white)](https://discord.com/invite/yYd6YKHQZH)
![](https://img.shields.io/github/repo-size/shi-gg/radio-bot?maxAge=3600)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/I3I6AFVAP)


A lightweight Discord music radio bot that streams a single audio source to a voice channel 24/7. Built with [linkdave](https://github.com/shi-gg/linkdave), a lightweight lavalink rewrite.

If you need help using this, join **[our Discord Server](https://discord.com/invite/yYd6YKHQZH)**.

## Configuration

You need:
- [Docker](https://www.docker.com/)
- A Discord Bot Token

The bot is configured via environment variables. Create a `.env` file in the root directory with the following variables:

```env
DISCORD_TOKEN=your_discord_bot_token
GUILD_ID=your_guild_id
VOICE_CHANNEL_ID=your_voice_channel_id
SOURCE=your_audio_source_url*
```

*`SOURCE` may be a 24/7 MP3 radio stream, like [`https://icepool.silvacast.com/GAYFM.mp3`](https://icepool.silvacast.com/GAYFM.mp3).

## Using Docker Compose

The easiest way to deploy the bot is using Docker Compose. This will start both the bot and the required `linkdave` node.

1.  **Clone the repository:**
    ```bash
    mkdir radio-bot
    cd radio-bot
    ```

2.  **Set up your environment variables:**
    Create a `.env` file as described in the [Configuration](#configuration) section.

3. **Create a docker `compose.yml`:**
    ```yml
    services:
        bot:
            container_name: radio-bot
            image: ghcr.io/shi-gg/radio-bot
            restart: unless-stopped
            env_file: .env
            depends_on:
                - linkdave
        linkdave:
            image: ghcr.io/shi-gg/linkdave:0.1.2
            container_name: radio-linkdave
            restart: unless-stopped
            ports:
                - "18080:8080"
            healthcheck:
                test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
                interval: 30s
                timeout: 3s
                start_period: 5s
                retries: 3
            logging:
                driver: json-file
                options:
                    max-size: "10m"
                    max-file: "3"
            environment:
                LINKDAVE_SOURCE_HTTPS_ENABLED: true
                LINKDAVE_SOURCE_IP_ADDRESS_PUBLIC_ENABLED: true
    ```

4.  **Start the containers:**
    ```bash
    docker compose up -d
    ```

The bot will automatically connect to the specified voice channel and start playing the audio source.
