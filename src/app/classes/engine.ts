import { Http, Response } from '@angular/http';
import { Avatar } from './Avatar';
import 'rxjs/add/operator/map';
import * as $ from 'jquery';

export class Engine {
 	
    bgFramelength       = 100;
    framelength  	    = 100;
    avatars      	    = [];
    background		    = {};
    animationMapping    = {};
    animations          = [];
                  
    constructor(public http:Http){

        console.log('starting engine...');
        console.log('generating avatars');

        // Load animation mapping
        http.get('http://raynesworld.com/testing/DerpEngine/mapping.json').map(
            response => response.json()
        ).subscribe(
            data => {
                this.animationMapping = data;

                // Load avatar(s)
                http.get('http://raynesworld.com/testing/DerpEngine/Avatars/Rayne.json').map(
                    response => response.json()
                ).subscribe(
                    data => this.avatars.push(new Avatar(this.http,data,this.animationMapping,this.animations))
                );
            }
        );
        
        // this.drawBackground();
        // this.drawAvatars();
        this.startSpeechRecognition();    
    }  
  	
//   // Add avatar to collection
//   this.addAvatar = function(avatarDesign){
// 		var avatar = new Avatar(avatarDesign,this.background);
//     this.avatars.push(avatar);
// 		return avatar;
//   };
	
// 	// Draw background
// 	this.drawBackground = function(){
		
// 		if(!this.background.name){
// 			this.background.name = "pending...";
// 			$.getJSON("Backgrounds/Default.json",function(design){
// 				var keys = Object.keys(design);
				
// 				for(let i=0; i<keys.length; i++){
// 					that.background[keys[i]] = design[keys[i]];
// 				}
// 			})
// 		}
		
// 		$('#backgroundCanvas').css('background',this.background.background);
		
// 		if(this.background.parts){	
// 			var partNames = Object.keys(this.background.parts);
			
// 			for(var i=0; i<partNames.length; i++){
// 				this.drawPart(this.background.parts[partNames[i]],null,"backgroundCanvas");
// 			}
// 		}
		
//     // Repeat drawing
//     setTimeout(function(){ that.drawBackground() },this.bgFramelength);
// 	}
	
    // Draw all avatars
    drawAvatars(avatars?){
        
        this.clearCanvas();
        
        avatars = avatars || this.avatars;
        
        for(var i=0; i<avatars.length; i++){
            this.drawAvatar(avatars[i]);	
        }
        
        var that = this;

        if(this.framelength){
            // Repeat drawing
            setTimeout(function(){ that.drawAvatars(avatars) },this.framelength);
        }
    }

    // Draw an individual avatar
    drawAvatar(avatar){
        
        var design 		= avatar.design;
            
        if(!design || !design.limbs) return;
            
        var position	= design.position;
        var limbs		= this.sortByZindex(design.limbs);
        
            // Draw limbs
        for(var i=0; i<limbs.length; i++){
            this.drawPart(limbs[i],position);
        }
    }
        
    // Draw a limb or part thereof
    drawPart(part,refPosition?,canvasId?){
        
        if(part.hidden)  return;
        if(!refPosition) refPosition = [0,0];

        var canvas:any	= $('#'+(canvasId||"avatarCanvas"))[0];
        var ctx 	 	= canvas.getContext("2d");
        var position	= part.position || [0,0];
        var coords 		= part.shape;
        var angle	 	= part.angle || 0;
        var angleCenter = part.angleCenter || position;
        var scale	 	= part.scale || 1;

        ctx.save();

        if(part.color){
            ctx.strokeStyle = part.color;
            ctx.fillStyle 	= part.color;
        }
            
            // Move to ref position
        ctx.translate(
            (refPosition[0] + position[0]) * scale,
            (refPosition[1] + position[1]) * scale
        );
        
        // Rotate around angle center relative to ref pos
        if(angle){
            ctx.translate(
                angleCenter[0] * scale,
                angleCenter[1] * scale
            );

            ctx.rotate(angle * Math.PI/180);

            ctx.translate(
                -angleCenter[0] * scale,
                -angleCenter[1] * scale
            );
        }
            
        if(part.shape){
            
            ctx.beginPath();

            for(var i=0; i<coords.length; i+=2){
                ctx.lineTo(
                    coords[i]		* scale,
                    coords[i+1]	* scale
                );
            }

            if(part.color && !part.nofill) ctx.fill();

            ctx.stroke();
            ctx.closePath();
        }
            
        // Draw parts of those limbs
        if(part.parts){
            var parts = this.sortByZindex(part.parts);

            for(var j=0; j<parts.length; j++){
                this.drawPart(parts[j]);
            }
        }
            
        ctx.restore();
    }

    clearCanvas(){
        var canvas:any  = $("#avatarCanvas")[0];
        var ctx         = canvas.getContext("2d");
        ctx.clearRect(0,0,10000,10000);
    }
        
	startSpeechRecognition(){
        
        var w = (<any>window);

        var recognition = new ( w.SpeechRecognition || w.webkitSpeechRecognition || 
                                w.mozSpeechRecognition || w.msSpeechRecognition)();

		recognition.lang 			= 'en-US';
		recognition.continuous 		= false;
		recognition.interimResults 	= true;
		recognition.maxAlternatives = 5;
		recognition.start();
		
// 		recognition.onresult = function(event) {
						
// 			var result = event.results[0][0].transcript;
			
// 			for(var i=0; i<that.avatars.length; i++){
// 				that.avatars[i].talking = true;
// 				that.avatars[i].animate(result);
// // 				avatar.text = result;
// 			}
// 		};

// 		recognition.onend = function(event){
			
// 			for(var i=0; i<that.avatars.length; i++){
// 				that.avatars[i].talking = false;
// 				that.avatars[i].animationCache = {};
// 			}
			
// 			that.startSpeechRecognition();
// 		}
	}
	
	sortByZindex(parts){
		var partNames 	 = Object.keys(parts);
		var partsByIndex = [];
		
		for(let i=0; i<partNames.length; i++){
			var part	= parts[partNames[i]];
			var index = part.zindex || 0;
			
			if(!partsByIndex[index]) partsByIndex[index] = [];
			
			partsByIndex[index].push(part);
		}
		
		var sortedParts = [];
		
		for(let i=0; i<partsByIndex.length; i++){
			if(partsByIndex[i] === undefined) continue;
			
			for(let j=0; j<partsByIndex[i].length; j++){
				sortedParts.push(partsByIndex[i][j]);
			}
		}
		
		return sortedParts;
	}
}
