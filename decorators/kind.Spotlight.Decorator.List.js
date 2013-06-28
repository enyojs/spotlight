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
			var nCurrent = this._getCurrent(oSender),
				node;
			
			if (nCurrent !== null) {
				this._blurNode(oSender, nCurrent);
			}

			if ((n !== null) && (n !== undefined)) {
				this._focusNode(oSender, n);
				oSender._nCurrentSpotlightItem = n;
				node = this._getNode(oSender, n);
				if (node && !this._isInView(oSender, node)) {
					if(oSender.animateToNode) {
						oSender.animateToNode(node, true);
					} else {
						oSender.scrollIntoView({
							hasNode : function() { return true; },
							node    : this._getNode(oSender, n)
						}, false);
					}
				}
				enyo.Spotlight.Util.dispatchEvent('onSpotlightItemFocus', {index: n}, oSender);
			}
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
		},

		//replacement ScrollStrategy function to address the offsets in List where a paging strategy is used
		_isInView: function(oSender, inNode) {
			var sb = oSender.getScrollBounds();
			var ot = inNode.offsetTop + inNode.offsetParent.offsetTop;
			var oh = inNode.offsetHeight;
			var ol = inNode.offsetLeft + inNode.offsetParent.offsetLeft;
			var ow = inNode.offsetWidth;
			return (ot >= sb.top && ot + oh <= sb.top + sb.clientHeight) && (ol >= sb.left && ol + ow <= sb.left + sb.clientWidth);
		},
	
		/******************************/
	
		onSpotlightFocus: function(oSender, oEvent) {
			this._setCurrent(oSender, this._getCurrent(oSender), false);
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
		},
	
		onSpotlightBlur: function(oSender, oEvent) {
			this._setCurrent(oSender, null, true);
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
		},
	
		onSpotlightSelect: function(oSender, oEvent) {
			if (this._getCurrent(oSender) !== null) {
				enyo.Spotlight.Util.dispatchEvent('ontap', {index: this._getCurrent(oSender)}, oSender.children[0]);
			} else {
				this._setCurrent(oSender, 0, true);
			}
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
			return true;
		},
	
		onSpotlightDown: function(oSender, oEvent) {
			if(oSender.getOrient && oSender.getOrient() === "h") {
				this._setCurrent(oSender, null, true);
			} else {
				this._spotNextListItem(oSender, oEvent);
			}
		},
	
		onSpotlightUp: function(oSender, oEvent) {
			if(oSender.getOrient && oSender.getOrient() === "h") {
				this._setCurrent(oSender, null, true);
			} else {
				this._spotPreviousListItem(oSender, oEvent);
			}
		},
	
		onSpotlightLeft: function(oSender, oEvent) {
			if(oSender.getOrient && oSender.getOrient() === "h") {
				this._spotPreviousListItem(oSender, oEvent);
			} else {
				this._setCurrent(oSender, null, true);
			}
		},
	
		onSpotlightRight: function(oSender, oEvent) {
			if(oSender.getOrient && oSender.getOrient() === "h") {
				this._spotNextListItem(oSender, oEvent);
			} else {
				this._setCurrent(oSender, null, true);
			}
		},
	
		onSpotlightPoint: function(oSender, oEvent) {
			this._setCurrent(oSender, oEvent.index);
			return true;
		},
		
		_spotNextListItem: function(oSender, oEvent) {
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent === null) { return; }
			if (nCurrent < oSender.getCount() - 1) {
				this._setCurrent(oSender, nCurrent + 1, true);
				return false;
			}
			this._setCurrent(oSender, null, true);
		},
		
		_spotPreviousListItem: function(oSender, oEvent) {
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent === null) { return; }
			if (nCurrent > 0) {
				this._setCurrent(oSender, nCurrent - 1, true);
				return false;
			}
			this._setCurrent(oSender, null, true);
		}
	}
});
