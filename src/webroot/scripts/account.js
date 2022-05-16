
function account_init(acc_obj){
	if(acc_obj.id){
		$("#loginbtn").hide();
		$("#registerbtn").hide();
		$("#actname").text(": "+acc_obj.id);
		// Admins and trainers don't use the store
		if("at".indexOf(acc_obj.id[0]) != -1)
			$("#storebtn").hide();
	}
	else{
		$("#logoutbtn").hide();
		$("#mngbtn").hide();
		$("#storebtn").hide();
	}
}

function logout(e){
	var jqxhr = $.get("/account/logout");
	jqxhr.done((data) => {
		$("#loginbtn").show();
		$("#registerbtn").show();
		$("#logoutbtn").hide();
		$("#mngbtn").hide();
		$("#storebtn").hide();
		$("#actname").html("");
		// Redirect to home page only after logging out
		location.assign("/");
	});
	jqxhr.fail((data) => {
		alert("logout failed: "+data);
	});
	return false;
}

function validate_id(id, valid_initials = "tua"){
	/* Check whether id is a valid id string.
		valid_initials: combination of "t", "u", &/or "a" (lowercase)
		returns a lowercase version of the given id or "-" if the id is invalid.
	*/
	
	id = id.toLowerCase();
	if(valid_initials.indexOf(id[0]) == -1)
		return "-";
	if(id[0] != "a" && id.length < 2)
		return "-";
	return id;
}