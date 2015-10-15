/**
 * A graphical button to handle spin requests:
 * It has multiple function though:
 * First press: Send a bet (and spin the reels!)
 * Second press: set reels to quick-stop (turbo mode) as soon as a result is available.
 * Next press: Cancel win animations and skip to next action ie start freespins or bonus if flagged.
 *
 * Spin button functionality can get fairly complex so make sure you're well in control of its state.
 *
 * Base class is a standard button implementation with 4 states:
 * up, down, off, on (highlit)
 *
 * @param imageName
 * @param posX
 * @param posY
 * @param name
 * @constructor
 */
function SpinButton(imageName,posX,posY,name){
    this.state = SpinButton.IDLE;
    Button.call(this, imageName,posX,posY,name);
    this.onAllReelsStopped = this.onAllReelsStopped.bind(this);
    Events.Dispatcher.addEventListener(Event.ALL_REELS_STOPPED,this.onAllReelsStopped);
    this.onAllReelsSpinning = this.onAllReelsSpinning.bind(this);
    Events.Dispatcher.addEventListener(Event.ALL_REELS_SPINNING,this.onAllReelsSpinning);
};
SpinButton.prototype = Object.create(Button.prototype);
SpinButton.constructor = SpinButton;

    SpinButton.IDLE = 0;
    SpinButton.SPIN = 1;
    SpinButton.STOP = 2;


/**
 * TODO Clicks may fire twice on certain android devices
 * but only once on iPad or desktop or other Androids.
 * May be to do with this function being run onTap AND onClick
 * @see Button.js constructor
 * Try to deal with some Droid double-tap issue
 */
SpinButton.prototype.onAllReelsSpinning = function(){
    this.clicked = false;
}

/**
 * TODO Clicks may fire twice on certain android devices
 * but only once on iPad or desktop or other Androids.
 * May be to do with this function being run onTap AND onClick
 * @see Button.js constructor
 */
SpinButton.prototype.onClick = function(data){

    Button.prototype.onClick.call(this);

    if(!this.clicked){
        this.clicked = true;
        this.performStateAction();
    }
    else{
        this.clicked = false;
    }

    SoundPlayer.getInstance().play(Sounds.CLICK);
}

/**
 *
 * @param event
 */
SpinButton.prototype.onAllReelsStopped = function(event){
    this.state = SpinButton.IDLE;
    this.clicked = false;
}

/**
 * Perform action and move to next state
 */
SpinButton.prototype.performStateAction = function(state){
    
    if(state != null)this.state = state;
    else{
        switch(this.state){
            case SpinButton.IDLE:
                this.state = SpinButton.SPIN;
                // Listened to by Game to provide timings
                Events.Dispatcher.dispatchEvent(new Event(Event.SPIN,this));
                break;
            case SpinButton.SPIN:
                this.state = SpinButton.STOP;
                // Listened to by Game to provide timings and stopPositions
                Events.Dispatcher.dispatchEvent(new Event(Event.STOP,this));
                break;
            case SpinButton.STOP:
                break;
        }
    }
}

SpinButton.prototype.setState = function(state){
    this.state = state;
};

