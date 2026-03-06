import { Client, Events, GatewayIntentBits, Options, ActivityType } from "discord.js";
import { EventName, LinkDaveClient } from "linkdave";
import { inspect } from "node:util";
import z from "zod";

const SNOWFLAKE_REGEX = /\d{15,21}/;

const { data: env, error } = z
    .object({
        DISCORD_TOKEN: z.string(),
        GUILD_ID: z.string().regex(SNOWFLAKE_REGEX),
        VOICE_CHANNEL_ID: z.string().regex(SNOWFLAKE_REGEX),
        SOURCE: z.url()
    })
    .safeParse(process.env);

if (error) {
    throw new Error(error.message);
}

const discord = new Client({
    makeCache: Options.cacheWithLimits({
        ApplicationCommandManager: 0,
        ApplicationEmojiManager: 0,
        AutoModerationRuleManager: 0,
        BaseGuildEmojiManager: 0,
        DMMessageManager: 0,
        EntitlementManager: 0,
        GuildBanManager: 0,
        GuildEmojiManager: 0,
        GuildForumThreadManager: 0,
        GuildInviteManager: 0,
        GuildMessageManager: 0,
        GuildScheduledEventManager: 0,
        GuildStickerManager: 0,
        GuildTextThreadManager: 0,
        MessageManager: 0,
        PresenceManager: 0,
        ReactionManager: 0,
        ReactionUserManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        UserManager: 0
    }),
    intents: [
        GatewayIntentBits.GuildVoiceStates
    ]
});

const linkdave = new LinkDaveClient({
    token: env.DISCORD_TOKEN,
    nodes: [
        { name: "main", url: "ws://linkdave:8080" }
    ],
    sendToShard: (guildId, payload) => {
        discord.guilds.cache.get(guildId)?.shard.send(payload);
    }
});

discord.on(Events.Raw, (packet) => linkdave.handleRaw(packet));

discord.on(Events.ClientReady, async () => {
    log("Bot ready as", discord.user?.tag);

    discord.user?.setPresence({
        status: "online",
        activities: [
            {
                type: ActivityType.Custom,
                name: "Custom Status",
                state: "• wamellow.com"
            }
        ]
    });

    await linkdave.connectAll();
    const player = linkdave.getPlayer(env.GUILD_ID);
    await player.connect(env.VOICE_CHANNEL_ID);
});

linkdave.on(EventName.VoiceConnect, (payload) => {
    log("voice connect", payload);

    const player = linkdave.getPlayer(env.GUILD_ID);
    void player.play(env.SOURCE);
});

linkdave.on(EventName.VoiceDisconnect, (payload) => {
    log("voice disconnect", payload);

    const player = linkdave.getPlayer(env.GUILD_ID);
    void player.connect(env.VOICE_CHANNEL_ID);
});

linkdave.on(EventName.TrackEnd, (payload) => {
    log("track end", payload);

    const player = linkdave.getPlayer(env.GUILD_ID);
    void player.play(env.SOURCE);
});

linkdave.on(EventName.TrackError, (err) => {
    log("err", err);

    const player = linkdave.getPlayer(env.GUILD_ID);
    void player.play(env.SOURCE);
});

linkdave.on(EventName.Close, (d) => console.log(`Connection closed: ${d.code} ${d.reason}`));
linkdave.on(EventName.Error, console.error);

process.on("SIGINT", () => {
    void discord.destroy();
    linkdave.disconnectAll();
    process.exit(0);
});

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

void discord.login(process.env.DISCORD_TOKEN);

function log(text: string, payload: unknown) {
    const date = new Date().toLocaleString("en-US", { timeZone: "Europe/Vienna" }).split(", ")[1];

    console.log(`${date} ${text}:\n${inspect(payload, { depth: 2 })}\n`);
}