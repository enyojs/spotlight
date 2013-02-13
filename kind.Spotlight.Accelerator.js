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

		processKey: function(oEvent) {
			switch (oEvent.type) {
				case 'keydown':
					if (oEvent.keyCode != this._nKey) {
						this.reset();
						this._nTime = (new Date()).getTime();
						this._nKey = oEvent.keyCode;
						return enyo.Spotlight.onKeyEvent(oEvent);
					} else {
						var nElapsedTime = (new Date()).getTime() - this._nTime,
							nSeconds	 = Math.floor(nElapsedTime / 1000),
							nToSkip		 = 0;

						nSeconds = nSeconds > this._aFrequency.length - 1
							? this._aFrequency.length - 1
							: nSeconds;

						nToSkip = this._aFrequency[nSeconds] - 1;
						if (nToSkip < 0) { nToSkip = 0; }

					//	console.log('Seconds:', nSeconds, 'Need to skip:', nToSkip);

						if (this._nSkipped >= nToSkip) {
						//	console.log('event', this._nSkipped);
							this._nSkipped = 0;
							return enyo.Spotlight.onKeyEvent(oEvent);
						} else {
						//	console.log('skip', this._nSkipped);
							this._nSkipped ++;
							return true;
						}
					}
					break;
				case 'keyup':
					this.reset();
					return true;
					break;
			}
		},

		reset: function() {
			this._nSkipped = 0;
			this._nTime    = 0;
			this._nKey	   = 0;
		}
	}
});