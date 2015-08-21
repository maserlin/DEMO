/**
 * Game-specific Configuration settings. Singleton: ONE config object ONLY.
 * Some or all may be over-written by initialisation from server depending upon 
 * which engine is being used. May need to provide setters through DataParser to here.
 */
var gameConfig;

function GameConfig(){
    Configuration.call(this);
    console.log("GC");
    this.setReels();
    this.serverUrl = "http:\\\\10.32.10.73:8090\\PIXI";
}
GameConfig.prototype = Object.create(Configuration.prototype);
GameConfig.constructor = GameConfig;

GameConfig.getInstance = function(){
    return gameConfig ? gameConfig : gameConfig = new GameConfig();
}

GameConfig.prototype.setReels = function(){
    var reels_0 = [ [7,5,3,2,0,1,3,0,2,2,0,1,3,0,2,4,5,6,7,0,4,1,0,2,3,1,8,2,4,1,0,3,2,1,0,4,6,5,7,5,3,2,4,5,6,7,8,9,8,7,6,5,1],
                    [1,4,5,1,6,5,0,2,1,2,0,1,3,0,2,0,3,4,0,2,3,7,6,1,4,0,3,1,2,6,7,2,1,0,4,1,0,0,7,5,3,2,4,5,6,7,8,9,8,7,6,5,3],
                    [3,1,7,5,3,0,4,1,2,0,1,3,0,2,6,5,0,1,2,0,3,2,1,3,8,2,9,8,4,0,1,3,0,2,1,4,2,5,7,5,3,2,4,5,6,7,8,9,8,7,6,5,7],
                    [0,3,2,4,1,0,3,2,0,4,3,0,1,0,2,2,0,1,3,0,2,3,0,7,6,5,1,6,5,7,2,1,0,4,1,0,0,2,7,5,3,2,4,5,6,7,8,9,8,7,6,5,1],
                    [0,8,4,0,1,8,0,2,0,1,3,0,4,2,2,0,1,3,0,2,0,1,3,2,6,7,5,1,7,5,6,1,0,3,1,0,4,2,7,5,3,2,4,5,6,7,8,9,8,7,6,5,0] ];
                    
    var reels_1 = [ [7,5,3,2,0,1,3,0,2,2,0,1,3,0,2,4,5,6,7,0,4,1,0,2,3,1,8,2,4,1,0,3,2,1,0,4,6,5,7,5,3,2,4,5,6,7,8,9,8,7,6,5,1],
                    [1,4,5,1,6,5,0,2,1,2,0,1,3,0,2,0,3,4,0,2,3,7,6,1,4,0,3,1,2,6,7,2,1,0,4,1,0,0,7,5,3,2,4,5,6,7,8,9,8,7,6,5,3],
                    [11,1,7,5,3,0,4,1,2,0,1,3,0,2,6,5,0,1,2,0,3,2,1,3,8,2,9,8,4,0,1,3,0,2,1,4,2,5,7,5,3,2,4,5,6,7,8,9,8,7,6,5,7],
                    [0,3,2,4,1,0,3,2,0,4,3,0,1,0,2,2,0,1,3,0,2,3,0,7,6,5,1,6,5,7,2,1,0,4,1,0,0,2,7,5,3,2,4,5,6,7,8,9,8,7,6,5,1],
                    [0,8,4,0,1,8,0,2,0,1,3,0,4,2,2,0,1,3,0,2,0,1,3,2,6,7,5,1,7,5,6,1,0,3,1,0,4,2,7,5,3,2,4,5,6,7,8,9,8,7,6,5,0] ];
                    
    this.reels = [reels_0, reels_1];
}
