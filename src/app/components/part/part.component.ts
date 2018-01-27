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
    if(this.part.hidden) return null;
    return this.part.parts? Object.keys(this.part.parts) : null;
  }

  get style(){
    return this.sanitizer.bypassSecurityTrustStyle(
            'fill:'+(this.part.fill || 'black')+';stroke:'+(this.part.stroke||'black')+';stroke-width:3'
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
    return true;
  }

}
