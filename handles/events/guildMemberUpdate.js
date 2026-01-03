const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const levelSystem = require('../xp/levelSystem');
const { BOOST_XP } = require('../xp/xpConfig');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'boosted.json');

function ensureDataFile() {
	if (!fs.existsSync(DATA_FILE)) {
		fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
		fs.writeFileSync(DATA_FILE, '{}');
	}
}

function hasReceivedBoostXP(userId) {
	ensureDataFile();
	const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
	return !!data[userId];
}

function setReceivedBoostXP(userId) {
	ensureDataFile();
	const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
	data[userId] = true;
	fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
	name: 'guildMemberUpdate',
	once: false,
	async execute(oldMember, newMember) {
		try {
            // 2026 - tbh never tested if this works
			if (!oldMember.premiumSince && newMember.premiumSince) {
				if (hasReceivedBoostXP(newMember.id)) return;
				setReceivedBoostXP(newMember.id);
				levelSystem.addXP(newMember.id, BOOST_XP);
				try {
					await newMember.send({
						embeds: [
							new EmbedBuilder()
								.setTitle('Thank you for boosting!')
								.setDescription(`You received ${BOOST_XP} XP for boosting the server.`)
								.setColor(0xF47FFF)
						]
					});
				} catch {}
			}
		} catch {}
	}
};
