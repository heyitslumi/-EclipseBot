const fs = require('fs');
const path = require('path');

module.exports = {
	name: 'guildMemberRemove',
	once: false,
	async execute(member) {
		try {
			if (member.user?.bot) return;
			const pendingFile = path.join(__dirname, '..', '..', 'data', 'invite_pending.json');
			if (!fs.existsSync(pendingFile)) return;
			let pending;
			try {
				pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
			} catch {
				return;
			}
			if (pending[member.id]) {
				pending[member.id].left = true;
				fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2));
			}
		} catch {}
	}
};
