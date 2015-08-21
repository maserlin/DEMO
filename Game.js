/**
 * GAME manages all onscreen components individually or in groups. 
 * Onscreen components are all derived from PIXI.Container so they can be put on the stage
 * and removed as necessary in their logical groups, and can resize as a group, be zoomed in and out
 * or cross-faded etc etc.
 */
function Game(){
    this.gameBackground = null;
    this.bunny = null;
    this.rect = null;
    this.reelset = null;

    this.winCalculator = new WinCalculator();
    this.dataParser = new DataParser(this.winCalculator);
    this.serverProxy = new ServerProxy(GameConfig.getInstance().serverUrl, this.dataParser);
    
    this.onInitResponseReceived = this.onInitResponseReceived.bind(this);
    this.onBetResponseReceived = this.onBetResponseReceived.bind(this);
    this.onInvalidBetResponseReceived = this.onInvalidBetResponseReceived.bind(this);
    this.onBonusResponseReceived = this.onBonusResponseReceived.bind(this);
    this.onReelsSpinning = this.onReelsSpinning.bind(this);

    
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
Game.prototype.vhost = null;


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
    this.gameBackground = new GameBackground(["im/bg.jpg","im/bg2.jpg"]);

    // gameBackground should be able to do its own cross-fades etc because it *is*
    // a PIXI.Container: we can manage it as a single item. 
    this.layers[Game.BACKGROUND].addChild(this.gameBackground);

    // manages all reels game components
    this.reelsScreen = new ReelsScreen(GameConfig.getInstance().reels[0], this.winCalculator);

    // Right now we want to show the ReelsScreen
    this.loadScreen = this.loadScreen.bind(this);
    this.loadScreen(this.reelsScreen);
    
    /*
     * TODO This should be a whole console component in an upper layer. 
     */
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
 */
Game.prototype.onReelsOut = function(){
    console.log("onReelsOut for Bonus");
    this.layers[Game.MAIN].removeChild(this.reelsScreen);    
    this.bonusScreen = new BonusScreen(this.winCalculator);
    this.loadScreen(this.bonusScreen);    

    this.fadeScreen = this.bonusScreen;
    this.onFadedIn = this.bonusScreen.start;
    globalTicker.add(this.fadeIn);

    this.fadeIn(this.bonusScreen);
};

/**
 * "BONUS_OUT"
 */
Game.prototype.onBonusOut = function(){
    console.log("onBonusOut for Reels");
    this.bonusScreen.cleanUp();
    this.layers[Game.MAIN].removeChild(this.bonusScreen);    
    this.loadScreen(this.reelsScreen);    

    this.fadeScreen = this.reelsScreen;
    this.onFadedIn = this.onWinDisplayComplete;
    globalTicker.add(this.fadeIn);

    this.fadeIn(this.bonusScreen);
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
 */
Game.prototype.onWinDisplayComplete = function(){
    console.log("Wins complete");
    this.console.enable();
};

/**
 * 
 */
Game.prototype.onSpinReels = function(event){
    console.log("call spin");
    this.foitems = null;
    if(event.data.name == "cheat"){
        console.log("Cheat button");
        this.foitems = [0,29,26,27,25,31];
        this.foitems = [1,0,0,0,0,0];
    }
    
    /**
     * TODO refactor all this to use proper XML & comms and use proper request data
     */
    var req = Object.create(null);
    req.code = "BET";
    req.stake = 200;
    req.winlines = 20;
    req.foitems = this.foitems;
    
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
    if(this.validResponseReceived){
        this.onStopReels();
    }
    else if(this.invalidResponseReceived){
        this.onStopReelsOnError();
    }
}

/**
 * Don't STOP REELS unless they are all spinning AND result received 
 */
Game.prototype.onBetResponseReceived = function(event){
    Events.Dispatcher.removeEventListener(Event.VALID_RESPONSE_RECEIVED, this.onBetResponseReceived);
    Events.Dispatcher.removeEventListener(Event.INVALID_RESPONSE_RECEIVED, this.onInvalidBetResponseReceived);
    this.validResponseReceived = true;
    if(this.reelsSpinning){
        this.onStopReels();
    }
}

Game.prototype.onInvalidBetResponseReceived = function(event){
    Events.Dispatcher.removeEventListener(Event.VALID_RESPONSE_RECEIVED, this.onBetResponseReceived);
    Events.Dispatcher.removeEventListener(Event.INVALID_RESPONSE_RECEIVED, this.onInvalidBetResponseReceived);
    this.invalidResponseReceived = true;
    if(this.reelsSpinning){
        this.onStopReelsOnError();
    }
}

Game.prototype.onBonusResponseReceived = function(event){
    this.bonusScreen.responseReceived();    
}

Game.prototype.onInitResponseReceived = function(event){
    console.log("Init request received");
}

/**
 * 
 */
Game.prototype.onStopReels = function(){
    var stops = this.dataParser.getReelStops();
    this.reelsScreen.stopReels(stops, this.dataParser.getReelLayout() );
    console.log("call stop pos " + stops);
};

/**
 * No server? Or server error! Don't use for real! Do a fake safe-stop!!
 */
Game.prototype.onStopReelsOnError = function(){
    var reelset = 0;
    var stops = [];
    
    // Set from faked foitems
    if(this.foitems != null){
        reelset = this.foitems.shift();
        stops = this.foitems.slice(0,5);
    }
    
    // Set random result
    else {
        // Decide on bonus 
        if(Math.floor(Math.random() * 15) == 0){
            
            reelset = 1;
            
            // Set stops
            for(var reel in GameConfig.getInstance().reels[reelset]){
                var stop =  Math.floor( Math.random() * GameConfig.getInstance().reels[reelset][reel].length );
                stops.push(stop);
            }
            
            // Show bonus symbol on the middle reel
            var reel = GameConfig.getInstance().reels[reelset][2];
            var index = reel.indexOf(11);
            var offset = (Math.floor( (Math.random() * 10) ) %3 )-1;
            index = (index + offset + reel.length) % reel.length;
            stops[2] = index;
        } 
        // no bonus
        else{
            reelset = 0;
            for(var reel in GameConfig.getInstance().reels[reelset]){
                var stop =  Math.floor( Math.random() * GameConfig.getInstance().reels[reelset][reel].length );
                stops.push(stop);
            }
        }
        // Safe positions, no bonus
        // reelset = 0;
        //stops = [0,9,3,30,4];
    }
    
    this.reelsScreen.stopReels(stops, reelset);
    console.log("call stop pos " + stops);
};




/** *****************************************************************************************
 * Test method 
 */
Game.prototype.createGameAssets = function(){
    //this.createBunny();
    
    // create a background + quick and dirty resize
    this.gameBackground = new PIXI.Sprite(PIXI.Texture.fromImage("im/bg.jpg"));
    var that = this;
    this.gameBackground.resize = function(xscale,yscale){
        var size = getWindowBounds()
        that.bg.position.x = size.x/2;
        that.bg.position.y = size.y/2;
    }
    // center the sprites anchor point
    this.gameBackground.anchor.x = 0.5;
    this.gameBackground.anchor.y = 0.5;
    // stage should be global?
    stage.addChild(this.gameBackground);

    // List assets and get them loaded
    var assets = ["im/spinButton.json","im/explosion.json","im/BlursNStills.json"];
    var loader = PIXI.loader;
    loader.add(assets);
    loader.once('complete',this.onAssetsLoaded);
    loader.load();
};


/** ****************************************************************************************************
 * Test method 
 */
Game.prototype.createBunny = function(){
    // create a texture from an image path
    //var texture = PIXI.Texture.fromImage("im/bunny.png");
    
    // create a new Sprite using the texture
    this.bunny = new PIXI.Sprite(PIXI.Texture.fromImage("im/bunny.png"));
    this.bunny.anchor.x = 0.5;
    this.bunny.anchor.y = 0.5;
    stage.addChild(this.bunny);
};


/** ****************************************************************************************************
 * Test method 
 */
Game.prototype.addRectangle = function(x,y,w,h){
    var gfx = new PIXI.Graphics();
    
    gfx.beginFill(0xFFFF00);
    
    // set the line style to have a width of 5 and set the color to red
    gfx.lineStyle(5, 0xFF0000);
    
    // draw a rectangle
    gfx.drawRect(x,y,w,h);
    
    stage.addChild(gfx);
    
    this.rect = gfx;
};


/** ****************************************************************************************************
 * Test method 
 */
Game.prototype.addExplosion = function(){
    var explosionTextures = [];    
    for (var i=0; i < 26; i++) 
    {
        var texture = PIXI.Texture.fromFrame("Explosion_Sequence_A " + (i+1) + ".png");
        explosionTextures.push(texture);
    };
    var explosion = new PIXI.extras.MovieClip(explosionTextures);
    explosion.position.x = explosion.position.y = 100;
    explosion.anchor.x = explosion.anchor.y = 0.5;
//    explosion.rotation = Math.random() * Math.PI;
    explosion.gotoAndPlay(0);
    stage.addChild(explosion);
};


