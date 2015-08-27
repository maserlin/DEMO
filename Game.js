/**
 * GAME manages all onscreen components individually or in groups.
 * Onscreen components are all derived from PIXI.Container so they can be put on the stage
 * and removed as necessary in their logical groups, and can resize as a group, be zoomed in and out
 * or cross-faded etc etc.
 * For larger projects it may be advisable to split this file up into GameManager and Game,
 * where GameManager performs all the housekeeping and can load any "Game" and run it transparently.
 * In this case the "Game" has the following responsibilities:
 * Build 3 layers to add to the stage: background, game, console. Interaction between these layers
 * is handled by Events.
 * Change the backgrounds and game screens (reels, bonus1, bonus2) as appropriate, by event request;
 * here we cross-fade the screens in and out, but this functionality could be added to GameScreen
 * to have them fade themselves if that is preferred.
 * Send Requests to the ServerProxy and field the Responses:
 * For the ReelsScreen we are handling the results and telling the reels when to start and stop:
 * again this can be changed to a more appropriate implementation if desired.
 * For the BonusScreen we aren't doing much, but also we act as the switchboard for request/response.
 * The value of this is that some servers require some book-keeping calls between the game and
 * the wrapper or server and we can handle that here without making the game code unnecessarily complex.
 */

function Game(){

    // Maintain a game background Object to handle aspects of scene changes and stage sizing
    this.gameBackground = null;

    /*
     * winCalculator builds a results object given reel positions etc;
     * Required on some platforms, not on others.
     */
    this.winCalculator = new WinCalculator();

    /*
     * Receives results in a variety of formats (xml, json, name=value pairs)
     * and parses into one format appropriate for all games (usually JSON)
     */
    this.dataParser = new DataParser(this.winCalculator);

    /*
     * Sends requests to a server and fields the result. Uses dataParser to determine
     * validity and signals readiness of response with an Event.
     */
    this.serverProxy = new ServerProxy(GameConfig.getInstance().serverUrl, this.dataParser);
    
    this.onInitResponseReceived = this.onInitResponseReceived.bind(this);
    this.onBetResponseReceived = this.onBetResponseReceived.bind(this);
    this.onInvalidBetResponseReceived = this.onInvalidBetResponseReceived.bind(this);
    this.onBonusResponseReceived = this.onBonusResponseReceived.bind(this);
    this.onReelsSpinning = this.onReelsSpinning.bind(this);

    // Display layer management
    this.layers = [];
    this.layers[Game.BACKGROUND] = new PIXI.Container();
    this.layers[Game.MAIN] = new PIXI.Container();
    this.layers[Game.CONSOLE] = new PIXI.Container();
}
Game.BACKGROUND = "background";
Game.MAIN = "main";
Game.CONSOLE = "console";
Game.prototype.layers = null;
Game.prototype.reelsScreen = null;
Game.prototype.bonusScreen = null;
Game.prototype.currentScreen = null;
Game.prototype.validResponseReceived = false;
Game.prototype.invalidResponseReceived = false;
Game.prototype.reelsSpinning = false;


/**
 * Build everything.
 * We are maintaining three distinct layers:  
 * Game.BACKGROUND:
 *      contains a container with any number of swappable backgrounds in the control of GameBackground.js
 *      driven from here depending on game results, by event management
 * 
 * Game.MAIN:
 *      This layer contains one of ReelsScreen, BonusScreen, Bonus2Screen etc: we manage which is showing
 *      based on game result combined with events sent by the current occupier of the layer. 
 * 
 * Game.CONSOLE:
 *      TODO this will house the UI components.
 */
Game.prototype.onAssetsLoaded = function(obj){
    
    // var gc = new GameConfig();
    GameConfig.getInstance().allow();
    
    // These layers remain undisturbed: 
    // We can add and remove children from them as the game plays out.
    stage.addChild(this.layers[Game.BACKGROUND]);    
    // MAIN layer mounts the ReelsScreen, BonusScreen, InterScreen/s etc
    stage.addChild(this.layers[Game.MAIN]);
    // For all UI components
    stage.addChild(this.layers[Game.CONSOLE]);

    // Create a background manager with a couple of images to play with.
    this.gameBackground = new GameBackground(["images/bg.jpg","images/bg2.jpg"]);

    // gameBackground should be able to do its own cross-fades etc because it *is*
    // a PIXI.Container: we can manage it as a single item. 
    this.layers[Game.BACKGROUND].addChild(this.gameBackground);

    // manages all reels game components
    this.reelsScreen = new ReelsScreen(GameConfig.getInstance().reels[0], this.winCalculator);

    // Right now we want to show the ReelsScreen
    this.loadScreen = this.loadScreen.bind(this);
    // Loads the screen into view and sets as currentScreen.
    this.loadScreen(this.reelsScreen);

    // UI controls: Spin button, stake up/down etc
    this.console = new Console();
    this.layers[Game.MAIN].addChild(this.console);    

    // Everything built; bind listeners and their methods        
    this.onSpinReels = this.onSpinReels.bind(this);
    this.onStopReels = this.onStopReels.bind(this);
    Events.Dispatcher.addEventListener(Event.SPIN,this.onSpinReels);
    Events.Dispatcher.addEventListener(Event.STOP,this.onStopReels);
    
    this.onWinDisplayComplete = this.onWinDisplayComplete.bind(this);
    Events.Dispatcher.addEventListener(Event.WIN_DISPLAY_COMPLETE,this.onWinDisplayComplete);    

    this.onStartBonus = this.onStartBonus.bind(this);
    Events.Dispatcher.addEventListener(Event.BONUS_START,this.onStartBonus);    

    this.onBonusComplete = this.onBonusComplete.bind(this);
    Events.Dispatcher.addEventListener(Event.BONUS_COMPLETE,this.onBonusComplete);    

    this.fadeOut = this.fadeOut.bind(this);
    this.fadeIn = this.fadeIn.bind(this);
};

/**
 * 
 */
Game.prototype.loadScreen = function(screen){
    this.layers[Game.MAIN].addChild(screen);
    this.currentScreen = screen;    
}

/**
 * "START_BONUS"
 */
Game.prototype.onStartBonus = function(){
    console.log("Start Bonus");
    this.console.hide();
    this.gameBackground.change(GameBackground.REELS_BG,GameBackground.BONUS_BG);
    this.fadeScreen = this.reelsScreen;
    this.onFadedOut = this.onReelsOut;
    globalTicker.add(this.fadeOut);
};

/**
 * "BONUS_COMPLETE"
 */
Game.prototype.onBonusComplete = function(){
    console.log("Bonus Complete");
    this.gameBackground.change(GameBackground.BONUS_BG,GameBackground.REELS_BG);
    this.fadeScreen = this.bonusScreen;
    this.onFadedOut = this.onBonusOut;
    globalTicker.add(this.fadeOut);
};

/**
 * "REELS_OUT"
 * Reels screen has faded out and is no longer showing.
 * Load the bonus screen.
 */
Game.prototype.onReelsOut = function(){
    console.log("onReelsOut for Bonus");
    this.layers[Game.MAIN].removeChild(this.reelsScreen);    
    this.bonusScreen = new BonusScreen(this.winCalculator);
    this.loadScreen(this.bonusScreen);    

    this.fadeScreen = this.bonusScreen;
    this.onFadedIn = this.bonusScreen.start;
    globalTicker.add(this.fadeIn);
};

/**
 * "BONUS_OUT"
 * Bonus screen has faded out and is no longer showing.
 * Load the reels screen.
 */
Game.prototype.onBonusOut = function(){
    console.log("onBonusOut for Reels");
    this.console.show();
    this.bonusScreen.cleanUp();
    this.layers[Game.MAIN].removeChild(this.bonusScreen);    
    this.loadScreen(this.reelsScreen);    

    this.fadeScreen = this.reelsScreen;
    this.onFadedIn = this.onWinDisplayComplete;
    globalTicker.add(this.fadeIn);
};

Game.prototype.fadeOut = function(){
    if(this.fadeScreen.alpha > 0.05){
        this.fadeScreen.alpha -= 0.05;
    }
    else {
        globalTicker.remove(this.fadeOut);
        this.fadeScreen.alpha = 0;
        this.onFadedOut();
    }
}

Game.prototype.fadeIn = function(screen){
    if(this.fadeScreen.alpha < 1){
        this.fadeScreen.alpha += 0.05;
    }
    else {
        globalTicker.remove(this.fadeIn);
        this.fadeScreen.alpha = 1;
        this.onFadedIn();
    }
}

/**
 * "WIN_DISPLAY_COMPLETE"
 * Signal that enough of the win display has completed to allow player to spin again.
 * Usually this is after the win summary; player may skip the line-by-line win display
 * OR if there is a bonus flagged, they may want to skip to the bonus start.
 */
Game.prototype.onWinDisplayComplete = function(){
    console.log("Wins complete");
    this.console.enable();
};

/**
 * SPIN has been called by the player.
 * Alternatively we could listen for a BET_REQUEST, as we sometimes have to validate
 * the bet with the game wrapper or server before allowing the spin to continue:
 * here we simply send the bet in the expectation that an invalid bet
 * will be flagged by the server response value.
 */
Game.prototype.onSpinReels = function(event){
    console.log("call spin");
    this.foitems = null;

    // If we span using the cheat button, set a result value to be used.
    if(event.data.name == "cheat"){
        console.log("Cheat button");
        this.foitems = [0,29,26,27,25,31];
        this.foitems = [1,0,0,0,0,0];
    }
    
    /**
     * TODO
     * this is an example bet only.
     */
    var req = Object.create(null);
    req.code = Event.BET;
    req.stake = this.console.getTotalBetInCents();
    req.winlines = this.console.getNumberOfWinlinesSelected();
    req.foitems = this.foitems;
    
    /*
     * Valid bet is OK to send: make Request and tell the reels they may spin.
     * Listen for a server response and do not stop the reels until
     * a) all reels are spinning and
     * b) response received.
     * This can all be re-wired and delegated to the ReelsScreen itself if required.
     */
    Events.Dispatcher.addEventListener(Event.VALID_RESPONSE_RECEIVED, this.onBetResponseReceived);
    Events.Dispatcher.addEventListener(Event.INVALID_RESPONSE_RECEIVED, this.onInvalidBetResponseReceived);
    Events.Dispatcher.addEventListener(Event.ALL_REELS_SPINNING,this.onReelsSpinning);
    this.validResponseReceived = false;
    this.invalidResponseReceived = false;
    this.reelsSpinning = false;

    this.serverProxy.makeRequest(req);
    this.reelsScreen.spinReels();
};

/**
 * Don't STOP REELS unless they are all spinning AND result received 
 */
Game.prototype.onReelsSpinning = function(event){
    Events.Dispatcher.removeEventListener(Event.ALL_REELS_SPINNING, this.onReelsSpinning);
    this.reelsSpinning = true;

    // Separate these cases to make life easier :)
    if(this.validResponseReceived){
        this.onStopReels();
    }
    else if(this.invalidResponseReceived){
        this.onStopReelsOnError();
    }
}

/**
 * Don't STOP REELS unless they are all spinning AND result received.
 * THIS MODULE receives the results and acts accordingly:
 * This can change; delegate to reels screen if required!
 */
Game.prototype.onBetResponseReceived = function(event){
    Events.Dispatcher.removeEventListener(Event.VALID_RESPONSE_RECEIVED, this.onBetResponseReceived);
    Events.Dispatcher.removeEventListener(Event.INVALID_RESPONSE_RECEIVED, this.onInvalidBetResponseReceived);
    this.validResponseReceived = true;

    if(this.reelsSpinning){
        this.onStopReels();
    }
}

/**
 * If the reels are all spinning it's safe to stop them.
 * This is the onError case.
 * @param event
 */
Game.prototype.onInvalidBetResponseReceived = function(event){
    Events.Dispatcher.removeEventListener(Event.VALID_RESPONSE_RECEIVED, this.onBetResponseReceived);
    Events.Dispatcher.removeEventListener(Event.INVALID_RESPONSE_RECEIVED, this.onInvalidBetResponseReceived);
    this.invalidResponseReceived = true;

    if(this.reelsSpinning){
        this.onStopReelsOnError();
    }
}

/**
 * A bonus screen has requested some results from the server
 */
Game.prototype.onBonusRequest = function(data){
    var req = Object.create(null);
    req.code = Event.BONUS;
    req.id = 1;
    Events.Dispatcher.addEventListener(Event.VALID_BONUS_RESPONSE_RECEIVED, this.onBonusResponseReceived);
    Events.Dispatcher.addEventListener(Event.INVALID_BONUS_RESPONSE_RECEIVED, this.onInvalidBonusResponseReceived);

    this.serverProxy.makeRequest(req);
}

/**
 * currentScreen should have been set to whichever bonus is in play.
 * @param event
 */
Game.prototype.onBonusResponseReceived = function(event){
    Events.Dispatcher.removeEventListener(Event.VALID_BONUS_RESPONSE_RECEIVED, this.onBonusResponseReceived);
    Events.Dispatcher.removeEventListener(Event.INVALID_BONUS_RESPONSE_RECEIVED, this.onInvalidBonusResponseReceived);
    this.currentScreen.responseReceived(event);
}

/**
 * Handle error condition
 * currentScreen should have been set to whichever bonus is in play.
 * @param event
 */
Game.prototype.onInvalidBonusResponseReceived = function(event){
    Events.Dispatcher.removeEventListener(Event.VALID_BONUS_RESPONSE_RECEIVED, this.onBonusResponseReceived);
    Events.Dispatcher.removeEventListener(Event.INVALID_BONUS_RESPONSE_RECEIVED, this.onInvalidBonusResponseReceived);
    this.currentScreen.invalidResponseReceived(event);
}

/**
 * TODO
 * @param event
 */
Game.prototype.onInitResponseReceived = function(event){
    console.log("Init request received");
}

/**
 * Allow the reels to stop at the designated positions.
 */
Game.prototype.onStopReels = function(){
    var stops = this.dataParser.getReelStops();
    this.reelsScreen.stopReels(stops, this.dataParser.getReelLayout() );
    console.log("call stop pos " + stops);
};

/**
 * No server? Or server error! Construct a fake result.
 * This may show some wins; what we are doing here is emulating a play-for-fun response.
 * Don't use this for real ... !!!
 * Do a fake safe-stop to bring the reels to halt not showing a win.
 * The game server (when it exists) should be sent a token indicating play-for-fun or
 * play-for-real so it can maintain the fake or real balance etc. The game need not know
 * which is in use.
 */
Game.prototype.onStopReelsOnError = function(){
    var reelset = 0;
    var stops = [];

    // Presently creating an actual game result in lieu of a server response.
    // Should really be just stopping reels in a neutral place as the server
    // ought to be returning a valid play-for-fun result.
    this.dataParser.createErrorResult();

    // Safe positions, no bonus
    // reelset = 0;
    //stops = [0,9,3,30,4];

    this.reelsScreen.stopReels(this.dataParser.getReelStops(), this.dataParser.getReelLayout());
    console.log("call stop pos " + stops);
};



