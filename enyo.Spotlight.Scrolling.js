/**
 * enyo.Spotlight.Scrolling definition
 * @author: Lex Podgorny
 */

enyo.Spotlight.Scrolling = new function() {
	//* @protected
	/*************************************************************/

	var _nDelta = 0;

	//* @public
	/*************************************************************/

	//* Fire scroll event every this.frequency mousewheel points
	this.frequency = 40;

	this.processMouseWheel = function(oEvent, fCallback, oContext) {
		_nDelta += oEvent.wheelDeltaY;
		var bUp = true;

		if (_nDelta >= this.frequency) {
			_nDelta = 0;
		} else if (_nDelta <= -this.frequency) {
			_nDelta = 0;
			bUp = false;
		}
		
		return fCallback.apply(oContext, [oEvent, bUp]);

	};
};