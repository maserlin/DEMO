/**
 * SoundController is a static object and as such always exists whether there are sounds
 * loaded into the game or not, allowing to use unmodified game code if the player chooses "no sound". 
 * 
 * This class, when initialised by SoundLoader, will start either a SoundSprite or WebAudio controller
 * depending on the variable values supplied.
 * 
 * If we haven't initialised a controller (either web audio or fallback sound sprite) 
 * the code in this file should ensure there are no ill effects, whether the player chose "no sounds"
 * or soundfile loading failed for some reason. 
 * 
 * The Player may start the game with the "no sound" option and later choose to turn sound6s on
 * using the sidebar button. If the SoundLoader hasn't run then it will do so, finally initialising
 * this SoundController with whatever it has loaded, and sounds will start to be heard.
 */
    /**
     * We can instantiate either a soundsprite controller or
     * a web audio controller, depending on which is supported.
     */
    function SoundController()
    {
        //run this to make sounds json and print in the console
        //var cv = new Convert();
        //cv = null;

        // No bindings: static object
    }

    /*
     * Whichever controller we need based on device support
     */
    SoundController.controller = null;

    /* 
     * Simple top-level muting var until we get WebAudio 100% implemented
     * Initialise to muted in case we don't even load sounds.
     */
    SoundController.muted = true;

    /*
     * More complex muting controls for when web audio/GTS wrapper can support it
     */
    SoundController.cueEffectsMuting = false;
    SoundController.cueMusicMuting = false;


    /**
     * The loader initialises us with whatever it has loaded.
     * Apply any audio settings the player has made while we were loading.
     * 
     * @param objAudio: a working html audio object OR a web audio context
     * @param audioJson: JSON control data file.  
     * @param webAudioBufferList (optional): bufferList containing individual mp3 files
     *                                       for use in web audio mode. Does not exist if we are
     *                                       using html audio sound-sprite mode.
     */
    SoundController.initialise = function(objAudio, audioJson, webAudioBufferList)
    {
        if(webAudioBufferList)
        {
            SoundController.controller = new WebAudioController(objAudio, audioJson, webAudioBufferList);
        }
        else
        {
            SoundController.controller = new SoundSpriteController(objAudio, audioJson);
        } 
        
        // Apply choices made while loading (or defaults).
        SoundController.controller.muteEffects = SoundController.cueEffectsMuting;
        SoundController.controller.muteMusic = SoundController.cueMusicMuting;
        SoundController.muted = SoundController.controller.muteEffects || SoundController.controller.muteMusic;
        
        /* Print out filenames
        for(var all in audioJson.sounds)
        {
            trace(all + " " + audioJson.sounds[all].name)
        }
        */
    }

    /**
     * Message from the wrapper to tweak the sound settings. 
     * Message may come before sound module is ready, so cue the setting up
     * if necessary and apply when we initialise the sound sprite or web audio.
     * If a controller exists, just go ahead and set it.
     * Currently these act on a single base class variable: web audio should allow us to separate 
     * out these signals and behave a bit better.
     */
    SoundController.setSoundLevels = function(wrapperSoundSetup)
    {
        SoundController.muted = (wrapperSoundSetup.value == 0);

        if (wrapperSoundSetup.channel == Controller.EFFECTS )
        {
            if(SoundController.controller)
            {
                SoundController.controller.muteEffects = SoundController.muted;
                console.log("game set effects MUTE " + SoundController.muted);
            }
            else
            {
                console.log("No sound controller initialised yet. Will set EFFECTS mute to " + SoundController.muted + " when ready.")
                SoundController.cueEffectsMuting = SoundController.muted;
            }
        }
        else if (wrapperSoundSetup.channel == Controller.MUSIC )
        {
            if(SoundController.controller)
            {
                SoundController.controller.muteMusic = SoundController.muted;
                console.log("game set music MUTE " + SoundController.muted);
            }
            else
            {
                console.log("No sound controller initialised yet. Will set MUSIC mute to " + SoundController.muted + " when ready.")
                SoundController.cueMusicMuting = SoundController.muted;
            }
        }
    }

    /**
     * WebAudio mode:
     * Concurrent sounds are possible, so just play it.
     * 
     * Single sprite mode: 
     * Use this method to put the next sound into the queue.
     * It will play when the queue reaches it.
     * The controller state will first be SEEK as the playhead moves, then PLAYING as the sound plays.
     * 
     * Note: A looping sound will continue until .stop() is called. Also, the SOUND_COMPLETE event
     * will be fired every time the sound finishes and seeks back to the start. 
     * 
     * @param soundId (mandatory): the SoundController.soundId
     * @param blLoop (optional): set to true to override JSON setting and make sound loop.
     * @param fade (optional): set to true to fade the sound out when it is stopped.
     */
    SoundController.play = function(soundId, blLoop, fade)
    {
        if(SoundController.controller && !SoundController.muted)SoundController.controller.play(soundId, blLoop);
    }
    
    /**
     * Web Audio Mode:
     * Use this method to add overlay sounds e.g. lightning flashes over dramatic music. 
     * They'll play in WebAudio as concurrency is not a problem
     * 
     * Single Sprite mode: 
     * The sound WILL NOT PLAY as that would stop the main music 
     * or ongoing loop from playing.
     * 
     * @param soundId (mandatory): the SoundController.soundId
     * @param blLoop (optional): set to true to override JSON setting and make sound loop.
     */
    SoundController.playOver = function(soundId, blLoop, fade)
    {
        if(SoundController.controller && !SoundController.muted)SoundController.controller.playOver(soundId, blLoop, fade);
    }
    
    /**
     * Web Audio Mode:
     * No Queue presently. Just play it.
     * 
     * Single Sprite mode: 
     * Use this to interrupt a loop or other sound currently playing.
     * The queue will be cleared, so it may be necessary to re-start a spin loop by
     * first checking if(SoundController.isPlaying(spinLoopId) == false).
     * Also useful to interrupt win animation sounds with the spin button sound, for instance.
     * 
     * @param soundId (mandatory): the SoundController.soundId
     * @param blLoop (optional): set to true to override JSON setting and make sound loop.
     */
    SoundController.playNow = function(soundId, blLoop, fade)
    {
        if(SoundController.controller && !SoundController.muted)SoundController.controller.playNow(soundId, blLoop, fade);
    }
    
    /**
     * Web Audio Mode:
     * Under construction, but should return appropriate value.
     * 
     * Single Sprite mode: 
     * Return true if the player's state is not PAUSED and the current
     * sound id is the one you supplied as a param. 
     */
    SoundController.isPlaying = function(soundId)
    {
        if(SoundController.controller)
            return SoundController.controller.isPlaying(soundId);
        else
            return false;
    }
    
    /**
     * Web Audio Mode:
     * Under construction, should work but not guaranteed.
     *  
     * Single sprite mode:
     * stops the currently playing audio, sets state to PAUSED
     * dispatches SOUND_COMPLETE.
     * Does NOT clear the queue.
     * Does NOT process the next in the queue.
     */
    SoundController.stop = function(soundId)
    {
        if(SoundController.controller)SoundController.controller.stop(soundId);
    }
    
    /**
     * SoundSprite: just calls stop.
     * WebAudio: stops things playing too
     */
    SoundController.stopAll = function()
    {
        if(SoundController.controller)SoundController.controller.stopAll();
    }
    
    /**
     * Web Audio Mode:
     * Not implemented yet.
     *  
     * Single sprite mode:
     * Plays the next sound in the queue, if there is one. 
     * There is currently no method to re-start a stopped sound.
     */
    SoundController.resume = function()
    {
        if(SoundController.controller)SoundController.controller.resume();
    }
    
    // General    
    SoundController.click = 6;// buttonpress
    SoundController.stakedown = 30;// stakedown
    SoundController.stakeup = 31;// stakeup 
    SoundController.spinclick = 32;// startreelspin 
    
    // 
    SoundController.suspense = 43;// Not in FMF
    SoundController.spinLoop1 = 43;// reelspinloop
    SoundController.spinLoop2 = 43;// reelspinloop
    SoundController.spinLoop3 = 43;// reelspinloop
    
    // Stops and scatter
    SoundController.reelstop = 27;// reelstops 
    SoundController.scatterLand1 = 14;// freespinsymbol
    SoundController.scatterLand2 = 15;// freespinsymbol2 
    SoundController.scatterLand3 = 16;// freespinsymbol3 
    SoundController.scatterLand4 = 17;// freespinsymbol4
    SoundController.scatterLand5 = 18;// freespinsymbol5
    
    // winsymbols etc
    SoundController.tenjackqueen = 0;// T-Q_win
    SoundController.kingace = 23;// k_a_win 
    SoundController.symbol5 = 39;// werewolffootprintsymbol
    SoundController.symbol6 = 29;// silverbulletsymbol
    SoundController.symbol7 = 9;// doctorsymbol
    SoundController.symbol8 = 10;// dragonsym 
    SoundController.symbol9 = 40;// wild_symbol_win
    SoundController.winsummary1 = 28;// reelwinsummaryhighlight
    SoundController.bigwinloop1 = 2;// amazingly_big_win_loop 
    SoundController.countup1 = 7;// Count_up_tick_loop_2 
    SoundController.scatterWin = 42;// wolf_howl_loopable_2

    // Freespins
    SoundController.freespinIntroLoop = 13;// freespinstotalsummary
    SoundController.freespinLoop = 12;// reelspinloop
    SoundController.freespinOutro = 41; //winSummary_large
    SoundController.freespinStartButton = 5;// bonus_total_summary
    SoundController.backtoreelstransition = 3;// backtoreelstransition
    
    // inreel Bonus
    SoundController.inreelbonus1 = 19;// fullmoonsymbol2 
    SoundController.bonusSound1 = 34;// transformation_howl_1
    SoundController.bonusSound2 = 35;// transformation_howl_2 
    SoundController.bonusSound3 = 36;// transformation_howl_3 
    SoundController.bonusSound4 = 37;// transformation_howl_4
    SoundController.bonusSound5 = 38;// transformation_howl_5
    SoundController.symbolTransformation = 40;// wild_symbol_win 
    
    // Onscreen popups
    SoundController.alert1 = 33;// super_multiplier
    SoundController.alert2 = 1;// amazing_multiplier 
    SoundController.alert3 = 22;// incredible_multiplier 
    SoundController.alert4 = 25;// massive_multiplier
    
    // Other
    SoundController.sfx1 = 8;// destruction_of_freespins_surround_with_music 
    SoundController.sfx2 = 11;// freespinaddfx 
    SoundController.sfx3 = 20;// gravestonecrumblefx
    SoundController.sfx4 = 20;// gravestonecrumblefx2
    SoundController.sfx5 = 21;// hidden_amounts_reveal
    SoundController.sfx6 = 24;// lightning
    SoundController.sfx7 = 26;// multiplieraddfx 
    SoundController.sfx8 = 4;// bonus_instructions_appear 
    

/*
0 T-Q_win
1 amazing_multiplier
2 amazingly_big_win_loop
3 backtoreelstransition
4 bonus_instructions_appear
5 bonus_total_summary
6 buttonpress
7 Count_up_tick_loop_2
8 destruction_of_freespins_surround_with_music
9 doctorsymbol
10 dragonsym
11 freespinaddfx
12 freespinssloop
13 freespinstotalsummary
14 freespinsymbol
15 freespinsymbol2
16 freespinsymbol3
17 freespinsymbol4
18 freespinsymbol5
19 fullmoonsymbol2
20 gravestonecrumblefx
21 hidden_amounts_reveal
22 incredible_multiplier
23 k_a_win
24 lightning
25 massive_multiplier
26 multiplieraddfx
27 reelstops
28 reelwinsummaryhighlight
29 silverbulletsymbol
30 stakedown
31 stakeup
32 startreelspin
33 super_multiplier
34 transformation_howl_1
35 transformation_howl_2
36 transformation_howl_3
37 transformation_howl_4
38 transformation_howl_5
39 werewolffootprintsymbol
40 wild_symbol_win
41 winSummary_large
42 wolf_howl_loopable_2
43 reelspinloop
 */