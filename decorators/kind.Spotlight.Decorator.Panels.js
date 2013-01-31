/**
 * enyo.Spotlight.Decorator.Panels kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.Panels',
	
	statics: {
		decorates: enyo.Panels,
		
		// Creates oSender._spotlight object
		_initComponent: function(oSender) {
			if (!this._isInitialized(oSender)) {
				console.log('INIT', oSender.name);
				this._setFocus(oSender, false);
				this._initChildren(oSender);
				enyo.Spotlight.Util.interceptEvents(oSender, this._handleChildEvents);
			}
		},
		
		// Is Panels object initialized?
		_isInitialized: function(oSender) {
			return typeof oSender._spotlight.hasFocus != 'undefined';
		},
		
		_initChildren: function(oSender) {
			var nLength = oSender.children.length,
				n 		= 0;
				
			for (;n<nLength; n++) {
				oSender.children[n].spotlight = 'container';
			}
		},
		
		_handleChildEvents: function(oSender, oEvent) {
			switch (oEvent.type) {
				case 'onSpotlightContainerEnter':
					enyo.Spotlight.Decorator.Panels.onSpotlightPanelEnter(oSender, oEvent);
					break;
				case 'onSpotlightContainerLeave':
					enyo.Spotlight.Decorator.Panels.onSpotlightPanelLeave(oSender, oEvent);
					break;
				case 'onSpotlightFocus':
					break;
				case 'onSpotlightLeft':
					break;
			}
			return true;
		},
		
		// Does container contain focused element?
		_getFocus: function(oSender) {
			return oSender._spotlight.hasFocus;
		},
		
		// Specify that container contains focused element
		_setFocus: function(oSender, bIsFocused) {
			oSender._spotlight.hasFocus = bIsFocused;
		},
		
		// What child of container was last focused?
		_getLastFocusedChild: function(oSender) {
			return oSender.children[this._getCurrent(oSender)];
		},
		
		_setCurrent: function(oSender, n) {
			oSender._spotlight.nCurrent = n;
			oSender.setIndex(n);
			console.log('PANELS: Setting current', n);
			enyo.Spotlight.spot(oSender.children[n]); // not here
		},
		
		_getCurrent: function(oSender) {
			if (typeof oSender._spotlight.nCurrent != 'undefined') {
				return oSender._spotlight.nCurrent;
			}
			return 0;
		},
		
		_handleRight: function(oSender) {
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent < oSender.children.length - 1) {
				this._setCurrent(oSender, nCurrent + 1);
				return true;
			}
			return false;
		},
		
		_handleLeft: function(oSender) {
			var nCurrent = this._getCurrent(oSender);
			if (nCurrent > 0) {
				this._setCurrent(oSender, nCurrent - 1);
				return true;
			}
			return false;
		},
		
		/******************************/
		
		onSpotlightPanelEnter: function(oSender, oEvent) {
		},
		
		onSpotlightPanelLeave: function(oSender, oEvent) {
			var sEvent;
			
			switch (oEvent.direction) {
				case 'LEFT':
					console.log('PANEL LEAVE -> LEFT');
					if (this._handleLeft(oSender)) {
						this._setFocus(oSender, false);
						return false;
					}
					sEvent = 'onSpotlightLeft';
					break;
				case 'RIGHT':
					console.log('PANEL LEAVE -> RIGHT');
					if (this._handleRight(oSender)) {
						this._setFocus(oSender, false);
						return false;
					}
					sEvent = 'onSpotlightRight';
					break;
				case 'UP':
					sEvent = 'onSpotlightUp';
					break;
				case 'DOWN':
					sEvent = 'onSpotlightDown';
					break;
				
			}
			console.log('Near exiting panels');
			if (typeof oEvent.direction != 'undefined') {
				console.log('PANELS EXITING:', oSender.name);
				this._setFocus(oSender, false);
				enyo.Spotlight.Util.dispatchEvent('onSpotlightBlur', null, enyo.Spotlight.getCurrent());
				enyo.Spotlight.setCurrent(oSender.parent)
				enyo.Spotlight.Util.dispatchEvent(sEvent, null, oSender.parent);
			}
			return true;
		},
	
		onSpotlightFocused: function(oSender, oEvent) {
			if (enyo.Spotlight.getPointerMode()) { return false; }
			this._initComponent(oSender);
			
			if (this._getFocus(oSender)) {												// Focus came from within
				console.log('PANELS: FOCUSED', oSender.name, '(from within)');
				this._setFocus(oSender, false);
			} else {																	// Focus came from without
				console.log('PANELS: FOCUSED', oSender.name, '(from without)');
				var oLastFocusedChild = this._getLastFocusedChild(oSender);
				console.log('PANELS:', oSender.name, 'LAST CHILD:', oLastFocusedChild.name);
				if (oLastFocusedChild) {
					console.log('SPOTTING', oLastFocusedChild.name);
					enyo.Spotlight.spot(oLastFocusedChild);
				}
				this._setFocus(oSender, true);
			}
			
			return true;
		},
	}
});