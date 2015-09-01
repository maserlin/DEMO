/**
 * Base class for Animated Symbols:
 * Manages a sprite sheet and can show any given symbol either at rest
 * of the blurred version while spinning.
 * @param id : which symbol to show
 */
function SpinSymbol(id){
    this.blur = false;
    
    var iconTextures = [];

    for(var i=0; i<12; ++i)
    {
        var texture;
        if(i<10) texture = PIXI.Texture.fromFrame("Icon_0" + i + ".png");
        else texture = PIXI.Texture.fromFrame("Icon_" + i + ".png");
        iconTextures.push(texture);
    }
    this.blurOffset = i;

    for(var i=0; i<12; ++i)
    {
        var texture;
        if(i<10) texture = PIXI.Texture.fromFrame("Blur_Icon_0" + i + ".png");
        else texture = PIXI.Texture.fromFrame("Blur_Icon_" + i + ".png");
        iconTextures.push(texture);
    }

    PIXI.extras.MovieClip.call(this, iconTextures);

    this.id = id;
    this.isRoyal = this.id > 4 ? false : true;
    this.gotoAndStop(this.id);
    // console.log("Symbol set to " + this.id);
    this.revolve = this.revolve.bind(this);
}

SpinSymbol.prototype = Object.create(PIXI.extras.MovieClip.prototype);
SpinSymbol.prototype.constructor = SpinSymbol;
SpinSymbol.prototype.blur = false;
SpinSymbol.prototype.isRoyal = true;
SpinSymbol.prototype.bp = null;

/**
 * Override this to animate symbol or add some implementation here using filters etc
 * Add sprites etc to container then remove them in order to see them on screen.
 */
SpinSymbol.prototype.animate = function(container){
    // --
}

/**
 * Test method
 */
SpinSymbol.prototype.revolve = function(){
    this.rotation += 0.01;
}

/**
 * @param {Object} id: which symbol to show
 * @param {Object} blur : whether to blur (while spinning)
 * There is a blur method you can apply to sprites but they look rubbish.
 * Better to use an alternative image.
 */
SpinSymbol.prototype.setId = function(id, blur){
    blur = blur || false;
    
    if(this.id != id || this.blur != blur)
    {
        this.blur = blur;
        this.id = id;
        if(this.blur)this.gotoAndStop(this.id+this.blurOffset);
        else this.gotoAndStop(this.id);
        this.isRoyal = this.id > 4 ? false : true;
    }
}

