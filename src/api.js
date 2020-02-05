/**
 * This file is injected into each Chrome tab by the Content script to make the FDC3 API available as a global
 */

function _doFdc3(){

/**
*  the Listener class 
*/
class Listener {
    constructor(){


    }

    unsubscribe(){
        
    }
}

/**
 * the Channel class 
 */
class Channel {
    constructor(id, type, displayMetadata){
        this.id = id;
        this.type = type;
        this.displayMetadata = displayMetadata;
    }

    broadcast(context){

    }

    getCurrentContext(contextType){
        return new Promise(async (resolve, reject) => {

        });
    }

    addContextListener(handler) {

    }
}

const wireMethod = (method, detail, isVoid) => {
    const ts = Date.now();
    const eventId = `${method}_${ts}`;
    detail.eventId = eventId;
    detail.ts = ts;
    if (isVoid){      
        document.dispatchEvent(new CustomEvent(`FDC3:${method}`,{detail:detail}));
    }
    else {
        return new Promise((resolve, reject) => {
           
            document.addEventListener(`FDC3:return_${eventId}`,(evt)=>{
                if (evt.detail){
                    resolve(evt.detail);
                }
                else {
                    reject(evt.detail);
                }           
            },{once:true});
            
            
            document.dispatchEvent(new CustomEvent(`FDC3:${method}`,{detail:detail}));

        });
    }
};

window.fdc3 = {
    _contextListeners:[],
    _intentListeners:{},
    open:function(name, context){
        return wireMethod("open", {name:name, context:context});
    },
    broadcast:function(context){
        //void
        wireMethod("broadcast", {context:context}, true);
    },

    raiseIntent:function(intent, context){
       return wireMethod("raiseIntent",{intent:intent, context:context});
    },

    addContextListener:function(listener){
        window.fdc3._contextListeners.push(listener);
        document.dispatchEvent(new CustomEvent('FDC3:addContextListener', {
            detail:{
            }
        }));
    },

    addIntentListener:function(intent, listener){
        if (!window.fdc3._intentListeners[intent]){
            window.fdc3._intentListeners[intent] = [];
        }
        window.fdc3._intentListeners[intent].push(listener);
        document.dispatchEvent(new CustomEvent('FDC3:addIntentListener', {
            detail:{
                intent:intent
            }
        }));
    },

    findIntent: function(intent, context){
        return wireMethod("findIntent",{intent:intent, context:context});
    },


    findIntentsByContext: function(context){
        return wireMethod("findIntentsByContext",{context:context});
    },

    getSystemChannels: function(){
        return new Promise((resolve, reject) => {
            document.addEventListener("FDC3:returnSystemChannels",evt =>{
                resolve(evt.detail.data);
            }, {once : true});
            document.dispatchEvent(new CustomEvent('FDC3:getSystemChannels', {
  
            }));
        });
    },

    joinChannel: function(channel){
        return new Promise((resolve, reject) => {
            document.addEventListener("FDC3:confirmJoin",evt =>{
                resolve(true);
            }, {once : true});
            document.dispatchEvent(new CustomEvent('FDC3:joinChannel', {
                detail:{
                    channel:channel
                }
            }));
                

        });
    }

   
 };

 document.addEventListener("FDC3:context",evt => {
     window.fdc3._contextListeners.forEach(l => {
         l.call(this,evt.detail.data.context);
     });
 });

 document.addEventListener("FDC3:intent",evt => {
     if (window.fdc3._intentListeners[evt.detail.data.intent]){
        window.fdc3._intentListeners[evt.detail.data.intent].forEach(l => {
            l.call(this,evt.detail.data.context);
        });
     }
});



//look for onFDC3 function set by the window...
try{
    if (onFDC3){
        onFDC3.call();
    }
} catch (e) {
    console.log("onFDC3 not set");
}
};

_doFdc3();

