import { Component, OnInit, Input } from '@angular/core';
import 'rxjs/add/operator/map';

@Component({
  selector: '[app-part-data]',
  templateUrl: './part-data.component.html',
  styleUrls: ['./part-data.component.css']
})
export class PartDataComponent implements OnInit {

  partName;
  oldPartName;

  @Input() part;
  @Input() parentPart;
  @Input() set name(name){
    if(!this.oldPartName) this.oldPartName = name;
    else{
      this.parentPart[name] = this.parentPart[this.oldPartName];
      delete this.parentPart[this.oldPartName];
      this.oldPartName = name;
    }
  };

  get name(){
    return this.oldPartName;
  }

  set posX(x){
    if(!this.part.position) this.part.position = [0,0];
    this.part.position[0] = Number(x);
  }
  
  get posX(){
    if(!this.part.position) this.part.position = [0,0];
    return this.part.position[0];
  }
  
  set posY(y){
    if(!this.part.position) this.part.position = [0,0];
    this.part.position[1] = Number(y);
  }
  
  get posY(){
    if(!this.part.position) this.part.position = [0,0];
    return this.part.position[1];
  }

  set shape(shape){
    this.part.shape = shape.split(',').map(Number);
  }

  get shape(){
    return this.part.shape.join(',');
  }

  get subparts(){
    return this.part.parts? Object.keys(this.part.parts) : null;
  }

  get angle(){
    return this.part.angle;
  }
  set angle(pt){
    this.part.angle = Number(pt);
  }

  get angleCenter(){
    return this.part.angleCenter? this.part.angleCenter.join(',') :null
  }
  set angleCenter(pt){
    this.part.angleCenter = pt.split(',').map(Number);
  }
  
  get zindex(){
    return Number(this.part.zindex||0);
  }
  set zindex(zindex){
    this.part.zindex = Number(zindex);
  }
  
  copyPart(){
    this.parentPart[this.name+'Copy'] = JSON.parse(JSON.stringify(this.part));
  }

  deletePart(){
    delete this.parentPart[this.name];
  }

  constructor() {}

  ngOnInit() {
  }

}
