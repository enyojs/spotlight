var
	kind = require('enyo/kind');

var
	Spotlight = require('./spotlight');

/**
* The {@link spotlight/VDRSpotlightSupport} [mixin]{@glossary mixin} adds Spotlight
* support to {@link enyo.VirtualDataRepeater}. Specifically, it ensures that Spotlight
* focus is properly removed if the currently focused element is virtualized.
*
* Any application or library that uses Spotlight and creates a subkind or instance of
* {@link enyo.VirtualDataRepeater} with focusable elements inside should mix
* {@link spotlight/VDRSpotlightSupport} into the subkind or instance.
*
* @mixin spotlight/VDRSpotlightSupport
* @public
*/
module.exports = {
	assignChild: kind.inherit(function (sup) {
		return function (model, index, child) {
			var cur = Spotlight.getCurrent();

			if (cur && child === cur && child.model !== model) {
				Spotlight.unspot();
			}

			sup.apply(this, arguments);
		};
	})
};