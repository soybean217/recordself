var HEX_MAP = ['2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z'];
var LENGTH_FIX = 13 ;

function hexAddOne(input){
	var input;
	var goOn = true ;
	var index = LENGTH_FIX-1;
	var output = [];
	var strOutput = new String() ;
	if (input.length==LENGTH_FIX){
		for (index;index>=0;index--){
			if (goOn){
				// get index of HEX_MAP
				var mapIndex = -1 ;
				for (var i = 0 ;i<HEX_MAP.length;i++){
					if (input[index]==HEX_MAP[i]){
						mapIndex = i;
						if (input[index]!=HEX_MAP[HEX_MAP.length-1]){
							output[index]=HEX_MAP[i+1];
							goOn = false;
						}else{
							output[index]=HEX_MAP[0];
						}
						break;
					}
				}
				//overload
				if (goOn&&index==0&&output[index]==HEX_MAP[0]){
					console.log("error input : "+input+" overload");
					output = [];
				}
				if (mapIndex==-1){
					output = [];
					console.log("error illegal input:"+input+" . not in map");
					break;
				}
			}else{
				output[index]=input[index];
			}
		}
		for (var i in output){
			strOutput += output[i];
		}
	}else{
		output = [];
		console.log("error illegal input:"+input+" , length must equals :"+LENGTH_FIX);
	}
	return strOutput;
}
function testHexAddOne(){
	var  input = "746VHXEAVQY43";
	console.log(input+";"+hexAddOne(input));
	var  input = "ZZ";
	console.log(input+";"+hexAddOne(input));
	var  input = "3ZZZZZZZZZZZZ";
	console.log(input+";"+hexAddOne(input));
	var  input = "ZZZZZZZZZZZZZ";
	console.log(input+";"+hexAddOne(input));
	var  input = "ZZZZZZZ0ZZZZZ";
	console.log(input+";"+hexAddOne(input));
	var  input = "ZZZZZZZZZZZZZ2";
	console.log(input+";"+hexAddOne(input));
} 