/**
* Logic to identify the nearest neighboring object for the object that currently has focus.
*
* Returns a generator function that accepts the [Spotlight]{@link module:spotlight}
* instance as an argument.
*
* @module spotlight/neighbor
* @public
*/
module.exports = function (Spotlight) {

    /**
    * Determines whether a control overlaps multiple planes.
    *
    * @param  {String} sDirection - The direction of acceleration.
    * @param  {Object} oBounds1 - Initial bounds.
    * @param  {Object} oBounds2 - Final bounds.
    * @param  {Boolean} bCenterCheck - Whether to check for the center of the bounds.
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
        * Checks to see which control has higher precedence for spottability.
        *
        * @param  {String} sDirection - The direction of acceleration.
        * @param  {Object} oBounds1 - Initial bounds.
        * @param  {Object} oBounds2 - Final bounds.
        * @returns {Number}
        * @private
        */
        _getAdjacentControlPrecedence = function(sDirection, oBounds1, oBounds2) {
            var oPoints = _getAdjacentControlPoints(sDirection, oBounds1, oBounds2);
            return _getPrecedenceValue(oPoints, sDirection);
        },

        /**
        * Retrieves the adjacent axis control points based on direction of acceleration.
        *
        * @param  {String} sDirection - The direction of acceleration.
        * @param  {Object} oBounds1 - Initial bounds.
        * @param  {Object} oBounds2 - Final bounds.
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
        * Retrieves the `y`-axis points for the specified bounds, dependent on
        * direction of acceleration.
        *
        * @param  {String} sDirection - The direction of acceleration.
        * @param  {Object} oBounds1 - Initial bounds.
        * @param  {Object} oBounds2 - Final bounds.
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
        * Retrieves the `x`-axis points for the specified bounds, dependent on
        * direction of acceleration.
        *
        * @param  {String} sDirection - The direction of acceleration.
        * @param  {Object} oBounds1 - Initial bounds.
        * @param  {Object} oBounds2 - Final bounds.
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
        * Calculates precedence value for the given set of axis points and
        * direction of acceleration.
        *
        * @param  {Object} oPoints - Axis points to be evaluated.
        * @param  {Object} sDirection - The direction of acceleration.
        * @returns {Number} The precedence value.
        * @private
        */
        _getPrecedenceValue = function(oPoints, sDirection) {
            var delta = _getDelta(oPoints[0], oPoints[1]),
                slope = _getSlope(delta, sDirection),
                angle = _getAngle(slope),
                distance = _getDistance(delta);

            return angle > 90 ? 0 : 1 / (angle * Math.pow(distance, 4));
        },

        /**
        * Retrieves the difference between points.
        *
        * @param  {Object} point1 - Initial point.
        * @param  {Object} point2 - Destination point.
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
        * Retrieves the distance from the specified bounds to the center point.
        *
        * @param  {Object} oBounds1 - Initial bounds.
        * @param  {Object} oBounds2 - Destination bounds.
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
        * Retrieves the slope of the angle.
        *
        * @param  {Object} delta - Initial bounds.
        * @param  {String} sDirection - Destination bounds.
        * @returns {Number} The slope value.
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
        * Retrieves the distance between delta points.
        *
        * @param  {Object} delta - Initial bounds.
        * @returns {Number}
        * @private
        */
        _getDistance = function(delta) {
            return Math.pow(delta.dx * delta.dx + delta.dy * delta.dy, 0.5) || 0.1;
        },

        /**
        * Retrieves the distance between angle based on slope.
        *
        * @param  {Number} nSlope - Slope used to determine angle.
        * @returns {Number}
        * @private
        */
        _getAngle = function(nSlope) {
            return Math.atan(nSlope) * 180 / Math.PI || 0.1;
        },

        /**
        * Calculates nearest neighbor based on bounds and acceleration direction.
        *
        * @param  {Object} o - Object used to determine if it is a neighbor.
        * @param  {Number} sDirection - The direction of acceleration
        * @param  {Number} oBounds1 - Originating bounds.
        * @param  {Number} oControl - The current control.
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
                nBestDistance = sDirection ? 0 : Infinity,
                nLen = o.length;

            for (n = 0; n < nLen; n++) {
                oSibling = o[n];
                if (oControl && oSibling === oControl) {
                    continue;
                }

                oBounds2 = oSibling.getAbsoluteBounds();

                if (sDirection) {
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
                else {
                    nDistance = _getCenterToCenterDistance(oBounds1, oBounds2);
                    if (nDistance < nBestDistance) {
                        nBestDistance = nDistance;
                        oBestMatch = oSibling;
                    }
                }

            }
            return oBestMatch;
        };

    // TODO: Deprecate both `getNearestPointerNeighbor()` and `getNearestNeighbor()`
    //       and replace with a new `getNearestNeighbor()` in Spotlight. Motivation:
    //
    //         * Create a single unified API for finding the neighbor of an arbitrary
    //           Control, the currently focused Control, the location of the pointer,
    //           an arbitrary point, etc.
    //         
    //         * Remove Spotlight dependency from NearestNeighbor module, keeping
    //           NearestNeighbor focused on the basic algorithm and decoupled from
    //           details like container vs. not, the existence of 'last focused
    //           child', etc.

    /**
    * Gets the nearest neighbor of the pointer.
    *
    * @param  {Object} oRoot - The root component.
    * @param  {String} sDirection - The direction in which to spot the next control.
    * @param  {Number} nPositionX - The `x` coordinate of the pointer.
    * @param  {Number} nPositionY - The `y` coordinate of the pointer.
    * @returns {Object} The nearest neighbor of the pointer.
    * @public
    */
    this.getNearestPointerNeighbor = function(oRoot, sDirection, nPositionX, nPositionY) {
        var oBounds = {
                left: nPositionX,
                top: nPositionY,
                width: 1,
                height: 1
            },
            o = Spotlight.getChildren(oRoot, true);

        return _calculateNearestNeighbor(o, sDirection, oBounds);
    };

    /**
    * Gets the nearest neighbor of a control.
    *
    * @param  {String} sDirection - The direction in which to spot the next control.
    * @param  {Object} oControl - The control whose nearest neighbor is to be
    * determined.
    * @returns {Object} The nearest neighbor of the control.
    * @public
    */
    this.getNearestNeighbor = function(sDirection, oControl, oOpts) {
        var oRoot = oOpts && oOpts.root,
            oCandidates,
            oBounds;

        sDirection = sDirection.toUpperCase();
        oControl = oControl || Spotlight.getCurrent();

        // If we've been passed a root, find the best match among its children;
        // otherwise, find the best match among siblings of the reference control
        oCandidates = oRoot ?
            Spotlight.getChildren(oRoot) :
            Spotlight.getSiblings(oControl).siblings;

        // If the control is container, the nearest neighbor is calculated based on the bounds
        // of last focused child of container.
        if (Spotlight.isContainer(oControl)) {
            oControl = Spotlight.Container.getLastFocusedChild(oControl) || oControl;
        }

        oBounds = oControl.getAbsoluteBounds();

        return _calculateNearestNeighbor(oCandidates, sDirection, oBounds, oControl);
    };
};
