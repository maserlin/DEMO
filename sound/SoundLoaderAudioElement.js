com.sound.SoundLoader = (function(_super){
    
    var GameConfiguration = com.game.fullmoonfortunes.GameConfiguration;
    var DataLoader = com.utils.dataLoader.DataLoader;
    var DataLoaderEvent = com.utils.dataLoader.DataLoaderEvent;
    var SoundController = com.game.SoundController;
    var GameEvent = com.game.fullmoonfortunes.GameEvent;
    var DisplayEvent = com.display.events.DisplayEvent;
    var LayoutManager = com.utils.layout.LayoutManager;

    /**
     * 
     */
    function SoundLoader(displayContainer, eventManager)
    {
        trace("SOUND LOADER")
        this._displayContainer = displayContainer;
        this._eventManager = eventManager;
            
        this._itemsLoaded = 0;
                
        var config = GameConfiguration.getInstance();
        
        /*
         * Could also use _audioElement = document.getElementById(AUDIO.ELEMENT)
         * then this code can move out of the ctr.
         * N.B. still use createElement for HTC One though!
         */
        this._audioElement = document.createElement ('audio');
        document.getElementsByTagName('body')[0].appendChild(this._audioElement);

        if( this._audioElement != null && this.setAudioSource( config ) == true )
        {
            this._audioElement.id = AUDIO.ELEMENT;
            trace("Sound src=" + this.strAudioSrc);
            this._audioElement.src = this.strAudioSrc;
            this._audioElement.style = "display:none;";
            this._audioElement.type = this.strAudioType;
            this._audioElement.loop = false;
            this._audioElement.autoplay = false;
            this._audioElement.muted = false;
            this._audioElement.preload = "none";
            
            // This should fire when the file is loaded entirely
            this._audioElement.addEventListener("canplaythrough",this._onSoundLoaded);            
            
            // Go
            this._audioElement.load();
            
            // Also get JSON to control sound sprite
            var loader = new DataLoader();
            loader.addEventListener(DataLoaderEvent.LOAD_COMPLETE, this._onSoundJsonLoaded);
            loader.load(config.strSoundResPath + config.strSoundFilename + ".json");
            
            // Flash loading sound message
            var layout = LayoutManager.getInstance().getLayout("SoundLoader");
            this._text = layout.getChildByName("txtLoadingSound");
            this._displayContainer.addChild(this._text);
            this._frameCount = 0;
            this._removeMessage = false;
            this._displayContainer.stage.addEventListener(DisplayEvent.TICK_EVENT, this._onTick);
        }
    }
    var SoundLoader = newClass(SoundLoader, _super);
    
    SoundLoader.prototype.strAudioSrc = null;
    SoundLoader.prototype.strAudioType = null;    
    SoundLoader.prototype._audioElement = null;
    SoundLoader.prototype._soundJson = null;
    SoundLoader.prototype._itemsLoaded = null;
    SoundLoader.prototype._eventManager = null;
    SoundLoader.prototype._displayContainer = null;
    SoundLoader.prototype._frameCount = null;
    SoundLoader.prototype._removeMessage = null;
    
    /**
     * 
     */
    SoundLoader.prototype._onTick = function()
    {
        if(++this._frameCount >= 60)
        {
            /*
             * Remove all resources etc in a timely fashion, ie
             * ensuring that the message is onscreen for a second, at least. 
             */
            if(this._removeMessage)
            {
                this._displayContainer.stage.removeEventListener(DisplayEvent.TICK_EVENT, this._onTick);
                this._displayContainer.removeChild(this._text);
                this._text = null;
                this._itemsLoaded = null;
                this._displayContainer = null;
                this._frameCount = null;
                this._removeMessage = null;
            }
            else
            {
                this._frameCount = 0;
                this._text.visible = !this._text.visible;
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
        this._audioElement.play();
        this._audioElement.pause();
        
        //
        if(++this._itemsLoaded == 2)
        {
            this._initialiseSound();
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
        }
        /*
         * If JSON conversion errors don't try to initialise sound.
         * itemsLoaded will never reach 2.
         * Flag to remove loading message/clean up resources
         */
        catch(e)
        {
            trace("Error parsing sound JSON " + e.message)
            this._removeMessage = true;
            return;
        }
        
        //
        if(++this._itemsLoaded == 2)
        {
            this._initialiseSound();
        }
    }
    
    /**
     * Ready to start. Flag resources ready to remove in the _onTick
     * and kisk off the SoundSpriteController. 
     */
    SoundLoader.prototype._initialiseSound = function()
    {
        this._removeMessage = true;
        SoundController.initialise(this._audioElement, this._soundJson);    
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
