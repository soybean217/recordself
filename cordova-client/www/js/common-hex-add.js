var HEX_MAP = ['2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z'];
var LENGTH_FIX = 13 ;

function hexAddOne(input){
	var input;
	var goOn = true ;
	var index = LENGTH_FIX-1;
	while (goOn&&index>=0){
		// get index of HEX_MAP
		var mapIndex = -1 ;
		for (var i = 0 ;i<HEX_MAP.length;i++){
			if (input[index]==HEX_MAP[i]){
				mapIndex = i;
				if (input[index]!=HEX_MAP[HEX_MAP.length-1]){
					input[index]=
				}else{
					
				}
			}
		}
		if (mapIndex==-1){
			console.log("illegal input");
			break;
		}
		index--;
	}
	if (i==0){
		console.log("overload");
		input = "0";
	}
	return input;
}