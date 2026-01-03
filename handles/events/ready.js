const fs = require('fs');
const { ActivityType } = require('discord.js')
const {ThreadManager} = require('discord-tickets');
const grantPendingInviteXp = require('../xp/inviteXpGrantJob');
module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        let sCount = client.guilds.cache.size
        ascii = `   ____        _                        _       \n  | __ )  ___ | |_   _ __ ___  __ _  __| |_   _ \n  |  _ \\ / _ \\| __| | '__/ _ \\/ _' |/ _' | | | |\n  | |_) | (_) | |_  | | |  __/ (_| | (_| | |_| |\n  |____/ \\___/ \\__| |_|  \\___|\\__,_|\\__,_|\\__, |\n                                          |___/ `
        console.log(`Logged in as ${client.user.tag}\nThis bot is in ${sCount} servers\n${ascii}\n\n`)
        client.user.setActivity(gconfig.status, { type: ActivityType.Watching })
        client.ticketManager = new ThreadManager(client, {
            enabled: true,
            channelId: gconfig.ticketID,
            staffRole: gconfig.staffAccessRoleID,
            storage: `../../../tickets.json`,
            ticketCache: true
        });
        if (client.test) {
            process.exit(0)
        }

        client.inviteCache = new Map();
        async function cacheGuildInvites(guild) {
            try {
                const invites = await guild.invites.fetch();
                client.inviteCache.set(guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
            } catch {}
        }
        for (const guild of client.guilds.cache.values()) {
            await cacheGuildInvites(guild);
        }

        setInterval(() => grantPendingInviteXp(client), 60 * 1000);

        setInterval(function () {
            fs.writeFileSync('./times.json', '{}', 'utf-8')
        }, 86400000)
    },
};
