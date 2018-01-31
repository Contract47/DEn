import { Http, Response } from '@angular/http';
import { Component, OnInit, group, AfterViewInit } from '@angular/core';
import { Engine } from './classes/engine';
import { DomSanitizer } from '@angular/platform-browser';
import 'rxjs/add/operator/map';

import * as $ from 'jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  shownTab     = 'draw';
  newGroupName = "NewGroup";
  scaleFactor  = 1;

  _bgImg;
  set bgImg(img){
    this._bgImg = img;
    $('#bgImg').attr('src',img);
  }
  get bgImg(){
    return this._bgImg;
  }

  isDrawing          = false;
  isDrawingAnimation = false;
  animationsHidden   = false;

  get availableAnimationNames(){
    return Object.keys(this.availableAnimations);
  }

  availableAnimations = {};

  avatarDesign;
  avatarDesignCopy;
  animations = [];
  hoveredAnimation;
  selectedAnimationCoord;

  currentPart = {
    shape:[], 
    fill: "black", 
    stroke: "red", 
    position: [0,0],
    angle: null,
    angleCenter: null
  };

  get parts(){
    return Object.keys(this.avatarDesign.parts);
  }

  get transform(){
    return this.avatarDesign.position? 'translate('+this.avatarDesign.position[0]+','+this.avatarDesign.position[1]+')' : '';
  }

  constructor(private http:Http, private sanitizer:DomSanitizer){
    
     // Function variant (script with function allows free manipulation of avatars at the cost of complexity)
     this.http.get("http://raynesworld.com/testing/DerpEngine/Avatars/Rayne.json").
     map( response => response.json()).
     subscribe(
         data =>{
           this.avatarDesign = data;
           (<any>window).avatarDesign = this.avatarDesign;
           (<any>window).animations   = this.animations;
         }
     );

     this.availableAnimations["NewAnimation"] = this.animations;

     var animationNames = ["wave"];

     for(let i in animationNames){
      this.http.get("http://raynesworld.com/testing/DerpEngine/Animations/"+animationNames[i]+".json").
      map( response => response.json()).
      subscribe(
          data =>{
            for(let i in data) this.prepareAnimationProps(data[i]);
            this.availableAnimations[animationNames[i]] = data;
          }
      );
    }
  }

  ngOnInit(){
    // resize the canvas to fill browser window dynamically
    // window.addEventListener('resize', resizeCanvas, false);

    // function resizeCanvas() {
			
		// 	$('canvas').each(function(){
    //     this['width']  = window.innerWidth;
    //     this['height'] = window.innerHeight;
    //   })
    // }
    // resizeCanvas();
  }
  
  ngAfterViewInit(){
    this.trackFace();
  }

  goToTab(tabName){
    // switch(tabName){
    //   case 'animate':  break;
    // }

    if(this.shownTab == 'draw' && tabName !== this.shownTab){
      this.avatarDesignCopy = JSON.stringify(this.avatarDesign);
    }else if(tabName == 'draw'){
      this.avatarDesign = JSON.parse(this.avatarDesignCopy);
    }

    this.shownTab=tabName;
  }

  startDrawing($event){
    this.isDrawing   = true;

    var parts = this.getSelectedParts(this.avatarDesign.parts);

    if(parts.length == 0){
      this.currentPart = {
        shape:[], 
        fill: "none", 
        stroke: "black", 
        position: [0,0],
        angle: null,
        angleCenter: null
      };

      var limbcnt = Object.keys(this.avatarDesign.parts).length;
      this.avatarDesign.parts["Part"+limbcnt] = this.currentPart;
    }else{
      for(let i in parts){
        parts[i].part.position   = [0,0]; 
        parts[i].part.shape = [];
      }
    }
  }

  draw($event){
    if(!this.isDrawing || (this.animationsHidden && this.shownTab == "animate") ) return;

    var parts = this.getSelectedParts(this.avatarDesign.parts);

    if(parts.length == 0) parts = [this.currentPart];

    for(let i in parts){

      let part = (parts[i].part || parts[i]);

      if($event.targetTouches){
        part.shape.push($event.targetTouches[0].pageX - this.avatarDesign.position[0]);
        part.shape.push($event.targetTouches[0].pageY - this.avatarDesign.position[1]);      
      }else{
        part.shape.push($event.offsetX - this.avatarDesign.position[0]);
        part.shape.push($event.offsetY - this.avatarDesign.position[1]);
      }
    }
  }

  stopDrawing($event){
    this.isDrawing   = false;    
    this.currentPart = null;
  }

  startDrawingAnimation($event){
    if($event.button !== 0) return; // Left-click only

    if(this.animations.length === 0) return;
    this.isDrawingAnimation   = true;
    this.animations.slice(-1)[0].path = [];
  }

  drawAnimation($event){
    if(!this.isDrawingAnimation || this.animations.length === 0) return;

    var currentAnimation = this.animations.slice(-1)[0];

    if($event.targetTouches){
      currentAnimation.path.push($event.targetTouches[0].pageX);
      currentAnimation.path.push($event.targetTouches[0].pageY);      
    }else{
      currentAnimation.path.push($event.offsetX);
      currentAnimation.path.push($event.offsetY);
    }
  }

  stopDrawingAnimation($event){
    this.isDrawingAnimation = false;
  }

  setHovered(animation){
    this.hoveredAnimation = animation;
  }

  selectCoord(animation,x,y,$event){
    this.selectedAnimationCoord = [x,y];
  }

  group(){
    var selected  = this.getSelectedParts(this.avatarDesign.parts);

    if(!selected) return;
    
    var groupObj;

    if(!this.newGroupName){
      groupObj = this.avatarDesign;
    }else{
      groupObj  = this.findGroup(this.newGroupName,this.avatarDesign.parts);
    }
    
    if(!groupObj){
      groupObj = { parts:{} };
      this.avatarDesign.parts[this.newGroupName] = groupObj;
    }

    for(let i in selected){
      if(!groupObj.parts) groupObj.parts ={};

      if(groupObj.parts == selected[i].parent) continue;

      groupObj.parts[selected[i].name] = selected[i].part;
      delete selected[i].parent[selected[i].name];
    }

    console.log(this.avatarDesign.parts);
  }

  findGroup(name,root){
    
    if(!root) return;

    for(let i in root){
      if(i == name) return root[i];

      var groupObj = this.findGroup(name, root[i].parts);

      if(groupObj) return groupObj;
    }
  }

  merge(){
    var selected  = this.getSelectedParts(this.avatarDesign.parts);
    
    if(!selected) return;
    
    var merged = [];
    var name   = selected[0].name;

    for(let i in selected){
      var shape = selected[i].part.shape;
      if(shape) merged = merged.concat(shape);
      delete selected[i].parent[selected[i].name];
    }
    
    selected[0].part.shape = merged;
    this.avatarDesign.parts[name] = selected[0].part;
  }

  offset(){
    var selected  = this.getSelectedParts(this.avatarDesign.parts);
    
    if(!selected) return;

    for(let i in selected){
      var shape = selected[i].part.shape;
      if(!shape) continue;
      
      let offset = (<any>$('#offset').val()).split(',').map(Number);

      for(let j=0; j<shape.length; j+=2){
        shape[j]   += offset[0];
        shape[j+1] += offset[1];
      }
    }
  }

  getSelectedParts(root){
    var selected = [];

    if(root){
      for(let i in root){
        if(root[i]._selected){

          var data = {
            parent: root,
            name:   i,
            part:   root[i]
          }

          selected.push(data);
        }
        
        selected = selected.concat(this.getSelectedParts(root[i].parts));
      }
    }

    return selected;
  }

  scale(root,noselected?){

    if(!noselected){
      var selected = this.getSelectedParts(this.avatarDesign.parts);

      if(selected){
        for(let i in selected){
          this.scaleSingle(selected[i].part);
          if(selected[i].part.parts) this.scale(selected[i].part.parts,true);
        }
        return;
      }
    }

    if(!root){      
      this.avatarDesign.position[0] *= this.scaleFactor;
      this.avatarDesign.position[1] *= this.scaleFactor;
      root = this.avatarDesign.parts;
    }

    for(let i in root){      
      this.scaleSingle(root[i]);      

      if(root[i].parts) this.scale(root[i].parts,noselected);
    }
  }

  scaleSingle(part){

    if(!part) return;

    if(part.position){
      part.position[0] *= this.scaleFactor;
      part.position[1] *= this.scaleFactor;
    }

    if(part.shape){
      for(let j in part.shape){
        part.shape[j] = part.shape[j]*Number(this.scaleFactor);
      }
    }
  }

  mirror(root,noselected?){

    if(!noselected){
      var selected  = this.getSelectedParts(this.avatarDesign.parts);
      
      if(selected){
        for(let i in selected){
          var shape   = selected[i].part.shape;
          
          if(shape){           
            var offset  = shape[0];
            for(let j=0; j<shape.length; j+=2) shape[j] = -shape[j] +2*offset;
          }

          if(selected[i].part.parts) this.mirror(selected[i].part.parts,true);
        }
        return;
      }
    }

    if(!root) root = this.avatarDesign.parts;

    for(let i in root){
      var shape = root[i].shape;
      if(shape){              
        for(let j=0; j<shape.length; j+=2) shape[j] = -shape[j];
      }

      if(root[i].parts) this.mirror(root[i].parts,noselected);
    }
  }

  reduce(root,noselected?){

    var selected  = this.getSelectedParts(this.avatarDesign.parts);
    
    if(!selected) return;

    for(let i in selected){
      var shape = selected[i].part.shape;

      if(shape){           
        var length = shape.length/4;
        for(let j=0; j<length; j+=2){
          shape.splice(j,2);
        }
      }
    }
  }

  getPartAndOffset(name,offset?,root?){

    if(!root)   root    = this.avatarDesign;
    if(!offset) offset  = [0,0];

    if(root.position){
      offset[0] += root.position[0];
      offset[1] += root.position[1];
    }

    for(let i in root.parts){
      if(i == name){

        // if(root.parts[i].position){
        //   offset[0] += root.parts[i].position[0];
        //   offset[1] += root.parts[i].position[1];
        // }

        return { part:root.parts[i], offset:offset };
      }

      if(root.parts[i].parts){
        var partAndOffset = this.getPartAndOffset(name,offset,root.parts[i]);
        if(partAndOffset) return partAndOffset;
      }
    }
  }

  get animationStyle(){
    return this.sanitizer.bypassSecurityTrustStyle(
            'fill:none;stroke:blue;stroke-width:3'
          );
  }

  animationDotStyle(x,y){
    var selCoord = this.selectedAnimationCoord;

    if(selCoord && selCoord[0] == x && selCoord[1] == y){
      return this.sanitizer.bypassSecurityTrustStyle(
              'fill:red;stroke:blue;stroke-width:3'
            );
    }else{
      return this.sanitizer.bypassSecurityTrustStyle(
              'fill:blue;stroke:blue;stroke-width:3'
            );      
    }
  }

  addAnimation(animation){
    animation = animation || {
      part:         "none",
      path:         [],
      angleCenter:  null,
      angle:        null,
      duration:     1000,
      delay:        null
    };

    this.prepareAnimationProps(animation);

    this.animations.push(animation);
  }

  prepareAnimationProps(animation){
    var that  = this;
    var props = ['duration','delay','angle'];

    for(let i in props){
      Object.defineProperty(animation,'_'+props[i], {
        get: function() {
          return animation[props[i]]? Number(animation[props[i]]) : 0;
        },
        set: function(value) {
          animation[props[i]] = value? Number(value) : 0;
        }
      });
    }

    var props2 = ['path','angleCenter'];

    for(let i in props2){
      Object.defineProperty(animation, '_'+props2[i], {
        get: function() {
          if(!animation[props2[i]]) return null;
          else                      return animation[props2[i]].join(',');
        },
        set: function(value) {
          if(!value) animation[props2[i]] = [];
          else       animation[props2[i]] = value.split(',').map(Number);
        }
      });
    }
    
    Object.defineProperty(animation,'_ghost', {
      get: function() {
        if(!animation.__ghost){
          var copy  = JSON.parse(that.avatarDesignCopy);
          var po    = that.getPartAndOffset(animation.part,null,copy);

          console.log(po.offset);
          
          if(po){
            animation.__ghost             = po.part;
            // animation.__ghost.position[0] = po.offset[0];
            // animation.__ghost.position[1] = po.offset[1];
          }
        }

        return animation.__ghost;
      },
      set: function(value) {}
    });
  }

  copyAnimation(animation){
    this.addAnimation(JSON.parse(JSON.stringify(animation)));
  }

  deleteAnimation(animation){
    for(let i=0; i<this.animations.length; i++){
      if(this.animations[i] == animation){
        this.animations.splice(i,1);

        if(animation == this.hoveredAnimation) this.hoveredAnimation = null;
        return;
      }
    }
  }
  
  playSelected(){

    this.avatarDesign = JSON.parse(this.avatarDesignCopy);

    for(let i in this.animations){
      if(this.animations[i]._selected){
        this.play(this.animations[i],true);
      }
    }
  }
  
  playSet(setName){
    if(this.avatarDesignCopy) this.avatarDesign = JSON.parse(this.avatarDesignCopy);
    
    for(let i in this.availableAnimations[setName]){
      this.play(this.availableAnimations[setName][i],true);
    }
  }

  play(animation,noreset?){
    
    if(!noreset) this.avatarDesign = JSON.parse(this.avatarDesignCopy);

    var that = this;
    setTimeout(function(){ that.playDelayed(animation); },animation.delay || 0);
  }

  playDelayed(animation){
    var part, scopeOffset;

    if(!animation.part){
      scopeOffset = [0,0]; //this.avatarDesign.position;
      part        = this.avatarDesign;
    }else{
      var partAndOffset = this.getPartAndOffset(animation.part);

      if(!partAndOffset){
        alert('Part "'+animation.part+'" not found!');
        return;
      }

      scopeOffset = partAndOffset.offset;
      part        = partAndOffset.part;
    }
    
    if(!part.position) part.position = [0,0];

    var duration  = animation.duration;

    var tmp:any   = JSON.stringify(part);
    var framerate = duration/(animation.path.length/2);
    var offset    = [ animation.path[0]-scopeOffset[0]-part.position[0],
                      animation.path[1]-scopeOffset[1]-part.position[1] ];

    for(let i=0; i<animation.path.length; i+=2){

      setTimeout(function(){
        part.position[0] = animation.path[i]-scopeOffset[0]-offset[0];
        part.position[1] = animation.path[i+1]-scopeOffset[1]-offset[1];
      },framerate*i/2);
    }

    var center  = animation.angleCenter || [0,0];
    var angle   = animation.angle;
    
    if(angle === null) return;

    var frameSize = 10;
    var fragCount = duration/frameSize;

    var frAngles  = angle / fragCount;

    part.angleCenter = center;

    if(!part.angle) part.angle = 0;

    for(let i=0; i<fragCount; i++){
      setTimeout(function(){
        part.angle += frAngles;//*(i+1);
      },frameSize*i);
    }
  }

  // Face tracking
  trackFace(){
    var that = this;

    var headtrackr = (<any>window).headtrackr;
    var document   = (<any>window).document;
    
    var videoInput  = $('#camVideo')[0];
    var canvasInput = $('#camCanvas')[0];
    
    var htracker = new headtrackr.Tracker({calcAngles : true, ui : false, headPosition : false});
    htracker.init(videoInput, canvasInput);
    htracker.start();
    
    // document.addEventListener("headtrackrStatus", function(event) {
    //   if(that.avatarDesign){         
    //   // that.avatarDesign.parts.head.position = [event.x,event.y];
    //   }
    // }, true);
        
    var offset,standardAngle;
    document.addEventListener("facetrackingEvent", function( event ) {
      if(that.avatarDesign){   
        if(offset == null){
          offset = [
            event.x-that.avatarDesign.parts.head.position[0],
            event.y-that.avatarDesign.parts.head.position[1]
          ]; 
          standardAngle = event.angle;
        }

        that.avatarDesign.parts.head.position = [-(event.x-offset[0]),event.y-offset[1]];
        that.avatarDesign.parts.head.angleCenter = [40,40];
        that.avatarDesign.parts.head.angle = Math.round(90-event.angle * 180 / Math.PI-standardAngle);
      }
    });
  }
}
