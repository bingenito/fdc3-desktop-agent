/**
 * Desktop Agent Background script
 * this is the singleton controller for most fdc3 business logic including:
 *  - interfacing with the app directory
 *  - managing channels and routing context data
 *  - resolving intents
 *  
 */
import utils from "./utils";
import listeners from "./bg-listeners";


listeners.initContextChannels(utils.getSystemChannels());


/*
    When an app (i.e. a new tab) connects to the FDC3 service:
        - determine if it has a corresponding entry in the app directory
        - if it is in appD, fetch it's appD entry - since we are only dealing with webapps, we don't need another manifest to launch
        - add the tab reference plus any appD data to the "connected" dictionary
        - add event listeners for the app
        - send environment data to the app (directory data, channels, etc)
        - for the app, reciept of the environment data will signal that the background script is ready to recieve events from it

*/
chrome.runtime.onConnect.addListener( async function(port) {
    
    let app_url = new URL(port.sender.url);
    let app_id = utils.id(port);
    //envData is the known info we're going to pass back to the app post-connect
    let envD = {};
    envD.currentChannel = listeners.getTabChannel(port.sender.tab.id);
    envD.tabId = port.sender.tab.id;
    //let dMatch = [];
    //look origin up in directory...
    try {
        const directoryUrl = await utils.getDirectoryUrl();
        let _r = await fetch(`${directoryUrl}/apps/search?origin=${app_url.origin}`);
        let data = await  _r.json();
        //see if there was an exact match on origin
        //if not (either nothing or ambiguous), then let's treat this as dynamic - i.e. no directory match
        let entry = null;
        if (data.length === 1){
            entry = data[0];
    
            //if the app has actions defined in the appD, look those up (this is an extension of appD implemented by appd.kolbito.com) 
            //actions automate wiring context and intent handlers for apps with gettable end-points
            if (entry.hasActions){
                console.log("hasActions");
                let actionsR = await fetch(`${directoryUrl}/apps/${entry.name}/actions`);
                
                let actions = await actionsR.json();
                if (actions){
                    entry.actions = actions;
                    envD.directory = entry;
                    utils.setConnected(app_id,{port:port, directoryData:entry});
                    port.postMessage({topic:"environmentData", 
                    data:envD});
                }
                
            }
            else {
           
                envD.directory = entry;
                utils.setConnected(app_id,{port:port, directoryData:entry});
                port.postMessage({topic:"environmentData", data:envD});
            }        
            
        }
        else {
            if (data.length === 0){
                console.log("No match appd entries found");
            } else {
                console.log(`Ambiguous match - ${data.length} items found.`);
            }
            utils.setConnected(app_id,{port:port, directoryData:null});
            
            port.postMessage({topic:"environmentData", 
                        data:envD});

        }

        listeners.applyPendingChannel(port);
    
    }
    catch (e){
        console.log(`app data not found for origin ${app_url.origin}`);
        utils.setConnected(app_id,{port:port, directoryData:null});
        port.postMessage({topic:"environmentData", 
                                data:envD});
                        
    }
    
    port.onDisconnect.addListener(function(){
        console.log("disconnect",port);
        let id = utils.id(port);
        utils.dropConnected(id);
        //remove context listeners
        listeners.dropContextListeners(id);
        
        //cleanup the listeners...
        listeners.dropIntentListeners(port);
    });

    const wrapListener = async (msg, port, decorator) => {
        let r = null;
        if (listeners[msg.topic]){
            try {
                let _r = await listeners[msg.topic].call(this, msg, port);
                if (decorator){
                    r = decorator.call( {result:true}, _r);
                }
                else {
                  r = _r;  
                }
                
            }
            catch (err){
                console.log("error", err);
                r = {result:false,
                    error:err};
            }
            //post the return message back to the content script
            if (msg.data && msg.data.eventId){
                port.postMessage({
                        topic:msg.data.eventId,
                        data:r
                })
            }
        }
        else {
            console.log(`no listener found for message topic '${msg.topic}'`);   
        }
    };

    port.onMessage.addListener(async function(msg) {
        wrapListener(msg, port);
    });
});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
    // Send a message to the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    });
});


