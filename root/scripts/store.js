inventory = {"b":10,
	"s":50,
	"g":100};
	
module.exports = {"inv": inventory};

//Fills a div with the given medals. heap is of format: "gsgsbgbbbss"
//Also, the document needs a div with id "heap"
function genHeap(heap){
	var heap2 = {};
	var heap3 = "";
	for(var i = 0; i< heap.length; i++){
		if(heap2[heap[i]] != null)
			heap2[heap[i]]++;
		else
			heap2[heap[i]] = 1;
	}
	for(var i = 0; i< heap2.g; i++){
		heap3 += "<div class='sticker'><img src='/media/gold.svg' alt='Gold' height='150px'></div>";
	}
	for(var i = 0; i< heap2.s; i++){
		heap3 += "<div class='sticker'><img src='/media/silver.svg' alt='Silver' height='150px'></div>";
	}
	for(var i = 0; i< heap2.b; i++){
		heap3 += "<div class='sticker'><img src='/media/bronze.svg' alt='Bronze' height='150px'></div>";
	}
	document.getElementById("heap").innerHTML = heap3;
}