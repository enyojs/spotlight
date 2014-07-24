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
     * @type {number}
     * @public
     */
    this.frequency = 40;

    /**
     * Figure out string component id to push
     *
     * @param  {object} oEvent - Current event
     * @param  {function} fCallback - Callback function
     * @param  {object} oContext - Execution context for callback
     * @type {function}
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
