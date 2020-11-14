import vg from "../vg";
import * as THREE from "three";

function Tile(config) {
	config = config || {};
	var settings = {
		cell: null, // required vg.Cell
		geometry: null, // required threejs geometry
		material: null // not required but it would improve performance significantly
	};
	settings = vg.Tools.merge(settings, config);

	if (!settings.cell || !settings.geometry) {
		throw new Error('Missing vg.Tile configuration');
	}

	this.cell = settings.cell;
	if (this.cell.tile && this.cell.tile !== this) this.cell.tile.dispose(); // remove whatever was there
	this.cell.tile = this;

	this.uniqueID = vg.Tools.generateID();

	this.geometry = settings.geometry;
	this.material = settings.material;
	if (!this.material) {
		this.material = new THREE.MeshPhongMaterial({
			color: vg.Tools.randomizeRGB('30, 30, 30', 13)
		});
	}

	this.objectType = vg.TILE;
	this.entity = null;
	this.hexData = {};

	this.selected = false;
	this.highlight = '0x0084cc';

	this.mesh = new THREE.Mesh(this.geometry, this.material);
	this.mesh.hexData.structure = this;

	// create references so we can control orientation through this (Tile), instead of drilling down
	this.position = this.mesh.position;
	this.rotation = this.mesh.rotation;

	// rotate it to face "up" (the threejs coordinate space is Y+)
	this.rotation.x = -90 * vg.DEG_TO_RAD;
	this.mesh.scale.set(settings.scale, settings.scale, 1);

	if (this.material.emissive) {
		this._emissive = this.material.emissive.getHex();
	}
	else {
		this._emissive = null;
	}
}

Tile.prototype = {
  constructor: Tile,
  select: function() {
    if (this.material.emissive) {
      this.material.emissive.setHex(this.highlight);
    }
    this.selected = true;
    return this;
  },

  deselect: function() {
    if (this._emissive !== null && this.material.emissive) {
      this.material.emissive.setHex(this._emissive);
    }
    this.selected = false;
    return this;
  },

  toggle: function() {
    if (this.selected) {
      this.deselect();
    }
    else {
      this.select();
    }
    return this;
  },

  dispose: function() {
    if (this.cell && this.cell.tile) this.cell.tile = null;
    this.cell = null;
    this.position = null;
    this.rotation = null;
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    this.mesh.hexData.structure = null;
    this.mesh = null;
    this.material = null;
    this.hexData = null;
    this.entity = null;
    this.geometry = null;
    this._emissive = null;
  }
};

export default Tile;
