/**
 * {@link enyo.Spotlight.Scrolling} contains logic relating to mousewheel events.
 *
 * @typedef {Object} enyo.Spotlight.Scrolling definition
 *
 * @class enyo.Spotlight.Scrolling
 * @public
 */

enyo.Spotlight.Scrolling = new function() {
    //* @protected
    /*************************************************************/

    var _nDelta = 0;

    /**
    * Scroll event is fired every `this.frequency` mousewheel points.
    *
    * @type {Number}
    * @public
    */
    this.frequency = 40;

    /**
    * Determines string component id to push.
    *
    * @param  {Object} oEvent - The current event.
    * @param  {Function} fCallback - The callback function.
    * @param  {Object} oContext - The execution context for the callback.
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
