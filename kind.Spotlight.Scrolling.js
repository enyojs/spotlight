/**
 * enyo.Spotlight.Scrolling kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name	: 'enyo.Spotlight.Scrolling',
	statics : {
		
		//* @protected
		/*************************************************************/

		_nDelta	: 0,
		_nTime	: 0,

		//* @public
		/*************************************************************/
		
		//* Fire scroll event every this.frequency mousewheel points
		frequency: 40,
		
		processMouseWheel: function(oEvent, fCallback, oContext) {
			this._nDelta += oEvent.wheelDeltaY;
			//enyo.log('wheel', this._nDelta);

			// When no spottable elements are present in the app, rely on default events
			if (oContext == enyo.Spotlight && oContext.getCurrent()) {
				oEvent.preventDefault();
				return;
			}
			
			if (this._nDelta >= this.frequency) {
				this._nDelta = 0;
				return fCallback.apply(oContext, [oEvent, true]);
			} else if (this._nDelta <= -this.frequency) {
				this._nDelta = 0;
				return fCallback.apply(oContext, [oEvent, false]);
			}
			
		}
	}
});