/**
 * Converts a string, which is the CSV of the sound spreadsheet (minus all the extra
 *     bits like the titles and such) formatted with a | delimeter between entries.
 * See below var soundlist.
 * 
 * Anyway, we load this up in run() and for each entry, add to a "json" string.
 * Some basic operations are carried out:
 * We are converting the timestamps from the format "mins:secs:ms" to seconds.ms
 * Also setting the loop boolean based on whether "loop" appears in the filename.
 * We also add our own ".mp3" to the name to make the filename, just in case, as the original
 * xls file this was developed on had all the files as ".wav"s 
 * 
 * When the string is complete we are dumping it out to the console so we can copy and paste it into 
 * an actual JSON file, for loading in the usual way. 
 * NB it helps to format this output using notepad++ into formatted JSON: makes it readable and it's
 * a good double-check on validity.
 */
com.sound.Convert = (function(){
    
    function Convert()
    {
        this.run()
    }
    var Convert = newClass(Convert);
    
    /**
     * 
     */
    Convert.prototype.run = function()
    {
        var elements = soundlist.split("|");
        var json="{\"sounds\": [";
        for(var e in elements)
        {
            var el = elements[e].split(",");
            var obj = Object.create(null);
            obj.name = el[0].split(".")[0];
            obj.filename = obj.name + ".mp3";
            obj.start = this.getSecondsFromTimestamp(el[1]);
            obj.end = this.getSecondsFromTimestamp(el[2]);
            obj.duration = this.getSecondsFromTimestamp(el[3]);
            obj.loop = this.getLoopBoolFromName(obj.name);

            json += JSON.stringify(obj) + ",";
        }
        
        var index = String(json).lastIndexOf(",");
        json = String(json).substr(0,index)
        json += "]}";
        console.log(json);
    }
    
    /*
     * 
     */
    Convert.prototype.getLoopBoolFromName = function(strName)
    {
        if(strName.match(/loop/i))
        {
            return true;
        }
        return false;
    }
    
    /**
     *  convert "2:5:533" to seconds
     */
    Convert.prototype.getSecondsFromTimestamp = function(strTimestamp)
    {
        var parts = strTimestamp.split(":");
        var minsInSecs = Number(parts[0]*60);
        var secs = Number(parts[1]);
        var ms = Number(parts[2]);
        var tot = Number((minsInSecs+secs) + "." + ms);
        //trace (tot)
        return tot;
    }
    
    
    return Convert;
})();

/**
 * Replace this with your game's CSV list of sounds
 * and convert to JSON. Print it out in the console, copy it to a file
 * and bung it in the res/sounds folder! Simples.
 * 
 * Alternatively we could use this data direct but it's useful to have it editable
 * so we can change whether sounds loop and correct any 404 errors due to invalid
 * filenames (spaces, invalid chars liek leading numbers in the name etc)
 * 
 * NOTE THOUGH that this data is rarely 100% valid. One problem is that
 * all end times must be 3 decimal places. If you see an end time like this:
 * 0:54:79 it must be edited to read 0:54:079
 * Likewise 0:54:9 should read 0:54:009
 * Easy check is to look at the start time for the next sound in the list.
 * It should be the previous end time 
 */
var soundlist = "T-Q_win.wav,0:2:0,0:2:529,0:0:529|"+
"amazing_multiplier.wav,0:3:129,0:6:692,0:3:563|"+
"amazingly_big_win_loop.wav,0:7:292,0:19:850,0:12:557|"+
"backtoreelstransition.wav,0:20:450,0:30:196,0:9:746|"+
"bonus_instructions_appear.wav,0:30:796,0:31:822,0:1:25|"+
"bonus_total_summary.wav,0:32:422,0:36:825,0:4:403|"+
"buttonpress.wav,0:37:425,0:37:708,0:0:282|"+
"Count_up_tick_loop_2.wav,0:38:308,0:43:701,0:5:393|"+
"destruction_of_freespins_surround_with_music.wav,0:44:301,0:49:751,0:5:450|"+
"doctorsymbol.wav,0:50:351,0:54:79,0:3:727|"+
"dragonsym.wav,0:54:679,0:57:179,0:2:500|"+
"freespinaddfx.wav,0:57:779,0:59:937,0:2:158|"+
"freespinssloop.wav,1:0:537,1:35:260,0:34:722|"+
"freespinstotalsummary.wav,1:35:860,1:39:843,0:3:983|"+
"freespinsymbol.wav,1:40:443,1:43:521,0:3:77|"+
"freespinsymbol2.wav,1:44:121,1:46:741,0:2:620|"+
"freespinsymbol3.wav,1:47:341,1:49:573,0:2:231|"+
"freespinsymbol4.wav,1:50:173,1:52:351,0:2:177|"+
"freespinsymbol5.wav,1:52:951,1:55:63,0:2:111|"+
"fullmoonsymbol2.wav,1:55:663,1:59:402,0:3:738|"+
"gravestonecrumblefx.wav,2:0:2,2:2:425,0:2:422|"+
"hidden_amounts_reveal.wav,2:3:25,2:4:715,0:1:690|"+
"incredible_multiplier.wav,2:5:315,2:9:38,0:3:722|"+
"k_a_win.wav,2:9:638,2:10:292,0:0:653|"+
"lightning.wav,2:10:892,2:12:992,0:2:100|"+
"massive_multiplier.wav,2:13:592,2:17:829,0:4:237|"+
"multiplieraddfx.wav,2:18:429,2:19:657,0:1:228|"+
"reelstops.wav,2:20:257,2:21:903,0:1:645|"+
"reelwinsummaryhighlight.wav,2:22:503,2:24:94,0:1:590|"+
"silverbulletsymbol.wav,2:24:694,2:26:394,0:1:700|"+
"stakedown.wav,2:26:994,2:27:483,0:0:489|"+
"stakeup.wav,2:28:83,2:28:572,0:0:489|"+
"startreelspin.wav,2:29:172,2:30:548,0:1:375|"+
"super_multiplier.wav,2:31:148,2:35:101,0:3:953|"+
"transformation_howl_1.wav,2:35:701,2:37:962,0:2:260|"+
"transformation_howl_2.wav,2:38:562,2:41:566,0:3:4|"+
"transformation_howl_3.wav,2:42:166,2:45:170,0:3:4|"+
"transformation_howl_4.wav,2:45:770,2:48:646,0:2:876|"+
"transformation_howl_5.wav,2:49:246,2:52:138,0:2:891|"+
"werewolffootprintsymbol.wav,2:52:738,2:55:187,0:2:448|"+
"wild_symbol_win.wav,2:55:787,2:59:727,0:3:940|"+
"winSummary_large.wav,3:0:327,3:9:228,0:8:900|"+
"wolf_howl_loopable_2.wav,3:9:828,3:12:250,0:2:421|"+
"reelspinloop.wav,3:12:818,3:17:090,0:4:086";
