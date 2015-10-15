/**
 * This module handles communication between the game and the server.
 * It can be loaded on a per-platform basis to change deployment capability.
 * @param server url string where to send requests
 * @param dataParser to decode requests into a game-friendly format regardless of response format.
 */
function ServerProxy(server, dataParser){
    this._dataParser = dataParser;
    this._server = server;
    this._objComms = new Comm();

    this.receiveResponse = this.receiveResponse.bind(this);
    this.receiveErrorResponse = this.receiveErrorResponse.bind(this);
    this.serverTimeout = this.serverTimeout.bind(this);
    this._objComms.setHandlerTime(this.serverTimeout, 3000);

    trace("Created ServerProxy");
}
ServerProxy.prototype._dataParser = null;
ServerProxy.prototype._requestData = null;
ServerProxy.prototype._requestCode = null;
ServerProxy.prototype._objComms = null;
ServerProxy.prototype._timeOfLastBet = 0;
ServerProxy.BET_INTERVAL = 3000;
    

/**
 *
 * @param {Object} data: JSON from game
 */
ServerProxy.prototype.makeRequest = function(jsonData)
{
    //trace("ServerProxy.prototype.makeRequest " + JSON.stringify(jsonData));
    this._requestCode = jsonData.code;
    switch(this._requestCode)
    {
        /*
         * Init request initialises this._timeOfLastBet
         */
        case Event.INIT:
            this._requestData = this._dataParser.buildInitRequest();
            this._sendRequest();
        break;

        /*
         * In some jurisdictions bet requests must be at least 3 seconds apart even in turbo
         * The following code delays sending a Bet until 3000ms have passed since the previous bet.
         * Works in normal, turbo, autoplay and turbo autoplay modes.
         * Freespins are unaffected as they do not use the server on VF.
         */
        case Event.BET:
        {
            this._requestData = this._dataParser.buildSpinRequest(jsonData);

            // Find out how long since the last bet was sent.
            var timeElapsed = (new Date().getTime() - this._timeOfLastBet);

            /*
             * If less than the interval set a timeout to send the bet.
             * The delay is 3 seconds minus time already elapsed.
             * NB could just set timeout with (ServerProxy.BET_INTERVAL-timeElapsed) as -ive values
             * *should* be OK ... but better safe than sorry.
             */
            if(timeElapsed < ServerProxy.BET_INTERVAL)
            {
                setTimeout(this._sendRequest, (ServerProxy.BET_INTERVAL - timeElapsed));
                //trace("timeElapsed only",timeElapsed,"Send bet in",(ServerProxy.BET_INTERVAL - timeElapsed))
            }
            else
            {
                this._sendRequest();
            }
        }
        break;
    }

};

/**
 * on BetRequest : Sent after a minimum of 3 seconds has elapsed since the last request.
 */
ServerProxy.prototype._sendRequest = function()
{
    //trace("Sending request after",((new Date().getTime() - this._timeOfLastBet)/1000),"seconds")
   // var server = wrapper.getGameEndpointUrl();
   console.log(this._server);

   // Post to server, wait for response
   this._objComms.doPost(this._server, this._requestData, this.receiveResponse, this.receiveErrorResponse);

    // Get new time of last bet.
    this._timeOfLastBet = new Date().getTime();
};

    
/**
 *
 * @param {Object} data: xml from server:
 * listen for Event.VALID_RESPONSE_RECEIVED to pick up parsed data
 */
ServerProxy.prototype.receiveResponse = function(responseData)
{
    //trace("ServerProxy.receiveResponse " + responseData);
    if(this._dataParser.parseResponse(this._requestCode, responseData) == false)
    {
        var data;
        if (  responseData.indexOf('noFunds') > 0  ) {
            data = "noFunds";
        }
        else {
            data = "serverError";
        }

        // Can be helpful to split responses up:
        switch(this._requestCode){
            case Event.INIT:
                Events.Dispatcher.dispatchEvent(new Event(Event.INVALID_INIT_RESPONSE_RECEIVED, data));
                break;
            case Event.BET:
                Events.Dispatcher.dispatchEvent(new Event(Event.INVALID_RESPONSE_RECEIVED, data));
                break;
        }
    }
    else
    {
        // Can be helpful to split responses up:
        switch(this._requestCode){
            case Event.INIT:
                Events.Dispatcher.dispatchEvent(new Event(Event.VALID_INIT_RESPONSE_RECEIVED));
                break;
            case Event.BET:
                Events.Dispatcher.dispatchEvent(new Event(Event.VALID_RESPONSE_RECEIVED));
                break;
        }
    }
};

/**
 *
 * @param responseData
 */
ServerProxy.prototype.receiveErrorResponse = function(responseData){
    console.log( "Received error response with responseData \"" + responseData + "\"" );
    console.log( "TAKING NO ACTION");
}

/**
 * Server timeout: no response received.
 * Stop reels safely & show error dialog.
 * This demo: fabricate a valid result for testing.
 */
ServerProxy.prototype.serverTimeout = function(){
    console.log( "ServerProxy.prototype.serverTimeout");
        // Can be helpful to split responses up:
        switch(this._requestCode){
            case Event.INIT:
                Events.Dispatcher.dispatchEvent(new Event(Event.INVALID_INIT_RESPONSE_RECEIVED));
                break;
            case Event.BET:
                Events.Dispatcher.dispatchEvent(new Event(Event.INVALID_RESPONSE_RECEIVED));
                break;
        }
}
