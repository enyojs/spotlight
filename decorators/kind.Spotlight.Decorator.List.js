/**
 * enyo.Spotlight.Decorator.List kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.List',

	statics: {
		decorates: "enyo.List",

		_getNode: function(oSender, n) {
			return oSender.$.generator.fetchRowNode(n);
		},

		_focusItem: function(oSender, n, bScrollIntoView) {
			if (!enyo.exists(n) || n === null) { n = 0; }

			var oNode = this._getNode(oSender, n);
			enyo.Spotlight.Util.addClass(oNode, 'spotlight');

			if (bScrollIntoView && oNode && !this._isInView(oSender, oNode)) {
				if (oSender.animateToNode) {
					oSender.animateToNode(oNode, true);
				} else {
					oSender.scrollIntoView({
						hasNode : function() { return true; },
						oNode    : this._getNode(oSender, n)
					}, false);
				}
			}
		},

		_blurItem: function(oSender, n) {
			if (!enyo.exists(n) || n === null) { n = this.getCurrent(oSender); }
			enyo.Spotlight.Util.removeClass(this._getNode(oSender, n), 'spotlight');
			enyo.Spotlight.Util.removeClass(oSender.node, 'spotlight');
		},

		_unspot: function(oSender) {
			this.setCurrent(oSender, null, true);
		},

		_itemExists: function(oSender, n) {
			return n >= 0 && n < oSender.getCount();
		},

		_spotNextItem: function(oSender) {
			var nNext = this.getCurrent(oSender) + 1;

			if (this._itemExists(oSender, nNext)) {
				this.setCurrent(oSender, nNext, true);
				return true;
			} else {
				this._unspot(oSender);
			}
		},

		_spotPreviousItem: function(oSender) {
			var nPrev = this.getCurrent(oSender) - 1;

			if (this._itemExists(oSender, nPrev)) {
				this.setCurrent(oSender, nPrev, true);
				return true;
			} else {
				this._unspot(oSender);
			}
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
			this.setCurrent(oSender, this.getCurrent(oSender), false);
		},

		onSpotlightBlur: function(oSender, oEvent) {
			this._unspot(oSender);
		},

		onSpotlightSelect: function(oSender, oEvent) {
			var nCurrent = this.getCurrent(oSender);
			enyo.Spotlight.Util.dispatchEvent('ontap', {index: nCurrent}, oSender.children[nCurrent]);
			return true;
		},

		onSpotlightDown: function(oSender, oEvent) {
			if (oSender.getOrient && oSender.getOrient() === 'h') {
				this._unspot(oSender);
			} else {
				return this._spotNextItem(oSender);
			}
		},

		onSpotlightUp: function(oSender, oEvent) {
			if (oSender.getOrient && oSender.getOrient() === 'h') {
				this._unspot(oSender);
			} else {
				return this._spotPreviousItem(oSender);
			}
		},

		onSpotlightLeft: function(oSender, oEvent) {
			if (oSender.getOrient && oSender.getOrient() === 'h') {
				return oSender.rtl ? this._spotNextItem(oSender) : this._spotPreviousItem(oSender);
			} else {
				this._unspot(oSender);
			}
		},

		onSpotlightRight: function(oSender, oEvent) {
			if (oSender.getOrient && oSender.getOrient() === 'h') {
				return oSender.rtl ? this._spotPreviousItem(oSender) : this._spotNextItem(oSender);
			} else {
				this._unspot(oSender);
			}
		},

		onSpotlightPoint: function(oSender, oEvent) {
			this.setCurrent(oSender, oEvent.index, false);
			return true;
		},

		getCurrent: function(oSender) {
			return enyo.exists(oSender._nCurrentSpotlightItem)
				? oSender._nCurrentSpotlightItem
				: 0;
		},

		setCurrent: function(oSender, n, bScrollIntoView) {
			bScrollIntoView = bScrollIntoView || false;

			if (!enyo.exists(n))               { n = null; }
			if (!this._itemExists(oSender, n)) { return; }

			this._blurItem(oSender, null);
			if (n !== null) {                             // Navigating within list - blur current and spot another
				this._focusItem(oSender, n, bScrollIntoView);
				oSender._nCurrentSpotlightItem = n;
				enyo.Spotlight.Util.dispatchEvent('onSpotlightItemFocus', {index: n}, oSender);
			}
		}
	}
});
