const inventory = {"b":5,
	"s":30,
	"g":100};

//This script is used by the server and by the client, so it needs this.
//That's kind of ugly... Maybe move inventory to db
if(typeof module != "undefined")
	module.exports = {"inv": inventory};

/**Fills a div with the given medals. 
	heap is a string made of the 1-letter codes for the medals (eg. "gsgsbgbbbss")
	Also, the document needs a div with id "heap"
*/
function genHeap(heap){
	var heap_obj = {};
	var heap_html = "";
	for(var i = 0; i < heap.length; i++){
		if(heap_obj[heap[i]] != null)
			heap_obj[heap[i]]++;
		else
			heap_obj[heap[i]] = 1;
	}
	for(var i = 0; i < heap_obj.g; i++){
		heap_html += "<div class='sticker'><img src='/media/gold.svg' alt='Gold' height='150px'></div>";
	}
	for(var i = 0; i < heap_obj.s; i++){
		heap_html += "<div class='sticker'><img src='/media/silver.svg' alt='Silver' height='150px'></div>";
	}
	for(var i = 0; i < heap_obj.b; i++){
		heap_html += "<div class='sticker'><img src='/media/bronze.svg' alt='Bronze' height='150px'></div>";
	}
	document.getElementById("heap").innerHTML = heap_html;
}