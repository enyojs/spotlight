/**
 	enyo.Spotlight.Decorator.GridList kind definition
 	
 	TODO: This is a copy of List decorator. 
	Ideally, we should be able to inherit decorators from parent kinds and simply override functions that are specific to the overridden decorator
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.GridList',
	
	statics: {
		decorates: enyo.GridList,
	
		_getNodeParent: function(oSender, n) {
			if (oSender.$.generator.hasNode()) {
				return oSender.$.generator.node.querySelector('[data-enyo-index="' + n + '"]');
			}
		},

		_getNode: function(oSender, n) {
			if (oSender.$.generator.hasNode()) {
				return oSender.$.generator.node.querySelector('[data-enyo-index="' + n + '"] > .moon-gridlist-item');
			}
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
					var nd = this._getNodeParent(oSender, n);
					if (!oSender.$.strategy.isInView(nd)) {
						oSender.scrollIntoView({
							hasNode	: function() { return true; },
							node	: nd
							}, false);
					}
				}
				enyo.Spotlight.Util.dispatchEvent('onSpotlightItemFocus', {index: n}, oSender);
			}
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
		},
	
		/******************************/
	
		onSpotlightFocus: function(oSender, oEvent) {
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
				enyo.Spotlight.Util.dispatchEvent('ontap', {index: this._getCurrent(oSender)}, oSender.$.generator.$.selection);
				this._setCurrent(oSender, this._getCurrent(oSender), true);
			} else {
				this._setCurrent(oSender, 0, true);
			}
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
			return false;
		},
	
		onSpotlightDown: function(oSender, oEvent) {
			//Jump one row down (increment index by itemsPerRow)
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent === null) { return; }
			var nNew = nCurrent + oSender.itemsPerRow;
			if (nNew < oSender.getCount() - 1) {
				this._setCurrent(oSender, nNew, true);
				return false;
			}
			this._setCurrent(oSender, null, true);
			return true;
		},
	
		onSpotlightUp: function(oSender, oEvent) {
			//Jump one row up (decrement index by itemsPerRow)
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent === null) { return; }
			var nNew = nCurrent - oSender.itemsPerRow;
			if (nNew > 0) {
				this._setCurrent(oSender, nNew, true);
				return false;
			}
			this._setCurrent(oSender, null, true);
			return true;
		},
	
		onSpotlightLeft: function(oSender, oEvent) {
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent === null) { return; }
			if (nCurrent > 0) {
				this._setCurrent(oSender, nCurrent - 1, true);
				return false;
			}
			this._setCurrent(oSender, null, true);
			return true;
		},

		onSpotlightRight: function(oSender, oEvent) {
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent === null) { return; }
			if (nCurrent < oSender.getCount() - 1) {
				this._setCurrent(oSender, nCurrent + 1, true);
				return false;
			}
			this._setCurrent(oSender, null, true);
			return true;
		},
	
		onSpotlightPoint: function(oSender, oEvent) {
			this._setCurrent(oSender, oEvent.index);
			return true;
		}
	}
});