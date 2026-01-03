const config = require('../../config.json');

const xp = config.xp || {};

module.exports = {
	WELCOME_CHANNEL_ID: xp.WELCOME_CHANNEL_ID,
	SUPPORT_TICKET_URL: xp.SUPPORT_TICKET_URL,
	BOOST_XP: typeof xp.BOOST_XP === 'number' ? xp.BOOST_XP : 50,
	MESSAGE_XP: typeof xp.MESSAGE_XP === 'number' ? xp.MESSAGE_XP : 1,
	THANKS_XP: typeof xp.THANKS_XP === 'number' ? xp.THANKS_XP : 10,
	THANKS_GIVER_XP: typeof xp.THANKS_GIVER_XP === 'number' ? xp.THANKS_GIVER_XP : 1,
	STAFF_ROLE_ID: xp.STAFF_ROLE_ID,
	GUILD_LINK: xp.GUILD_LINK,
	GUILD_LINK_XP: typeof xp.GUILD_LINK_XP === 'number' ? xp.GUILD_LINK_XP : 10,
	PRIMARY_GUILD_ID: xp.PRIMARY_GUILD_ID,
	GUILD_INVITE_XP: typeof xp.GUILD_INVITE_XP === 'number' ? xp.GUILD_INVITE_XP : 25
};
