import { Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: '[app-part]',
  templateUrl: './part.component.html',
  styleUrls: ['./part.component.css']
})
export class PartComponent {

  constructor(private sanitizer: DomSanitizer) { }

  @Input() part;

  get posX(){
    return this.part.position? this.part.position[0] : 0;
  }
  
  get posY(){
    return this.part.position? this.part.position[1] : 0;
  }

  get subparts(){
    if(this.part.hidden || !this.part.parts) return null;

    var parts = this.part.parts;
    var keys  = Object.keys(parts);
    
    keys = keys.sort(function(a,b) {
      return  ( (parts[a].zindex || 0) > (parts[b].zindex || 0) )? 1 : 
              ( (parts[b].zindex || 0) > (parts[a].zindex || 0) )? -1 :
              0;
    });
    
    return keys;
  }

  get style(){
    var fill = this.part.fill;

    if(fill && fill.indexOf('linear-gradient') !== -1) fill = "url(#linear)";

    return this.sanitizer.bypassSecurityTrustStyle(
            'fill:'+(fill || 'black')+';stroke:'+(this.part.stroke||'black')+';stroke-width:3'
          );
  }

  get transform(){
    var transform = "";
    
    if(this.part.position)  transform += 'translate('+this.part.position[0]+','+this.part.position[1]+') ';
    
    if(this.part.angle && this.part.angleCenter){
      var rotate = 'rotate('+this.part.angle+') ';
      if(this.part.angleCenter){
        transform +=  'translate('+this.part.angleCenter[0]+','+this.part.angleCenter[1]+') '+
                      rotate+
                      'translate(-'+this.part.angleCenter[0]+',-'+this.part.angleCenter[1]+') ';
      }else{
        transform += rotate;
      }
    }
    return transform;
  }
  
  get gradient(){
    return this.part.fill && this.part.fill.indexOf('linear-gradient') !== -1;
  }

  get offsetColors(){
    var tmp = this.part.fill.match('linear-gradient\\(([^\\)]*)\\)');

    if(!tmp) return null;

    var colors = tmp[1].split(',');

    for(let i in colors) colors[i] = colors[i].trim().split(/[\s]+/);

    return colors;
  }

}