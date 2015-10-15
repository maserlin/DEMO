/**
 * This is how to subclass a PIXI (or any other) object, in this case
 * a Loader, in order to add our own functionality to a new GameLoader.

 GameLoader.prototype = Object.create(PIXI.loaders.Loader.prototype);
 GameLoader.prototype.constructor = GameLoader;
 function GameLoader(){
     PIXI.loaders.Loader.call(this);
 * Follow these steps to create a child class in which you can override any parent methods.
    * Note two types of call to super (experiment to find the right one for you!):
    * passing args as a comma delimited list
    * parentClass.prototype.theMethod.call(this, param, param);
    * passing args as an array of values
    * parentClass.prototype.theMethod.apply(this, params);
 * @constructor
 */

function GameLoader(){
    PIXI.loaders.Loader.call(this);

    // Bind functions to ensure correct value of "this" in method.
    this.loadProfile = this.loadProfile.bind(this);   
    this.loadAssets = this.loadAssets.bind(this);   
    this.onreadystatechange = this.onreadystatechange.bind(this);
}
GameLoader.prototype = Object.create(PIXI.loaders.Loader.prototype);
GameLoader.prototype.constructor = GameLoader;
GameLoader.prototype.oReq = null;


/**
 * Load the maths profile first (reels/symbols etc)
 */
GameLoader.prototype.loadProfile = function(){
    this.oReq = getXMLHttpRequest();
    if (this.oReq != null) {
        this.oReq.open("GET", "profile.xml", true);
        this.oReq.onreadystatechange = this.onreadystatechange;
        this.oReq.send();
    }
    else {
        window.console.log("AJAX (XMLHTTP) not supported.");
    }
}

/**
 * Call back to game (using Event) when profile is loaded.
 */
GameLoader.prototype.onreadystatechange = function()
{
    if (this.oReq.readyState == 4 /* complete */) {
        if (this.oReq.status == 200) {
            console.log("Loaded XML:");
            console.log(this.oReq.responseText);
            GameConfig.getInstance().setConfig(this.oReq.responseText);

            Events.Dispatcher.dispatchEvent(new Event(Event.PROFILE_LOADED));
        }
    }
}

/**
 * Load assets (inbuilt asynchronous method) 
 */
GameLoader.prototype.loadAssets = function(){

    // List all spritesheet JSON files, PIXI will do the rest
    var assets = ["images/icons_00_04.json",
                  "images/icon05.json",
                  "images/icon06.json",
                  "images/icon07.json",
                  "images/icon08.json",
                  "images/icon09.json",
                  "images/explosion.json",
                  "images/BlursNStills.json",
                  "images/playbutton.json"];

    // Load standalone images. NOT doing so results in some VERY strange behaviour!
    assets.push("images/bg.jpg");
    assets.push("images/bg2.jpg");
    // Go
    this.add(assets);
    this.once('complete',this.onAssetsLoaded);
    this.on('progress', this.onProgress);
    this.load();
}



/**
 * Gets a valid request object on any platform (in theory)
 */
function getXMLHttpRequest() 
{
    if (window.XMLHttpRequest) {
        return new window.XMLHttpRequest;
    }
    else {
        try {
            return new ActiveXObject("MSXML2.XMLHTTP.3.0");
        }
        catch(ex) {
            return null;
        }
    }
}

/**
 * Report loading progress:
 * TODO access this data on loading screen. 
 * TODO A loading screen ;-)
 */
GameLoader.prototype.onProgress = function(data){
    console.log(data.progress);
}
var soundJson = null;

/**
 * Dispatch event on loading assets complete
 * @param {Object} data
 */
GameLoader.prototype.onAssetsLoaded = function(data){
    for ( var obj in data.resources){
/*
        console.log("Loaded " + obj);
        console.log(data.resources[obj]);
        if(data.resources[obj].data)console.log(data.resources[obj].data);
*/
    }
    Events.Dispatcher.dispatchEvent(new Event(Event.ASSETS_LOADED));
}

GameLoader.prototype.onSoundJsonLoadedLoaded = function(data){
    for ( var obj in data.resources){
        console.log("Loaded " + obj);
    }
    Events.Dispatcher.dispatchEvent(new Event(Event.SOUND_ASSETS_LOADED));
}
