/** ver 0.0.1 fmload.js - a wrapper of FileMaker.PerformScript which returns Promise */

var FMLOAD_LIMIT_COUNT = 10; /** How many times to try loading FileMaker object. 1 try = approximately 16ms. Basically loaded in 1 or 2 try */
var FMSCRIPT_WAIT_TIME = 10; /** How long to wait for response from FileMaker after request of FileMaker.PerformScript*/

/**
 *  What fmload does:
 *  1. wait for FileMaker object loaded
 *  2. define 'performScript' function which is a wrapper of FileMaker.PerformScript
 *  performScript - Promise chain sequence depends on this.
 *  3. define 'fmcallback' function which is called by FileMaker 'Perform Javascript in Web Viewer' script step after FileMaker.PerformScript request
 *  4. define FileMaker.result property which stores data from FileMaker temorarily.
 * 
 *  == Usage ==
 *  pattern1: If you want data from FileMaker just after WebViewer is loaded
 *  fmload().then( function(){
 *      return performScript(scriptName, parameter)  
 *  })
 *  .then(function(data){
 *      // deploy your data
 *  }).catch(function(err){
 *      // error handling here
 *  })
 * 
 *  pattern2: In event handlers
 *  e.g. button.onclick = function(){
 *     performScript(scriptName, parameter).then(function(data){
 *         // deploy your data
 *     }).catch(function(err){
 *      // error handling here
 *     })
 *  }
 * 
 *  FileMaker Side: In script step 'Perform JavaScript in Web Viewer', use 'fmcallback' for function name to be called.
 *  parameters: 1st param: JSON {"state": "ng/ok", "data": __DATA__}, 2nd: requestId
 *  requestId is included in the data via performScript
 * 
 * 
 *  Caveat:
 *  1. DON'T RUN MULTIPLE performScript functions at once. In race condition, the order of getting result is not guaranteed. USE one by one in Promise chain if needed. 
 *  2. You can use original FileMaker.PerformScript in offical way.
 *  
 *  For Windows:
 *  IE11 doesn't supprt Promise. So you must include polyfill before this code (fmload.js)
 *  Read the WhyPromise.md
 *  You can find download url there
 */

function fmload() {
    var counter = 0;
    return new Promise(function (success, failure) {
        requestAnimationFrame(function check() {
            try {
                if (!FileMaker) { throw new Error("FileMaker NOT FOUND") }
                console.log("FileMake Loaded!!!!!!!!!!!!!!!!!!!!!!!!")
                if (FileMaker && !FileMaker.result) {
                    console.log("FileMaker.result is created");
                    FileMaker.result = {};
                }
                window.fmcallback = function (params, requestId) {
                    console.log("fmcallback is called!");
                    if (requestId in FileMaker.result) {
                        console.log("RESOLVED");
                        FileMaker.result[requestId] = params;
                    } else {
                        alert("callback Timeout Error, already this script is cancelled");
                    }
                };
                window.performScript = function (name, params) {
                    const requestId = getId();
                    console.log("peroformScript requestId", requestId);
                    FileMaker.result[requestId] = null;
                    var obj = {
                        requestId: requestId,
                        data: params
                    }
                    FileMaker.PerformScript(name, JSON.stringify(obj));
                    return new Promise(function (success2, failure2) {
                        var time = 0;
                        (function waitForResult() {
                            console.log("check--" + requestId);
                            if (FileMaker.result[requestId]) {
                                console.log("Promise Resolved", requestId)
                                const temp = FileMaker.result[requestId];
                                delete FileMaker.result[requestId];
                                return success2(temp);
                            } else {
                                time += 100;
                                console.log("waiting callback", time);
                                if (time > 1000 * FMSCRIPT_WAIT_TIME) {
                                    console.log("Waiting too long ... cancelled", time)
                                    delete FileMaker.result[requestId];
                                    failure2(new Error("FileMaker object Timeout Error"));
                                } else {
                                    setTimeout(waitForResult, 100);
                                }
                            }
                        })();
                    })
                };
                success();
            } catch (e) {
                if (counter++ > FMLOAD_LIMIT_COUNT) failure(e);
                requestAnimationFrame(check);
            }
        })
    })
}
/** Making a counter function */
function makeCounter() {
    var count = 1;
    return function () {
        return count++;
    }
}
var counter = makeCounter();
function getId() {
    var count = counter();
    return count;
}