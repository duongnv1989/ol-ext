﻿/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).

	Usefull function to handle geometric operations
*/

import {getCenter as ol_extent_getCenter} from 'ol/extent'

/** Distance beetween 2 points
*	Usefull geometric functions
* @param {ol.coordinate} p1 first point
* @param {ol.coordinate} p2 second point
* @return {number} distance
*/
var ol_coordinate_dist2d = function(p1, p2)
{	var dx = p1[0]-p2[0];
	var dy = p1[1]-p2[1];
	return Math.sqrt(dx*dx+dy*dy);
}

/** 2 points are equal
*	Usefull geometric functions
* @param {ol.coordinate} p1 first point
* @param {ol.coordinate} p2 second point
* @return {boolean}
*/
var ol_coordinate_equal = function(p1, p2)
{	return (p1[0]==p2[0] && p1[1]==p2[1]);
}

/** Get center coordinate of a feature
* @param {ol.Feature} f
* @return {ol.coordinate} the center
*/
var ol_coordinate_getFeatureCenter = function(f)
{	return ol_coordinate_getGeomCenter (f.getGeometry());
};

/** Get center coordinate of a geometry
* @param {ol.Feature} geom
* @return {ol.coordinate} the center
*/
var ol_coordinate_getGeomCenter = function(geom)
{	switch (geom.getType())
	{	case 'Point': 
			return geom.getCoordinates();
		case "MultiPolygon":
			geom = geom.getPolygon(0);
		case "Polygon":
			return geom.getInteriorPoint().getCoordinates();
		default:
			return geom.getClosestPoint(ol_extent_getCenter(geom.getExtent()));
	};
};

/** Offset a polyline
 * @param {Array<ol.coordinate>} coords
 * @param {Number} offset
 * @return {Array<ol.coordinates>} resulting coord
 * @see http://stackoverflow.com/a/11970006/796832
 * @see https://drive.google.com/viewerng/viewer?a=v&pid=sites&srcid=ZGVmYXVsdGRvbWFpbnxqa2dhZGdldHN0b3JlfGd4OjQ4MzI5M2Y0MjNmNzI2MjY
 */
var ol_coordinate_offsetCoords = function (coords, offset) {
    var path = [];
    var N = coords.length-1;
    var max = N;
    var mi, mi1, li, li1, ri, ri1, si, si1, Xi1, Yi1;
    var p0, p1, p2;
    var isClosed = ol_coordinate_equal(coords[0],coords[N]);
    if (!isClosed) {
        p0 = coords[0];
        p1 = coords[1];
        p2 = [
            p0[0] + (p1[1] - p0[1]) / ol_coordinate_dist2d(p0,p1) *offset,
            p0[1] - (p1[0] - p0[0]) / ol_coordinate_dist2d(p0,p1) *offset
        ];
        path.push(p2);
        coords.push(coords[N])
        N++;
        max--;
    }
    for (var i = 0; i < max; i++) {
        p0 = coords[i];
        p1 = coords[(i+1) % N];
        p2 = coords[(i+2) % N];

        mi = (p1[1] - p0[1])/(p1[0] - p0[0]);
        mi1 = (p2[1] - p1[1])/(p2[0] - p1[0]);
        // Prevent alignements
        if (Math.abs(mi-mi1) > 1e-10) {
            li = Math.sqrt((p1[0] - p0[0])*(p1[0] - p0[0])+(p1[1] - p0[1])*(p1[1] - p0[1]));
            li1 = Math.sqrt((p2[0] - p1[0])*(p2[0] - p1[0])+(p2[1] - p1[1])*(p2[1] - p1[1]));
            ri = p0[0] + offset*(p1[1] - p0[1])/li;
            ri1 = p1[0] + offset*(p2[1] - p1[1])/li1;
            si = p0[1] - offset*(p1[0] - p0[0])/li;
            si1 = p1[1] - offset*(p2[0] - p1[0])/li1;
            Xi1 = (mi1*ri1-mi*ri+si-si1) / (mi1-mi);
            Yi1 = (mi*mi1*(ri1-ri)+mi1*si-mi*si1) / (mi1-mi);

            // Correction for vertical lines
            if(p1[0] - p0[0] == 0) {
                Xi1 = p1[0] + offset*(p1[1] - p0[1])/Math.abs(p1[1] - p0[1]);
                Yi1 = mi1*Xi1 - mi1*ri1 + si1;
            }
            if (p2[0] - p1[0] == 0 ) {
                Xi1 = p2[0] + offset*(p2[1] - p1[1])/Math.abs(p2[1] - p1[1]);
                Yi1 = mi*Xi1 - mi*ri + si;
            }

            path.push([Xi1, Yi1]);
        }
    }
    if (isClosed) {
        path.push(path[0]);
    } else {
        coords.pop();
        p0 = coords[coords.length-1];
        p1 = coords[coords.length-2];
        p2 = [
            p0[0] - (p1[1] - p0[1]) / ol_coordinate_dist2d(p0,p1) *offset,
            p0[1] + (p1[0] - p0[0]) / ol_coordinate_dist2d(p0,p1) *offset
        ];
        path.push(p2);
    }
    return path;
}

/** Find the segment a point belongs to
 * @param {ol.coordinate} pt
 * @param {Array<ol.coordinate>} coords
 * @return {} the index (-1 if not found) and the segment
 */
var ol_coordinate_findSegment = function (pt, coords) {
    for (var i=0; i<coords.length-1; i++) {
        var p0 = coords[i];
        var p1 = coords[i+1];
        if (ol_coordinate_equal(pt, p0) || ol_coordinate_equal(pt, p1)) {
            return { index:1, segment: [p0,p1] };
        } else {
            var d0 = ol_coordinate_dist2d(p0,p1);
            var v0 = [ (p1[0] - p0[0]) / d0, (p1[1] - p0[1]) / d0 ];
            var d1 = ol_coordinate_dist2d(p0,pt);
            var v1 = [ (pt[0] - p0[0]) / d1, (pt[1] - p0[1]) / d1 ];
            if (Math.abs(v0[0]*v1[1] - v0[1]*v1[0]) < 1e-10) {
                return { index:1, segment: [p0,p1] };
            }
        }
    }
    return { index: -1 };
};

/**
 * Split a Polygon geom with horizontal lines
 * @param {Array<ol.coordinate>} geom
 * @param {Number} y the y to split
 * @param {Number} n contour index
 * @return {Array<Array<ol.coordinate>>}
 */
var ol_coordinate_splitH = function (geom, y, n) {
    var x, abs;
    var list = [];
    for (var i=0; i<geom.length-1; i++) {
        // Hole separator?
        if (!geom[i].length || !geom[i+1].length) continue;
        // Intersect
        if (geom[i][1]<=y && geom[i+1][1]>y || geom[i][1]>=y && geom[i+1][1]<y) {
            abs = (y-geom[i][1]) / (geom[i+1][1]-geom[i][1]);
            x = abs * (geom[i+1][0]-geom[i][0]) + geom[i][0];
            list.push ({ contour: n, index: i, pt: [x,y], abs: abs });
        }
    }
    // Sort x
    list.sort(function(a,b) { return a.pt[0] - b.pt[0] });
    // Horizontal segement
    var result = [];
    for (var j=0; j<list.length-1; j += 2) {
        result.push([list[j], list[j+1]])
    }
    return result;
};

export {ol_coordinate_dist2d, ol_coordinate_equal, ol_coordinate_findSegment, ol_coordinate_getFeatureCenter, ol_coordinate_getGeomCenter, ol_coordinate_offsetCoords, ol_coordinate_splitH}