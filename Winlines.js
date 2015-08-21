console.log("Winlines.js loaded")
/**
 * This class draws basic winlines linking up the symbols in a win for each given winline 
 * It also draws basic bounding boxes around each symbol in a win linked with a line to join them up.
 * Its base class is a PIXI.Container. Use addChild to display graphics.
 */
function Winlines(){
    PIXI.Container.call(this);
    
    // Data about symbol sizes and positions.
    this.symbolData = Reelset.symbolData;

    this.show = this.show.bind(this);
    this.showLineSummary = this.showLineSummary.bind(this);
    this.showWin = this.showWin.bind(this);
        

    /*
     * UNCOMMENT TO TEST
     * LineId, numOfSymbols to highlight    
     */
    // this.showWin(5,5);
    
    this.onSpin = this.onSpin.bind(this);
    Events.Dispatcher.addEventListener(Event.SPIN, this.onSpin);
    
    /*
     * Line button positioning (not onscreen yet):
     * Provides spacing for winlines so they don't all draw
     * on top of each other!
     * LEFT top to bottom:  18, 2, 16, 11, 15, 1, 8, 17, 20, 3
     * RIGHT top to bottom: 4, 12, 7, 9, 14, 10, 6, 13, 19, 5
     * 
     * Line starts on row 0:    2, 4, 6 , 12, 16, 18
     * Line starts on row 1:    1, 8, 9, 10, 11, 14, 15
     * Line starts on row 2:    3, 5, 7, 13, 17, 19, 20
     */
    this.ySpacing = [0, -36, 18, -30, 36, -18, 12, 6, -6, 12, -12, -12, 24, 18, -18, -6, 30, 24, -24, 6];
    
    this.winShown = 0;
    
    /*
     * Runs attractor mode or comment it out &
     * uncomment this._showLines to show all lines. 
     */ 
    if(this.demoMode){
        this.demoLines();
        //this._showLines([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]);
    }
}
Winlines.prototype = Object.create(PIXI.Container.prototype);
Winlines.constructor = Winlines;
Winlines.prototype.symbolData = null;
Winlines.prototype.ySpacing = null;
Winlines.prototype.colours = null;
Winlines.prototype.colour = null;
Winlines.prototype.winShown = 0;
Winlines.prototype.winData = null;
Winlines.prototype.lineWidth = 6;
Winlines.prototype.rounding = 3;
Winlines.prototype.demoMode = false;


/**
 * Clear everything off the screen when SPIN called. 
 */
Winlines.prototype.onSpin = function(event){
    this.demoMode = false;
    this.removeChildren();
    clearTimeout(this.timeout);
}

/**
 * Runs demo mode attractor 
 */
Winlines.prototype.demoLines = function(){
    
    // Cycle around if we've done the last one    
    if(this.winShown == GameConfig.getInstance().winlineColours.length){
        this.removeChildren();
        this.winShown = 0;   
    }
    
    var that = this;
    this.timeout = setTimeout(function(){
        that._showLines([that.winShown]);
        ++that.winShown;
        that.demoLines();
    },150);
}


/**
 * Show a complete winline with bounding boxes.
 * TODO Show win amount.
 * Sets up for a sequence and uses showNext to display results in order.
 */
Winlines.prototype.show = function(winData){
    this.winData = winData;
    this.winShown = 0;
    this.showNext();
}

/**
 * Show line summary 
 * winData: Object containing array of all line IDs to show
 */
Winlines.prototype.showLineSummary = function(winData){
    this.winData = winData;
    this.demoMode = false;
    this.winShown = 0;
    this._showLines(this.winData.lines);
}

/**
 * WinSummary: call with an array of winlines to display all together. 
 */
Winlines.prototype._showLines = function(lineIds){
    var gfx = new PIXI.Graphics();
    var dropShadowOffset = new Point(2,2);
    
    gfx.lineStyle(this.lineWidth, 0x000000, 0.4);
    gfx.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    var offsets = new Point(2,2);
    for(var line in lineIds){
        this.drawLine(gfx, lineIds[line], offsets);
    }

    gfx.blendMode = PIXI.BLEND_MODES.NORMAL;

    for(var line in lineIds){
        gfx.lineStyle(this.lineWidth, GameConfig.getInstance().winlineColours[lineIds[line]]);
        this.drawLine(gfx, lineIds[line]);
    }
    
    this.addChild(gfx);
    
    // Do not dispatch this if we are running the attractor
/*
    if(!this.demoMode){
        var that = this;
        this.timeout = setTimeout(function(){
            that.onSummaryComplete();
        },1500);
    }
*/
};

/**
 * 
 */
Winlines.prototype.onSummaryComplete = function(){
    this.removeChildren();
        this.timeout = setTimeout(function(){
            Events.Dispatcher.dispatchEvent(new Event(Event.WIN_SUMMARY_COMPLETE));
        },300);
}

/**
 * Win Summary display mode:
 * Draws a complete winline across the reels extending beyond the reels frame on both sides. 
 */
Winlines.prototype.drawLine = function(gfx, lineId, dropShadowOffset){

    var xoff = dropShadowOffset == null ? 0 : dropShadowOffset.x;
    var yoff = dropShadowOffset == null ? 0 : dropShadowOffset.y;
    
    yoff += this.ySpacing[lineId];    

    var symbols = [];
    for(var s in GameConfig.getInstance().winlines[lineId]){
        symbols.push(GameConfig.getInstance().winlines[lineId][s]);
    }
    
    var w = this.symbolData[0][0].width/2;
    var h = this.symbolData[0][0].height/2;
    
    gfx.moveTo(this.symbolData[0][symbols[0]].x-36 + xoff, this.symbolData[0][symbols[0]].y + h + yoff);

    for(var s in symbols){
        gfx.lineTo(this.symbolData[s][symbols[s]].x + w + xoff, this.symbolData[s][symbols[s]].y + h + yoff)       
    }
    
    gfx.lineTo(this.symbolData[s][symbols[s]].x + (w*2) + xoff + 36, this.symbolData[s][symbols[s]].y + h + yoff)       
}

/**
 * Show the next in the win sequence: when being managed by THIS  

Winlines.prototype.showNext = function(){
    
    this.removeChildren();
    
    if(this.winShown < this.winData.lines.length){
        this.showWin(this.winData.lines[this.winShown],this.winData.winline[this.winShown].length);
        ++this.winShown;
    }    
    else{
        Events.Dispatcher.dispatchEvent(new Event(Event.WIN_LINES_COMPLETE));
    }
}
 */
/**
 * Show the next in the win sequence: when being managed by WinAnimator
 */
Winlines.prototype.showNextWin = function(line, numSymbols){
    
    this.removeChildren();
    this.showWin(line, numSymbols);
}

/**
 * Draws a set of bounding boxes around the relevant win sybmols, with linking lines.
 */
Winlines.prototype.showWin = function(lineId, symbolsInWin){
    
    // Get fresh data in case of resizing
    this.symbolData = Reelset.symbolData;
    
    // Set winline colour
    this.colour = GameConfig.getInstance().winlineColours[lineId];
    
    var gfx = new PIXI.Graphics();
    var dropShadowOffset = new Point(2,2);
    
    gfx.lineStyle(this.lineWidth, 0x000000, 0.4);
    gfx.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    
    var rounding = 0;

    // 
    for(var s=0; s<symbolsInWin; ++s){
        // console.log("ShowWinBox on symbol, line " + lineId + " " + GameConfig.getInstance().winlines[lineId][s]);  
        var reel = s;
        var symbol = GameConfig.getInstance().winlines[lineId][s];
        this.drawBoundingBox(gfx, reel, symbol, dropShadowOffset);
        if(s < symbolsInWin-1){
            var nextSymbol = GameConfig.getInstance().winlines[lineId][s+1];
            this.drawLink(gfx, reel, symbol, nextSymbol, dropShadowOffset);
        }
    }
    
    gfx.lineStyle(this.lineWidth, this.colour);
    gfx.blendMode = PIXI.BLEND_MODES.NORMAL;
    
    for(var s=0; s<symbolsInWin; ++s){
        // console.log("ShowWinBox on symbol, line " + lineId + " " + GameConfig.getInstance().winlines[lineId][s]);  
        var reel = s;
        var symbol = GameConfig.getInstance().winlines[lineId][s];
        this.drawBoundingBox(gfx, reel, symbol);
        if(s < symbolsInWin-1){
            var nextSymbol = GameConfig.getInstance().winlines[lineId][s+1];
            this.drawLink(gfx, reel, symbol, nextSymbol);
        }
    }

    this.addChild(gfx);
/*
    
    var that = this;
    this.timeout = setTimeout(function(){
        that.removeChildren();
        that.timeout = setTimeout(that.showNext,500);
    },1500);
*/

}

/**
 * draws the little bits of winlines that link the symbols to each other. 
 */
Winlines.prototype.drawLink = function(gfx,reel,symbol,nextSymbol,dropShadowOffset){
    
    var xoff = dropShadowOffset == null ? 0 : dropShadowOffset.x;
    var yoff = dropShadowOffset == null ? 0 : dropShadowOffset.y;
    
    var w = this.symbolData[0][0].width;
    var h = this.symbolData[0][0].height;
    
    if(symbol == nextSymbol){
        gfx.moveTo(this.symbolData[reel][symbol].x + w + xoff, this.symbolData[0][symbol].y+(h/2) + yoff);
        gfx.lineTo(this.symbolData[reel+1][nextSymbol].x + xoff, this.symbolData[reel+1][nextSymbol].y+(h/2) + yoff)       
    }
    else if(symbol < nextSymbol){
        if(nextSymbol-symbol == 1){
            gfx.moveTo(this.symbolData[reel][symbol].x + w + xoff, this.symbolData[0][symbol].y+h + yoff);
            gfx.lineTo(this.symbolData[reel+1][nextSymbol].x + xoff, this.symbolData[reel+1][nextSymbol].y + yoff)       
        }
        else{
            gfx.moveTo(this.symbolData[reel][symbol].x + (w*0.75) + xoff, this.symbolData[0][symbol].y+h + yoff);
            gfx.lineTo(this.symbolData[reel+1][nextSymbol].x + (w*0.25) + xoff, this.symbolData[reel+1][nextSymbol].y + yoff)       
        }
    }
    else{
        if(symbol-nextSymbol == 1){
            gfx.moveTo(this.symbolData[reel][symbol].x + w + xoff, this.symbolData[0][symbol].y + yoff);
            gfx.lineTo(this.symbolData[reel+1][nextSymbol].x + xoff, this.symbolData[reel+1][nextSymbol].y+h + yoff)       
        }
        else{
            gfx.moveTo(this.symbolData[reel][symbol].x + (w*0.75) + xoff, this.symbolData[0][symbol].y + yoff);
            gfx.lineTo(this.symbolData[reel+1][nextSymbol].x + xoff + (w*0.25), this.symbolData[reel+1][nextSymbol].y+h + yoff)       
        }
    }
}



/**
 * draws a single bounding box
 */
Winlines.prototype.drawBoundingBox = function(gfx, reel, symbol, dropShadowOffset){
    // console.log("Draw bounding box " + reel + "," + symbol);
    
    var xoff = dropShadowOffset == null ? 0 : dropShadowOffset.x;
    var yoff = dropShadowOffset == null ? 0 : dropShadowOffset.y;
    
    // draw a rectangle
    if(this.rounding == 0){
        gfx.drawRect( this.symbolData[reel][symbol].x+xoff, this.symbolData[reel][symbol].y+yoff,
                      this.symbolData[reel][symbol].width+xoff, this.symbolData[reel][symbol].height+yoff);
    }    
    else{
        gfx.drawRoundedRect( this.symbolData[reel][symbol].x+xoff, this.symbolData[reel][symbol].y+yoff,
                      this.symbolData[reel][symbol].width+xoff, this.symbolData[reel][symbol].height+yoff, this.rounding);
    }
}

