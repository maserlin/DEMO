    /**
     * @param {Object} objAudio : an audio element attached to the html.body
     * @param {Object} objAudioJson : control data fro the sound spritesheet
     */
    function SoundSpriteController(objAudio, objAudioJson)
    {
        this._queue = [];
        this._state = SoundSpriteController.PAUSED;

        this.objAudio = objAudio;
        this.objAudio.addEventListener('timeupdate', this._onPlaying);
        this.objAudioJson = objAudioJson;

        this.objFocusTimer = setInterval(this.onFocus, 50);


        this.onFocus = this.onFocus.bind(this);
        this._okToPlay = this._okToPlay.bind(this);
        this.play = this.play.bind(this);
        this.playOver = this.playOver.bind(this);
        this.playNow = this.playNow.bind(this);
        this._processQueue = this._processQueue.bind(this);
        this._onSeeking = this._onSeeking.bind(this);
        this.isPlaying = this.isPlaying.bind(this);
        this._onPlaying = this._onPlaying.bind(this);
        this.stop = this.stop.bind(this);
        this.stopAll = this.stopAll.bind(this);
        this.resume = this.resume.bind(this);
        this._clearQueue = this._clearQueue.bind(this);


        trace("SoundSpriteController created")
    }
    /*
     * These check focus in an interval by getting Date.now.
     * It stops being run if the browser is minimised, and 
     * in the loop code for the sound (_onPlaying), 
     * if (Date.now - this.focusLastSeen >= 500) stops the loop
     * and cancels the interval.
     * The interval is started in processQueue if objFocusTimer == null
     * and we are starting a looping sound.
     * It runs continually unless the above condition is hit, whe we cancel it
     * as it can still run (slower) when browser is minimised!
     */
    SoundSpriteController.prototype.objFocusTimer = null;
    SoundSpriteController.prototype.focusLastSeen = 0;
    
    SoundSpriteController.prototype._state = null;
    SoundSpriteController.PLAYING = "playing";
    SoundSpriteController.SEEKING = "seeking";
    SoundSpriteController.PAUSED = "paused";
    
    SoundSpriteController.prototype.objAudio = null;
    SoundSpriteController.prototype.objAudioJson = null;

    SoundSpriteController.prototype._soundId = null;
    SoundSpriteController.prototype._startTime = null;
    SoundSpriteController.prototype._endTime = null;
    SoundSpriteController.prototype._loop = null;
    SoundSpriteController.prototype._queue = null;

    /**
     * Get the latest time, to stop loops if minimised.
     */
    SoundSpriteController.prototype.onFocus = function ()
    {
        try
        {
            this.focusLastSeen = Date.now();
        }
        catch(e)
        {
            // --
        }
    }
    
    /**
     * Quick check to see if we can play a sound.
     * If ANY condition is met, it's not OK.
     */
    SoundSpriteController.prototype._okToPlay = function(soundId)
    {
        var okToPlay = true;
        
        if(this._muted || this.objAudioJson.sounds[soundId] == null)
        {
            okToPlay = false;
            Events.Dispatcher.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
        }
        
        return okToPlay;
    }
    
    /**
     * Play a sound. This adds our sound to the queue rather than playing immediately.
     * We add the sound params to a queue list and then call processQueue which will 
     * only continue if we are in PAUSED state.
     * If another sound is already playing, processQueue will be called again
     * when it's done.
     * 
     * If not initialised i.e. no sounds, code should have no effect,
     * 
     * @param soundId : one of the above ids
     * @param blLoop : an override for the JSON setting if we need to do that.
     */
    SoundSpriteController.prototype.play = function(soundId, blLoop)
    {
        if( this._okToPlay(soundId) )
        {
            var obj = Object.create(null);
            obj.soundId = soundId;
            obj.loop = blLoop;
            this._queue.push(obj);

            this._processQueue();
        }
    }
    
    /**
     * Only play this sound if no other sounds are playing or queued. 
     */
    SoundSpriteController.prototype.playOver = function(soundId, blLoop)
    {
        if(this._state == SoundSpriteController.PAUSED && this._queue.length == 0)
        {
            this.play(soundId, blLoop);
        }   
    }
    
    
    /**
     * Sound requested to be played immediately, cancelling whatever is currently 
     * in the queue. We can stop sound and clear the queue regardless of whether
     * we are correctly initialised or muted.
     * 1. Stop the current sound.
     * 2. Clear the queue.
     * 3. Play new sound.
     * Example use: reelsController will interrupt the spin loop with a windup loop
     * if it detects 2 or more scatters landing.
     */
    SoundSpriteController.prototype.playNow = function(soundId, blLoop)
    {
        this.stop();
        this._clearQueue();
        this.play(soundId, blLoop);
    }
    
    /**
     * Process next in queue if there is a next item, and if not busy.
     * Set up the current parameters from the queue.
     * Set the objAudio current time to the start and begin seek. 
     */
    SoundSpriteController.prototype._processQueue = function()
    {
        if(this._queue.length > 0 && this._state == SoundSpriteController.PAUSED)
        {   
            this._state = SoundSpriteController.SEEKING;   
            
            var obj = this._queue.shift();
            this._startTime = this.objAudioJson.sounds[obj.soundId].start;
            this._endTime = this.objAudioJson.sounds[obj.soundId].end;
            this._loop = obj.loop || this.objAudioJson.sounds[obj.soundId].loop; 
            
            //
            this._soundId = obj.soundId;
            
            //trace("Seek sound id " + obj.soundId + " " + this.objAudioJson.sounds[obj.soundId].name)
            obj = null;

            globalTicker.add(this._onSeeking);
            this.objAudio.currentTime = String(this._startTime);
        }
    }
    
    
    /**
     * Delay start of sound while playhead is seeking to new position. 
     * Using Math.floor to ignore minor differences in the decimal :
     * playhead might be at 117.3710045758230208 and start time might be just 117.371!
     * This is browser-dependant! i.e. Chrome behaves itself and native doesn't IME.
     */
    SoundSpriteController.prototype._onSeeking = function()
    {
        var now = this.focusLastSeen;
        try{
            now = Date.now();
        }
        catch(e){
        }
        
        if( now - this.focusLastSeen > 250 )
        {
            this.objAudio.pause();
            this._state = SoundSpriteController.PAUSED;
            return;    
        }

        //trace("this.objAudio.currentTime " + this.objAudio.currentTime + " : " + this._startTime)
        if( Math.floor(Number(this.objAudio.currentTime)) == Math.floor(this._startTime) )
        {
            globalTicker.remove(this._onSeeking);
            
            this.objAudio.currentTime = String(this._startTime);
            this._state = SoundSpriteController.PLAYING;   
            
            this.objAudio.play();
            Events.Dispatcher.dispatchEvent(new GameEvent(GameEvent.SOUND_START));
        }
    }

    /**
     * 
     */
    SoundSpriteController.prototype.isPlaying = function(soundId)
    {
        // If not paused we are seeking or playing
        if(this._state != SoundSpriteController.PAUSED)
        {
            if(soundId == this._soundId)
            {
                return true;
            }
        }
        
        return false;
    }

    /**
     * While playing, detect end of sound
     * Loop if appropriate, else stop sound and do next in queue if not muted.
     */
    SoundSpriteController.prototype._onPlaying = function()
    {
        var now = this.focusLastSeen;
        try{
            now = Date.now();
        }
        catch(e){
        }
        
        if( now - this.focusLastSeen > 250 )
        {
            this.objAudio.pause();
            this._state = SoundSpriteController.PAUSED;
            return;    
        }
        
        if( Number(this.objAudio.currentTime) >= this._endTime )
        {
            /*
             * If looping, continue until STOP is called by the code that  
             * started the sound off: Usually we're talking spin loop/ReelsController
             * or BigWin Countup etc.
             */
            if( this._loop )
            {
                // Each time sound completes            
                Events.Dispatcher.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
                
                /*
                 * Check elapsed time before looping. If it's been too long
                 * (interval continues to run when minimised, but slowly)
                 * cancel the looping sound and the interval.
                 */
                try
                {
                    if( now - this.focusLastSeen < 250 ) // 500 )
                    {
                        // Go round again
                        this.objAudio.currentTime = String(this._startTime);
                        this._state = SoundSpriteController.SEEKING;   
                        globalTicker.add(this._onSeeking);
                    }
                    else
                    {
                        trace("too late for loop")
                        this.stop();
                        clearInterval(this.objFocusTimer);
                        this.objFocusTimer = null;
                    }
                  
                }
                catch(e)
                {
                    // --    
                }
            } 
            
            /*
             * Not looping: Stop sound and process next if we haven't been muted
             * while that sound was playing: if we have clear the queue and go silent.
             */
            else
            {
                this.stop();
                
                if(!this._muted)
                {
                    this._processQueue();
                }
                else
                {
                    this._clearQueue();
                }
            
            }
        }
    }
    
    /**
     * Should have no effect if there are no sounds!
     * Example use: SpinScreen will call stop when all reels have stopped,
     * ending the spin loop or windup sound, whichever is playing.
     */
    SoundSpriteController.prototype.stop = function(soundId)
    {
        // If a sound has been specified
        if(soundId)
        {
            // Sound currently playing
            if(this._soundId == soundId)
            {
                this.objAudio.pause();
                this._state = SoundSpriteController.PAUSED;
                Events.Dispatcher.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
            }
            // Not playing: remove from queue if found.
            else
            {
                for(var all in this._queue)
                {
                    var obj = this._queue[all];
                    if(obj.soundId == soundId)
                    {
                        this._queue[all] = null;
                        break;
                    }
                }    
            }
        }
        // No specific sound to stop: stop all
        else
        {
            this.objAudio.pause();
            this._state = SoundSpriteController.PAUSED;
            Events.Dispatcher.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
        }
    }
    
    /**
     * 
     */
    SoundSpriteController.prototype.stopAll = function()
    {
            this.objAudio.pause();
            this._state = SoundSpriteController.PAUSED;
    }

    /**
     * 
     */
    SoundSpriteController.prototype.resume = function()
    {
        this._processQueue();
    }
    
    /**
     * A sound was requested which should override whatever is currently playing,
     * or we completed a sound and found we are muted.
     */
    SoundSpriteController.prototype._clearQueue = function()
    {
        while( this._queue.length > 0 )
        {
            var obj = this._queue.shift();
            obj = null;
        }
    }
