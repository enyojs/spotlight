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
			
			oEvent.preventDefault();
			
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