
function account_init(user){
	if(user.id){
		$("#loginbtn").hide();
		$("#registerbtn").hide();
		$("#actname").text(": "+user.id);
	}
	else{
		$("#logoutbtn").hide();
		$("#actmng").hide();
	}
}

function logout(e){
	var jqxhr = $.get("/account/logout");
	jqxhr.done((data) => {
		$("#loginbtn").show();
		$("#registerbtn").show();
		$("#logoutbtn").hide();
		$("#actmng").hide();
		$("#actname").html("");
		// Redirect to home page only after logging out
		location.assign("/");
	});
	jqxhr.fail((data) => {
		alert("logout failed: "+data);
	});
	return false;
}
