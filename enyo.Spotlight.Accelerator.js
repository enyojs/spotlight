/**
* Provides acceleration and throttle of cursor movement.
*
* @typedef {Object} enyo.Spotlight.Accelerator
*
* @ui
* @class enyo.Spotlight.Accelerator
* @public
*/
enyo.Spotlight.Accelerator = new function() {

    //* @protected
    /*************************************************************/

    var _isAccelerating = false,
        _nSkipped = 0,
        _nTime = 0,
        _nKey = 0,
        _bCanceled = false;

    /**
    * Controls the frequency in which the cursor will 'freeze'
    * While frozen, current cannot change and all events are directed to it.
    *
    * @type {Array}
    * @default [3, 3, 3, 2, 2, 2, 1]
    * @public
    */
    this.frequency = [3, 3, 3, 2, 2, 2, 1];

    /**
    * Called from enyo.Spotlight, with current keydown event and Spotlight's callback
    * Which will be called when an event is allowed through
    *
    * @param  {Object} oEvent - Current event to validate
    * @param  {Function} fCallback - Callback that is executed
    * @param  {Object} oContext - Callback's execution context
    * @type {Function}
    * @returns {Boolean}
    * @public
    */
    this.processKey = function(oEvent, fCallback, oContext) {
        switch (oEvent.type) {
            case 'keydown':
            case 'pagehold':
            case 'pageholdpulse':
                if (oEvent.keyCode != _nKey) {
                    this.reset();
                    _nTime = (new Date()).getTime();
                    _nKey = oEvent.keyCode;
                    return fCallback.apply(oContext, [oEvent]);
                } else if (_bCanceled) {

                    // Prevent skipped keydown events from bubbling
                    oEvent.preventDefault();
                    return true;
                } else {
                    var nElapsedTime = (new Date()).getTime() - _nTime,
                        nSeconds = Math.floor(nElapsedTime / 1000),
                        nToSkip = 0;

                    nSeconds = nSeconds > this.frequency.length - 1 ? this.frequency.length - 1 : nSeconds;

                    nToSkip = this.frequency[nSeconds] - 1;
                    if (nToSkip < 0) {
                        nToSkip = 0;
                    }

                    _isAccelerating = !(nSeconds === 0 && _nSkipped === 0);

                    if (_nSkipped >= nToSkip) {
                        _nSkipped = 0;
                        return fCallback.apply(oContext, [oEvent]);
                    } else {
                        _nSkipped++;
                        oEvent.preventDefault(); // Prevent skipped keydown events from bubbling
                        return true;
                    }
                }
                break;
            case 'keyup':
            case 'pagerelease':
                this.reset();
                return fCallback.apply(oContext, [oEvent]);
        }
    };


    /**
    * Reset values for spotlight
    *
    * @type {Function}
    * @public
    */
    this.reset = function() {
        _nSkipped = 0;
        _nTime = 0;
        _nKey = 0;
        _bCanceled = false;
        _isAccelerating = false;
    };

    /**
    * Cancel the accelerator
    *
    * @type {Function}
    * @public
    */
    this.cancel = function() {
        _bCanceled = true;
    };

    /**
    * Verify the accelerator is in motion
    *
    * @type {Function}
    * @returns {Boolean}
    * @public
    */
    this.isAccelerating = function() {
        return _isAccelerating;
    };
};
