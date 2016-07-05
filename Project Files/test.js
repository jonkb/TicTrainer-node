var a = "abcowdefg";

console.log("A");

function hasAcow(str){
	str += "ZZZ";
	if(str.indexOf("cow") > -1)
		return str;
	return false;
}
a = hasAcow(a);
if(a === false){
	console.log("You Failed Me");
}
else{
	console.log(a);
}

console.log("Z");