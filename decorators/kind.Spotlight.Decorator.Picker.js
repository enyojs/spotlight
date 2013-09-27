/**
 * enyo.Spotlight.Decorator.Picker kind definition
 * @author: Lex Podgorny
 */

if (window.onyx && onyx.Picker) {

	enyo.kind({
		name: 'enyo.Spotlight.Decorator.Picker',

		statics: {
			decorates: "onyx.PickerDecorator",

			_getButton: function(oSender) {
				var n = 0,
					oChild;

				for (;n<oSender.children.length; n++) {
					oChild = oSender.children[n];
					if (oChild instanceof onyx.Button) {
						return oChild;
					}
				}
			},

			_getMenu: function(oSender) {
				var n = 0,
					oChild;

				for (;n<oSender.children.length; n++) {
					oChild = oSender.children[n];
					if (oChild instanceof onyx.Menu) {
						return oChild;
					}
				}
			},

			_getMenuItems: function(oSender) {
				return oSender._spotlight.aItems;
			},

			// Finding within floatingLayer while menu is open
			// Poor architecture of Popup and Menu makes this implementation
			// Shaky at best
			_findMenuItems: function(oSender) {
				this._open(oSender);
				this._close(oSender);
				if (typeof oSender._spotlight.aItems == 'undefined' || !oSender._spotlight.aItems[0]) {
					var aNodes  = document.getElementById('floatingLayer').children,
						n       = 0,
						sMenu   = this._getMenu(oSender).name;

					oSender._spotlight.aItems = [];

					for (;n<aNodes.length; n++) {
						if (enyo.Spotlight.Util.stringEndsWith(aNodes[n].id, sMenu)) {
							aNodes = aNodes[n].getElementsByTagName('*');
							for (n=0; n<aNodes.length; n++) {
								if (aNodes[n].id.indexOf('_menuItem') != -1) {
									oSender._spotlight.aItems.push(aNodes[n]);
								}
							}
							return;
						}
					}
				}
			},

			_open: function(oSender) {
				var oButton = this._getButton(oSender);
				enyo.Spotlight.Util.dispatchEvent('ontap', null, oButton);
				this._setOpen(oSender, true);
			},

			_close: function(oSender) {
				this._getMenu(oSender).setShowing(false);
				this._setOpen(oSender, false);
				enyo.Spotlight.Util.addClass(this._getButton(oSender).hasNode(), 'spotlight');
				this._setOpen(oSender, false);
			},

			_setCurrent: function(oSender, n) {
				var aItems   = this._getMenuItems(oSender),
					nCurrent = this._getCurrent(oSender);

				oSender._spotlight.nCurrent = n;
				enyo.Spotlight.Util.removeClass(aItems[nCurrent], 'spotlight');
				enyo.Spotlight.Util.addClass(aItems[n], 'spotlight');
			},

			_getCurrent: function(oSender) {
				if (typeof oSender._spotlight.nCurrent != 'undefined') {
					return oSender._spotlight.nCurrent;
				}
				return 0;
			},

			_setOpen: function(oSender, bOpen) {
				oSender._spotlight.bOpen = bOpen;
			},

			_getOpen: function(oSender) {
				if (typeof oSender._spotlight.bOpen != 'undefined') {
					return oSender._spotlight.bOpen;
				}
				return false;
			},

			_select: function(oSender) {
				var nCurrent  = this._getCurrent(oSender),
					oSelected = this._getMenuItems(oSender)[nCurrent];

				this._getButton(oSender).setContent(oSelected.innerHTML);
			},

			/******************************/

			onSpotlightFocused: function(oSender, oEvent) {
				this._findMenuItems(oSender);
				var oButton = this._getButton(oSender);
				if (oButton) {
					enyo.Spotlight.Util.addClass(oButton.hasNode(), 'spotlight');
					enyo.Spotlight.Util.removeClass(oSender.hasNode(), 'spotlight');
				}
			},

			onSpotlightBlur: function(oSender, oEvent) {
				if (!this._getOpen(oSender)) {
					enyo.Spotlight.Util.removeClass(this._getButton(oSender).hasNode(), 'spotlight');
				}
			},

			onSpotlightSelect: function(oSender, oEvent) {
				if (this._getOpen(oSender)) {
					this._select(oSender);
					this._close(oSender);
					this._setOpen(oSender, false);
				} else {
					this._open(oSender);
					this._setCurrent(oSender, this._getCurrent(oSender));
					this._setOpen(oSender, true);
				}
				return true;
			},

			onSpotlightDown: function(oSender, oEvent) {
				if (!this._getOpen(oSender)) {
					enyo.Spotlight.Util.removeClass(this._getButton(oSender).hasNode(), 'spotlight');
				}

				var nCurrent = this._getCurrent(oSender),
					aItems   = this._getMenuItems(oSender);

				if (this._getOpen(oSender)) {
					if (nCurrent < aItems.length - 1) {
						this._setCurrent(oSender, nCurrent + 1);
					} else {
						this._close(oSender);
					}
				}
				return true;
			},

			onSpotlightUp: function(oSender, oEvent) {
				if (!this._getOpen(oSender)) {
					enyo.Spotlight.Util.removeClass(this._getButton(oSender).hasNode(), 'spotlight');
				}

				var nCurrent = this._getCurrent(oSender);

				if (this._getOpen(oSender)) {
					if (nCurrent > 0) {
						this._setCurrent(oSender, nCurrent - 1);
					} else {
						this._close(oSender);
					}
				}
				return true;
			},

			onSpotlightLeft: function(oSender, oEvent) {
				if (this._getOpen(oSender)) {
					this._close(oSender);
					return true;
				}
				enyo.Spotlight.Util.removeClass(this._getButton(oSender).hasNode(), 'spotlight');
			},

			onSpotlightRight: function(oSender, oEvent) {
				if (this._getOpen(oSender)) {
					this._close(oSender);
					return true;
				}
				enyo.Spotlight.Util.removeClass(this._getButton(oSender).hasNode(), 'spotlight');
			},

			onSpotlightPoint: function(oSender, oEvent) {
			}
		}
	});

}