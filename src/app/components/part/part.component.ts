import { Component, Input, HostBinding } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: '[app-part]',
  templateUrl: './part.component.html',
  styleUrls: ['./part.component.css']
})
export class PartComponent {

  constructor(private sanitizer: DomSanitizer) { }

  @Input() part;
  @Input() name;

  get posX(){
    return this.part.position? this.part.position[0] : 0;
  }
  
  get posY(){
    return this.part.position? this.part.position[1] : 0;
  }

  oldShapeStr;
  get shape(){
    var shape = this.part.shape;

    if(!shape) return null;
    
    var shapeStr = shape.slice(0,shape.length-(shape.length%2)).join(',');

    if(shapeStr != this.oldShapeStr) this.oldShapeStr = shapeStr;
    
    return this.oldShapeStr;
  }

  keys = [];
  get subparts(){
    if(this.part.hidden || !this.part.parts) return null;

    var parts = this.part.parts;
    var keys  = Object.keys(parts);
    
    keys = keys.sort(function(a,b) {
      return  ( (parts[a].zindex || 0) > (parts[b].zindex || 0) )? 1 : 
              ( (parts[b].zindex || 0) > (parts[a].zindex || 0) )? -1 :
              0;
    });

    for(let key in keys) this.keys[key] = keys[key];

    return this.keys;
  }

  oldStyle;
  oldStyleSanitized;
  get style(){
    var fill = this.part.fill;

    if(fill && fill.indexOf('linear-gradient') !== -1) fill = "url(#linear"+this.name+")";


    var style = 'fill:'+(fill || 'black')+';stroke:'+(this.part.stroke||'black')+';stroke-width:3;';
    var styleSanitized = this.sanitizer.bypassSecurityTrustStyle(style);
    
    if(style != this.oldStyle){
      this.oldStyle = style;
      this.oldStyleSanitized = styleSanitized;
    }

    return this.oldStyleSanitized;
  }

  oldTransform;
  get transform(){
    var transform = "";
    
    if(this.part.position)  transform += 'translate('+this.part.position[0]+','+this.part.position[1]+') ';
    
    if(this.part.angleZ && this.part.angleCenter){
      var rotate  = 'rotate('+this.part.angleZ+') ';
      if(this.part.angleCenter){
        transform +=  'translate('+this.part.angleCenter[0]+','+this.part.angleCenter[1]+') '+
                      rotate+
                      'translate(-'+this.part.angleCenter[0]+',-'+this.part.angleCenter[1]+') ';
      }else{
        transform += rotate;
      }
    }

    if(transform != this.oldTransform) this.oldTransform = transform;

    return transform;
  }

  // 3-Dimensional rotation handled via CSS as SVG can't do that
  oldRotateXY;
  oldRotateXYSanitized;
  get rotateXY(){

    var transformStr = 'transform: '+
                        (this.part.angleX? 'rotateX('+this.part.angleX+'deg) ':'')+
                        (this.part.angleY? 'rotateY('+this.part.angleY+'deg) ':'');
    
    if(this.oldRotateXY != transformStr){
      this.oldRotateXY          = transformStr;
      this.oldRotateXYSanitized = this.sanitizer.bypassSecurityTrustStyle(transformStr);
    }
    
    return this.oldRotateXYSanitized;
  }
  
  get gradient(){
    return this.part.fill && this.part.fill.indexOf('linear-gradient') !== -1;
  }

  _offsetColors = [];
  _oldFill;
  get offsetColors(){

    // color value change causes a repaint, even if the new value is the same,
    // so just change colors if fill was adjusted!
    if(this._oldFill == this.part.fill) return this._offsetColors; 

    var tmp = this.part.fill.match('linear-gradient\\(([^\\)]*)\\)');

    if(!tmp) return null;

    var colors = tmp[1].split(',');

    for(let i in colors) this._offsetColors[i] = colors[i].trim().split(/[\s]+/);
    
    this._oldFill = this.part.fill;
    
    return this._offsetColors;
  }
}