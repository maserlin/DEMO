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
    // Spin button based on a normal 3-state button(up, pressed, inactive)
    this.spinButton = new SpinButton("playbutton",0,100,"spin");
    this.cheatButton = new MovieClipButton("Icon05",0,300,"cheat");

    this.addChild(this.spinButton);
    this.addChild(this.cheatButton);
        
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

Console.prototype.show = function(){
    this.spinButton.setVisible(true);
    this.cheatButton.setVisible(true);
}
Console.prototype.hide = function(){
    this.spinButton.setVisible(false);
    this.cheatButton.setVisible(false);
}
Console.prototype.enable = function(){
    this.spinButton.setEnable(true);
    this.cheatButton.setEnable(true);
}
Console.prototype.disable = function(){
    this.spinButton.setEnable(false);
    this.cheatButton.setEnable(false);
}


Console.prototype.resize = function(event){
    var data = event.data;
    
    // Scale both by X to maintain aspect ratio
    this.scale.x = data.scale.x * Console.scaleDown;
    this.scale.y = data.scale.x * Console.scaleDown;
    
}

















