/**
* Mixin that provides Spotlight support to {@link module:enyo/VirtualDataRepeater~VirtualDataRepeater}.
*
* @wip
* @module spotlight/VDRSpotlightSupport
*/

var
	kind = require('enyo/kind');

var
	Spotlight = require('./spotlight');

/**
* The {@link module:spotlight/VDRSpotlightSupport~VDRSpotlightSupport} [mixin]{@glossary mixin} adds
* Spotlight support to {@link module:enyo/VirtualDataRepeater~VirtualDataRepeater}.
* Specifically, it ensures that Spotlight focus is properly removed if the
* currently focused element is virtualized.
*
* Any application or library that uses Spotlight and creates a subkind or instance
* of {@link module:enyo/VirtualDataRepeater~VirtualDataRepeater} with focusable elements
* inside should mix {@link module:spotlight/VDRSpotlightSupport} into the subkind
* or instance.
*
* @mixin
* @wip
* @public
*/
var VDRSpotlightSupport = {
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

module.exports = VDRSpotlightSupport;
