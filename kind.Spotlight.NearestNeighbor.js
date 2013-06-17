/**
 * enyo.Spotlight.NearestNeighbor kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.NearestNeighbor',
	statics: {
		_isInHalfPlane: function(sDirection, oBounds1, oBounds2) {
			switch (sDirection) {
				case 'UP'		: return oBounds1.top >= oBounds2.top + oBounds2.height;
				case 'DOWN'		: return oBounds1.top + oBounds1.height <= oBounds2.top;
				case 'LEFT'		: return oBounds1.left >= oBounds2.left + oBounds2.width;
				case 'RIGHT'	: return oBounds1.left + oBounds1.width <= oBounds2.left;
			}
		},

		_getAdjacentControlPrecedence: function(sDirection, oBounds1, oBounds2) {
			return this._getPrecedenceValue(this._getAdjacentControlPoints(sDirection, oBounds1, oBounds2), sDirection);
		},

		_isBeyondXBounds: function(oBounds1, oBounds2) {
			return oBounds1.left < oBounds2.left && oBounds1.right < oBounds2.right;
		},

		_isBeyondYBounds: function(oBounds1, oBounds2) {
			return oBounds1.top < oBounds2.top && oBounds1.bottom < oBounds2.bottom;
		},

		_getAdjacentControlPoints: function(sDirection, oBounds1, oBounds2) {
			switch (sDirection) {
				case 'UP'	:
				case 'DOWN'	:
					return this._getYAxisPoints(sDirection, oBounds1, oBounds2);
				case 'LEFT'	:
				case 'RIGHT':
					return this._getXAxisPoints(sDirection, oBounds1, oBounds2);
			}
		},

		_getYAxisPoints: function(sDirection, oBounds1, oBounds2) {
			var x1, x2, y1, y2;

			y1 = (sDirection === 'UP')
				?	oBounds1.top
				:	oBounds1.top + oBounds1.height;

			y2 = (sDirection === 'UP')
				?	oBounds2.top + oBounds2.height
				:	oBounds2.top;

			if (oBounds1.left < oBounds2.left) {
				if (oBounds1.left + oBounds1.width < oBounds2.left) {
					x1 = oBounds1.left + oBounds1.width;
					x2 = oBounds2.left;
				} else {
					x1 = oBounds2.left;
					x2 = oBounds2.left;
				}
			} else {
				if (oBounds1.left > oBounds2.left + oBounds2.width) {
					x1 = oBounds1.left;
					x2 = oBounds2.left + oBounds2.left;
				} else {
					x1 = oBounds1.left;
					x2 = oBounds1.left;
				}
			}

			return [{x: x1, y: y1}, {x: x2, y: y2}];
		},

		_getXAxisPoints: function(sDirection, oBounds1, oBounds2) {
			var x1, x2, y1, y2;

			x1 = (sDirection === 'LEFT')
				?	oBounds1.left
				:	oBounds1.left + oBounds1.width;

			x2 = (sDirection === 'LEFT')
				?	oBounds2.left + oBounds2.width
				:	oBounds2.left;

			if (oBounds1.top < oBounds2.top) {
				if (oBounds1.top + oBounds1.height < oBounds2.top) {
					y1 = oBounds1.top + oBounds1.height;
					y2 = oBounds2.top;
				} else {
					y1 = oBounds2.top;
					y2 = oBounds2.top;
				}
			} else {
				if (oBounds1.top > oBounds2.top + oBounds2.height) {
					y1 = oBounds1.top;
					y2 = oBounds2.top + oBounds2.height;
				} else {
					y1 = oBounds1.top;
					y2 = oBounds1.top;
				}
			}

			return [{x: x1, y: y1}, {x: x2, y: y2}];
		},

		_getPrecedenceValue: function(oPoints, sDirection) {
			var delta = this._getAdjacentControlDelta(oPoints[0], oPoints[1]),
				slope = this._getAdjacentControlSlope(delta, sDirection),
				angle = this._getAdjacentControlAngle(slope),
				distance = this._getAdjacentControlDistance(delta);

			return angle > 89 ? 0 : 1/(angle * Math.pow(distance, 4));
		},

		_getAdjacentControlDelta: function(point1, point2) {
			return {
				dx: Math.abs(point2.x - point1.x),
				dy: Math.abs(point2.y - point1.y)
			};
		},

		_getAdjacentControlSlope: function(delta, sDirection) {
			switch (sDirection) {
				case 'UP'	:
				case 'DOWN'	:
					return delta.dx/delta.dy;
				case 'LEFT'	:
				case 'RIGHT':
					return delta.dy/delta.dx;
			}
		},

		_getAdjacentControlDistance: function(delta) {
			return Math.pow(delta.dx*delta.dx + delta.dy*delta.dy, 0.5) || 0.1;
		},

		_getAdjacentControlAngle: function(nSlope) {
			return Math.atan(nSlope) * 180/Math.PI || 0.1;
		},

		//* @public
		/**************************************************************/

		getNearestNeighbor: function(sDirection, oControl) {
			sDirection = sDirection.toUpperCase();
			oControl = oControl || enyo.Spotlight.getCurrent();

			var oNeighbor = enyo.Spotlight.Util.getDefaultDirectionControl(sDirection, oControl);
			if (oNeighbor) {
				return oNeighbor;
			}

			var n,
				oBestMatch	= null,
				nBestMatch	= 0,
				oBounds1 	= enyo.Spotlight.Util.getAbsoluteBounds(oControl),
				oBounds2	= null,
				o 			= enyo.Spotlight.getSiblings(oControl),
				nLen 		= o.siblings.length,
				nPrecedence;

			for (n=0; n<nLen; n++) {
				oBounds2 = enyo.Spotlight.Util.getAbsoluteBounds(o.siblings[n]);
				if (this._isInHalfPlane(sDirection, oBounds1, oBounds2) && o.siblings[n] !== oControl) {
					nPrecedence = this._getAdjacentControlPrecedence(sDirection, oBounds1, oBounds2);
					if (nPrecedence > nBestMatch) {
						nBestMatch = nPrecedence;
						oBestMatch = o.siblings[n];
					}
				}
			}

			return oBestMatch;
		}
	}
});