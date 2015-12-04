var HEX_MAP = ['2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z'];
var LENGTH_FIX = 13 ;

function hexAddOne(input){
	var input;
	var goOn = true ;
	var index = LENGTH_FIX-1;
	var output = [];
	for (index;index>=0;index--){
		if (goOn){
			// get index of HEX_MAP
			var mapIndex = -1 ;
			for (var i = 0 ;i<HEX_MAP.length;i++){
				console.log(input[index]+":"+HEX_MAP[i]);
				if (input[index]==HEX_MAP[i]){
					console.log(input[index]+":"+HEX_MAP[i]);
					mapIndex = i;
					if (input[index]!=HEX_MAP[HEX_MAP.length-1]){
						output[index]=HEX_MAP[i+1];
						console.log("true:"+input[index]+":"+i+":"+HEX_MAP[i+1]);
						goOn = false;
					}else{
						output[index]=HEX_MAP[0];
						console.log("else:"+input[index]);
					}
					break;
				}
			}
			if (mapIndex==-1){
				output = [];
				console.log("illegal input");
				break;
			}
		}else{
			output[index]=input[index];
		}
		console.log(output);
	}
	if (index<-1){
		console.log("overload");
		input = [];
	}
	var strOutput = new String() ;
	for (var i = 0 ; i<output.length;i++){
		strOutput.concat(output[i]);
	}
	return strOutput;
}