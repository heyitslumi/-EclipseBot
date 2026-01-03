const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

async function updatejson(userid, type, highestrole, client, target, reason, time) {
    let object = require('./times.json')
    if (!object[userid]) {
        const a = require('./config.json').rolecooldown[highestrole];
        object[userid] = {
            "bansused": a.bansperday,
            "kicksused": a.kicksperday,
            "timeoutsused": a.timeoutsperday,
            "unbansused": a.unbansperday
        }
    }
    if (type === 'ban') {
        object[userid].bansused--;
    } else if (type === 'kick') {
        object[userid].kicksused--;
    } else if (type === 'timeout') {
        object[userid].timeoutsused--;
    } else if (type === 'unban') {
        object[userid].unbansused--;
    }
    const channel = await client.channels.fetch(gconfig.logchannelID)
    const Embed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle('Staff log')
	.addFields(
		{ name: 'Moderator', value: `<@${userid}> | \`${userid}\``, inline: true },
        { name: 'Action type', value:  `\`${type}\``, inline: true },
		{ name: 'Target', value: `${target} | \`${target.id}\``, inline: true },
        { name: 'Reason', value: `\`${reason}\``, inline: true },
	)
    if(time) Embed.setDescription(`Timeout time: ${time} minutes`)

    channel.send({ embeds: [Embed] });
    fs.writeFileSync('./times.json', JSON.stringify(object, null, 2), 'utf-8')
}

async function checkjson(userid, type, highestrole) {
    let object = require('./times.json')
    if (!object[userid]) {
        const a = require('./config.json').rolecooldown[highestrole];
        object[userid] = {
            "bansused": a.bansperday,
            "kicksused": a.kicksperday,
            "timeoutsused": a.timeoutsperday,
            "unbansused": a.unbansperday
        }
    }
    if (type === 'ban') {
        if (object[userid].bansused == 0) {
            return true
        } else {
            return false
        }
    } else if (type === 'kick') {
        if (object[userid].kicksused == 0) {
            return true
        } else {
            return false
        }
    } else if (type === 'timeout') {
        if (object[userid].timeoutsused == 0) {
            return true
        } else {
            return false
        }
    } else if (type === 'unban') {
        if (object[userid].unbansused == 0) {
            return true
        } else {
            return false
        }
    }
}

async function checkrole(highestrole) {
    if (Object.keys(require('./config.json').rolecooldown).includes(highestrole)) return true
    return false
}

module.exports = {
    updatejson,
    checkjson,
    checkrole
}
