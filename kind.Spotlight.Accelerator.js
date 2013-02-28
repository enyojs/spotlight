/**
 * enyo.Spotlight.Accelerator kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Accelerator',

	statics: {
		_aFrequency	: [3, 3, 3, 2, 2, 2, 1],	// At n-th second use every _aFrequency[n] subsequent keydown event
		_nSkipped	: 0,
		_nTime		: 0,
		_nKey		: 0,

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

						nSeconds = nSeconds > this._aFrequency.length - 1
							? this._aFrequency.length - 1
							: nSeconds;

						nToSkip = this._aFrequency[nSeconds] - 1;
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