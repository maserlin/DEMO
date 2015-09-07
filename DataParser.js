/**
 * Game specific data parser.
 *
 * NOTE this file is very disorganised. Its function is to decode server responses and translate them
 * into a format that any game can read, in order to display the results to the Player.
 * Exactly how you do this depends on what the server is returning:
    * XML
    * JSON
    * name-value string
    * masses of data or just new reel positions and balance
 * and what you think the game will require:
     * XML that it can decode on the fly
     * JSON that it can read directly
     * some other proprietary format.
 * In addition you can code this file as an Object to be passed around, a Singleton (since there should
 * only ever be ONE of these) or a static object (same reason).
 *
 * One way to use it: decode the server response and return true or false (for valid or invalid response/server error)
 * then signal the game using Events that the response is ready so it can stop the reels and collect whatever
 * parts of the response it requires in its own time.
 */
    
    function DataParser(){
        this.x2js = new xml2json();
        console.log("Created DataParser");
        this.winCalculator = new WinCalculator();

        this.responseIsValid = this.responseIsValid.bind(this);
        this.cleanObject = this.cleanObject.bind(this);
        this.parseResponse = this.parseResponse.bind(this);
    }
    // Parses XML string or dom doc to Json
    DataParser.prototype.x2js = null;
    // Used to create results JSON from new reel positions and reelsetId
    DataParser.prototype.winCalculator = null;
    // Storage for SPIN requests: Use in case of ERROR to contruct safe return data
    DataParser.prototype.spinRequestJson = Object.create(null);
    // Server responses are converted to JSON for easy processing.
    DataParser.prototype.serverResponseJson = Object.create(null);
    // Returned to game as the results object (config, spin, etc)
    DataParser.prototype.resultsJson = Object.create(null);

/**
 *
 */
DataParser.prototype.buildInitRequest = function()
{
    var objConfiguration = Object.create(null);
    objConfiguration.strGameTitle ="AG-FullMoonFortunes";

    return '<InitRequest gameTitle="' + objConfiguration.strGameTitle + '" />';
};

/**
 *
 * @param {Object} jsonData
 *
 * <CompositeRequest>
    <PlaceBetRequest gameTitle="AG-FullMoonFortunes">
    <Bet stake="2.00" winlines="20"/>
    </PlaceBetRequest />
    </CompositeRequest>
 */
DataParser.prototype.buildSpinRequest = function (jsonData)
{
    // Used to construct an error response ONLY.
    this.spinRequestJson = jsonData;

    // Init output.
    var strSpinRequest="";

    var title = "PIXI_TEST_GAME";//GameConfiguration.getInstance().strGameTitle;

    // Bet Request. Check input is in fact a bet request.
    if( jsonData.code == "BET")//GameEvent.BetRequest )
    {
        strSpinRequest = '<PlaceBetRequest gameTitle=\"' + title + '">';
        strSpinRequest += '<' + jsonData.code + ' stake="' + (jsonData.stake/100).toFixed(2) +
                          '" winlines="' + jsonData.winlines +
                          '" foitems="' + jsonData.foitems;
        strSpinRequest += '" />';
    }

    //
    return strSpinRequest;
};

/**
 * Check for a valid response ie no error codes etc
 * some operators have a "max win" which must not be exceeded. This is a PITA
 * and there needs to be code to deal with that if required.
 */
DataParser.prototype.responseIsValid = function( responseData )
{
    /*
     * In freespins the server will return an error for ALL freespin results
     * that follow a freespin with maxWin=true. We DON'T want to flag this:
     * Allow the game to play out!
     */
    if(responseData.match(/Freespins/i)){
        if(responseData.match(/error/i)){
            if(!responseData.match(/maxWin="true"/i)){
                return false;
            }
        }
    }
    else if(responseData.match(/error/i)){
        return false;
    }

    return true;
};

/**
 * Used to delete all data from data holders to make sure memory is reused and
 * old data does not pollute the current result
 * @param dataobj
 */
DataParser.prototype.cleanObject = function(dataobj)
{
    for(var prop in dataobj){
        delete dataobj[prop];
    }
};
    
/**
 *
 * @param code: passed in to be attached to response, identifies response type.
 * @param responseXml : received from server for translation to common data format.
 */
DataParser.prototype.parseResponse = function( code, responseXml )
{
    // New data to return to game
    this.cleanObject(this.resultsJson);

    // Attach id code
    this.resultsJson.code = code;

    // Check validity
    if(this.responseIsValid(responseXml)==false){
        this.resultsJson.Error = true;
        return false;
    }

    //
    switch(code)
    {
        case Event.INIT:
        {
            /*
             * Sets the GameConfiguration up with the server data:
             * Winlines, reels, stakes etc
             */
            this._parseInitXml(responseXml);

            // TODO IF there is a Wrapper to deal with: Initial Balance
            //wrapper.setBalance(Number(this.serverResponseJson.InitResponse.Balances.Balance[0]._amount));
        }
        break;

        case Event.BET:
        {
            // Test with a single freespin which hits maxWin
            //responseXml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><PlaceBetResponse gameId="39"><Jackpots/><Balances><Balance amount="2190.40" category="TOTAL" currency="GBP" name="Total"/><Balance amount="2190.40" category="CASH" currency="GBP" name="Cash"/></Balances><Outcome balance="2190.40"><Spin layout="2" maxWin="false" position="2,4,25,2,0" spinWin="2.50" stake="2.00" symbols="0,12,3,2,12,0,11,0,1,11,1,3,10,11,9" totalWin="2.50"><Winlines><Winline count="3" id="0" symbol="0" symbols="12,12,0,1,11" win="5"/><Winline count="3" id="10" symbol="0" symbols="12,0,0,3,11" win="5"/><Winline count="4" id="14" symbol="1" symbols="12,12,1,1,11" win="10"/><Winline count="3" id="15" symbol="0" symbols="0,12,0,1,10" win="5"/></Winlines><Bonus id="0" indices="1,4" multiplier="0" position="12" win="0.00"/><Freespins award="7" index="0" multiplier="4" value="6,9,13"/></Spin><Freespin award="7" freespinsWin="7.50" index="7" indices="1,6,13" layout="14" maxWin="true" multiplier="4" position="36,18,16,11,28" spinWin="7.50" stake="2.00" symbols="3,12,6,6,1,0,12,2,0,0,1,4,1,12,2" totalWin="10.00"><Winlines><Winline count="3" id="7" symbol="6" symbols="12,6,12,0,12" win="40"/><Winline count="3" id="8" symbol="0" symbols="12,0,0,4,12" win="5"/><Winline count="5" id="13" symbol="1" symbols="12,1,12,1,12" win="30"/></Winlines></Freespin><Error msg="Invalid request"/><Error msg="Invalid request"/><Error msg="Invalid request"/><Error msg="Invalid request"/><Error msg="Invalid request"/><Error msg="Invalid request"/><DrawState drawId="0" state="closed"><Bet payout="10.00" pick="" seq="0" stake="2.00" type="L" won="true"/></DrawState></Outcome></PlaceBetResponse>'
            // Test with second freespin hitting maxWin
            //responseXml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><PlaceBetResponse gameId="39"><Jackpots/><Balances><Balance amount="2190.40" category="TOTAL" currency="GBP" name="Total"/><Balance amount="2190.40" category="CASH" currency="GBP" name="Cash"/></Balances><Outcome balance="2190.40"><Spin layout="2" maxWin="false" position="2,4,25,2,0" spinWin="2.50" stake="2.00" symbols="0,12,3,2,12,0,11,0,1,11,1,3,10,11,9" totalWin="2.50"><Winlines><Winline count="3" id="0" symbol="0" symbols="12,12,0,1,11" win="5"/><Winline count="3" id="10" symbol="0" symbols="12,0,0,3,11" win="5"/><Winline count="4" id="14" symbol="1" symbols="12,12,1,1,11" win="10"/><Winline count="3" id="15" symbol="0" symbols="0,12,0,1,10" win="5"/></Winlines><Bonus id="0" indices="1,4" multiplier="0" position="12" win="0.00"/><Freespins award="7" index="0" multiplier="4" value="6,9,13"/></Spin><Freespin award="7" freespinsWin="7.50" index="7" indices="1,6,13" layout="14" maxWin="false" multiplier="4" position="36,18,16,11,28" spinWin="7.50" stake="2.00" symbols="3,12,6,6,1,0,12,2,0,0,1,4,1,12,2" totalWin="10.00"><Winlines><Winline count="3" id="7" symbol="6" symbols="12,6,12,0,12" win="40"/><Winline count="3" id="8" symbol="0" symbols="12,0,0,4,12" win="5"/><Winline count="5" id="13" symbol="1" symbols="12,1,12,1,12" win="30"/></Winlines></Freespin><Freespin award="7" freespinsWin="7.50" index="7" indices="1,6,13" layout="14" maxWin="true" multiplier="4" position="36,18,16,11,28" spinWin="7.50" stake="2.00" symbols="3,12,6,6,1,0,12,2,0,0,1,4,1,12,2" totalWin="10.00"><Winlines><Winline count="3" id="7" symbol="6" symbols="12,6,12,0,12" win="40"/><Winline count="3" id="8" symbol="0" symbols="12,0,0,4,12" win="5"/><Winline count="5" id="13" symbol="1" symbols="12,1,12,1,12" win="30"/></Winlines></Freespin><Error msg="Invalid request"/><Error msg="Invalid request"/><Error msg="Invalid request"/><Error msg="Invalid request"/><Error msg="Invalid request"/><DrawState drawId="0" state="closed"><Bet payout="10.00" pick="" seq="0" stake="2.00" type="L" won="true"/></DrawState></Outcome></PlaceBetResponse>'

            // Parses incoming XML to serverResponseAsJSON
            this._parseResultXml(responseXml);

            /*
             * Uses serverResponseAsJSON to create result set in JSON format for Game
             * *MAY* throw an error in edge cases such as one single freespin that reaches
             * maxWin returned in the results, as the Edge implementation returns the results
             * in a different format to usual in this case :(
             */
            try{
                this._createResultsResponse();
            }
            catch(e){
                console.error("Error creating game results from " + responseXml);
            }
        }
        break;

        case Event.BALANCE_UPDATE_REQUEST:
        {
            // parse the balance
            var newBalance = responseXml.substring(responseXml.indexOf("balance=") + 9, responseXml.indexOf("/")-1);

            // Update messenger model balance
            //wrapper.setBalance(Number(newBalance));
        }

        break;
    }

    return true;
};
    
    /**
     * Create valid game configuration from the details passed in by the server
     * (balance, stakes, winlines, reels, symbols etc)
     * @param {Object} responseXml
     */
    DataParser.prototype._parseInitXml = function (responseXml)
    {
        var xmlDoc = createDoc(responseXml);
        this.cleanObject(this.serverResponseJson);
        this.serverResponseJson = this.x2js.xml2json(xmlDoc);

        /*
         * Construct game initialisation objects..
         */ 
        //GameConfiguration.getInstance().storeCurrencyDetails(this.serverResponseJson.InitResponse.Balances.Balance[0]);
        //GameConfiguration.getInstance().createGameConfiguration(this.serverResponseJson.InitResponse);
    };

    
    /**
     * Turn the server response into some JSON we can work with.
     * It will be further transformed into a platfor-independent format
     * in _createResultsResponse
     * "<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <PlaceBetResponse gameId="1">
            <Jackpots/>
            <Balances>
                <Balance amount="398.70" category="TOTAL" currency="GBP" name="Total"/>
                <Balance amount="398.70" category="CASH" currency="GBP" name="Cash"/>
            </Balances>
            <Outcome balance="398.70">
                <Spin layout="0" maxWin="false" position="2,7,12,5,29" spinWin="0.70" stake="2.00" symbols="6,2,0,2,1,11,9,6,0,1,2,7,11,2,3">
                    <Winlines>
                        <Winline count="3" id="7" symbol="2" symbols="2,2,9,1,2" win="7"/>
                    </Winlines>
                </Spin>
                <DrawState drawId="0" state="betting">
                    <Bet pick="" seq="0" stake="2.00" type="L" won="pending"/>
                </DrawState>
            </Outcome>
        </PlaceBetResponse>"
     */
    DataParser.prototype._parseResultXml = function(responseXml)
    {
        //console.log(responseXml);
    
        var xmlDoc = createDoc(responseXml);
        this.cleanObject(this.serverResponseJson);
        this.serverResponseJson = this.x2js.xml2json(xmlDoc);
        
        /*
         * Work with just the Spin results. Include latest balance. If there's no wins the main screen
         * will update balance to latest; this will include any new funds added as a result of low balance
         * message to player. 
         */
        this.objResultsJson = this.serverResponseJson.PlaceBetResponse.Outcome.Spin;
        this.objResultsJson.flBalance = this.serverResponseJson.PlaceBetResponse.Balances.Balance[0]._amount;
        
        // If freespins, store like this.
        if(this.serverResponseJson.PlaceBetResponse.Outcome.Freespin)
        {
            this.objResultsJson.Freespins.Freespin = [];
            try
            {
                for(var result in this.serverResponseJson.PlaceBetResponse.Outcome.Freespin)
                {
                    this.objResultsJson.Freespins.Freespin.push(this.serverResponseJson.PlaceBetResponse.Outcome.Freespin[result]);
                }
            }
            catch(e)
            {
                //alert("DataParser.prototype.parseResultXml")
            }
        
        }
    };
    
    
    DataParser.prototype.getReelStops = function(){
        return this.resultsJson.Spin.stops;
    }
    DataParser.prototype.getReelLayout = function(){
        return this.resultsJson.Spin.layout;
    }
    DataParser.prototype.getBonusWins = function(){
        return this.winCalculator.getBonusWins();
    }
    DataParser.prototype.getWinData = function(){
        return this.winData;
    }

    
    /**
     * Use the received XML or other response, now parsed to JSON,
     * to create platform-independent JSON for the game.
     * There are MANY ways to do this: Via a Singleton, via static data object/s,
     * by using the XML directly extracting the required results JIT in the code,
     * by parsing to JSON and using that, by converting to a common data format
     * for all games to reduce overhead in the gamecode.
     * Whichever method you use is up to you.
     *
     * In this demo I am using the client-side WinCalculator object to work out
     * the game-specific results from the reel positions supplied by the server.
     *
     * A truly dumb client decodes the response or uses it directly to drive the game interface,
     * but some server only send the reel positions through, leaving the results calculation to the client.
     * this also exposes some of the underlying maths to the Player should they care to look :-(
     */
    DataParser.prototype._createResultsResponse = function ()
    {
        this.resultsJson.Spin = Object.create(null);
        this.resultsJson.Spin.layout = parseInt(this.objResultsJson._layout, 10);

        // Get new stop positions as ints
        this.resultsJson.Spin.stops = this.objResultsJson._position.split( "," );
        for( i in this.resultsJson.Spin.stops )
        {
            this.resultsJson.Spin.stops[i] = parseInt( this.resultsJson.Spin.stops[i], 10 );
        }

        var reelMap = [];
        // Ensure ints for array of final symbols-in-view.
        var arrSymbols = this.objResultsJson._symbols.split( "," );
        for( i in arrSymbols )
        {
            arrSymbols[i] = parseInt( arrSymbols[i], 10 );
        }

        for( var s = 0; s < arrSymbols.length; s += 3 )
        {
            reelMap.push( arrSymbols.slice( s, 3 + s ) );
        }

        this.winData = this.winCalculator.calculate( reelMap );
    }

/**
 * BAD SERVER RESPONSE: FAKE A RESULT FOR PLAY-FOR-FREE
 * TODO make a safe result to stop the reels not showing wins
 * There are many ways of doing this:
 * We could fake up the serverResponseJson and parse as if it were real.
 * We can construct resultsJson directly as we are doing here: we need to maintain a fake balance though.
 *
 * Note the only part we are really using at present are the reelset (layout) and stop positions (stops):
 * the game uses WinCalculator to work everything out from that. This is probably the wrong approach
 * since it exposes some game maths : often the Server returns a totally complete set of results with instructions
 * to the client on how to display them, but this is specific to every platform/engine combination.
 */
DataParser.prototype.createErrorResult = function(){
    this.resultsJson.Spin = Object.create(null);

    if(this.spinRequestJson.foitems != null){
        this.resultsJson.Spin.layout = this.spinRequestJson.foitems.shift();
        this.resultsJson.Spin.stops = this.spinRequestJson.foitems.slice(0,5);
    }
    else{
        this.resultsJson.Spin.stops = [];

        // Create bonus result based on RNG
        if(Math.floor(Math.random() * GameConfig.getInstance().bonusChance) == 0){
            this.resultsJson.Spin.layout = 1;

            // Set stops
            for(var reel in GameConfig.getInstance().reels[this.resultsJson.Spin.layout]){
                var stop =  Math.floor( Math.random() * GameConfig.getInstance().reels[this.resultsJson.Spin.layout][reel].length );
                this.resultsJson.Spin.stops.push(stop);
            }

            // Show bonus symbol on the middle reel
            var reel = GameConfig.getInstance().reels[this.resultsJson.Spin.layout][2];
            var index = reel.indexOf(11);
            var offset = (Math.floor( (Math.random() * 10) ) %3 )-1;
            index = (index + offset + reel.length) % reel.length;
            this.resultsJson.Spin.stops[2] = index;
        }
        // no bonus
        else{
            this.resultsJson.Spin.layout = 0;
            for(var reel in GameConfig.getInstance().reels[this.resultsJson.Spin.layout]){
                var stop =  Math.floor( Math.random() * GameConfig.getInstance().reels[this.resultsJson.Spin.layout][reel].length );
                this.resultsJson.Spin.stops.push(stop);
            }
        }
    }

    // -- Got stops and layout: get symbols in view

    var reelMap = [];

    // Ensure ints for array of final symbols-in-view.
    var arrSymbols = this.getSymbolsInView();

    for( var s = 0; s < arrSymbols.length; s += 3 ){
        reelMap.push( arrSymbols.slice( s, 3 + s ) );
    }

    this.winData = this.winCalculator.calculate( reelMap );
}

/**
 * Get a linear list of all the symbols the player can see.
 * @returns {Array}
 */
DataParser.prototype.getSymbolsInView = function(){
    var symbolsInView = [];
    var reels = GameConfig.getInstance().reels[this.resultsJson.Spin.layout];
    var stops = this.resultsJson.Spin.stops;
    for(var r=0; r<reels.length; ++r){
        for(var s=0; s<GameConfig.getInstance().symbolsInView; ++s ){
            var index = this.getWrappedIndex(reels[r], stops[r] + (s-1));
            symbolsInView.push(reels[r][index]);
        }
    }
    return symbolsInView;
}

/**
 * Ensure new index position is +tive and wrapped to length of reel
 * @param reel
 * @param index
 * @returns {number}
 */
DataParser.prototype.getWrappedIndex = function(reel, index){
    return (reel.length + index) % reel.length;
}

/**
 *
 */
DataParser.prototype.buildBalanceUpdateRequest = function (){
    return "<CustomerBalanceRequest />";
};

/**
 * Helper object
 */
function WinlineResult(jsonData)
{
    this.intId = parseInt(jsonData._id, 10);
    this.intSymbolId = parseInt(jsonData._symbol, 10);
    this.intCount = parseInt(jsonData._count, 10);
    this.flWin = parseFloat(jsonData._win);
    this.arrSymbols = jsonData._symbols.split(",");
}

WinlineResult.prototype.intId;
WinlineResult.prototype.intSymbolId;
WinlineResult.prototype.intCount;
WinlineResult.prototype.flWin;
WinlineResult.prototype.arrSymbols;


