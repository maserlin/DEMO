/**
 * This class loads mp3 files into an array. 
 * They are requested using an XMLHttpRequest which was designed to allow a webpage 
 * to update a part of a page without doing a full refresh. 
 * We use it to retrieve byteArrays (mp3s) by setting request.responseType = "arraybuffer";
 * @see https://developer.mozilla.org/en-US/docs/Web/API/xmlHttpRequest
 * 
 * As each file loads it is processed by the supplied audioContext object using its
 * decodeAudioData method. 
 * The decodeAudioData() method is preferred over the createBuffer() from ArrayBuffer method 
 * because it is asynchronous and does not block the main JavaScript thread. 
 * @see http://docs.webplatform.org/wiki/apis/webaudio/AudioContext/decodeAudioData
 * 
 */
com.sound.SoundBufferLoader = ( function(){
    
    /**
     * Loads an array of sound (or any other) files into an "arraybuffer"
     * a typed array. See:
     * https://developer.mozilla.org/en-US/docs/Web/API/ArrayBuffer
     * http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/
     */
    function SoundBufferLoader(audioContext, urlList, callback) 
    {
      this.audioContext = audioContext;
      this.urlList = urlList;
      this.onload = callback;
      this.bufferList = new Array();
      this.loadCount = 0;
    }
    var SoundBufferLoader = newClass(SoundBufferLoader);
    
    SoundBufferLoader.prototype.audioContext = null;
    SoundBufferLoader.prototype.urlList = null;
    SoundBufferLoader.prototype.onload = null;
    SoundBufferLoader.prototype.bufferList = null;
    SoundBufferLoader.prototype.loadCount = null;

    /**    
     * Process the list.
     */
    SoundBufferLoader.prototype.load = function() 
    {
        for (var i = 0; i < this.urlList.length; ++i)
        {
            this.loadBuffer(this.urlList[i], i);
        }
    }
    
    /**
     * Sounds are loaded from the JSON filenames in the order in which they appear.
     * Therefore Sound #0 will end up in array position (loader.bufferList) [0]
     * The original code didn't increment the counter if a file failed to load but
     * we are incrementing the counter: the net effect is to ignore files failing to load
     * and to carry on regardless. We'll have to account for this in the player code
     * or change this behaviour later on, but for now to get stuff working that's OK.
     */
    SoundBufferLoader.prototype.loadBuffer = function(url, index) 
    {
        // Load buffer asynchronously
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        var loader = this;

        /*
         * Asynchronously decode the audio file data in request.response
         * Use this inline style of declaration in order to preserve the 
         * index param associated with loading this particular file, as we
         * want to preserve the order of the files according to the JSON list
         * that is driving this method call.
         * Note the synchronous load method is now officially deprecated, ao ALWAYS
         * use decodeAudioData with the three params.
         * @param request.response : the arrival of a sound file.
         * @param function(buffer) : on successful load handler.
         * @param function(error) : on load error handler.
         */
        request.onload = function() 
        {
            loader.audioContext.decodeAudioData( request.response,
                                            
                                            // Handles decode of valid file.
                                            function(buffer) 
                                            {
                                                // Add to list if OK.
                                                 if(buffer) 
                                                 {
                                                     loader.bufferList[index] = buffer;
                                                 }
                                                 // Add space in array if not to keep order
                                                 else
                                                 {
                                                     loader.bufferList[index] = null;
                                                 }
                                                
                                                // Always increment: ignore missing files for now.
                                                 if(++loader.loadCount == loader.urlList.length)
                                                    loader.onload(loader.bufferList);
                                            },
                                            
                                            // Handles errors i.e. missing files: Carry on as normal
                                            function(error) 
                                            {
                                                trace('decodeAudioData error');
                                                if(error == null)
                                                {
                                                    trace("PROBABLY FILE NOT FOUND? " + loader.urlList[index])
                                                }

                                                // Add space in array to keep order
                                                loader.bufferList[index] = null;
                                                
                                                //
                                                trace('Game will start but beware missing sounds!');
                                                if(++loader.loadCount == loader.urlList.length)
                                                    loader.onload(loader.bufferList);
                                            } );
        }
        
        //
        request.onerror = function() 
        {
          alert('BufferLoader: XHR error');
        }
        
        //
        request.send();
    }
    
    
    //
    return SoundBufferLoader;
})();
