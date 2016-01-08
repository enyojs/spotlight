/**
* Accelerator provides logic for accelerating and throttling cursor movement.
*
* Returns a generator function that accepts the [Spotlight]{@link module:spotlight}
* instance as an argument.
*
* @module spotlight/accelerator
* @public
*/
module.exports = function (Spotlight) {

    //* @protected
    /*************************************************************/

    var _isAccelerating = false,
        _nSkipped = 0,
        _nTime = 0,
        _nKey = 0,
        _bCanceled = false;

    /**
    * Controls the frequency with which the cursor will "freeze". While frozen,
    * the current spotted item cannot change, and all events are directed to it.
    *
    * @type {Array}
    * @default [3, 3, 3, 2, 2, 2, 1]
    * @public
    */
    this.frequency = [3, 3, 3, 2, 2, 2, 1];

    /**
    * Called from {@link module:spotlight}, with the current keydown event and
    * Spotlight's callback, which will be called when the event is allowed
    * through.
    *
    * @param  {Object} oEvent - The current event to validate.
    * @param  {Function} fCallback - The callback to execute.
    * @param  {Object} oContext - The callback's execution context.
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
    * Resets values for Spotlight.
    *
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
    * Cancels the accelerator.
    *
    * @public
    */
    this.cancel = function() {
        _bCanceled = true;
    };

    /**
    * Verifies that the accelerator is active.
    *
    * @returns {Boolean} `true` if the accelerator is active; otherwise, `false`.
    * @public
    */
    this.isAccelerating = function() {
        return _isAccelerating;
    };
};
