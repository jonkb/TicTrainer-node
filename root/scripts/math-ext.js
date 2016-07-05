module.exports.norm = norm;

//Approximate Normal Distribution   -   default: (-6, 6) sd 1 median 0
function norm(median, sd, clip_radius){
	//defaults
	if(median === undefined)
		median = 0;
	if(sd === undefined)
		sd = 1;
	n = 12;

	var x = -n/2;
	for(var i = 0; i < n; i++){
		x+= Math.random();
	}
	//At this point, x is normally distributed between -n/2 and n/2 with sd=sqrt(n/12)
	//Clip edges
	if(clip_radius != undefined && clip_radius < sd*n/2){
		if(sd*x > clip_radius)
			x = clip_radius / sd;
		if(sd*x < -clip_radius)
			x = -clip_radius / sd;
	}
	
	return sd * x + median;
}