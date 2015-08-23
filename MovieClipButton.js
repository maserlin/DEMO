function MovieClipButton(imageName,posX,posY,name){
    this.actions = [];
    this.state = MovieClipButton.IDLE;
    this.name = name || "MovieClipButton";
    
    var MovieClipButtonTextures = [];
    for(var i=0; i<62; i+=2)
    {
        var texture = PIXI.Texture.fromFrame(imageName + (i+1) + ".png");
        MovieClipButtonTextures.push(texture);
    }
    this.button = new PIXI.extras.MovieClip(MovieClipButtonTextures);
    this.button.position.x = posX || 100;
    this.button.position.y = posY || 100;
    this.button.anchor.x = this.button.anchor.y = 0.5;
    this.button.animationSpeed = .2;
    this.button.loop = false;
    this.button.gotoAndPlay(0);
    this.button.interactive = true;
    
    // Fix scope
    this.clicked = false;
    this.buttonClick = this.buttonClick.bind(this);
    
    var that = this;
    this.button.click = function(data){
        that.buttonClick();
    }
    this.button.tap = function(data){
        that.buttonClick();
    }

    this.onAllReelsStopped = this.onAllReelsStopped.bind(this);
    Events.Dispatcher.addEventListener(Event.ALL_REELS_STOPPED,this.onAllReelsStopped);
    this.onAllReelsSpinning = this.onAllReelsSpinning.bind(this);
    Events.Dispatcher.addEventListener(Event.ALL_REELS_SPINNING,this.onAllReelsSpinning);
};
MovieClipButton.prototype.name = null;

    MovieClipButton.IDLE = 0;
    MovieClipButton.SPIN = 1;
    MovieClipButton.STOP = 2;



MovieClipButton.prototype.setVisible = function(vis){
    this.button.visible = vis;
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
        this.button.gotoAndPlay(0);
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

