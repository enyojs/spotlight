/**
 * enyo.Spotlight.Dispatcher kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Dispatcher',

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
						enyo.Spotlight.onKeyEvent(oEvent);
					} else {
						var nElapsedTime = (new Date()).getTime() - this._nTime,
							nSeconds	 = Math.floor(nElapsedTime / 1000),
							nToSkip		 = 0;
							
						nSeconds = nSeconds > this._aFrequency.length - 1
							? this._aFrequency.length - 1
							: nSeconds;
							
						nToSkip = this._aFrequency[nSeconds] - 1;
						
					//	console.log('Seconds:', nSeconds, 'Need to skip:', nToSkip);
							
						if (this._nSkipped >= nToSkip) {
						//	console.log('event', this._nSkipped);
							enyo.Spotlight.onKeyEvent(oEvent);
							this._nSkipped = 0;
						} else {
						//	console.log('skip', this._nSkipped);
							this._nSkipped ++;
						}
					}
					break;
				case 'keyup':
					this.reset();
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