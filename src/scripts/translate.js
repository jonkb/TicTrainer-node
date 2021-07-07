const path = require("path");
const i18n = require("i18n");

i18n.configure({
	locales: ['en', 'pt'],
	directory: "../locales",//path.join(__dirname, '../locales'),
	register: global
});

module.exports.tr = __;
module.exports.setLocale = i18n.setLocale;

