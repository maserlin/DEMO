/**
 * A symbol which has a base class that can show a static image,
 * with or without blur, used when spinning the reels.
 * This Object can swap in a sprite sheet in place of the static image
 * and animate it to show wins/symbol transformations etc
 * By its nature this is a game-specific file
 * @param id : which symbol to show
 */
function AnimatedSymbol(id){
    SpinSymbol.call(this, id);

    this.spritesheets = ["Icons_10","Icons_10","Icons_10","Icons_10","Icons_10",
                          "Icon05_","Icon06_","Icon07_","Icon08_","Icon09_"];

    // End frame of each of the above symbol animations
    this.frames = [37,37,37,37,37,62,62,20,50,54];

    this.animate = this.animate.bind(this);
}

AnimatedSymbol.prototype = Object.create(SpinSymbol.prototype);
AnimatedSymbol.prototype.constructor = AnimatedSymbol;
AnimatedSymbol.prototype.spritesheets;
AnimatedSymbol.prototype.textureFrames;
AnimatedSymbol.prototype.movieClip;
AnimatedSymbol.prototype.frames;


AnimatedSymbol.prototype.animate = function(container){
    console.log("Symbol id",this.id," animate...");

    this.container = container;

    this.textureFrames = [];

    var animationSpeed = 0.2;

    // Set up the texture data for the symbol we want to animate
    switch(this.id)
    {
        default:
            for(var i=6; i<this.frames[this.id]; ++i)
            {
                var texture = PIXI.Texture.fromFrame(this.spritesheets[this.id] + (i+1) + ".png");
                this.textureFrames.push(texture);
            }
            animationSpeed = 0.5;
        break;
        case 5:
            for(var i=0; i<this.frames[this.id]; i+=2)
            {
                var texture = PIXI.Texture.fromFrame(this.spritesheets[this.id] + (i+1) + ".png");
                this.textureFrames.push(texture);
            }
        break;

        case 6:
            for(var i=0; i<this.frames[this.id]; i+=2)
            {
                var texture = PIXI.Texture.fromFrame(this.spritesheets[this.id] + (i+1) + ".png");
                this.textureFrames.push(texture);
            }
        break;

        case 7:
            for(var i=0; i<this.frames[this.id]; i+=2)
            {
                var texture = PIXI.Texture.fromFrame(this.spritesheets[this.id] + (i+1) + ".png");
                this.textureFrames.push(texture);
            }
        break;

        case 8:
            for(var i=0; i<this.frames[this.id]; i+=2)
            {
                var texture = PIXI.Texture.fromFrame(this.spritesheets[this.id] + (i+1) + ".png");
                this.textureFrames.push(texture);
            }
        break;

        case 9:
            for(var i=0; i<this.frames[this.id]; i+=2)
            {
                var texture = PIXI.Texture.fromFrame(this.spritesheets[this.id] + (i+1) + ".png");
                this.textureFrames.push(texture);
            }
            animationSpeed = 0.4;
        break;
    }

    // Set the movie clip up and animate it
    this.movieClip = new PIXI.extras.MovieClip(this.textureFrames);
    this.container.addChild(this.movieClip);
    this.movieClip.animationSpeed = 0.2;
    this.movieClip.loop = false;
    this.movieClip.position = this.position;
    this.movieClip.play();
    this.movieClip.interactive = false;
    this.movieClip.animationSpeed = animationSpeed;
    var that = this;

    // Dispatch event when done to allow sync with sound/next animation etc
    this.movieClip.onComplete = function(){
        that.container.removeChild(that.movieClip);
        Events.Dispatcher.dispatchEvent(new Event(Event.SYMBOL_ANIMATION_COMPLETE));
    }
}
