const path = require("path");
const i18n = require("i18n");

i18n.configure({
	locales: ['en', 'pt'],
	directory: path.join(__dirname, '/locales'),
	register: global
});

req = {};
res = {};
//i18n.init(req, res);

i18n.setLocale("pt");
console.log(__("rindex_h2_welcome"));
