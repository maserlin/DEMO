/**
 * This button only exists to demonstrate that any movieClip can be an interactive button.
 * When Clicked you can play out the movie and send and receive Events etc. This is very useful
 * for bonus elements or more complicated buttons than just a standard on/off/click type.
 * Don't base it on standard Button as that is expecting a certain type of spriteSheet.
 *
 * @param imageName
 * @param posX
 * @param posY
 * @param name
 * @constructor
 */
function MovieClipButton(imageName,posX,posY,name){
    this.actions = [];
    this.state = MovieClipButton.IDLE;
    this.name = name || "MovieClipButton";
    
    var movieClipButtonTextures = [];
    for(var i in PIXI.utils.TextureCache){
        if( String( i ).indexOf( imageName + "_" ) != -1 ){
            movieClipButtonTextures.push(PIXI.Texture.fromFrame(i));
        }
    }

    PIXI.extras.MovieClip.call(this, movieClipButtonTextures);

    this.position.x = posX || 100;
    this.position.y = posY || 100;
    this.anchor.x = this.anchor.y = 0.5;
    this.animationSpeed = .2;
    this.loop = false;
    this.gotoAndPlay(0);
    this.interactive = true;
    
    // Fix scope
    this.clicked = false;
    var that = this;
    this.click = function(data){
        that.buttonClick();
    }
    this.tap = function(data){
        that.buttonClick();
    }

    this.onAllReelsStopped = this.onAllReelsStopped.bind(this);
    Events.Dispatcher.addEventListener(Event.ALL_REELS_STOPPED,this.onAllReelsStopped);
    this.onAllReelsSpinning = this.onAllReelsSpinning.bind(this);
    Events.Dispatcher.addEventListener(Event.ALL_REELS_SPINNING,this.onAllReelsSpinning);
};
MovieClipButton.prototype = Object.create(PIXI.extras.MovieClip.prototype);
MovieClipButton.constructor = MovieClipButton;
MovieClipButton.prototype.name = null;

    MovieClipButton.IDLE = 0;
    MovieClipButton.SPIN = 1;
    MovieClipButton.STOP = 2;



// Set visibility
MovieClipButton.prototype.setVisible = function(vis){
    this.visible = vis;
}

// Play clip on enable
MovieClipButton.prototype.setEnable = function(enable){
    if(enable)this.gotoAndPlay(0);
}

/**
 * Try to deal with some Droid double-tap issue
 */
MovieClipButton.prototype.onAllReelsSpinning = function(){
    this.clicked = false;
}

/**
 * Clicks may fire twice on certain android devices
 * but only once on iPad or desktop or other Androids. 
 */
MovieClipButton.prototype.buttonClick = function(){
        this.gotoAndPlay(0);
    if(!this.clicked){
        this.clicked = true;
        this.performStateAction();
    }
    else{
        this.clicked = false;
    }
}


MovieClipButton.prototype.onAllReelsStopped = function(event){
    this.state = MovieClipButton.IDLE;
    this.clicked = false;
}

/**
 * Perform action and move to next state
 */
MovieClipButton.prototype.performStateAction = function(state){
    
    if(state != null)this.state = state;
    else{
        switch(this.state){
            case MovieClipButton.IDLE:
                this.state = MovieClipButton.SPIN;
                // Listened to by Game to provide timings
                Events.Dispatcher.dispatchEvent(new Event(Event.SPIN,this));
                break;
            case MovieClipButton.SPIN:
                this.state = MovieClipButton.STOP;
                // Listened to by Game to provide timings and stopPositions
                Events.Dispatcher.dispatchEvent(new Event(Event.STOP,this));
                break;
            case MovieClipButton.STOP:
                break;
        }
    }
}

MovieClipButton.prototype.setState = function(state){
    this.state = state;
};

