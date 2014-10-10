/**
* Use {@link enyo.Spotlight.States} when you need to save Spotlight state (i.e.,
* what is currently spotted) to spot again later. One use case is a model window
* that takes over Spotlight interaction for as long as it is open. Before the
* window opens, save the spotted component by calling
* `enyo.Spotlight.push("mystackname")`; then, after the window closes, call
* `enyo.Spotlight.pop("mystackname")` to restore the previous state.
*
* You can create as many stacks as needed and push as many states as necessary
* on each stack by specifying its name or the component that keeps track of
* changes:
* ```
* enyo.Spotlight.push(this.id) => enyo.Spotlight.pop(this.id)
* ```
*
* In addition, when pushing to a stack, you may specify the component that you
* want to be spotted when the stack is popped.
*
* To log changes in States, turn on verbose mode (see
* [verbose()]{@link enyo.Spotlight.States#verbose}).
*
* @typedef {Object} enyo.Spotlight.States definition
*
* @class enyo.Spotlight.States
* @public
*/
enyo.Spotlight.States = new function() {
    var _oStacks = {},
        _bVerbose = false;

    var
    /**
    * Determines string component id to push.
    *
    * @param  {Object} oComponentToSpotOnPop - The component to be spotted when popped.
    * @returns {Number}
    * @private
    */
    _resolveComponentId = function(oComponentToSpotOnPop) {
        return (oComponentToSpotOnPop && oComponentToSpotOnPop.id) ? oComponentToSpotOnPop.id : enyo.Spotlight.getCurrent().id;
    },

    /**
    * Determines whether a stack with the given name has been created.
    *
    * @param  {String} sStackName - The name of the stack to verify.
    * @returns {Boolean} `true` if a stack with the given name exists; otherwise, `false`.
    * @private
    */
    _stackExists = function(sStackName) {
        return typeof _oStacks[sStackName] != 'undefined';
    },

    /**
    * Writes to log if currently in verbose mode.
    *
    * @private
    */
    _log = function() {
        if (!_bVerbose) {
            return;
        }
        enyo.log('SPOTLIGHT STATES: ' + Array.prototype.slice.call(arguments, 0).join(' '));
    };

    /**
    * Adds a component to the specified stack.
    *
    * @param  {String} sStackName - The name of the stack to push to.
    * @param  {Object} [oComponentToSpotOnPop] - A component to be spotted when
    * the stack is popped.
    * @type {Function}
    * @public
    */
    this.push = function(sStackName, /*optional*/ oComponentToSpotOnPop) {

        var sComponentId = _resolveComponentId(oComponentToSpotOnPop);

        // Create stack if it has not been created
        if (!_stackExists(sStackName)) {
            _oStacks[sStackName] = [];
        }

        // Push component id onto the stack
        _oStacks[sStackName].push(sComponentId);
        _log('Pushed', sComponentId, 'onto stack', sStackName + '[' + _oStacks[sStackName].length + ']');
    };

    /**
    * Pops a component from the specified stack.
    *
    * @param  {String} sStackName - The name of the stack to pop from.
    * @public
    */
    this.pop = function(sStackName) {
        var sComponentId;

        if (!_stackExists(sStackName)) {
            throw 'Error in enyo.Spotlight.States: stack "' + sStackName + "' dose not exist, call push to create it";
        }

        if (_oStacks[sStackName].length > 0) {
            sComponentId = _oStacks[sStackName].pop();
            if (sComponentId) {
                enyo.Spotlight.spot(enyo.$[sComponentId]);
                _log('Popped', sComponentId, 'off stack', sStackName + '[' + _oStacks[sStackName].length + ']');
            }
        } else {
            enyo.warn('enyo.Spotlight.States.pop() has failed: Stack "' + sStackName + '" is empty');
        }
    };

    /**
    * Sets verbosity state.
    *
    * @param  {Boolean} bVerbose - Whether verbosity should be enabled.
    * @public
    */
    this.verbose = function(bVerbose) {
        _bVerbose = (typeof bVerbose == 'undefined') ? !_bVerbose : bVerbose;
        return 'SPOTLIGHT.STATES: verbose mode is ' + (_bVerbose ? 'ON' : 'OFF');
    };
};
