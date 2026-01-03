const fs = require('fs');
const path = require('path');
const levelSystem = require('../xp/levelSystem');
const {
	GUILD_LINK,
	GUILD_LINK_XP,
	PRIMARY_GUILD_ID
} = require('../xp/xpConfig');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'presence_rewards.json');

function ensureDataFile() {
	if (!fs.existsSync(DATA_FILE)) {
		fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
		fs.writeFileSync(DATA_FILE, '{}');
	}
}

function hasReceived(userId, type) {
	ensureDataFile();
	const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
	return data[userId] && data[userId][type];
}

function setReceived(userId, type) {
	ensureDataFile();
	const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
	if (!data[userId]) data[userId] = {};
	data[userId][type] = true;
	fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
	name: 'presenceUpdate',
	once: false,
	async execute(oldPresence, newPresence) {
		try {
			const member = newPresence.member;
			if (!member || member.user?.bot) return;

			if (GUILD_LINK && !hasReceived(member.id, 'link')) {
				let status = '';
				if (Array.isArray(newPresence.activities)) {
					status = newPresence.activities
						.map(a => (typeof a.state === 'string' ? a.state : ''))
						.filter(Boolean)
						.join(' ');
				}
				status = status ? status.toLowerCase() : '';
				if (status.includes(String(GUILD_LINK).toLowerCase())) {
					setReceived(member.id, 'link');
					levelSystem.addXP(member.id, GUILD_LINK_XP);
					try {
						await member.send(
							`You received ${GUILD_LINK_XP} XP for putting our link in your status!`
						);
					} catch {}
				}
			}

			if (PRIMARY_GUILD_ID && !hasReceived(member.id, 'primaryGuild')) {
				try {
					if (
						member.user.primaryGuild &&
						member.user.primaryGuild.identityGuildId === PRIMARY_GUILD_ID
					) {
						setReceived(member.id, 'primaryGuild');
						levelSystem.addXP(member.id, 10);
						try {
							await member.send(
								'You received 10 XP for having our server as your primary guild!'
							);
						} catch {}
					}
				} catch {}
			}
		} catch {}
	}
};
