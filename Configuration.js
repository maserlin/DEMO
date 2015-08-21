/**
 * Base configuration file for all games. Singleton!
 */

var config = null;

function Configuration(){
    this.setWinlines();
}

/**
 * simple singleton: feel free to improve on this implenetation :) 
 */
Configuration.getInstance = function(){
    if(config == null)config = new Configuration();
    return config;
}
Configuration.prototype.serverUrl = null;
Configuration.prototype.winlines = null;
Configuration.prototype.winlines = null;
Configuration.prototype.reels = null;
Configuration.prototype.startTiming = [0,200,400,600,800];
Configuration.prototype.stopTiming = [0,200,400,600,800]
Configuration.prototype.allow = function(){
    console.log("ALLOW");
}

Configuration.prototype.setWinlines = function(){
    this.winlines = [[1,1,1,1,1],// 1
                    [0,0,0,0,0],// 2
                    [2,2,2,2,2],// 3
                    [0,1,2,1,0],// 4
                    [2,1,0,1,2],// 5
                    [0,0,1,2,2],// 6
                    [2,2,1,0,0],// 7
                    [1,0,0,0,1],// 8
                    [1,2,2,2,1],// 9
                    [1,0,1,0,1],// 10
                    [1,2,1,2,1],// 11
                    [0,1,0,1,0],// 12
                    [2,1,2,1,2],// 13
                    [1,1,0,1,1],// 14
                    [1,1,2,1,1],// 15
                    [0,1,1,1,0],// 16
                    [2,1,1,1,2],// 17
                    [0,2,0,2,0],// 18
                    [2,0,2,0,2],// 19
                    [2,2,0,2,2]];// 20

    this.winlineColours = [0xfe3f3f,0xfec53f,0x8c3f87,0xfe3cb0,0xd88c3f,
    0x65fe8c,0xfe8c3f,0xb23ffe,0xb0b0fe,0xb03c3c,
    0xbb3d7d,0x3f3ffe,0xfe8c8c,0x3f8b3f,0xfefe3f,
    0x3f3fb1,0xfeb3fe,0x3ffefe,0x9c7147,0x40d740];
}
