/**
Precompile a .hbs file to a .js file
*/

const path = require("path");
const hbs = require("handlebars");
const fs = require("fs");

let ifname = path.join(__dirname, "/../webroot/templates/report_user.hbs")
let ofname = ifname.slice(0, ifname.lastIndexOf(".")) + ".js"
console.log(ifname);
let template = fs.readFileSync(ifname, {encoding:'utf8'});
let compiled = hbs.precompile(template);
fs.writeFileSync(ofname, compiled);
