var
    roots = require('enyo/roots');

/**
* A collection of Spotlight utilities for use in testing.
*
* Returns a generator function that accepts the [Spotlight]{@link module:spotlight}
* instance as an argument.
*
* @module spotlight/testmode
* @public
*/
module.exports = function (Spotlight) {

    /********************* PRIVATE ********************/

    var _aNodes = [],
        _bEnabled = false;

    var

        /**
        * Destroys all highlight elements.
        *
        * @type {Function}
        * @private
        */
        _destroyExistingHighlightNodes = function() {
            var n;
            for (n = 0; n < _aNodes.length; n++) {
                if (_aNodes[n]) {
                    _aNodes[n].destroy();
                }
            }
            _aNodes = [];
        },

        /**
        * Highlights the current spotted control and adds it to `_aNodes`.
        *
        * @private
        */
        _highlightCurrentControl = function() {
            _aNodes.push(_addConrolHighlightNode({
                control: Spotlight.getCurrent(),
                str: 'C'
            }));
        },

        /**
        * Highlights controls adjacent to the current spotted control and adds
        * them to `_aNodes`.
        *
        * @private
        */
        _highlightAdjacentControls = function() {
            if (!Spotlight.getCurrent()) {
                return;
            }
            var controls = _removeDuplicateHighlightNodes([{
                control: Spotlight.NearestNeighbor.getNearestNeighbor('UP'),
                str: 'U'
            }, {
                control: Spotlight.NearestNeighbor.getNearestNeighbor('DOWN'),
                str: 'D'
            }, {
                control: Spotlight.NearestNeighbor.getNearestNeighbor('LEFT'),
                str: 'L'
            }, {
                control: Spotlight.NearestNeighbor.getNearestNeighbor('RIGHT'),
                str: 'R'
            }]);

            for (var i = 0; i < controls.length; i++) {
                if (!controls[i]) {
                    continue;
                }
                _aNodes.push(_addConrolHighlightNode(controls[i]));
            }
        },

        /**
        * Combines duplicate highlight nodes (created for the same control).
        * This happens when a given control can be reached via multiple 5-way
        * directions (e.g., up and left).
        *
        * @private
        */
        _removeDuplicateHighlightNodes = function(inControls) {
            var returnControls = [],
                dupeOf = -1;

            for (var i = 0; i < inControls.length; i++) {
                dupeOf = -1;

                for (var j = 0; j < inControls.length; j++) {
                    if (inControls[i].control === inControls[j].control && inControls[i].str !== inControls[j].str) {
                        dupeOf = j;
                        break;
                    }
                }

                if (dupeOf > -1) {
                    inControls[i].str += ',' + inControls[dupeOf].str;
                    inControls.splice(dupeOf, 1);
                }

                returnControls.push(inControls[i]);
            }

            return returnControls;
        },

        /**
        * Creates a new control with styling to highlight current or adjacent
        * Spotlight nodes.
        *
        * @private
        */
        _addConrolHighlightNode = function(inObj) {
            if (!inObj || !inObj.control || !inObj.control.hasNode()) {
                return null;
            }

            var bounds = Spotlight.Util.getAbsoluteBounds(inObj.control),
                className = (inObj.str === 'C') ? 'spotlight-current-item' : 'spotlight-adjacent-item',
                highlightNode = roots.roots[0].createComponent({
                    classes: 'spotlight-highlight ' + className,
                    style: 'height:' + bounds.height + 'px;width:' + bounds.width + 'px;top:' + bounds.top + 'px;left:' + bounds.left + 'px;line-height:' + bounds.height + 'px;',
                    content: inObj.str
                });

            highlightNode.render();

            return highlightNode;
        };

    /**
    * Enables test mode.
    *
    * @public
    */
    this.enable = function() {
        _bEnabled = true;
        this.highlight();
    };

    /**
    * Disables test mode.
    *
    * @public
    */
    this.disable = function() {
        _bEnabled = false;
        _destroyExistingHighlightNodes();
    };

    /**
    * Destroys existing highlight nodes and highlights the currently spotted
    * control and adjacent controls.
    *
    * @public
    */
    this.highlight = function() {
        if (!_bEnabled) {
            return;
        }
        _destroyExistingHighlightNodes();
        _highlightCurrentControl();
        _highlightAdjacentControls();
    };

    /**
    * Determines whether test mode is enabled.
    *
    * @returns {Boolean} `true` if test mode is enabled; otherwise, `false`.
    * @public
    */
    this.isEnabled = function() {
        return _bEnabled;
    };
};
