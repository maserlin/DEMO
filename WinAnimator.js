/**
 * Co-ordinates win display animations, winlines, sounds (TODO)
 * @param reelset: ref to reelset, can animate any given array of symbols to show win
 * @param winlinesView: draws winlines and symbol bounding boxes
 * @param winSplash: Shows a summary screen with total win amount
 */
function WinAnimator(reelset, winlinesView, winSplash){
    this.reelset = reelset;
    this.winlinesView = winlinesView;
    this.winSplash = winSplash;
    
    this.start = this.start.bind(this);
    this.showNext = this.showNext.bind(this);

    this.onWinSummaryComplete = this.onWinSummaryComplete.bind(this);
    Events.Dispatcher.addEventListener(Event.WIN_SUMMARY_COMPLETE, this.onWinSummaryComplete);

    this.onWinLinesComplete = this.onWinLinesComplete.bind(this);
    Events.Dispatcher.addEventListener(Event.WIN_LINES_COMPLETE, this.onWinLinesComplete);

    this.onSymbolAnimationComplete = this.onSymbolAnimationComplete.bind(this);
    Events.Dispatcher.addEventListener(Event.SYMBOL_ANIMATION_COMPLETE, this.onSymbolAnimationComplete);

    this.onWinSplashComplete = this.onWinSplashComplete.bind(this);
    Events.Dispatcher.addEventListener(Event.WIN_SPLASH_COMPLETE, this.onWinSplashComplete);

    this.onSpin = this.onSpin.bind(this);
    Events.Dispatcher.addEventListener(Event.SPIN, this.onSpin);
}
WinAnimator.prototype.winData = null;
WinAnimator.prototype.reelset = null;
WinAnimator.prototype.winlinesView = null;
WinAnimator.prototype.winSplash = null;
WinAnimator.prototype.timeout = null;



/**
 * If Player spins, clear everything
 */
WinAnimator.prototype.onSpin = function(){
    clearTimeout(this.timeout);    
}



/**
 * Start win display: all winning lines, clearing after a timeout
 */
WinAnimator.prototype.start = function(winData){
    this.winData = winData;
    
    this.winlinesView.showLineSummary(this.winData);
    
    var that = this;
    this.timeout = setTimeout(function(){
        that.winlinesView.removeChildren();
        that.timeout = setTimeout(function(){
            that.onWinSummaryComplete();
        },500);
    },1500);

}

/**
 * Start the win display process with SUMMARY showing all winning lines
 * TODO sync with sound
 */
WinAnimator.prototype.onWinSummaryComplete = function(event){
    this.winShown = 0;
    this.showNext();
}

/**
 * Manage the progress of showing winlines one after the other
 * TODO sync to sound/symbol animations
 */
WinAnimator.prototype.showNext = function(){
    if(this.winShown < this.winData.lines.length){
        var lineId = this.winData.lines[this.winShown];
        this.numOfSymbols = this.winData.winline[this.winShown].length;        
        console.log("Show",this.numOfSymbols,"symbols on line",lineId);
        this.winlinesView.showNextWin(lineId, this.numOfSymbols);
        ++this.winShown;
        
        var symbols = [];
        for(var s=0; s<this.numOfSymbols; ++s){
            symbols.push(GameConfig.getInstance().winlines[lineId][s]);
        }
        console.log("animate symbols " + symbols)
        this.reelset.animate(symbols);
        
    }    
    else{
        this.winSplash.showTotal(this.winData);
    }
};

/**
 * Clear current win display and show next
 * @param event
 */
WinAnimator.prototype.onSymbolAnimationComplete = function(event){
    if(--this.numOfSymbols == 0){
        var that = this;
        this.timeout = setTimeout(function(){
            that.winlinesView.removeChildren();
            that.timeout = setTimeout(function(){
                that.showNext();
            },500);
        },250);
    
    }
}

/**
 * Display win total on splash screen
 * @param event
 */
WinAnimator.prototype.onWinLinesComplete = function(event){
        this.winSplash.showTotal(this.winData);
};

/**
 * Signal that all win animations are shown.
 * @param event
 */
WinAnimator.prototype.onWinSplashComplete = function(event){
    Events.Dispatcher.dispatchEvent(new Event(Event.WIN_ANIMATOR_COMPLETE));  
}

