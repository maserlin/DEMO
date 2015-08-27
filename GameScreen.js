/**
 * Base class for all game screens
 * @constructor
 */
function GameScreen(){
    PIXI.Container.call(this);
}
GameScreen.prototype = Object.create(PIXI.Container.prototype);
GameScreen.constructor = GameScreen;

GameScreen.prototype.responseReceived = function(data){
    console.log("GameScreen.responseReceived",data);
}
GameScreen.prototype.invalidResponseReceived = function(data){
    console.error("GameScreen.invalidResponseReceived",data);
}