function GameLoader(){
    PIXI.loaders.Loader.call(this);
    
    this.loadProfile = this.loadProfile.bind(this);   
    this.loadAssets = this.loadAssets.bind(this);   
    this.onreadystatechange = this.onreadystatechange.bind(this);
}

GameLoader.prototype = Object.create(PIXI.loaders.Loader.prototype);
GameLoader.prototype.constructor = GameLoader;
GameLoader.prototype.oReq = null;


/**
 * Load the profile first 
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
 * Load assets (inbuilt asynchronous method) 
 */
GameLoader.prototype.loadAssets = function(){

    var assets = ["images/icons_00_04.json",
                  "images/icon05.json",
                  "images/icon06.json",
                  "images/icon07.json",
                  "images/icon08.json",
                  "images/icon09.json",
                  "images/explosion.json",
                  "images/BlursNStills.json",
                  "images/playbutton.json"];
    
    assets.push("images/bg.jpg");
    assets.push("images/bg2.jpg");
    this.add(assets);
    this.once('complete',this.onAssetsLoaded);
    this.on('progress', this.onProgress);
    this.load();
}

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

/**
 * Dispatch event on complete 
 * @param {Object} data
 */
GameLoader.prototype.onAssetsLoaded = function(data){
    for ( var obj in data.resources){
        console.log("Loaded " + obj);
    }
    
    Events.Dispatcher.dispatchEvent(new Event(Event.ASSETS_LOADED));
}

