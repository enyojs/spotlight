/**
* Provides the nearest neighbor to object with current focus
*
* @typedef {Object} enyo.Spotlight.NearestNeighbor definition
*
* @ui
* @class enyo.Spotlight.NearestNeighbor
* @public
*/
enyo.Spotlight.NearestNeighbor = new function() {

    /**
    * Checks to see if a control overlaps multiple planes
    *
    * @param  {String} sDirection - Direction of acceleration
    * @param  {Object} oBounds1 - Initial Bounds
    * @param  {Object} oBounds2 - Final Bounds
    * @param  {Boolean} bCenterCheck - Check for the center of the bounds
    * @type {Function}
    * @returns {Boolean}
    * @private
    */
    var _isInHalfPlane = function(sDirection, oBounds1, oBounds2, bCenterCheck) {
            if (bCenterCheck) {
                switch (sDirection) {
                    case 'UP':
                        return oBounds1.top + oBounds1.height / 2 > oBounds2.top + oBounds2.height / 2;
                    case 'DOWN':
                        return oBounds1.top + oBounds1.height / 2 < oBounds2.top + oBounds2.height / 2;
                    case 'LEFT':
                        return oBounds1.left + oBounds1.width / 2 > oBounds2.left + oBounds2.width / 2;
                    case 'RIGHT':
                        return oBounds1.left + oBounds1.width / 2 < oBounds2.left + oBounds2.width / 2;
                }
            } else {
                switch (sDirection) {
                    case 'UP':
                        return oBounds1.top >= oBounds2.top + oBounds2.height - 1;
                    case 'DOWN':
                        return oBounds1.top + oBounds1.height - 1 <= oBounds2.top;
                    case 'LEFT':
                        return oBounds1.left >= oBounds2.left + oBounds2.width - 1;
                    case 'RIGHT':
                        return oBounds1.left + oBounds1.width - 1 <= oBounds2.left;
                }
            }
        },

        /**
        * Checks to see which control has higher precidence for spottability
        *
        * @param  {String} sDirection - Direction of acceleration
        * @param  {Object} oBounds1 - Initial Bounds
        * @param  {Object} oBounds2 - Final Bounds
        * @type {Function}
        * @returns {Number}
        * @private
        */
        _getAdjacentControlPrecedence = function(sDirection, oBounds1, oBounds2) {
            var oPoints = _getAdjacentControlPoints(sDirection, oBounds1, oBounds2);
            return _getPrecedenceValue(oPoints, sDirection);
        },

        /**
        * Retrieves the adjacent control Axis based on direction of acceleration
        *
        * @param  {String} sDirection - Direction of acceleration
        * @param  {Object} oBounds1 - Initial Bounds
        * @param  {Object} oBounds2 - Final Bounds
        * @type {Function}
        * @returns {Number}
        * @private
        */
        _getAdjacentControlPoints = function(sDirection, oBounds1, oBounds2) {
            switch (sDirection) {
                case 'UP':
                case 'DOWN':
                    return _getYAxisPoints(sDirection, oBounds1, oBounds2);
                case 'LEFT':
                case 'RIGHT':
                    return _getXAxisPoints(sDirection, oBounds1, oBounds2);
            }
        },

        /**
        * Retrieves the Y axis points of bounds, dependent on direction of acceleration
        *
        * @param  {String} sDirection - Direction of acceleration
        * @param  {Object} oBounds1 - Initial Bounds
        * @param  {Object} oBounds2 - Final Bounds
        * @type {Function}
        * @returns {Number}
        * @private
        */
        _getYAxisPoints = function(sDirection, oBounds1, oBounds2) {
            var x1, x2, y1, y2;

            y1 = (sDirection === 'UP') ? oBounds1.top : oBounds1.top + oBounds1.height;

            y2 = (sDirection === 'UP') ? oBounds2.top + oBounds2.height : oBounds2.top;

            if (oBounds1.left < oBounds2.left) {
                if (oBounds1.left + oBounds1.width <= oBounds2.left) {
                    x1 = oBounds1.left + oBounds1.width + 1;
                    x2 = oBounds2.left;
                } else {
                    x1 = oBounds2.left;
                    x2 = oBounds2.left;
                }
            } else {
                if (oBounds1.left >= oBounds2.left + oBounds2.width) {
                    x1 = oBounds1.left;
                    x2 = oBounds2.left + oBounds2.width + 1;
                } else {
                    x1 = oBounds1.left;
                    x2 = oBounds1.left;
                }
            }

            return [{
                x: x1,
                y: y1
            }, {
                x: x2,
                y: y2
            }];
        },

        /**
        * Retrieves the X axis points of bounds, dependent on direction of acceleration
        *
        * @param  {String} sDirection - Direction of acceleration
        * @param  {Object} oBounds1 - Initial Bounds
        * @param  {Object} oBounds2 - Final Bounds
        * @type {Function}
        * @returns {Number}
        * @private
        */
        _getXAxisPoints = function(sDirection, oBounds1, oBounds2) {
            var x1, x2, y1, y2;

            x1 = (sDirection === 'LEFT') ? oBounds1.left : oBounds1.left + oBounds1.width;

            x2 = (sDirection === 'LEFT') ? oBounds2.left + oBounds2.width : oBounds2.left;

            if (oBounds1.top < oBounds2.top) {
                if (oBounds1.top + oBounds1.height <= oBounds2.top) {
                    y1 = oBounds1.top + oBounds1.height + 1;
                    y2 = oBounds2.top;
                } else {
                    y1 = oBounds2.top;
                    y2 = oBounds2.top;
                }
            } else {
                if (oBounds1.top >= oBounds2.top + oBounds2.height) {
                    y1 = oBounds1.top;
                    y2 = oBounds2.top + oBounds2.height + 1;
                } else {
                    y1 = oBounds1.top;
                    y2 = oBounds1.top;
                }
            }

            return [{
                x: x1,
                y: y1
            }, {
                x: x2,
                y: y2
            }];
        },

        /**
        * @param  {Object} oPoints - Axis Points
        * @param  {Object} sDirection - Direction of acceleration
        * @type {Function}
        * @returns {Number}
        * @private
        */
        _getPrecedenceValue = function(oPoints, sDirection) {
            var delta = _getDelta(oPoints[0], oPoints[1]),
                slope = _getSlope(delta, sDirection),
                angle = _getAngle(slope),
                distance = _getDistance(delta);

            return angle > 89 ? 0 : 1 / (angle * Math.pow(distance, 4));
        },

        /**
        * Retrieves the difference between points.
        *
        * @param  {Object} point1 - Initial Point
        * @param  {Object} point2 - Destination Point
        * @type {Function}
        * @returns {Object}
        * @private
        */
        _getDelta = function(point1, point2) {
            return {
                dx: Math.abs(point2.x - point1.x),
                dy: Math.abs(point2.y - point1.y)
            };
        },

        /**
        * Retrieves the distance from bounds to the center point.
        *
        * @param  {Object} oBounds1 - Initial bounds
        * @param  {Object} oBounds2 - Destination bounds
        * @type {Function}
        * @returns {Object}
        * @private
        */
        _getCenterToCenterDistance = function(oBounds1, oBounds2) {
            var oCenter1 = {
                    x: oBounds1.left + oBounds1.width / 2,
                    y: oBounds1.top + oBounds1.height / 2
                },
                oCenter2 = {
                    x: oBounds2.left + oBounds2.width / 2,
                    y: oBounds2.top + oBounds2.height / 2
                },
                oDelta = _getDelta(oCenter1, oCenter2),
                nDistance = _getDistance(oDelta);

            return nDistance;
        },

        /**
        * Retrieves the slope of the angle
        *
        * @param  {Object} delta - Initial bounds
        * @param  {String} sDirection - Destination bounds
        * @type {Function}
        * @returns {Object}
        * @private
        */
        _getSlope = function(delta, sDirection) {
            switch (sDirection) {
                case 'UP':
                case 'DOWN':
                    return delta.dx / delta.dy;
                case 'LEFT':
                case 'RIGHT':
                    return delta.dy / delta.dx;
            }
        },

        /**
        * Retrieves the distance between delta points
        *
        * @param  {Object} delta - Initial bounds
        * @type {Function}
        * @returns {Number}
        * @private
        */
        _getDistance = function(delta) {
            return Math.pow(delta.dx * delta.dx + delta.dy * delta.dy, 0.5) || 0.1;
        },

        /**
        * Retrieves the distance between angle based on slope
        *
        * @param  {Number} nSlope - Slope used to determine angle
        * @type {Function}
        * @returns {Number}
        * @private
        */
        _getAngle = function(nSlope) {
            return Math.atan(nSlope) * 180 / Math.PI || 0.1;
        },

        /**
        * Calculates nearest neighbor based using bounds and acceleration direction
        *
        * @param  {Object} o - Object used to determine if it is a neighbor
        * @param  {Number} sDirection - Direction of acceleration
        * @param  {Number} oBounds1 - Originating bounds
        * @param  {Number} oControl - Current control
        * @type {Function}
        * @returns {Number}
        * @private
        */
        _calculateNearestNeighbor = function(o, sDirection, oBounds1, oControl) {
            var n,
                oBounds2,
                nPrecedence,
                nDistance,
                oSibling = null,
                oBestMatch = null,
                nBestMatch = 0,
                nBestDistance = 0,
                nLen = o.length;

            for (n = 0; n < nLen; n++) {
                oSibling = o[n];
                if (oControl && oSibling === oControl) {
                    continue;
                }

                oBounds2 = oSibling.getAbsoluteBounds();

                // If control is in half plane specified by direction
                if (_isInHalfPlane(sDirection, oBounds1, oBounds2)) {
                    // Find control with highest precedence to the direction
                    nPrecedence = _getAdjacentControlPrecedence(sDirection, oBounds1, oBounds2);
                    if (nPrecedence > nBestMatch) {
                        nBestMatch = nPrecedence;
                        oBestMatch = oSibling;
                        nBestDistance = _getCenterToCenterDistance(oBounds1, oBounds2);
                    } else if (nPrecedence == nBestMatch) {
                        nDistance = _getCenterToCenterDistance(oBounds1, oBounds2);
                        if (nBestDistance > nDistance) {
                            nBestMatch = nPrecedence;
                            oBestMatch = oSibling;
                            nBestDistance = nDistance;
                        }
                    }
                }
            }
            return oBestMatch;
        };

    /**
    * Gets the nearest neighbor of the pointer
    *
    * @param  {Object} oRoot - Root component
    * @param  {String} sDirection - Direction to spot next control
    * @param  {Number} nPositionX - X coordinate of the pointer
    * @param  {Number} nPositionY - Y coordinate of the pointer
    * @type {Function}
    * @returns {Object}
    * @public
    */
    this.getNearestPointerNeighbor = function(oRoot, sDirection, nPositionX, nPositionY) {
        var oBounds = {
                left: nPositionX,
                top: nPositionY,
                width: 1,
                height: 1
            },
            o = enyo.Spotlight.getChildren(oRoot, true);

        return _calculateNearestNeighbor(o, sDirection, oBounds);
    };

    /**
    * Get the nearest neighbor of a control
    *
    * @param  {String} sDirection - Direction to spot next control
    * @param  {Object} oControl - Control from which to determine the next spottable control
    * @type {Function}
    * @returns {Object}
    * @public
    */
    this.getNearestNeighbor = function(sDirection, oControl) {
        sDirection = sDirection.toUpperCase();
        oControl = oControl || enyo.Spotlight.getCurrent();

        // Check to see if default direction is specified
        var oNeighbor = enyo.Spotlight.Util.getDefaultDirectionControl(sDirection, oControl);
		if (oNeighbor) {
			if (enyo.Spotlight.isSpottable(oNeighbor)) {
				return oNeighbor;
			} else {
				oNeighbor = enyo.Spotlight.getFirstChild(oNeighbor);
				if (oNeighbor && enyo.Spotlight.isSpottable(oNeighbor)) { 
					return oNeighbor;
				}
			}
		}

        // If default control in the directin of navigation is not specified, calculate it

        var oBounds = oControl.getAbsoluteBounds(),
            o = enyo.Spotlight.getSiblings(oControl);

        return _calculateNearestNeighbor(o.siblings, sDirection, oBounds, oControl);
    };
};
