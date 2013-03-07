/**
 * enyo.Spotlight.Accelerator kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Accelerator',

	statics: {
		
		//* @protected
		/*************************************************************/
		
		_nSkipped	: 0,
		_nTime		: 0,
		_nKey		: 0,
		
		//* @public
		/*************************************************************/
		
		//* Firing configuration. At n-th second use every frequency[n] subsequent keydown event
		frequency	: [3, 3, 3, 2, 2, 2, 1],	
		
		//* Called from enyo.Spotlight, with current keydown event and Spotlight's callback 
		//* Which will be called when an event is allowed through
		processKey: function(oEvent, fCallback) {
			switch (oEvent.type) {
				case 'keydown':
					if (oEvent.keyCode != this._nKey) {
						this.reset();
						this._nTime = (new Date()).getTime();
						this._nKey = oEvent.keyCode;
						return fCallback(oEvent);
					} else {
						var nElapsedTime = (new Date()).getTime() - this._nTime,
							nSeconds	 = Math.floor(nElapsedTime / 1000),
							nToSkip		 = 0;

						nSeconds = nSeconds > this.frequency.length - 1
							? this.frequency.length - 1
							: nSeconds;

						nToSkip = this.frequency[nSeconds] - 1;
						if (nToSkip < 0) { nToSkip = 0; }

						if (this._nSkipped >= nToSkip) {
							this._nSkipped = 0;
							return fCallback(oEvent);
						} else {
							this._nSkipped ++;
							oEvent.preventDefault(); // Prevent skipped keydown events from bubbling
							return true;
						}
					}
					break;
				case 'keyup':
					this.reset();
					return fCallback(oEvent);
			}
		},

		reset: function() {
			this._nSkipped = 0;
			this._nTime    = 0;
			this._nKey	   = 0;
		}
	}
});