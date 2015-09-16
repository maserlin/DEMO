/**
 * A fairly basic button implementation with 4 states:
 * up (normal)
 * down (pressed)
 * on (highlit)
 * off (greyed out)
 * Basically it's a MovieClip and is expecting a spritesheet with 4 images
 * labelled _up, _down, _on, _off
 *
 * @param imageName
 * @param posX
 * @param posY
 * @param name
 * @constructor
 */
function Button(imageName,posX,posY,name){
    this.name = name || "btn"+imageName;


    var buttonTextures = [];
    for(var i in PIXI.utils.TextureCache){
        //console.log(i);
        if(String(i).indexOf(imageName+"_") != -1){
            if(String(i).indexOf("on") != -1){
                buttonTextures[3] = PIXI.Texture.fromFrame(i);
            }
            if(String(i).indexOf("off") != -1){
                buttonTextures[2] = PIXI.Texture.fromFrame(i);
            }
            if(String(i).indexOf("up") != -1){
                buttonTextures[0] = PIXI.Texture.fromFrame(i);
            }
            if(String(i).indexOf("down") != -1){
                buttonTextures[1] = PIXI.Texture.fromFrame(i);
            }
            console.log(i)
        }
    }

    PIXI.extras.MovieClip.call(this, buttonTextures);
    this.position.x = posX || 100;
    this.position.y = posY || 100;
    this.anchor.x = this.anchor.y = 0.5;
    this.loop = false;
    this.gotoAndStop(0);
    this.interactive = true;

    var that = this;
    this.mousedown = this.touchstart = function(data){
        console.log("Down");
        that.onDown(data);
    }
    this.mouseup = this.mouseout = this.touchend = function(data){
        console.log("Up");
        that.onUp(data);
    }
    this.click = this.tap = function(data){
        that.onClick(data);
    }
}
Button.prototype = Object.create(PIXI.extras.MovieClip.prototype);
Button.constructor = Button;
Button.prototype.active = true;

Button.prototype.onDown = function(data){
    this.gotoAndStop(1);
}
Button.prototype.onUp = function(data){
    if(this.active)this.gotoAndStop(0);
}
Button.prototype.onClick = function(data){
    console.log("Click");
}

Button.prototype.setEnable = function(enable){
    if(enable){
        this.active = true;
        this.gotoAndStop(0);
    }
    else{
        this.active = false;
        this.gotoAndStop(2);
    }
}

Button.prototype.setVisible = function(vis){
    this.visible = vis;
}
