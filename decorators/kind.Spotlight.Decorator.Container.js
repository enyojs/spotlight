/**
 * enyo.Spotlight.Decorator.Container kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.Container',
	
	statics: {
		decorates: null,
		
		// Creates oSender._spotlight object
		_initComponent: function(oSender) {
			if (!this._isInitialized(oSender)) {
				this.setLastFocusedChild(oSender, enyo.Spotlight.getFirstChild(oSender));
				enyo.Spotlight.Util.interceptEvents(oSender, this._handleEvent);
			}
		},
		
		_isInitialized: function(oSender) {
			return typeof oSender._spotlight.lastFocusedChild != 'undefined';
		},
		
		// Handle events bubbling from within the container
		_handleEvent: function(oSender, oEvent) {
			switch (oEvent.type) {
				case 'onSpotlightFocus':
					if (oEvent.originator !== oSender) {
						enyo.Spotlight.Decorator.Container.setLastFocusedChild(oSender, oEvent.originator);
					}
					return true;	// prevent default
			}
		},
		
		// Was last spotted control the container's child?
		_hadFocus: function(oSender) {
			return enyo.Spotlight.Util.isChild(oSender, enyo.Spotlight.getLastControl());
		},
				
		/******************************/
		
		onSpotlightFocused: function(oSender, oEvent) {
			if (enyo.Spotlight.getPointerMode()) { return; }
			this._initComponent(oSender);
			
			if (this._hadFocus(oSender)) {												// Focus came from within
				//console.log('FOCUS LEAVE', oSender.name);
				var s5WayEventType	= enyo.Spotlight.getLast5WayEvent() ? enyo.Spotlight.getLast5WayEvent().type : '',
					sDirection		= s5WayEventType.replace('onSpotlight','').toUpperCase();
					
				if (!(oSender.parent instanceof enyo.Panels)) {
					enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				} else if (oSender.parent.spotlight !== true && oSender.parent.spotlight != 'true') {
					enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				}
				enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerLeave', {direction: sDirection}, oSender);
			} else {																	// Focus came from without
				//console.log('FOCUS ENTER', oSender.name);
				var oLastFocusedChild = this.getLastFocusedChild(oSender);
				if (oLastFocusedChild) {
					enyo.Spotlight.spot(oLastFocusedChild);
				}
				enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerEnter', {}, oSender);
			}
			
			return true;
		},
		
		// What child of container was last focused?
		getLastFocusedChild: function(oSender) {
			oSender._spotlight = oSender._spotlight || {};
			if (!oSender._spotlight.lastFocusedChild) {
				oSender._spotlight.lastFocusedChild = enyo.Spotlight.getChildren(oSender)[0];
			}
			return oSender._spotlight.lastFocusedChild;
		},
		
		// Set last focused child
		setLastFocusedChild: function(oSender, oChild) {
			if (!enyo.Spotlight.isSpottable(oChild)) {
				enyo.warn('Spotlight Container' + oSender.name + ' has not spottable lastFocusedChild ' + oChild.name);
			}
			oSender._spotlight = oSender._spotlight || {};
			oSender._spotlight.lastFocusedChild = oChild;
		},
	}
});