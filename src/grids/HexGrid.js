import vg from "../vg";
import * as THREE from "three";

function HexGrid(config) {
	config = config || {};
	this.type = vg.HEX;
	this.size = 5;
	this.cellSize = typeof config.cellSize === 'undefined' ? 10 : config.cellSize;
	this.cells = {};
	this.numCells = 0;

	this.extrudeSettings = null;
	this.autogenerated = false;

	var i, verts = [];
	for (i = 0; i < 6; i++) {
		verts.push(this._createVertex(i));
	}
	this.cellShape = new THREE.Shape();
	this.cellShape.moveTo(verts[0].x, verts[0].y);
	for (i = 1; i < 6; i++) {
		this.cellShape.lineTo(verts[i].x, verts[i].y);
	}
	this.cellShape.lineTo(verts[0].x, verts[0].y);
	this.cellShape.autoClose = true;

	this.cellGeo = new THREE.Geometry();
	this.cellGeo.vertices = verts;
	this.cellGeo.verticesNeedUpdate = true;

	this.cellShapeGeo = new THREE.ShapeGeometry(this.cellShape);

	this._cellWidth = this.cellSize * 2;
	this._cellLength = (vg.SQRT3 * 0.5) * this._cellWidth;
	this._hashDelimeter = '.';
	// pre-computed permutations
	this._directions = [new vg.Cell(+1, -1, 0), new vg.Cell(+1, 0, -1), new vg.Cell(0, +1, -1),
						new vg.Cell(-1, +1, 0), new vg.Cell(-1, 0, +1), new vg.Cell(0, -1, +1)];
	this._diagonals = [new vg.Cell(+2, -1, -1), new vg.Cell(+1, +1, -2), new vg.Cell(-1, +2, -1),
					   new vg.Cell(-2, +1, +1), new vg.Cell(-1, -1, +2), new vg.Cell(+1, -2, +1)];

	this._list = [];
	this._vec3 = new THREE.Vector3();
	this._cel = new vg.Cell();
	this._conversionVec = new THREE.Vector3();
	this._geoCache = [];
	this._matCache = [];
}

HexGrid.TWO_THIRDS = 2 / 3;

HexGrid.prototype = {
  constructor: HexGrid,

  cellToPixel: function(cell) {
    this._vec3.x = cell.q * this._cellWidth * 0.75;
    this._vec3.y = cell.h;
    this._vec3.z = -((cell.s - cell.r) * this._cellLength * 0.5);
    return this._vec3;
  },

  pixelToCell: function(pos) {
    const q = pos.x * (vg.HexGrid.TWO_THIRDS / this.cellSize);
    const r = ((-pos.x / 3) + (vg.SQRT3/3) * pos.z) / this.cellSize;
    this._cel.set(q, r, -q-r);
    return this._cubeRound(this._cel);
  },

  getCellAt: function(pos) {
    // get the Cell (if any) at the passed world position
    var q = pos.x * (vg.HexGrid.TWO_THIRDS / this.cellSize);
    var r = ((-pos.x / 3) + (vg.SQRT3/3) * pos.z) / this.cellSize;
    this._cel.set(q, r, -q-r);
    this._cubeRound(this._cel);
    return this.cells[this.cellToHash(this._cel)];
  },

  getNeighbors: function(cell, diagonal, filter) {
    // always returns an array
    let i, n, l = this._directions.length;
    this._list.length = 0;
    for (i = 0; i < l; i++) {
      this._cel.copy(cell);
      this._cel.add(this._directions[i]);
      n = this.cells[this.cellToHash(this._cel)];
      if (!n || (filter && !filter(cell, n))) {
        continue;
      }
      this._list.push(n);
    }
    if (diagonal) {
      for (i = 0; i < l; i++) {
        this._cel.copy(cell);
        this._cel.add(this._diagonals[i]);
        n = this.cells[this.cellToHash(this._cel)];
        if (!n || (filter && !filter(cell, n))) {
          continue;
        }
        this._list.push(n);
      }
    }
    return this._list;
  },

  getRandomCell: function() {
    let c, i = 0, x = vg.Tools.randomInt(0, this.numCells);
    for (c in this.cells) {
      if (i === x) {
        return this.cells[c];
      }
      i++;
    }
    return this.cells[c];
  },

  cellToHash: function(cell) {
    return cell.q+this._hashDelimeter+cell.r+this._hashDelimeter+cell.s;
  },

  distance: function(cellA, cellB) {
    let d = Math.max(Math.abs(cellA.q - cellB.q), Math.abs(cellA.r - cellB.r), Math.abs(cellA.s - cellB.s));
    d += cellB.h - cellA.h; // include vertical height
    return d;
  },

  clearPath: function() {
    let i, c;
    for (i in this.cells) {
      c = this.cells[i];
      c._calcCost = 0;
      c._priority = 0;
      c._parent = null;
      c._visited = false;
    }
  },

  traverse: function(cb) {
    let i;
    for (i in this.cells) {
      cb(this.cells[i]);
    }
  },

  generateTile: function(cell, scale, material) {
    let height = Math.abs(cell.h);
    if (height < 1) height = 1;

    let geo = this._geoCache[height];
    if (!geo) {
      this.extrudeSettings.depth = height;
      geo = new THREE.ExtrudeGeometry(this.cellShape, this.extrudeSettings);
      this._geoCache[height] = geo;
    }

    const tile = new vg.Tile({
      size: this.cellSize,
      scale: scale,
      cell: cell,
      geometry: geo,
      material: material
    });

    cell.tile = tile;

    return tile;
  },

  generateTiles: function(config) {
    config = config || {};
    let tiles = [];
    let settings = {
      tileScale: 0.95,
      cellSize: this.cellSize,
      material: null,
      extrudeSettings: {
        depth: 1,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: this.cellSize/20,
        bevelThickness: this.cellSize/20
      }
    }
    settings = vg.Tools.merge(settings, config);

    this.cellSize = settings.cellSize;
    this._cellWidth = this.cellSize * 2;
    this._cellLength = (vg.SQRT3 * 0.5) * this._cellWidth;

    this.autogenerated = true;
    this.extrudeSettings = settings.extrudeSettings;

    let i, t, c;
    for (i in this.cells) {
      c = this.cells[i];
      t = this.generateTile(c, settings.tileScale, settings.material);
      t.position.copy(this.cellToPixel(c));
      t.position.y = 0;
      tiles.push(t);
    }
    return tiles;
  },

  generateTilePoly: function(material) {
    if (!material) {
      material = new THREE.LineBasicMaterial({color: 0x24b4ff});
    }
    const mesh = new THREE.Mesh(this.cellShapeGeo, material);
    this._vec3.set(1, 0, 0);
    mesh.rotateOnAxis(this._vec3, vg.PI/2);
    return mesh;
  },

  generate: function(config) {
    config = config || {};
    this.size = typeof config.size === 'undefined' ? this.size : config.size;
    let x, y, z, c;
    for (x = -this.size; x < this.size+1; x++) {
      for (y = -this.size; y < this.size+1; y++) {
        z = -x-y;
        if (Math.abs(x) <= this.size && Math.abs(y) <= this.size && Math.abs(z) <= this.size) {
          c = new vg.Cell(x, y, z);
          this.add(c);
        }
      }
    }
  },

  generateOverlay: function(size, overlayObj, overlayMat) {
    let x, y, z;
    const geo = this.cellShape.createPointsGeometry();
    for (x = -size; x < size+1; x++) {
      for (y = -size; y < size+1; y++) {
        z = -x-y;
        if (Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) {
          this._cel.set(x, y, z); // define the cell
          const line = new THREE.Line(geo, overlayMat);
          line.position.copy(this.cellToPixel(this._cel));
          line.rotation.x = 90 * vg.DEG_TO_RAD;
          overlayObj.add(line);
        }
      }
    }
  },

  add: function(cell) {
    const h = this.cellToHash(cell);
    if (this.cells[h]) {
      // console.warn('A cell already exists there');
      return;
    }
    this.cells[h] = cell;
    this.numCells++;

    return cell;
  },

  remove: function(cell) {
    const h = this.cellToHash(cell);
    if (this.cells[h]) {
      delete this.cells[h];
      this.numCells--;
    }
  },

  dispose: function() {
    this.cells = null;
    this.numCells = 0;
    this.cellShape = null;
    this.cellGeo.dispose();
    this.cellGeo = null;
    this.cellShapeGeo.dispose();
    this.cellShapeGeo = null;
    this._list = null;
    this._vec3 = null;
    this._conversionVec = null;
    this._geoCache = null;
    this._matCache = null;
  },

  load: function(url, cb, scope) {
    const self = this;
    vg.Tools.getJSON({
      url: url,
      callback: function(json) {
        self.fromJSON(json);
        cb.call(scope || null, json);
      },
      cache: false,
      scope: self
    });
  },

  fromJSON: function(json) {
    let i, c;
    const cells = json.cells;

    this.cells = {};
    this.numCells = 0;

    this.size = json.size;
    this.cellSize = json.cellSize;
    this._cellWidth = this.cellSize * 2;
    this._cellLength = (vg.SQRT3 * 0.5) * this._cellWidth;

    this.extrudeSettings = json.extrudeSettings;
    this.autogenerated = json.autogenerated;

    for (i = 0; i < cells.length; i++) {
      c = new vg.Cell();
      c.copy(cells[i]);
      this.add(c);
    }
  },

  toJSON: function() {
    const json = {
      size: this.size,
      cellSize: this.cellSize,
      extrudeSettings: this.extrudeSettings,
      autogenerated: this.autogenerated
    };
    let cells = [];
    let c, k;

    for (k in this.cells) {
      c = this.cells[k];
      cells.push({
        q: c.q,
        r: c.r,
        s: c.s,
        h: c.h,
        walkable: c.walkable,
        hexData: c.hexData,
        gameData: c.gameData,
      });
    }
    json.cells = cells;

    return json;
  },

  _createVertex: function(i) {
    const angle = (vg.TAU / 6) * i;
    return new THREE.Vector3((this.cellSize * Math.cos(angle)), (this.cellSize * Math.sin(angle)), 0);
  },

  _cubeRound: function(h) {
    let rx = Math.round(h.q);
    let ry = Math.round(h.r);
    let rz = Math.round(h.s);

    const xDiff = Math.abs(rx - h.q);
    const yDiff = Math.abs(ry - h.r);
    const zDiff = Math.abs(rz - h.s);

    if (xDiff > yDiff && xDiff > zDiff) {
      rx = -ry-rz;
    }
    else if (yDiff > zDiff) {
      ry = -rx-rz;
    }
    else {
      rz = -rx-ry;
    }

    return this._cel.set(rx, ry, rz);
  },
};

export default HexGrid;
