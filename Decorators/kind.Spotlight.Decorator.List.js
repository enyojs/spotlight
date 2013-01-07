/**
 * enyo.Spotlight.Decorator.List kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.List',
	
	statics: {
		decorates: enyo.List,
	
		_getNode: function(oSender, n) {
			return oSender.$.generator.fetchRowNode(n);
		},
	
		_focusNode: function(oSender, n) {
			enyo.Spotlight.Util.addClass(this._getNode(oSender, n), 'spotlight');
		},
	
		_blurNode: function(oSender, n) {
			enyo.Spotlight.Util.removeClass(this._getNode(oSender, n), 'spotlight');
		},

		_getCurrent: function(oSender) {
			if (typeof oSender._nCurrentSpotlightItem == 'undefined') {
				return 0;
			}
			return oSender._nCurrentSpotlightItem;
		},
		
		_setCurrent: function(oSender, n, bScrollIntoView) {
			var nCurrent = this._getCurrent(oSender);
			
			if (nCurrent !== null) {
				this._blurNode(oSender, nCurrent);
			}

			if (n !== null) {
				this._focusNode(oSender, n);
				oSender._nCurrentSpotlightItem = n;
				if (bScrollIntoView) {
					oSender.scrollIntoView({
						hasNode	: function() { return true; },
						node	: this._getNode(oSender, n)
					}, false);
				}
				enyo.Spotlight._dispatchEvent('onSpotlightItemFocus', {index: n}, oSender);
			}
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
		},
	
		/******************************/
	
		onSpotlightFocus: function(oSender, oEvent) {
			console.log('Focus');
			this._setCurrent(oSender, this._getCurrent(oSender), false);
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
			return true;
		},
	
		onSpotlightBlur: function(oSender, oEvent) {
			this._setCurrent(oSender, null, true);
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
			return true;
		},
	
		onSpotlightSelect: function(oSender, oEvent) {
			if (this._getCurrent(oSender) !== null) {
				enyo.Spotlight._dispatchEvent('ontap', {index: this._getCurrent(oSender)}, oSender.$.item);
			} else {
				this._setCurrent(oSender, 0, true);
			}
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
			return false;
		},
	
		onSpotlightDown: function(oSender, oEvent) {
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent === null) { return; }
			if (nCurrent < oSender.getCount() - 1) {
				this._setCurrent(oSender, nCurrent + 1, true);
				return false;
			}
			this._setCurrent(oSender, null, true);
			return true;
		},
	
		onSpotlightUp: function(oSender, oEvent) {
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent === null) { return; }
			if (nCurrent > 0) {
				this._setCurrent(oSender, nCurrent - 1, true);
				return false;
			}
			this._setCurrent(oSender, null, true);
			return true;
		},
	
		onSpotlightLeft: function(oSender, oEvent) {
			this._setCurrent(oSender, null, true);
			return true;
		},
	
		onSpotlightRight: function(oSender, oEvent) {
			this._setCurrent(oSender, null, true);
			return true;
		},
	
		onSpotlightPoint: function(oSender, oEvent) {
			this._setCurrent(oSender, oEvent.index);
			return true;
		},
	}
});