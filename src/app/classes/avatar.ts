import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';

export class Avatar {

    animationCache  = {}; // Don't animate the same thing twice
    talking         = false;
    framelength     = 200;

    constructor(public http:Http,public design,public animationMapping,public animations){}

    animate(text){
    
		if(!this.animationMapping) return;
		
        var utterances 	= Object.keys(this.animationMapping);
		
        for(let i=0;i<utterances.length;i++){      
			if(text.match("(^|\\s)("+utterances[i]+")($|\\s)")){
				
				let animationName = this.animationMapping[utterances[i]];
				
				// Don't animate twice until cache is cleared
				// except for idle & talking
				if(!animationName.match("idle|talking")){
					if(this.animationCache[animationName]) continue;
					else	this.animationCache[animationName] = true;
				}
				
				// Lazy load animation data
				if(!this.animations[animationName]){
					
					// Object variant (describes animation, generated via GUI => restricted but easy/fast to implement)
                    this.http.get("http://raynesworld.com/testing/DerpEngine/Animations/"+animationName+'.json').
                    map( response => response.json() ).
                    subscribe(
                        data => {
						    this.animations[animationName] = data;
						    this.executeAnimation(data);
                        },
                        error => {
                            // Function variant (script with function allows free manipulation of avatars at the cost of complexity)
                            this.http.get("http://raynesworld.com/testing/DerpEngine/Animations/"+animationName+'.js').
                            subscribe(
                                data => {
							        this.animations[animationName](this);
                                }
                            );
                        }
					);
				
				// Just execute if already loaded
				}else if(typeof this.animations[animationName] == 'function'){
					this.animations[animationName](this);
				
				// Just execute if already loaded
				}else if(typeof this.animations[animationName] == 'object'){
					this.executeAnimation(this.animations[animationName]);
				}
			}
        }
    }

    idle(){
		this.animate("idletime");
		
		if(this.talking) this.animate("idletalk");

        var that = this;

		setTimeout(function(){ that.idle(); },1600);
	}
		
	executeAnimation(data){
		
		var partPath 	= data.part.split('.');
		var part			= this.design;
		
		// Find the animated part
		for(let i=0; i<partPath.length; i++){
			part = part[partPath[i]];
		}
		
		// Rotate that part if stated, smoothed with 10 interpolations
		if(data.anglesAt){
			
			if(!part.angle) part.angle = 0;
			
			var angleTimes = Object.keys(data.anglesAt);
			
			if(data.angleCenter) part.angleCenter = data.angleCenter;
						
			for(let i=0; i<angleTimes.length; i++){
				let smoothInterpolations = Math.round( (Number(angleTimes[i])-Number(angleTimes[i-1] || 0))/this.framelength );
				let smoothingAngles			 = (Number(data.anglesAt[angleTimes[i]])-Number(data.anglesAt[angleTimes[i-1]] || 0)) /smoothInterpolations; //10;
				
				for(let j=0; j<smoothInterpolations; j++){
					setTimeout(function(){
						part.angle += smoothingAngles;
					},Number(angleTimes[i-1]||0)+ this.framelength*j);
				}
			}
		}
		
		// Move along a path, interpolated at 10 subcoords per step
		if(data.path){
			var durationFrags  					= Number(data.duration)/(data.path.length/2);
			var smoothingInterpolations = Math.round( durationFrags/this.framelength );
			
			for(let i=2; i<data.path.length; i+=2){
				
				// With smoothing
				if(smoothingInterpolations > 0){
					let smoothingX = (data.path[i]-data.path[i-2])		/smoothingInterpolations;
					let smoothingY = (data.path[i+1]-data.path[i-1])	/smoothingInterpolations;

					if(smoothingX === 0 && smoothingY === 0){
						continue;
					}
				
					for(let j=0; j<smoothingInterpolations; j++){
						setTimeout(function(){
							part.position[0] += smoothingX;
							part.position[1] += smoothingY;
						},durationFrags*((i-2)/2)+this.framelength*j);
					}
				// No smoothing
				}else{
					setTimeout(function(){
						part.position = [data.path[i],data.path[i+1]];
					},durationFrags*(i/2));
				}
			}
		}
		
		
// 			"path": [0, 0, 10, 10, 40, 10, 60, 6, 100, -2],
// 			"pathAt": {
// 				"200": [40, 10],
// 				"800": [60, 6]
// 			},
// 			"anglesAt": {
// 				"0": 90,
// 				"200": 180,
// 				"500": 270,
// 				"1000": 360
// 			},
// 			"deltasAt": {
// 				"500": {
// 					"shape": [0, 0, 10, 10, 20, 0, 10, -10, 0, 0],
// 					"color": "red"
// 				},
// 				"900": {
// 					"hidden": true
// 				}
// 			},
// 			"duration": 1000,
// 			"loop": false,
// 			"followupsAt": {
// 				"200": ["animation1"],
// 				"1000": ["animation2", "animation3"],
// 				"1500": ["animation4", "animation5"]
// 			}
// 		}
	// }
	
// 	this.idle();
}


}
