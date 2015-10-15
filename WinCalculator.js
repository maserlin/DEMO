/**
 * This object is given the new reel positions as a mapping of symbols in view (column x row)
 * and uses it to work out what if anything has been won.
 * Sometimes all this information comes from the Server in a big XML or JSON chunk
 * in which case you could use the DataParser to translate that into a game-friendly format
 * instead of working it out here (which risks exposing game maths etc to the player)
 */
function WinCalculator(){
  this.winlines = GameConfig.getInstance().winlines;

  this.wins = Object.create(null);
  this.wins.winline = [];
  this.wins.lines = [];
  this.wins.winAmount = [];
  this.wins.bonus = null;
};

WinCalculator.WILD = 9;
WinCalculator.BONUS = 11;

/**
 *
 * @returns {Array} bonus win game data
 */
WinCalculator.prototype.getBonusWins = function(){
    return this.wins.bonus.wins.slice(0);
}

/**
 * Create game-specific data of wins etc
 *
 * NOTE THIS CREATES FAKE BONUS WIN PRIZES and ignore anything coming from the server!
 *
 * @param reelMap : 2D array reel x symbol
 */
WinCalculator.prototype.calculate = function(reelMap){
    console.log("WinCalculator calc " + reelMap);

    this.wins = Object.create(null);
    this.wins.winIds = [];
    this.wins.winline = [];
    this.wins.lines = [];
    this.wins.winAmount = [];
    this.wins.bonus = null;

    // For each reel
    for(var r=0; r<reelMap.length; ++r)
    {
        // For each symbol
        for(var s=0; s<reelMap[r].length; ++s)
        {
            // If its a bonus symbol
            if(reelMap[r][s] == WinCalculator.BONUS){
                this.wins.bonus = Object.create(null);

                // Make a data holder and fake up some bonus wins
                this.wins.bonus.wins = [];
                var rand = Math.floor(Math.random()*4)+3;
                for(var p=0; p<rand; ++p)
                {
                    var prize = ((Math.random()*10000)+250);
                    this.wins.bonus.wins.push(prize);
                }
                break;
            }
        }
    }

    // Create winline wins as appropriate to the new reel positions
    for(var line=0; line<this.winlines.length; ++line)
    {
        var winline = this.winlines[line];
        var symbolsOnWinline = [];
        for(var pos in winline){
            symbolsOnWinline.push(reelMap[pos][winline[pos]]);
        }
        //console.log(symbolsOnWinline);
        this.analyseSymbols(line, symbolsOnWinline);
    }

    // Log out some info
    for(var winline in this.wins.winline){
        console.log("WIN Line " + this.wins.lines[winline] + ": " + this.wins.winline[winline] + " pays " + this.wins.winAmount[winline]);
    }
    return this.wins;
}

/**
 * Take a winlineId and the symbols on it, and see if they win anything.
 * @param line : int lineId
 * @param symbols: Symbols on the winline
 */
WinCalculator.prototype.analyseSymbols = function(line, symbols){
    var count = 1;
    
    var nonwilds = [];
    
    // Track which symbols are NOT wild!
    for(var s in symbols){
        if(symbols[s] != WinCalculator.WILD)nonwilds.push(s);
    }
    
    // Wilds win: winAmount is wilds value
    if(nonwilds.length == 0){
        this.wins.winIds.push(WinCalculator.WILD);
        this.wins.winline.push(symbols);
        this.wins.lines.push(line);
        this.wins.winAmount.push(WinCalculator.WILD * 100);
    }
    
    // Symbol win with 4 wilds: winAmount is symbol value
    else if(nonwilds.length == 1){
        this.wins.winIds.push(nonwilds[0]);
        this.wins.winline.push(symbols);
        this.wins.lines.push(line);
        this.wins.winAmount.push((1+symbols[nonwilds[0]]) * 50);
    }
    
    // 
    else{
        // First symbol that's not a wild
        var matchSymbol = null;
        for(var s in symbols){
            if(symbols[s] != WinCalculator.WILD)
            {
                matchSymbol = symbols[s];
                break;
            }
        }

        // Check all symbols against match symbol
        for(var s=1; s<symbols.length; ++s)
        {
            if(this.match(matchSymbol, symbols[s]))++count;
            else break;
        }
        
        // 3 or more symbols match
        if(count > 2)
        {
            this.wins.winIds.push(matchSymbol);
            this.wins.winline.push(symbols.slice(0,count));
            this.wins.lines.push(line);
            this.wins.winAmount.push((1+matchSymbol) * count * 10);
        }
    }
} 


/**
 * 
 * @param {Object} s1 : symbol to match - won't be a wild
 * @param {Object} s2
 */
WinCalculator.prototype.match = function(matchSymbol, s2){
    if( s2 == WinCalculator.WILD )return true;
    if(s2 == matchSymbol)return true;
    return false;
}





















