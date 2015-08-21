/**
 * Base class for SoundSpriteController and WebAudioController
 */
com.sound.Controller = (function(){
    
    function Controller()
    {
        this._muted = false;
        this._initialised = false;
    }
    var Controller = newClass(Controller);
    
    Controller.EFFECTS = "EFFECTS";
    Controller.MUSIC = "MUSIC";
    Controller.prototype._initialised = null;
    Controller.prototype._muted = null;
    
    defineSetter(Controller.prototype, "muteEffects", function(blMute){
       this._muted = blMute; 
    });
    defineGetter(Controller.prototype, "muteEffects", function(){
       return this._muted; 
    });
    defineSetter(Controller.prototype, "muteMusic", function(blMute){
       this._muted = blMute; 
    });
    defineGetter(Controller.prototype, "muteMusic", function(){
       return this._muted; 
    });
    
    return Controller;
})();
