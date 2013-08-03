/**
 * enyo.Spotlight.Scrolling definition
 * @author: Lex Podgorny
 */

enyo.Spotlight.Scrolling = new function() {
	//* @protected
	/*************************************************************/

	var _nDelta = 0,
		_nTime  = 0;

	//* @public
	/*************************************************************/
	
	//* Fire scroll event every this.frequency mousewheel points
	this.frequency = 40;
	
	this.processMouseWheel = function(oEvent, fCallback, oContext) {
		_nDelta += oEvent.wheelDeltaY;
		//enyo.log('wheel', _nDelta);

		// When no spottable elements are present in the app, rely on default events
		if (oContext == enyo.Spotlight && oContext.getCurrent()) {
			oEvent.preventDefault();
			return;
		}
		
		if (_nDelta >= this.frequency) {
			_nDelta = 0;
			return fCallback.apply(oContext, [oEvent, true]);
		} else if (_nDelta <= -this.frequency) {
			_nDelta = 0;
			return fCallback.apply(oContext, [oEvent, false]);
		}
		
	}
}