/**
 * Original file to load WebAudio with AudioElement fallback.
 * DOESN'T WORK!
 * For some reason the audioElement loading code only works in the contructor
 * of this object, and nowhere else. Have not go tto the bottom of this so we are
 * going with the code in SoundLoader.js at least for now due to pressure of time.
 * This file is kept as a useful resource to see what not to do, at least...
 */
com.sound.SoundLoader = (function(_super){
    
    var GameConfiguration = com.game.fullmoonfortunes.GameConfiguration;
    var GameEvent = com.game.fullmoonfortunes.GameEvent;
    var DataLoader = com.utils.dataLoader.DataLoader;
    var DataLoaderEvent = com.utils.dataLoader.DataLoaderEvent;
    var SoundController = com.game.SoundController;
    var DisplayEvent = com.display.events.DisplayEvent;
    var LayoutManager = com.utils.layout.LayoutManager;
    var SoundBufferLoader = com.sound.SoundBufferLoader;
    
    /**
     * SoundLoader is created when Player clicks "Play With Sound".
     * First get the JSON file so we can either control the SoundSprite 
     * or control the order of loading individual files.
     * Then determine whether to use web audio or HTML audio?
     */
    function SoundLoader(displayContainer, eventManager)
    {
        trace("SOUND LOADER");
        this._displayContainer = displayContainer;
        this._eventManager = eventManager;
        
        var config = GameConfiguration.getInstance();
        SoundLoader.started = true;
        
        // Flash loading sound message
        var layout = LayoutManager.getInstance().getLayout("SoundLoader");
        this._text = layout.getChildByName("txtLoadingSound");
        //this._displayContainer.addChild(this._text);
        this._frameCount = 0;
        this._showLoadingMessage = false;
        //this._displayContainer.stage.addEventListener(DisplayEvent.TICK_EVENT, this._onTick);

        /* 
         * Get JSON to control sound sprite or control order of loading sound files.
         */
        var loader = new DataLoader();
        loader.addEventListener(DataLoaderEvent.LOAD_COMPLETE, this._onSoundJsonLoaded);
        loader.load(config.strSoundResPath + config.strSoundFilename + ".json");
    }
    var SoundLoader = newClass(SoundLoader, _super);
    
    // Stuff :)
    SoundLoader.prototype._strAudioSrc = null;
    SoundLoader.prototype._strAudioType = null;    
    SoundLoader.prototype._audioElement = null;
    SoundLoader.prototype._webAudio = null;
    SoundLoader.prototype._soundJson = null;
    SoundLoader.prototype._bufferList = null;
    SoundLoader.prototype._eventManager = null;
    SoundLoader.prototype._displayContainer = null;
    SoundLoader.prototype._frameCount = null;
    SoundLoader.prototype._showLoadingMessage = null;
    SoundLoader.started = false;
    
    /**
     * If anything goes wrong with audio, either document.createElement or the newer
     * web audio, this is where we should finish: 
     * Remove the onscreen LOADING message
     * Set loadingError to true to stop us trying again if the player clicks the unmute sound button.
     * Signal the sidebar (not applicable to GTS Wrapper) to X the sound button. 
     */
    SoundLoader.prototype._loadAudioError = function(e)
    {
        if(e)trace("Load audio error " + e.message);
        this._showLoadingMessage = false;
        this._eventManager.dispatchEvent(new GameEvent(GameEvent.DISABLE_SOUND_BUTTON));
    }
    
   /*
    * Watch out! Applies to ALL HTC!
    * Force native browser to audioElement
    */
    SoundLoader.prototype._isHtcNative = function()
    {
        if( String(navigator.userAgent).indexOf("HTC") > -1)
        {
            /*
             * native keywords in userAgent:
             * "Mozilla" "Android" "HTC_One" "AppleWebKit" "KHTML like Gecko" "Mobile Safari"
             * Chrome keywords in userAgent:
             * "Mozilla" "Android" "HTC One" "AppleWebKit" "KHTML like Gecko" "Chrome" "Mobile Safari"
             */
            if( String(navigator.userAgent).indexOf("Chrome") == -1 )
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Convert data to JSON and determine whether to use HTML audio or web audio. 
     */    
    SoundLoader.prototype._onSoundJsonLoaded = function(event)
    {
        trace("_onSoundJsonLoaded");
        
        event.target.removeEventListener(DataLoaderEvent.LOAD_COMPLETE, this._onSoundJsonLoaded);
        
        try
        {
            this._soundJson = JSON.parse(event.target.data);
        }
        /*
         * If JSON conversion errors don't try to initialise sound.
         * itemsLoaded will never reach 2.
         * Flag to remove loading message/clean up resources
         */
        catch(e)
        {
            trace("Error parsing sound JSON");
            this._loadAudioError(e);
            return;
        }
        
        /*
         * Can we use webkit audio? No need to trap errors creating this and 
         * disable sounds in the game as we have a fallback. If THAT fails, though,
         * we need to deal with it.
         */
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        
        /*
         * This comes up as OK on native android, yet when we try to 
         * use it, this._audioElement = new AudioContext() throws "AudioContext is not defined" exception 
         * on *some* devices: S4 native seems OK
         */
        if(window.AudioContext != undefined && this._isHtcNative() == false)
        {
            this._createWebAudio();
        }
        else
        {
            this._createAudioElement();
        }
    }
    
    /** 
     * window.audioContext exists. Try to create webAudio. 
     */    
    SoundLoader.prototype._createWebAudio = function()
    {
        //alert("create WebAudio")
        try
        {
            /*
             * Note: We may be here on native android, which supports the audioContext idea
             * but throws an error if you actually try to instantiate one! Hence the try..catch
             * which throws us back to creating audioElement.
             */
            this._webAudio = new AudioContext();
            
            var filenames = [];
            for(var all in this._soundJson.sounds)
            {
                // Load individual files according to their order in the JSON
                filenames.push(GameConfiguration.getInstance().strSoundResPath + this._soundJson.sounds[all].filename);
            }
            
            /*
             * Note we are ignoring load errors unless we are left with no sounds at all, 
             * as web audio can still play those sounds that did load even if one or two are missing. 
             */
            var bufferLoader = new SoundBufferLoader(this._webAudio, filenames, this._onFinishedLoading);
            bufferLoader.load();
        }
        // Fallback to HTML audioElement on error
        catch(e)
        {
            this._webAudio = null;
            this._createAudioElement();
        }
    }
    
    /*
     * OK: we have the JSON and the bufferList (array of audio files)
     * from kicking off a web audio load. If there are NO SOUNDS loaded
     * then we should try the fallback, otherwise go with what we have.
     * 
     * Because we are creating null placeholders in the buffrList array for missing sounds,
     * we need a quick check to make sure ALL the sounds aren't missing!
     */
    SoundLoader.prototype._onFinishedLoading = function(bufferList)
    {
        var isEmpty = true;
        for(all in bufferList)if(bufferList[all] != null)isEmpty = false;
        
        if(bufferList.length != 0 && !isEmpty)
        {
            this._audioElement = null;
            this._bufferList = bufferList;
            this._initialiseSoundController();   
        }
        else
        {
            this._webAudio = null;
            this._bufferList = null;
            this._createAudioElement();
        }
    }
    
    
    /**
     * Listen out for AudioElement src file loading if we are doing AudioElement (SoundSprite) sounds
     * and the oncanplaythrough event is not supported by the browser's audioElement object.
     * 
     * Flash the Loading sounds message.
     */
    SoundLoader.prototype._onTick = function()
    {
        // This is set false on error or loaded
        if(this._showLoadingMessage)
        {
            if(++this._frameCount >= 60)
            {
                this._frameCount = 0;
                this._text.visible = false;//!this._text.visible;
            }
        }
        // Remove listener etc
        else
        {
            this._displayContainer.stage.removeEventListener(DisplayEvent.TICK_EVENT, this._onTick);
            this._displayContainer.removeChild(this._text);
            this._text = null;
            this._displayContainer = null;
            this._frameCount = null;
            this._showLoadingMessage = null;
        }
    }
    
    /**
     * If we can't even get this working, we have no sounds at all.
     */
    SoundLoader.prototype._createAudioElement = function()
    {
        try
        {
            /*
             * Create on the fly for HTC/Native. Get from page doesn't work!
             */
            if(this._isHtcNative())
            {
                this._audioElement = document.createElement ('audio');
                this._audioElement.id = AUDIO.ELEMENT;
                this._audioElement.type = AUDIO.MP3;
                document.getElementsByTagName('body')[0].appendChild(this._audioElement);
            }
            /*
             * Works for all others. Get from page.
             */
            else
            {
                this._audioElement = document.getElementById(AUDIO.ELEMENT);
            }
            
            // Ready: go for it.
            this._loadAudioSrc();
        }
        catch(e)
        {
            trace("Error creating document audio element");
            this._loadAudioError(e);
        }
    }   
        
    /**
     * document.createElement ('audio') appeared worked OK but if 
     * this.setAudioSource fails it means that this._audioElement is not operable:
     * Therefore no sounds are available to the game.
     */
    SoundLoader.prototype._loadAudioSrc = function()
    {
        if( this._audioElement != null && this.setAudioSource() == true )
        {
            trace("Sound src=" + this._strAudioSrc);
            this._audioElement.src = this._strAudioSrc;

            this._audioElement.addEventListener("canplaythrough",this._onSoundLoaded);            
            this._audioElement.addEventListener("error",this._onSoundLoadedError);            

            /*
             * *should* fire these events in this order
             * loadstart
             * durationchange
             * loadedmetadata
             * loadeddata
             * progress
             * canplay
             * canplaythrough
             * @see http://www.w3schools.com/tags/av_event_progress.asp
             */
            // Go
            this._audioElement.load();
        }
        else
        {
            trace("Audio not supported");
            this._loadAudioError(e);
        }
    }
    
    
    /**
     * Bad filename or similar... quit loading process 
     */
    SoundLoader.prototype._onSoundLoadedError = function(e)
    {
        trace("_onSoundLoadedError");
        this._audioElement.removeEventListener("canplaythrough",this._onSoundLoaded);            
        this._audioElement.removeEventListener("error",this._onSoundLoadedError);            
        this._loadAudioError(e);
    }
    
    /**
     * When audio obj reports that it "canplaythrough" we are ready to start using sounds,
     * so long as the JSON file is loaded too.
     * IF that method is supported! GalaxyS4 native doesn't recognise this!
     */
    SoundLoader.prototype._onSoundLoaded = function(e)
    {
        trace("_onSoundLoaded " + e.target.id);

        this._audioElement.removeEventListener("canplaythrough",this._onSoundLoaded);            
        this._audioElement.removeEventListener("error",this._onSoundLoadedError);            
        
        // #voodoo from prev framework.. ios workaround? Remove?
        try
        {
            this._audioElement.play();
            this._audioElement.pause();
            this._initialiseSoundController();
        }
        catch(e)
        {
            this._loadAudioError({message:"audioElement cannot play/pause"});
        }
    }
    
    
    /**
     * Ready to start. Flag resources ready to remove in the _onTick
     * and kisk off the SoundSpriteController. 
     */
    SoundLoader.prototype._initialiseSoundController = function()
    {
        var audio = this._webAudio || this._audioElement;
        
        // disable sound button if no audio.
        if(audio == null)
        {
            this._loadAudioError({message:"No audio object available."});            
        }
        // else init SoundController with whatever we have.
        else
        {
            this._showLoadingMessage = false;
            SoundController.initialise(audio, this._soundJson, this._bufferList);
        }
        
        // Always send this
        this._eventManager.dispatchEvent(new GameEvent(GameEvent.SOUND_LOADING_COMPLETE));
    }

    /**
     * Determine the correct audio file to load: mp3, m4a, ogg
     * According to Mark Claxton, Playtech only want mp3 support though.
     */
    SoundLoader.prototype.setAudioSource = function()
    {
        var blnAudioSupported = true;
        var config = GameConfiguration.getInstance();

        if (this.audioSupport(AUDIO.MP3))
        {
            this._strAudioSrc = config.strSoundResPath + config.strSoundFilename + config.strBitrate + '.mp3';
            this._strAudioType = AUDIO.MP3;
        } 
        else
        {
            blnAudioSupported = false;
        }

        return blnAudioSupported;
    }
    
    /**
     * Determine whether document audio support exists.
     */
    SoundLoader.prototype.audioSupport = function( strFormat )
    {
        return !!(this._audioElement.canPlayType && this._audioElement.canPlayType(strFormat).replace(/no/, ''));
    }

    //
    return SoundLoader;
})();

function AUDIO()
{
}
AUDIO.OGG = "audio/ogg";
AUDIO.MP4 = "audio/mp4";
AUDIO.AAC = "audio/x-aac";
AUDIO.MP3 = "audio/mpeg";
AUDIO.WAV = "audio/vnd.wave";
AUDIO.BUTTON = "iosAudioButton";
AUDIO.ELEMENT = "audioElement";   

/*
 * Previous framework #voodoo: keep for reference for now.
 * this seems to get HTC ONE working... and apparently Desire HD.
 * Have checked with an alert: it only fires once.
 * @see http://stackoverflow.com/questions/13716731/html5-audio-not-playing-multiple-times-in-android-4-0-4-device-native-browser
 * also arcticAdventure.SoundSprite.js for similar workaround.
 * @see http://stackoverflow.com/questions/12325787/setting-the-granularity-of-the-html5-audio-event-timeupdate

if (String(navigator.userAgent).indexOf("HTC") > -1)
{
    var that = this;
    this._audioElement.addEventListener('timeupdate', function() {
     if (that._audioElement.currentTime >= ( that._audioElement.duration - 0.3 ) ) {
      that._audioElement.currentTime = 0;
      that._audioElement.pause();
      that._audioElement.removeEventListener('timeupdate');
     }
    }, false); 
}
*/
