/**
 * Load WebAudio with AudioElement fallback.
 * Check for Chrome on Lenovo: audioElement has to be loaded from ctr as it is
 * in the buttonclick Call Stack. Otherwise it will all seem to work, but, no sound will play.
 * Otherwise, load the JSON, then use it to start WebAudio or AudioElement soundController
 * depending on our tests for browser sound support compatibility.
 *
 * SoundLoader is created when Player clicks "Play With Sound".
 * First get the JSON file so we can either control the SoundSprite
 * or control the order of loading individual files.
 * Then determine whether to use web audio or HTML audio.
 *
 * Added support for Chrome on Lenovo tablet: check for this
 * and do instead of the normal operation, as loading of audioElement will have to be started
 * from within the buttonclick Call Stack.
 */
function SoundLoader()
{
    /*
     * Lenovo only:
     * Lenovo Chrome browser crashes trying to start WebAudio, we HAVE to use audioElement.
     * "Mozilla/5.0 (Linux; Android 4.2.2; Lenovo B8000-F Build/JDQ39)
     *  AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.141
     *  Safari/537.36"
     * Also, Lenovo native only works on audioElement (if it works at all),
     * so we might as well do this for any Lenovo startup as it covers both bases.
     * Because it's Chrome (I'm guessing) we can ONLY load an audioElement
     * from within the buttonclick Call Stack.
     * It simply won't work if called elsewhere, either by setting from the page or creating
     * on dynamically, so we HAVE to do it here.
     */
    if(this._isLenovo())
    {
        this.audioElement = document.getElementById(AUDIO.ELEMENT);
        if( this.audioElement != null && this.setAudioSource() == true )
        {
            this.audioElement.src = this.strAudioSrc;
            this.audioElement.addEventListener("canplaythrough",this._onLenovoSoundLoaded);
            this.audioElement.addEventListener("error",this._onLenovoSoundLoadedError);
            this.audioElement.load();

            this.timeoutId = setTimeout(this._cancelLoading, SoundLoader.MAX_LOADING_TIME);
        }
        else
        {
            this._loadAudioError({message:"Lenovo audioElement/mp3 not supported"});
        }
    }
    /*
     * Normal support for everything else!
     * Get JSON to control sound sprite or control order of loading sound files.
     * Once it's loaded decide which system to launch.
     */
    else
    {
        var loader = new DataLoader();
        loader.addEventListener(DataLoaderEvent.LOAD_COMPLETE, this._onSoundJsonLoaded);
        loader.load("sounds/soundsLibrary.json");
    }

    /*
     * These might not all need to be bound but - belt 'n' braces. Sound is a bitch.
     */
    this._onLenovoSoundLoadedError = this._onLenovoSoundLoadedError.bind(this);
    this._onLenovoSoundLoaded = this._onLenovoSoundLoaded.bind(this);
    this._onLenovoJsonLoaded = this._onLenovoJsonLoaded.bind(this);
    this._cancelLoading = this._cancelLoading.bind(this);
    this._loadAudioError = this._loadAudioError.bind(this);
    this._isHtcNative = this._isHtcNative.bind(this);
    this._isLenovo = this._isLenovo.bind(this);
    this._onSoundJsonLoaded = this._onSoundJsonLoaded.bind(this);
    this.webAudioSupported = this.webAudioSupported.bind(this);
    this._createWebAudio = this._createWebAudio.bind(this);
    this._onFinishedLoading = this._onFinishedLoading.bind(this);
    this._createAudioElement = this._createAudioElement.bind(this);
    this._onSoundLoadedError = this._onSoundLoadedError.bind(this);
    this._onSoundLoaded = this._onSoundLoaded.bind(this);
    this._initialiseSoundController = this._initialiseSoundController.bind(this);
    this.setAudioSource = this.setAudioSource.bind(this);
    this.audioSupport = this.audioSupport.bind(this);
}

SoundLoader.prototype.strAudioSrc = null;
SoundLoader.prototype.audioElement = null;
SoundLoader.prototype.webAudio = null;
SoundLoader.prototype.soundJson = null;
SoundLoader.prototype.bufferList = null;
SoundLoader.prototype.timeoutId = null;
SoundLoader.MAX_LOADING_TIME = 120000;
SoundLoader.prototype.isErrored = false;

/**
 * LENOVO SUPPORT ONLY
 */
SoundLoader.prototype._onLenovoSoundLoadedError = function(e)
{
    trace("_onLenovoSoundLoadedError error loading " + e.currentTarget.src)
    this.audioElement.removeEventListener("canplaythrough",this._onLenovoSoundLoaded);
    this.audioElement.removeEventListener("error",this._onLenovoSoundLoadedError);
    this._loadAudioError(e);
}
/**
 * LENOVO SUPPORT ONLY
 */
SoundLoader.prototype._onLenovoSoundLoaded = function(e)
{
    trace("_onLenovoSoundLoaded " + e.currentTarget.src);

    this.audioElement.removeEventListener("canplaythrough",this._onLenovoSoundLoaded);
    this.audioElement.removeEventListener("error",this._onLenovoSoundLoadedError);

    var config = GameConfiguration.getInstance();
    var loader = new DataLoader();
    loader.addEventListener(DataLoaderEvent.LOAD_COMPLETE, this._onLenovoJsonLoaded);
    loader.load(config.strSoundResPath + config.strSoundFilename + ".json");
}
/**
 * LENOVO SUPPORT ONLY
 */
SoundLoader.prototype._onLenovoJsonLoaded = function(event)
{
    event.target.removeEventListener(DataLoaderEvent.LOAD_COMPLETE, this._onLenovoJsonLoaded);
    try
    {
        this.soundJson = JSON.parse(event.target.data);
        this.audioElement.play();
        this.audioElement.pause();
        this._initialiseSoundController();
    }
    catch(e)
    {
        this._loadAudioError(e);
    }
}

/**
 * Timeout to cancel loader has fired
 */
SoundLoader.prototype._cancelLoading = function()
{
    this._loadAudioError({message:"Timeout cancelled loading."});
}

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
    this.isErrored = true; // Stops buffer receiving anything new.
    if(this.timeoutId)clearTimeout(this.timeoutId);
    this.audioElement = null;
    this.webAudio = null;
    for(var all in this.bufferList)this.bufferList[all] = null;
    this._showLoadingMessage = false;
    Events.Dispatcher.dispatchEvent(new Event(Event.DISABLE_SOUND_BUTTON));
}

/*
* Watch out! Applies to ALL HTC!
* The intention is to force HTC One native browser to audioElement
* AND dynamic element creation, as that device works backwards to everything else :)
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

/*
* Intended to force Chrome on Lenovo (or any Lenovo) to audioElement
*/
SoundLoader.prototype._isLenovo = function()
{
    if( String(navigator.userAgent).indexOf("Lenovo") != -1 )
    {
        return true;
    }

    // Also temp return true for  Native (Version) AND Galaxy S5 (SM-G900F)
    if( String(navigator.userAgent).indexOf("Version") && String(navigator.userAgent).indexOf("SM-G900F") != -1 )
    {
        return true;
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
        this.soundJson = JSON.parse(event.target.data);
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
     * use it, this.audioElement = new AudioContext() throws "AudioContext is not defined" exception
     * on *some* devices: S4 native seems OK
     */
    if( this.webAudioSupported(window.AudioContext) )
    {
        this._createWebAudio();
    }
    else
    {
        this._createAudioElement();
    }
}

/**
 * ever-increasing list of lack of support for web audio
 */
SoundLoader.prototype.webAudioSupported = function(context)
{
    //
    if(context == undefined)
    {
        return false;
    }

    //
    if(this._isHtcNative())
    {
        return false;
    }

    //
    if(this._isLenovo())
    {
        return false;
    }

    //
    return true;
}

/**
 * window.audioContext exists. Try to create webAudio.
 */
SoundLoader.prototype._createWebAudio = function()
{
    try
    {
        /*
         * Note: We may be here on native android, which supports the audioContext idea
         * but throws an error if you actually try to instantiate one! Hence the try..catch
         * which throws us back to creating audioElement.
         */
        this.webAudio = new AudioContext();

        var filenames = [];
        for(var all in this.soundJson.sounds)
        {
            // Load individual files according to their order in the JSON
            filenames.push(GameConfiguration.getInstance().strSoundResPath + this.soundJson.sounds[all].filename);
        }

        /*
         * Note we are ignoring load errors unless we are left with no sounds at all,
         * as web audio can still play those sounds that did load even if one or two are missing.
         */
        var bufferLoader = new SoundBufferLoader(this.webAudio, filenames, this._onFinishedLoading);
        bufferLoader.load();

        this.timeoutId = setTimeout(this._cancelLoading, SoundLoader.MAX_LOADING_TIME);
    }
    // Fallback to HTML audioElement on error
    catch(e)
    {
        this.webAudio = null;
        this._createAudioElement();
    }
}

/*
 * OK: we have the JSON and the bufferList (array of audio files)
 * from kicking off a web audio load. If there are NO SOUNDS loaded
 * then we should try the fallback, otherwise go with what we have.
 * Because we are creating null placeholders in the bufferList array for missing sounds
 * so that if a single sound is missing we can still use WebAudio,
 * we need a quick check to make sure ALL the sounds aren't missing!
 */
SoundLoader.prototype._onFinishedLoading = function(bufferList)
{
    if(!this.isErrored)
    {
        var isEmpty = true;
        for(all in bufferList)if(bufferList[all] != null)isEmpty = false;

        if(bufferList.length != 0 && !isEmpty)
        {
            this.audioElement = null;
            this.bufferList = bufferList;
            this._initialiseSoundController();
        }
        else
        {
            this.webAudio = null;
            this.bufferList = null;
            this._createAudioElement();
        }
    }
}



/**
 * This is our fallback.
 * If we can't even get this working, we have no sounds at all.
 */
SoundLoader.prototype._createAudioElement = function()
{
    try
    {
        // Create on the fly for HTC/Native. Get from page doesn't work!
        if(this._isHtcNative())
        {
            this.audioElement = document.createElement ('audio');
            this.audioElement.id = AUDIO.ELEMENT;
            this.audioElement.type = AUDIO.MP3;
            document.getElementsByTagName('body')[0].appendChild(this.audioElement);
        }
        // Works for all others. Get from page.
        else
        {
            this.audioElement = document.getElementById(AUDIO.ELEMENT);
        }

        /**
         * if this.setAudioSource fails it means that this.audioElement is not operable with mp3:
         * Therefore no sounds are available to the game.
         * Likewise if this.audioElement is null, obvs.
         */
        if( this.audioElement != null && this.setAudioSource() == true )
        {
            trace("Sound src=" + this.strAudioSrc);
            this.audioElement.src = this.strAudioSrc;
            this.audioElement.addEventListener("canplaythrough",this._onSoundLoaded);
            this.audioElement.addEventListener("error",this._onSoundLoadedError);

            /*
             * *should* fire these events in this order
             * loadstart, durationchange, loadedmetadata, loadeddata, progress, canplay, canplaythrough
             * @see http://www.w3schools.com/tags/av_event_progress.asp
             */
            this.timeoutId = setTimeout(this._cancelLoading, SoundLoader.MAX_LOADING_TIME);
            this.audioElement.load();
        }
        else
        {
            this._loadAudioError({message:"AudioElement/mp3 not supported"});
        }
    }
    catch(e)
    {
        trace("Error creating document audio element");
        this._loadAudioError(e);
    }
}


/**
 * Bad filename or similar... quit loading process
 */
SoundLoader.prototype._onSoundLoadedError = function(e)
{
    trace("_onSoundLoadedError error loading " + e.currentTarget.src)
    this.audioElement.removeEventListener("canplaythrough",this._onSoundLoaded);
    this.audioElement.removeEventListener("error",this._onSoundLoadedError);
    this._loadAudioError(e);
}

/**
 * When audio obj reports that it "canplaythrough" we are ready to start using sounds.
 */
SoundLoader.prototype._onSoundLoaded = function(e)
{
    trace("_onSoundLoaded " + e.currentTarget.src);

    this.audioElement.removeEventListener("canplaythrough",this._onSoundLoaded);
    this.audioElement.removeEventListener("error",this._onSoundLoadedError);

    /*
     * #voodoo from prev framework.. Remove? In any case,
     * if play or pause throws an error then all is not as expected.
     */
    try
    {
        this.audioElement.play();
        this.audioElement.pause();
        this._initialiseSoundController();
    }
    catch(e)
    {
        this._loadAudioError(e);
    }
}


/**
 * Ready to start. Flag resources ready to remove in the _onTick
 * and kick off the SoundSpriteController.
 */
SoundLoader.prototype._initialiseSoundController = function()
{
    var audio = this.webAudio || this.audioElement;

    // disable sound button if no audio.
    if(audio == null)
    {
        this._loadAudioError({message:"No audio object available."});
    }
    // else init SoundController with whatever we have.
    else
    {
        clearTimeout(this.timeoutId);

        this._showLoadingMessage = false;
        SoundController.initialise(audio, this.soundJson, this.bufferList);
    }

    // Always send this
    Events.Dispatcher.dispatchEvent(new GameEvent(GameEvent.SOUND_LOADING_COMPLETE,audio));
}

/**
 * Determine the correct audio file to load: mp3, m4a, ogg
 */
SoundLoader.prototype.setAudioSource = function()
{
    var blnAudioSupported = false;

    if (this.audioSupport(AUDIO.MP3))
    {
        var config = GameConfiguration.getInstance();
        this.strAudioSrc = config.strSoundResPath + config.strSoundFilename + config.strBitrate + '.mp3';
        this._strAudioType = AUDIO.MP3;
        blnAudioSupported = true;
    }

    //
    return blnAudioSupported;
}

/**
 * Determine whether document audio support exists.
 * Will return true if "yes" or "maybe", since "no" will be replaced with <nothing> and eval to false
 */
SoundLoader.prototype.audioSupport = function( strFormat )
{
    return !!(this.audioElement.canPlayType && this.audioElement.canPlayType(strFormat).replace(/no/, ''));
}

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
*
* Not needed as I've got the HTC One working without this.

if (String(navigator.userAgent).indexOf("HTC") > -1)
{
var that = this;
this.audioElement.addEventListener('timeupdate', function() {
 if (that.audioElement.currentTime >= ( that.audioElement.duration - 0.3 ) ) {
  that.audioElement.currentTime = 0;
  that.audioElement.pause();
  that.audioElement.removeEventListener('timeupdate');
 }
}, false);
}
*/
