/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
 * 
 * This class plays game sounds using WebAudio.
 * We maintain an array of source objects, one for each sound.
 * Each of these is an Object of type AudioBufferSourceNode.
 * To play a sound, we set the AudioBufferSourceNode's AudioBuffer with 
 * one of our mp3's in our audioBufferList (provided as a ctr param).
 * 
 * Each sound can start only once and stopped only once after which an exception will be thrown.
 * Therefore we put a new AudioBufferSourceNode and load its AudioBuffer each time
 * we want a sound to play, and null the array position after it's finished.
 * In this way we can manitain a reference to the sound which allows us to stop it early.
 * In the case of looping sounds, this is the only way to stop it!
 * 
 * Update.
 * Looping sounds are now controlled manually by attaching a "looping" property to the 
 * buffer: this is checked in _onSoundComplete and if true the sound is played again.
 * This is because web audio loops play forever until stopped with no event or callback during play.
 * Using this, we can stop looping sounds when the browser is minimised. Here's how: 
 * Our javascript code ceases to run as soon as the browser is minimised, 
 * but the _onSoundComplete function DOES run because it is given as the implementation 
 * to the audioBuffer's onended method. This runs OUTSIDE of the javascript engine and continues to be called
 * whether the browser is minimised or not.
 * OUR code runs an Interval timer which updates a var with the current time.
 * onended checks the new current time against this and stops the sound if the difference is > some offset.
 * Since our interval timer won't update the var when minimised, this difference can trigger us to stop the sound.
 * 
Reply to my query about webAudio to one of the guys who specced it:

First, I’d suggest directing this type of query to the public web-audio list, 
public-audio-dev@w3.org where many other people can see your question and step in.
AudioNode.activeSourceCount and AudioBufferSourceNode.playbackState are not in the 
current rev Web Audio API spec. They were provisional features that were later dropped. 
So if some browsers implement these features, I don’t think you can rely on their continued presence.
The playbackState concept had ambiguity issues and I believe has been dropped 
in favor of event notifications when the state changes. 
activeSourceCount was removed because of similar ambiguity over the definition of “currently playing”.
It should generally be possible to avoid relying on either by having your app keep track of when “upstream sources” 
have been scheduled to produce output.
Hope this helps!

Best,
...Joe

Joe Berkovitz
President

Noteflight LLC
Boston, Mass.
phone: +1 978 314 6271
www.noteflight.com
"Your music, everywhere"

 * 
 */
com.sound.WebAudioController = (function(_super){
    
    var DisplayEvent = com.display.events.DisplayEvent;
    var GameEvent = com.game.fullmoonfortunes.GameEvent;    
    
    /**
     * @param audioContext : a new AudioContext object.
     * The AudioContext interface represents an audio-processing graph built from audio modules 
     * linked together, each represented by an AudioNode. 
     * An audio context controls the creation of the nodes it contains 
     * and the execution of the audio processing, or decoding. 
     * You need to create an AudioContext before you do anything else, 
     * as everything happens inside a context.
     * 
     * @param audioJson : Ashgaming JSON file describing the sounds contained in the audioBufferList.
     * 
     * @param audioBUfferList : an array of mp3's loaded for us by SoundLoader 
     *                          using an  xmlHttpRequest. Each is regarded to be an AudioBuffer as it
     *                          can be used to initialise the AudioBufferSourceNode's AudioBuffer.
     * The AudioBuffer interface represents a short audio asset residing in memory, 
     * created from an audio file using the AudioContext.createBuffer() method. 
     * Once decoded into this form, the audio can then be put into an AudioBufferSourceNode.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
     * The AudioBuffers were created when each file was loaded using the SoundBufferLoader: 
     * on successful loading of each mp3 as an "arraybuffer" it was given to 
     * audioContext.decodeAudioData(bytearray, function, function) which converted it to 
     * a useable AudioBuffer.
     * @see SoundBufferLoader 
     * @see http://docs.webplatform.org/wiki/apis/webaudio/AudioContext/decodeAudioData
     * 
     */
    function WebAudioController(stage, eventManager,
                                audioContext, audioJson, audioBufferList)
    {
        this._gameStage = stage;
        this._eventManager = eventManager;
        this._audioContext = audioContext;
        this._audioJson = audioJson.sounds;
        this._audioBufferList = audioBufferList;
        
        /*
         * Each sound has a play state in its 
         * AudioBufferSourceNode's playbackState property.
         * playbackState doesn't seem to exist now (24/07/2014)
         
        WebAudioController.UNSCHEDULED_STATE = 0;
        WebAudioController.SCHEDULED_STATE = 1;
        WebAudioController.PLAYING_STATE = 2;
        WebAudioController.FINISHED_STATE = 3;        
        */
        
        /*
         * Test an individual sound.
        
        var source1 = this._audioContext.createBufferSource();
        source1.buffer = this._audioBufferList[4];
        source1.connect(this._audioContext.destination);
        source1.start(0);
         */
        this.source = [];
        this._gainNode = [];
        this._createdFadeLoop = [];
        
        trace("WebAudioController created")
    }
    var WebAudioController = newClass(WebAudioController, _super);    
    
    WebAudioController.prototype._gameStage = null;
    WebAudioController.prototype._eventManager = null;
    WebAudioController.prototype._audioContext = null;
    WebAudioController.prototype._audioJson = null;
    WebAudioController.prototype._audioBufferList = null;
    WebAudioController.prototype._gainNode = null;
    WebAudioController.prototype._createdFadeLoop = null;
    WebAudioController.prototype._fadingSound = null;
    WebAudioController.prototype.source = null;
    WebAudioController.prototype.objFocusTimer = null;
    WebAudioController.prototype.focusLastSeen = null;


    /**
     * Get the latest time, to stop loops if minimised.
     */
    WebAudioController.prototype.onFocus = function ()
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
     * Otherwise dispatch SOUND_COMPLETE
     */
    WebAudioController.prototype._okToPlay = function(soundId)
    {
        var okToPlay = true;
        
        if(this._muted || this._audioBufferList[soundId] == null)
        {
            okToPlay = false;
            this._eventManager.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
        }
        
        return okToPlay;
    }

    /**
     * Schedules the start of the playback of the audio asset. 
     * 
     * Each buffer can only play once. If play is called twice, or after 
     * a call to AudioBufferSourceNode.stop(), an exception is raised.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
     * 
     * Therefore we create a new BufferSource each time we want to play a sound 
     * from an asset, and assign the asset as the "buffer".
     * 
     * The when parameter defines when the play will start, offset, which default to 0, 
     * the start of the asset, where it will start, 
     * and duration, which default to the length of the asset minus the value of offset, 
     * the length of the portion of the asset to be played. 
     * If "when" represents a time in the past, the play will start immediately. 
     */
    WebAudioController.prototype.play = function(soundId, blLoop, fade)
    {
        var fadeSound = fade || false;
        
        /* This check is to see if this sound is already playing 
         * (ie spin was clicked while the last spin was still fading out)
         * It will then kill the fading sound and remove it's tick listener
         * ready for a new spin sound to be played starting from full volume
         */
        if(this.isPlaying(soundId) && this.source[soundId].buffer.fade)
        {
            this._gameStage.removeEventListener(DisplayEvent.TICK_EVENT, this._fadeOut);    
            this._stopSound(soundId);
            this._gainNode[soundId] = null;
        }
        
        if( this._okToPlay(soundId) )
        {
            try
            {
                this.source[soundId] = this._audioContext.createBufferSource();
                
                this.source[soundId].buffer = this._audioBufferList[soundId];
                
                /* Check if the sound should be faded and perform particular
                 * actions if it is. Also check that there isn't already a 
                 * fading sound active by seeing if there is a gainNode or not.
                 */
                if(fadeSound)
                {
                    if(!this._gainNode[soundId])
                    {
                        /* If there's nothing already fading then we can
                         * setup the gain node and attach it to our sound
                         * object. We also set up some of its values e.g.
                         * volume and fade which are flags for later use.
                         */
                        this._gainNode[soundId] = this._audioContext.createGain();
                        this.source[soundId].connect(this._gainNode[soundId]);
                        this._gainNode[soundId].connect(this._audioContext.destination);
                        this.source[soundId].buffer.volume = 1;
                        this._gainNode[soundId].gain.value = 1;
                        this.source[soundId].buffer.fade = true;
                        this._createdFadeLoop[soundId] = true;
                    }
                }
                else
                {
                    // If the sound isn't fading, just set it up as normal
                    this.source[soundId].connect(this._audioContext.destination);
                }
                
                /*
                 * Add our own data so we can tell what's playing.
                 * in onended, we can clear the array position for this sound. 
                 */
                this.source[soundId].buffer.id = soundId;
                this.source[soundId].buffer.name = this._audioJson[soundId].name;
                
                this.source[soundId].buffer.looping = blLoop || this._audioJson[soundId].loop;

                // Start or re-start focus check if it's a loop we may have to stop.
                if(this.source[soundId].buffer.looping && this.objFocusTimer == null)
                {
                    this.objFocusTimer = setInterval(this.onFocus, 50);
                }
                
                //trace("WebAudio started id " + soundId + " " + this.source[soundId].buffer.name);
                //trace("WebAudioController activeSourceCount " + this.source.context.activeSourceCount);
                //trace("WebAudioController buffer.duration " + this.source[soundId].gain.value);

                this.source[soundId].onended = this._onSoundComplete;
                
                /*
                 * Support for HTC ONE and older browsers that *do
                 * support webAudio: Use deprecated method noteOn
                 * if start doesn't exist.
                 * Note too though that we are using audioElement for 
                 * HTC ONE as even though noteOn method exists, we 
                 * still can't hear anything!
                 */
                if(this.source[soundId].start)
                {
                    this.source[soundId].start(0);
                }
                else if(this.source[soundId].noteOn)
                {
                    this.source[soundId].noteOn(0);
                }
            }
            catch(e)
            {
                alert("play error " + e.message)
                console.error(e.message);
                console.error("Check soundId " + soundId)
            }
        }
    }

    /**
     * We always dispatch this as any random piece of code may be listening for it
     * Typically symbol win animations but maybe bonus elements too.
     * If we are not playing any sounds we should dispatch too!
     * 
     * NOTE: iPad Air e.currentTarget doesn't exist! try e.target first!
     */
    WebAudioController.prototype._onSoundComplete = function(e)
    {
        var buffer = e.target.buffer || e.currentTarget.buffer;
        //trace("WebAudio sound complete " + buffer.id + " " + buffer.name);
        
        try
        {
            if(buffer != null)
            {
                if(buffer.looping)
                {
                    if( Date.now() - this.focusLastSeen > 500 )
                    {
                        trace("too late for loop")
                        for(var all in this.source)this.source[all].buffer.looping = false;
                        clearInterval(this.objFocusTimer);
                        this.objFocusTimer = null;
                        this.stop(buffer.id);
                        this._eventManager.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
                    }
                    else
                    {
                        /* Here we check that the sound hasn't already been overridden
                         * by another spin etc. If it has then we just let that new override
                         * sound play out and dispatch the SOUND_COMPLETE for this sound that 
                         * has now stopped. If not then we kill the sound's references, dispatch
                         * the event and start playing a new sound (this happens if the sound is
                         * looping, but hasn't begun to fade yet, and hasn't been overridden).
                         */
                        if(this.source[buffer.id].buffer.volume == 1 && !this._createdFadeLoop[buffer.id])
                        {
                            this.source[buffer.id] = null;
                            this._eventManager.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
                            this.play(buffer.id);
                        }
                        else
                        {
                            this._createdFadeLoop[buffer.id] = false;
                            this._eventManager.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
                        }
                    }
                }
                else
                {
                    this.source[buffer.id] = null;
                    this._eventManager.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
                }
            }
            else
            {
                trace("Major problem in onSoundComplete: null buffer. Clearing queue.");
                for(var all in this.source)
                {
                    this.source[all] = null;
                }
                this._eventManager.dispatchEvent(new GameEvent(GameEvent.SOUND_COMPLETE));
            }
        }
        catch(e)
        {
            // --
        }
    }
    
    /**
     * Behaviour for WebAudio is to just play the sound as concurrency is not a problem
     * To interrupt the playing sound call stop first.
     */
    WebAudioController.prototype.playNow = function(soundId, blLoop, fade)
    {
        if(!this._muted)
        {
            this.play(soundId, blLoop, fade);            
        }
    }
    
    /**
     * Behaviour for webAudio is to just play the sound as we can have concurrent sounds.
     * This method is really only useful for altering SoundSprite behaviour, as we don't
     * want overlay sounds to play as they will cancel the background music or loop.
     */
    WebAudioController.prototype.playOver = function(soundId, blLoop, fade)
    {
        if(!this._muted)
        {
            this.play(soundId, blLoop, fade);            
        }
    }

    /**
     * No idea how to handle this right now...
     * playbackState has been deprecated apparently in favour of callbacks 
     * but I don't know what they are.
     * PLUS playbackState seems to have disappeared even though I haven't updated my browser recently!? 
     */
    WebAudioController.prototype.isPlaying = function(soundId)
    {
        if( this.source[soundId] != null)
        {
            return true;
            /*
            if( this.source[soundId].playbackState == WebAudioController.SCHEDULED_STATE ||
                this.source[soundId].playbackState == WebAudioController.PLAYING_STATE )
            {
                return true;
            }
            */
        }
        return false;
    }
    
    /**
     * Stop a specific sound, if not defined then stop all. 
     * Schedules the end of the playback of an audio asset. 
     * The when parameter defines when this will happen. 
     * If it represents a time in the past, the playback will end immediately. 
     * If this method is called twice or more, an exception is raised.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
     *
     * Therefore: CAREFUL: It can take time to stop a sound! If you start it again immediately
     * it will start before the last playout has stopped.
     * In the _onSoundComplete handler, the array pos for the sound will be set to null
     * AFTER restarting it, so you'll never be able to stop it again.
     */
    WebAudioController.prototype.stop = function(soundId)
    {
        //trace("WebAudio stop " + soundId)
        if(soundId)
        {
            /* If the sound exists and is flagged as wanting to fade
             * then we store the id of the sounds to fade, and we add
             * a tick event to do the fade out. If not then we just stop
             * the sound as normal.
             */
            if(this.source[soundId] && this.source[soundId].buffer.fade)
            {
                this._fadingSoundId = soundId;
                this._gameStage.addEventListener(DisplayEvent.TICK_EVENT, this._fadeOut);   
            }
            else
            {
                this._stopSound(soundId);
            }
        }
        else
        {
            for(var soundId in this.source)
            {
                this._stopSound(soundId);
            }
        }
    }
    
    /* _fadeOut will be called by a tick event to fade out any sounds that
     * have specified they need to fade when they are stopped.
     */
    WebAudioController.prototype._fadeOut = function()
    {
        // check that the sound hasn't been removed already for some reason
        if(this._gainNode[this._fadingSoundId])
        {
            // continue decrementing the volume until it reaches 0
            if(this._gainNode[this._fadingSoundId].gain.value > 0)
            {
                this._gainNode[this._fadingSoundId].gain.value -= 0.015;
                if(this._gainNode[this._fadingSoundId].gain.value <= 0)
                {
                    // once the volume is at 0 we remove the tick event, and stop the sound that was being faded.
                    this._gameStage.removeEventListener(DisplayEvent.TICK_EVENT, this._fadeOut);    
                    this._stopSound(this._fadingSoundId);
                    this._gainNode[this._fadingSoundId] = null;
                }
            }
        }
        else
        {
            // if for some reason the gainNode is missing, we just kill the sound and the fade.
            this._gameStage.removeEventListener(DisplayEvent.TICK_EVENT, this._fadeOut);    
            this._stopSound(this._fadingSoundId);
            this._gainNode[this._fadingSoundId] = null;
        }
    }
    
    /**
     * Calling stop will run _onSoundComplete, for looping or non-looping sounds.
     * Schedules the end of the playback of an audio asset. 
     * The when parameter defines when this will happen. 
     * If it represents a time in the past, the playback will end immediately. 
     * If this method is called twice or more, an exception is raised.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
     *
     * Therefore: CAREFUL: It can take time to stop a sound! If you start it again immediately
     * it will start before the last playout has stopped.
     * In the _onSoundComplete handler, the array pos for the sound will be set to null
     * AFTER restarting it, so you'll never be able to stop it again.
     */
    WebAudioController.prototype._stopSound = function(soundId)
    {
        if(this.source[soundId] != null)
        {
            if( this.isPlaying(soundId) )
            {
                //trace("WebAudio stopping soundId " + this.source[soundId].buffer.id + " " + this.source[soundId].buffer.name + " state " + this.source[soundId].playbackState)
                
                /*
                 * NOTE param 0 not required on desktop but if missing will crash android native browser.
                 * HTC ONE requires older impl. (noteOff) - note though that still doesn't produce
                 * anything audible so we have a fiddle to force it to audioElement in SoundLoader!
                 */
                try
                {
                    this.source[soundId].buffer.looping = false;
                    
                    if(this.source[soundId].stop)
                    {
                        this.source[soundId].stop(0);
                    }
                    else if(this.source[soundId].noteOff)
                    {
                        this.source[soundId].noteOff(0);
                    }
                }
                catch(e)
                {
                    trace("Error stopping soundId " + soundId)
                }
            }
        }
        else
        {
            //trace("source soundId " + soundId + " is null")
        }
    }
    
    /**
     * Call stop and mute 
     */
    WebAudioController.prototype.stopAll = function()
    {
        this.stop();
        this._muted = true;
    }
    
    /**
     * May not be correct to unmute here
     */
    WebAudioController.prototype.resume = function()
    {
        this._muted = false;
    }

    return WebAudioController;
})(com.sound.Controller);
