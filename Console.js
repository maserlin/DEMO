console.log("Console.js loaded");
/**
 * The Console contains all the UI components for basic interaction - spin button,
 * stake up/down, etc
 * as such the components can be overlaid on the game, handled as a group and repositioned/scaled
 * as a group or individually to suit. Spin button can be given methods to draw left or right side, etc.
 */
function Console()
{
    PIXI.Container.call(this);
//    this.spinButton = new SpinButton("playbutton");
    this.spinButton = new SpinButton("Icon06_",0,100,"spin");
    this.cheatButton = new SpinButton("Icon05_",0,300,"cheat");

    this.addChild(this.spinButton.button);
    this.addChild(this.cheatButton.button);
        
    this.enable = this.enable.bind(this);
    
    this.disable = this.disable.bind(this);
    Events.Dispatcher.addEventListener(Event.SPIN,this.disable);

    this.resize = this.resize.bind(this);
    Events.Dispatcher.addEventListener(Event.RESIZED, this.resize);
}
Console.prototype = Object.create(PIXI.Container.prototype);
Console.constructor = Console;
Console.prototype.spinButton = null;
Console.scaleDown = 0.85;

/**
 * TODO stake buttons etc, get real value of player choice
 * @returns {number} total bet in cents.
 */
Console.prototype.getTotalBetInCents = function(){
    return 200;
}

/**
 * player sometimes has the option to change the number of winlines in play
 */
Console.prototype.getNumberOfWinlinesSelected = function(){
    return GameConfig.getInstance().getNumberOfWinlines();
}

Console.prototype.enable = function(){
    this.spinButton.setVisible(true);
    this.cheatButton.setVisible(true);
}
Console.prototype.disable = function(){
    this.spinButton.setVisible(false);
    this.cheatButton.setVisible(false);
}


Console.prototype.resize = function(event){
    var data = event.data;
    
    // Scale both by X to maintain aspect ratio
    this.scale.x = data.scale.x * Console.scaleDown;
    this.scale.y = data.scale.x * Console.scaleDown;
    
}

















