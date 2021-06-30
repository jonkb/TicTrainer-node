//module.exports.norm = norm;

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

//returns a sorted copy of the given 2d array. Sorted by the goven column
//data in sortColumn should be numerical
//This is a copy of the function of auxiliary. Why?
function sort2d(inArray, sortColumn){
	var aCopy = inArray.slice();
	var res_table = [];
	while(aCopy.length > 0){
		var biggest = [0,0];//index,sortVal
		for(var i = 0; i < aCopy.length; i++){
			var valHere = parseInt(aCopy[i][sortColumn]);
			if(valHere === NaN)
				return "ice";
			if(valHere > biggest[1]){
				biggest = [i, valHere];
			}
		}
		res_table.push(aCopy[biggest[0]]);
		aCopy.splice(biggest[0], 1);//cut out the biggest
	}
	return res_table;
}