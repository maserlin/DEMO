/**
 * Parent is a basic GameScreen object giving us receivers for server responses.
 * There are many ways to organise the logic of the game but in this example the Game object
 * is sending and receiving the bet and when it is received and parsed, telling the reels to stop.
 * Therefore when the reels have stopped we know the data exists and we can show any wins.
 * @param reels_0
 * @param winCalculator
 * @constructor
 */
function ReelsScreen(reels_0, winCalculator)
{
    GameScreen.call(this);

    // non-visual components
    this.winCalculator = winCalculator;

    // Reelset is a container which builds up the reels components in order:
    // ReelBg, Reels x5, a mask for clipping the top and bottom, and reelFg overlay   
    this.reelset = new Reelset(reels_0);
    this.addChild(this.reelset);

    this.winlines = new Winlines();
    this.addChild(this.winlines);
    
    // Tell it where to draw relative to us
    this.winSplash = new WinSplash(new Point(this.width/2,this.height/2));
    this.addChild(this.winSplash);

    // Manager: non-visual
    this.winAnimator = new WinAnimator(this.reelset, this.winCalculator, this.winlines, this.winSplash);

    // Center ourselves onscreen
    this.pivot.x = this.width/2;
    this.pivot.y = this.height/2;
    this.position.x = getWindowBounds().x/2;
    this.position.y = getWindowBounds().y/2;

    this.onReelsSpinning = this.onReelsSpinning.bind(this);
    Events.Dispatcher.addEventListener(Event.ALL_REELS_SPINNING,this.onReelsSpinning);

    this.onReelsStopped = this.onReelsStopped.bind(this);
    Events.Dispatcher.addEventListener(Event.ALL_REELS_STOPPED,this.onReelsStopped);

    this.spinReels = this.spinReels.bind(this);
    this.stopReels = this.stopReels.bind(this);

    this.onWinAnimatorComplete = this.onWinAnimatorComplete.bind(this);
    Events.Dispatcher.addEventListener(Event.WIN_ANIMATOR_COMPLETE,this.onWinAnimatorComplete);

    this.resize = this.resize.bind(this);
    Events.Dispatcher.addEventListener(Event.RESIZED, this.resize);
    
}
ReelsScreen.prototype = Object.create(GameScreen.prototype);
ReelsScreen.constructor = ReelsScreen;
ReelsScreen.prototype.reelset = null;
ReelsScreen.prototype.winData = null;
ReelsScreen.prototype.winlines = null;
ReelsScreen.prototype.winSplash = null;
ReelsScreen.prototype.winCalculator = null;
ReelsScreen.scaleDown = 1;//0.85;


/**
 * Resize and scale the entire reels screen to suit the game's requirements.
 * NOTE this is the only size/scale code for the entire reels screen and all its components. 
 */
ReelsScreen.prototype.resize = function(event){
    var data = event.data;
    
    // Scale both by X to maintain aspect ratio
    this.scale.x = data.scale.x * ReelsScreen.scaleDown;
    this.scale.y = data.scale.x * ReelsScreen.scaleDown;
    
    // Reposition to center
    this.position.x = (data.size.x/2);
    this.position.y = data.size.y/2;
    
    // Reset all positioning data for win display components
    this.reelset.setSymbolData();
}

/**
 * The timing for spinning the reels comes from the GameConfiguration
 */
ReelsScreen.prototype.spinReels = function(){
    this.reelset.spinReels();
};


/**
 * 
 * Stop timing comes from the GameConfiguration
 * @param {Array[5]} stopPos : array of stop positions
 * @param {int} reelsetId : The reelset to stop with (may be different to the ones that are spinning!)
 */
ReelsScreen.prototype.stopReels = function(stopPos, reelsetId){
    this.reelset.stopReels(stopPos, GameConfig.getInstance().reels[reelsetId]);
};

/**
 * Could dispatch an all reels spinning event if required.
 */
ReelsScreen.prototype.onReelsSpinning = function(){
        // Events.Dispatcher.dispatchEvent(new Event(Event.STOP));
};

/**
 * When all stopped show win summary, win highlights, etc etc
 * Reels are not told to stop until the result has arrived so we know it exists in some form.
 */
ReelsScreen.prototype.onReelsStopped = function(){
    this.winData = this.winCalculator.calculate(this.reelset.getReelMap());
    
    if(this.winData.lines.length > 0){
        this.winAnimator.start(this.winData);
    }
    else if(this.winData.bonus){
        Events.Dispatcher.dispatchEvent(new Event(Event.BONUS_START));  
    }
    else {
        Events.Dispatcher.dispatchEvent(new Event(Event.WIN_DISPLAY_COMPLETE));  
    }
}

/**
 * 
 * @param {Object} event
 */
ReelsScreen.prototype.onWinAnimatorComplete = function(event){
    if(this.winData.bonus){
        Events.Dispatcher.dispatchEvent(new Event(Event.BONUS_START));  
    }
    else {
        Events.Dispatcher.dispatchEvent(new Event(Event.WIN_DISPLAY_COMPLETE));  
    }
}
