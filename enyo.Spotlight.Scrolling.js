/**
 * Provides the nearest neighbor to object with current focus
 *
 * @typedef {Object} enyo.Spotlight.Scrolling definition
 *
 * @ui
 * @class enyo.Spotlight.Scrolling
 * @public
 */

enyo.Spotlight.Scrolling = new function() {
    //* @protected
    /*************************************************************/

    var _nDelta = 0;

    /**
    * Fire scroll event every this.frequency mousewheel points
    *
    * @type {Number}
    * @public
    */
    this.frequency = 40;

    /**
    * Figure out string component id to push
    *
    * @param  {Object} oEvent - Current event
    * @param  {Function} fCallback - Callback function
    * @param  {Object} oContext - Execution context for callback
    * @type {Function}
    * @public
    */
    this.processMouseWheel = function(oEvent, fCallback, oContext) {
        _nDelta += oEvent.wheelDeltaY;

        if (_nDelta >= this.frequency) {
            _nDelta = 0;
            return fCallback.apply(oContext, [oEvent, true]);
        } else if (_nDelta <= -this.frequency) {
            _nDelta = 0;
            return fCallback.apply(oContext, [oEvent, false]);
        }
    };
};
