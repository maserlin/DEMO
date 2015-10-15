/**
 * App entry point for the game.
 * First, set up some basics for getting the game loading
 * TODO show a splash screen with progress
 *
 * It is entirely likely that the index page loading this will itself be loaded by an outside
 * wrapper html and appear inside that page's iFrame.
 * Communication between the game and the server may be done via this wrapper, or directly
 * using parameters decoded from the loading page's url query string.
 * This example loads directly from an index page so the comms logic is somewhat simplified as a result.
 * Some extra steps may need to be wired in to progress the game.
 * A loading screen *may* be run by the wrapper page in which case you need to get a (global) handle to it
 * here so that it can be communicated with in whatever way it wants, for example.
 */
var gameLoader = null;
var game = null;

/**
 * Convert console.log to use this trace method: makes it easy to turn all output off
 * (use trace instead of console.log in game code)
 * set trace = function(args){}; to stop output
 */
var trace = console.log.bind(console);// function(args){};

/*
 * Approx size of a game background; 
 * overwritten when the real background loads.
 * Modules use these numbers to define "size" of game for resizing etc
 */
var gameWidth = 1136;
var gameHeight = 640;

// EVERYTHING goes in here for display. It represents the main displayList.
var stage = new PIXI.Container();

// Create a renderer instance to fit window.
var renderer = PIXI.autoDetectRenderer(getWindowBounds().x, getWindowBounds().y);

// Add the renderer view element to the DOM
document.body.appendChild(renderer.view);
document.documentElement.style.overflow = 'hidden';  // firefox, chrome
document.body.scroll = "no"; // ie only

/**
 * Window loaded: 
 * Make game Loader and listen for PROFILE_LOADED (reels, symbols, paytable, winlines data)
 * Once we have the profile we can build the reels etc
 * NOTE
 * Some systems get their profile information from a server request
 * in which case the game will have to be initialised first so a call can be made.
 * Alternatively load a profile file and then overwrite with server profile at a later stage.
 */ 
document.addEventListener("DOMContentLoaded", function init(){
    gameLoader = new GameLoader();
    Events.Dispatcher.addEventListener(Event.PROFILE_LOADED, onProfileLoaded);
    gameLoader.loadProfile();
});

/**
 * Game XML arrived: get assets (spritesheet images etc)
 */
function onProfileLoaded(){
  Events.Dispatcher.removeEventListener(Event.PROFILE_LOADED, onProfileLoaded);
  Events.Dispatcher.addEventListener(Event.ASSETS_LOADED, onAssetsLoaded);
  gameLoader.loadAssets();

  // Start rendering
  requestAnimationFrame( animate );

}

/**
 * Global animation ticker: starts by default when any movie clip
 * e.g. our spin button is first declared.
 * We can attach and remove bound functions to it at will
 * to put ourselves "in the loop" for animating reels, winlines, win splashes etc.
 * This means there is only ever ONE animation loop running so it's easy to
 * suspend and restart the game (which happens by default when page is minimised
 * or loses focus as it is tied to requestAnimationFrame)
 */
var globalTicker = PIXI.ticker.shared;

/**
 * Create a new Game, tell it the assets have loaded.
 * Get the game dimensions from the background sheet.
 * Start resizing. 
 */
function onAssetsLoaded(){
    Events.Dispatcher.removeEventListener(Event.ASSETS_LOADED, onAssetsLoaded);
    
    game = new Game();
    game.onAssetsLoaded();

    gameWidth = game.gameBackground.getBounds().width;
    gameHeight = game.gameBackground.getBounds().height;
    
    window.addEventListener('resize', onWindowResize);

    // Force first resize.
    onWindowResize();
};


/**
 * Main render loop
 */ 
function animate() {
    requestAnimationFrame( animate );
    renderer.render(stage);
};

/**
 * Handle window resizing.
 * Dispatches an event with the window size and scale so any module listening
 * for this can resize or reposition itself appropriately.
 * Usually the background just centers itself while the main game components
 * like the reelset will resize as well to maintain a nice aspect.
 */ 
function onWindowResize(resizeEvent){
    var size = getWindowBounds();

    // Resize the renderer
    renderer.resize(size.x,size.y);
    
    // Calculate scale based on background dimensions (gameWidth, gameHeight)
    var scale = getWindowScale();
    
    // Dispatch a RESIZED event: any interested object can listen and take action.
    var data = Object.create(null);
    data.size = size;
    data.scale = scale;
    Events.Dispatcher.dispatchEvent( new Event(Event.RESIZED,data));
};

/**
 * UTILS: Get scale of window
 */ 
function getWindowScale(){
    var size = getWindowBounds();
    return new Point(size.x/gameWidth, size.y/gameHeight);    
}

/**
 * UTILS: Get area of window
 */ 
function getWindowBounds(){ 
 var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    return new Point(x,y);
};

/**
 * UTILS: Create Point class
 */
function Point(x, y){
  this.x = x;
  this.y = y;
};
Point.prototype.x = null;
Point.prototype.y = null;

/**
 * UTILS: Create Rectangle class
 */ 
function Rectangle(x,y,w,h){
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
};
Rectangle.prototype.x = null;
Rectangle.prototype.y = null;
Rectangle.prototype.width = null;
Rectangle.prototype.height = null;

/**
 * UTILS: Array randomiser
 */ 
function shuffleArray(array) {
    
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    
    return array;
};

/**
 *  UTILS: return a valid DOM document from a String
 */
function createDoc(xmlData)
{
    var xmlDoc = null;

    // Parse server XML
    if( window.DOMParser )
    {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString( xmlData, "text/xml" );
    }
    else // Internet Explorer
    {
        xmlDoc = new ActiveXObject( "Microsoft.XMLDOM" );
        xmlDoc.async = false;
        xmlDoc.loadXML( xmlData );
    }

    //
    return xmlDoc;
};
