
var soundPlayer = null;

function SoundPlayer(){

}

SoundPlayer.getInstance = function(){
    if(soundPlayer == null)soundPlayer = new SoundPlayer();
    return soundPlayer;
}



SoundPlayer.prototype.play = function(name, blLoop){
    var sound = new Howl({
      urls: ['sounds/'+name+'.mp3'],
        loop: blLoop || false
    }).play();

    return sound;
};

SoundPlayer.prototype.fadeOut = function(sound, duration){
    sound.fadeOut(0.0,duration);
}

SoundPlayer.prototype.stop = function(sound){
    if(sound)sound.stop();
}

SoundPlayer.prototype.fadeIn = function(name, duration, blLoop){
    var sound = new Howl({
        urls:['sounds/'+name+'.mp3'],
        loop : blLoop || false,
        fadeIn : [1.0,duration]
    } ).play();
}