# How to use fmload.js

Check sample files !!  
It is best to understand how to intergrate this with FileMaker  

## Why Promise  

Promise is very popular and daily use technique in Web development.

    fetch(url)  
        .then(successHandler1)  
        .then(sucessHandler2)  
        ......  
        .then(successHandlerN)  
        .catch(errorHandler) 
  
So it is obvious that if you think it could be available in FileMaker.PerformScript. In this libarary, I made performScript function, which is a wrapper function of 'FileMaker.PerformScript' and returns Promise.
Before mentioning it, let's observe how the code looks like if we can't use Promise.

    FileMaker.PerformScript(scriptName1, data)  

    function successHandler1(data) {  
        ... Process Data ...  
        FileMaker.PerformScript(scriptName2, data2)  
    }  
    function errorHandler1(errData){  
        ... Error Handling ...  
    }  
    function successHandler2(data) {  
        ... Process Data ...  
        FileMaker.PerformScript(scriptName3)  
    }  
    function errorHandler2(errData){  
        .... Error Handling ...  
    }  
    .................  

Because FileMaker.PerformScript doesn't have return-value, to get the result of script, we have to use 'Perform JavaScript in Web Viewer' script step in FileMaker side. We have to make functions to be called beforehand like above code. Comparing Promise pattern, what do you think? It is less readable, isn't it? 
Many functions to be called from FileMaker, that can be error-prone.

Not only the readablity, there's more important purpose to use Promise.  
Using Promise, we can completely control the sequential execution of FileMaker.PerformScript calls in order.

Here's the code using fmload.js

**== Usage ==**  

pattern1: If you want data from FileMaker just after WebViewer is loaded  

    fmload().then( function(){  
        return performScript(scriptName, parameter)    
    })  
    .then(function(data){  
        // deploy your data  
    }).catch(function(err){  
        // error handling here  
    })  

pattern2: In event handlers  

    fmload();
    // First call fmload() to setup performScript function
    button.onclick = function(){  
        performScript(scriptName, parameter)  
        .then(function(data){  
            // deploy your data  
        }).catch(function(err){  
            // error handling here  
        })  
    }

## RULES to use fmload.js

1. parameters of performScript (same with FileMaker.PerformScript)  
1st param: scriptName  
2nd: data  
In the background of performScript function, a object like below is created and it is passed to FileMaker script as ScriptParameter.
Understanding the structure, you must process it in FileMaker script.

    {  requestId: unique-number, data: object or number or string  }

    requestId is automatically assigned in the background.  

2. The function name to be called in 'Perform JavaScript in Web Viewer' script step is **'fmcallback'**.  
This name is **fixed**. Don't change it.  

3. fmcallback parameters  
1st param: JSON like below  
{
    "state":"ok/ng",
    "data": DATA_TO_BE_PASSED
}  
state property is a indicator whether the request form WebViewer is successfully handled or not.  
Assign 'ok' or 'ng' to it.  
2nd param: specify requestId  
This guarantees the consistency of Promise chain.
4. The timeout of performScript function caii is limited in 10 seconds. Change the code if needed.
5. In Windows WebViewer, Promise is not supported. So you must use Polyfill below.
    https://github.com/taylorhakes/promise-polyfill

## About sample files

It is hard to understand only reading this description.  
I made sample files to understand more easily.  
Follow the sequence of Promise based interaction there, and read the comment in fmload.js.

What is the situations when Promise based interaction is needed?
It is not necessarily needed only for visualzation of data.
When we use WebViewer as input UI, tight interactions between FileMake and WebViewer occur.
In those cases, Promise comes to rescue us.  
When using WebViewer for input, how do we handle the data-change by others?  
I think there are 3 approaches.

1. Lock the record、don't allow others to change data
2. Allow others to change, check it when you save your data
3. Detect the chages by others, and sync WebViewer

Sample files are made for each situation.

