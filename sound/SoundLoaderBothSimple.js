/*
 * This version working for native, chrome, iOS and HTC_ONE
 * Notes:
 * Load audioElement from page if not HTC, otherwise create on the fly.
 * HTC ONE supports web audio, but the older style (noteOn/noteOff NOT start/stop)
 * BUT though we support both in WebAudioController we still can't hear anything
 * SO we're using a test on navigator.userAgent to force use of audioElement.
 * 
 * Creating audioElement in the ctr always works, but we have an audioElement on the page too
 * so we can simply assign it from the page. This *should* work outside of the ctr but then
 * the HTC One might become a problem as *creating* an audioElement outside of the ctr seems to fail.
 * It gets created but never loads anything!
 * 
 * Therefore the logic in the loader now is:
 * load or create audioElement
 * load JSON file
 * When both OK, try for webAudio (unless we are HTC One Native)
 * If WebAudio succeeds null off the audioElement, or vice-versa, then call SoundController
 * with whatever we have. 
 * Use _loadAudioError if all else fails to null everything off, cancel the loading message
 * and signal the sidebar to set the sound button to show "sound off".
 * 
 * We are creating the audioElement upfront in the ctr then nulling it if webAudio succeeds.
 * This is not very elegant but it IS working: There's a way to do it better, which can be found in 
 * SoundLoaderWebAudio.js 
 */
com.sound.SoundLoader = (function(_super){
    
    var GameConfiguration = com.game.fullmoonfortunes.GameConfiguration;
    var DataLoader = com.utils.dataLoader.DataLoader;
    var DataLoaderEvent = com.utils.dataLoader.DataLoaderEvent;
    var SoundController = com.game.SoundController;
    var GameEvent = com.game.fullmoonfortunes.GameEvent;
    var DisplayEvent = com.display.events.DisplayEvent;
    var LayoutManager = com.utils.layout.LayoutManager;
    var SoundBufferLoader = com.sound.SoundBufferLoader;

    /**
     * 
     */
    function SoundLoader(displayContainer, eventManager)
    {
        trace("SOUND LOADER started");

        this._displayContainer = displayContainer;
        this._eventManager = eventManager;
            
        this._itemsLoaded = 0;
                
        var config = GameConfiguration.getInstance();
        
        /*
         * Create on the DOM if HTC native,
         * otherwise lift off page.
         */
        if( this._isHtcNative() )
        {
            this._audioElement = document.createElement ('audio');
            document.getElementsByTagName('body')[0].appendChild(this._audioElement);
            this._audioElement.id = AUDIO.ELEMENT;
            this._audioElement.type = AUDIO.MP3;
        }
        else
        {
            this._audioElement = document.getElementById(AUDIO.ELEMENT);
        }
        
        //
        if( this._audioElement != null && this.setAudioSource(config) == true )
        {
            trace("Sound src=" + this.strAudioSrc);
            this._audioElement.src = this.strAudioSrc;
            
            // This should fire when the file is loaded entirely
            this._audioElement.addEventListener("canplaythrough",this._onSoundLoaded);            

            // Go
            this._audioElement.load();
        }
        /*
         * No audioElement: probably no sound.
         * ++this._itemsLoaded so that when the JSON loads we'll go to _tryWebAudio 
         */
        else
        {   
            // AudioElement created but setAudioSource failed..
            if(this._audioElement)
            {
                this._audioElement = null;
            }
            
            // try WebAudio
            ++this._itemsLoaded;
        }

        /*
         * Get JSON to control sound sprite. When both are loaded try for webAudio
         */
        var loader = new DataLoader();
        loader.addEventListener(DataLoaderEvent.LOAD_COMPLETE, this._onSoundJsonLoaded);
        loader.load(config.strSoundResPath + config.strSoundFilename + ".json");
        
        /*
         * Flash loading sound message
         */
        var layout = LayoutManager.getInstance().getLayout("SoundLoader");
        this._text = layout.getChildByName("txtLoadingSound");
        this._displayContainer.addChild(this._text);
        this._frameCount = 0;
        this._showLoadingMessage = true;
        this._displayContainer.stage.addEventListener(DisplayEvent.TICK_EVENT, this._onTick);
    }
    var SoundLoader = newClass(SoundLoader, _super);
    
    SoundLoader.prototype.strAudioSrc = null;
    SoundLoader.prototype.strAudioType = null;    
    SoundLoader.prototype._audioElement = null;
    SoundLoader.prototype._webAudio = null;
    SoundLoader.prototype._soundJson = null;
    SoundLoader.prototype._bufferList = null;
    SoundLoader.prototype._itemsLoaded = null;
    SoundLoader.prototype._eventManager = null;
    SoundLoader.prototype._displayContainer = null;
    SoundLoader.prototype._frameCount = null;
    SoundLoader.prototype._showLoadingMessage = null;
    
    /**
     * If anything goes wrong with audio this is where we should finish: 
     * Remove the onscreen LOADING message
     * Set loadingError to true to stop us trying again if the player clicks the unmute sound button.
     * Signal the sidebar (not applicable to GTS Wrapper) to X the sound button. 
     */
    SoundLoader.prototype._loadAudioError = function(e)
    {
        if(e)trace("Load audio error " + e.message);
        
        // Clean up message
        this._showLoadingMessage = false;
        
        // Clean up audioElement
        var el = document.getElementById(AUDIO.ELEMENT)
        if( el != null )
        {
            this._audioElement.removeEventListener("canplaythrough",this._onSoundLoaded);           
            document.getElementsByTagName('body')[0].removeChild(this._audioElement);
            this._audioElement = null;
        }
        
        // Clean up webAudio
        if(this._webAudio)
        {
            this._webAudio = null;
            for(all in this._bufferList)
            {
                this._bufferList[all] = null;
            }
            this._bufferList = null;
        }
        
        //
        this._eventManager.dispatchEvent(new GameEvent(GameEvent.DISABLE_SOUND_BUTTON));
    }

    /**
     * 
     */
    SoundLoader.prototype._onTick = function()
    {
        if(++this._frameCount >= 60)
        {
            if(this._showLoadingMessage)
            {
                this._frameCount = 0;
                this._text.visible = !this._text.visible;
            }
            /*
             * Remove all resources etc in a timely fashion, ie
             * ensuring that the message is onscreen for a second, at least. 
             */
            else
            {
                this._displayContainer.stage.removeEventListener(DisplayEvent.TICK_EVENT, this._onTick);
                this._displayContainer.removeChild(this._text);
                this._text = null;
                this._itemsLoaded = null;
                this._displayContainer = null;
                this._frameCount = null;
                this._showLoadingMessage = null;
            }
        }
    }
    
    /**
     * When audio obj reports that it "canplaythrough" we are ready to start using sounds,
     * so long as the JSON file is loaded too.
     */
    SoundLoader.prototype._onSoundLoaded = function(e)
    {
        trace("_onSoundLoaded " + e.target.id);
        this._audioElement.removeEventListener("canplaythrough",this._onSoundLoaded);           
        
        // Possible #voodoo from previous framework        
        this._audioElement.play();
        this._audioElement.pause();
        
        //
        if(++this._itemsLoaded == 2)
        {
            this._tryWebAudio();
        }
    }
    
    /**
     * Convert data to JSON and start if soundfile loaded.
     */    
    SoundLoader.prototype._onSoundJsonLoaded = function(event)
    {
        trace("_onSoundJsonLoaded");
        
        event.target.removeEventListener(DataLoaderEvent.LOAD_COMPLETE, this._onSoundJsonLoaded);
        
        try
        {
            this._soundJson = JSON.parse(event.target.data);

            if(++this._itemsLoaded == 2)
            {
                this._tryWebAudio();
            }
        }
        /*
         * If JSON conversion errors don't try to initialise sound.
         * itemsLoaded will never reach 2.
         * Flag to remove loading message/clean up resources
         */
        catch(e)
        {
            trace("Error parsing sound JSON " + e.message)
            this._loadAudioError(e)
        }
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
     * Ready to start. Flag resources ready to remove in the _onTick
     * and kisk off the SoundSpriteController. 
     */
    SoundLoader.prototype._tryWebAudio = function()
    {
        if(this._isHtcNative())
        {
                this._initialiseSoundController(); 
        }
        else
        {
            /*
             * Use try catch blocks here to go to fallback (audioElement)
             */
            try
            {
                // Uncomment to test soundsprite on desktop
                //throw new Error("");
                /* 
                 * If this throws an exception we can intialise the SoundController
                 * with what we have ie the original webAudio and SoundSprite file
                 */ 
                //var webAudio = new (window.AudioContext || window.webkitAudioContext)();
                window.AudioContext = window.AudioContext||window.webkitAudioContext;
                this._webAudio = new AudioContext();   
    
                var filenames = [];
                for(var all in this._soundJson.sounds)
                {
                    /*
                     * Load individual files according to their order in the JSON
                     */
                    filenames.push(GameConfiguration.getInstance().strSoundResPath + this._soundJson.sounds[all].filename);
                }
                
                /*
                 * Note we are ignoring load errors unless we are left with no sounds at all, 
                 * as web audio can still play those sounds that did load even if one or two are missing. 
                 */
                var bufferLoader = new SoundBufferLoader(this._webAudio, filenames, this._onFinishedBufferLoading);
                bufferLoader.load();
            }
            catch(e)
            {
                //alert("Web audio failed: " + e.message)
                this._bufferList = null;
                this._webAudio = null;
                this._initialiseSoundController(); 
            }
        }
    }
    
    /*
     * We have the JSON and the bufferList (array of audio files)
     * from kicking off a web audio load start the soundController.
     * NOTE We're not checkign for any missing files so this may succeed
     * with nothing in the bufferlist.
     */
    SoundLoader.prototype._onFinishedBufferLoading = function(bufferList)
    {
        // Check for bufferList and that it contains something!
        if(bufferList.length > 0)
        {
            var bufferEmpty = true;
            for(var b in bufferList)
            {
                if(bufferList[b] != null)
                {
                    bufferEmpty = false;
                    break;
                }
            }
            
            // BufferList has sound files. Cancel the audioContext.
            if(!bufferEmpty)
            {
                this._bufferList = bufferList;
                if(this._audioElement)document.getElementsByTagName('body')[0].removeChild(this._audioElement);
                this._audioElement = null;
            }
            else
            {
                this._webAudio = null;
                this._bufferList = null;
            }
        }

        // All set, go start the sound.
        this._initialiseSoundController();   
    }
    
    /**
     * Finish up by initialising a SoundController.controller
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
     */
    SoundLoader.prototype.setAudioSource = function(config)
    {
        var blnAudioSupported = true;
    
        if (this.audioSupport(AUDIO.MP3))
        {
            this.strAudioSrc = config.strSoundResPath + config.strSoundFilename + config.strBitrate + '.mp3';
            this.strAudioType = AUDIO.MP3;
        } 
        /*  According to Claxton, Playtech want mp3 support only
        else if (this.audioSupport(AUDIO.MP4))
        {
            this.strAudioSrc = config.strSoundResPath + config.strSoundFilename + config.strBitrate + '.m4a';
            this.strAudioType = AUDIO.MP4;
        }
        else if (this.audioSupport(AUDIO.MP4))
        {
            this.strAudioSrc = config.strSoundResPath + config.strSoundFilename + '.m4a';
            this.strAudioType = AUDIO.MP4;
        }
        else if( this.audioSupport( AUDIO.OGG ))
        {
            this.strAudioSrc = config.strSoundResPath + config.strSoundFilename + '.ogg';
            this.strAudioType = AUDIO.OGG;
        }
        */
        else
        {
            blnAudioSupported = false;
        }

        return blnAudioSupported;
    }
    
    /**
     * Determine whether audio support exists.
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
AUDIO.ELEMENT = "audioElement";    // Name of audio element on our html page
            
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