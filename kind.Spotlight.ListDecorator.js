/**
 * enyo.Spotlight.ListDecorator kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.ListDecorator',
	handlers: {
		onSpotlightFocus  : 'onSpotlightFocus',
		onSpotlightBlur   : 'onSpotlightBlur',
		onSpotlightSelect : 'onSpotlightSelect',
		onSpotlightLeft   : 'onSpotlightLeft',
		onSpotlightRight  : 'onSpotlightRight',
		onSpotlightUp     : 'onSpotlightUp',
		onSpotlightDown   : 'onSpotlightDown',
		onSpotlightPoint  : 'onSpotlightPoint'
	},
	
	_oList		: null,
	_nCurrent	: 0,
	
	_getNode: function(n) {
		return this._oList.$.generator.fetchRowNode(n);
	},
	
	_focusNode: function(n) {
		enyo.Spotlight.Util.addClass(this._getNode(n), 'spotlight');
	},
	
	_blurNode: function(n) {
		enyo.Spotlight.Util.removeClass(this._getNode(n), 'spotlight');
	},
	
	_setCurrent: function(n, bScrollIntoView) {
		if (this._nCurrent !== null) {
			this._blurNode(this._nCurrent);
		}

		if (n === null) {
			//enyo.Spotlight.Util.addClass(this._oList.node, 'spotlight');
			//this._nCurrent = null;
		} else {
			this._focusNode(n);
			this._nCurrent = n;
			if (bScrollIntoView) {
				this._oList.scrollIntoView({
					hasNode	: function() { return true; },
					node	: this._getNode(n)
				}, false);
			}
		}
		enyo.Spotlight.Util.removeClass(this._oList.node, 'spotlight');
	},
	
	_preventDefault: function(oEvent) {
		delete oEvent.type;
	},
	
	/******************************/
	
	rendered: function() {
		this.inherited(arguments);
		this._oList = this.children[0];
	},
	
	onSpotlightFocus: function(oSender, oEvent) {
		this._setCurrent(this._nCurrent, false);
		enyo.Spotlight.Util.removeClass(this._oList.node, 'spotlight');
	},
	
	onSpotlightBlur: function(oSender, oEvent) {
		this._setCurrent(null, true);
		enyo.Spotlight.Util.removeClass(this._oList.node, 'spotlight');
	},
	
	onSpotlightSelect: function(oSender, oEvent) {
		if (this._nCurrent !== null) {
			enyo.Spotlight._dispatchEvent('ontap', {index: this._nCurrent}, this._oList.$.item); // HOW DO WE DISPATCH TAP EVENT?
		} else {
			enyo.Spotlight.Util.removeClass(this._oList.node, 'spotlight');
			this._setCurrent(0, true);
		}
		this._preventDefault(oEvent);
		enyo.Spotlight.Util.removeClass(this._oList.node, 'spotlight');
	},
	
	onSpotlightDown: function(oSender, oEvent) {
		if (this._nCurrent === null) { return; }
		if (this._nCurrent < this._oList.getCount() - 1) {
			this._setCurrent(this._nCurrent + 1, true);
			this._preventDefault(oEvent);
		} else {
			this._setCurrent(null, true);
		}
	},
	
	onSpotlightUp: function(oSender, oEvent) {
		if (this._nCurrent === null) { return; }
		if (this._nCurrent > 0) {
			this._setCurrent(this._nCurrent - 1, true);
			this._preventDefault(oEvent);
		} else {
			this._setCurrent(null, true);
		}
	},
	
	onSpotlightLeft: function(oSender, oEvent) {
		this._setCurrent(null, true);
	},
	
	onSpotlightRight: function(oSender, oEvent) {
		this._setCurrent(null, true);
	},
	
	onSpotlightPoint: function(oSender, oEvent) {
		this._setCurrent(oEvent.index);
	},
	
	/******************************/
});