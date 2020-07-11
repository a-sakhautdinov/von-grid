import Scene from "./utils/Scene";
import Tools from "./utils/Tools";
import HexGrid from "./grids/HexGrid";
import Cell from "./grids/Cell";
import LinkedList from "./lib/LinkedList";
import Board from "./Board";
import AStarFinder from "./pathing/AStarFinder";
import Loader from "./utils/Loader";
import MouseCaster from "./utils/MouseCaster";
import { Signal } from "./lib/Signal";
import Tile from "./grids/Tile";

const vg = { // eslint-disable-line
	VERSION: '0.1.1',

	PI: Math.PI,
	TAU: Math.PI * 2,
	DEG_TO_RAD: 0.0174532925,
	RAD_TO_DEG: 57.2957795,
	SQRT3: Math.sqrt(3), // used often in hex conversions

	// useful enums for type checking. change to whatever fits your game. these are just examples
	TILE: 'tile', // visual representation of a grid cell
	ENT: 'entity', // dynamic things
	STR: 'structure', // static things

	HEX: 'hex',
	SQR: 'square',
	ABS: 'abstract',

  Tools,
  Scene,
  HexGrid,
  Cell,
  LinkedList,
  Board,
  AStarFinder,
  Loader,
  MouseCaster,
  Signal,
  Tile,
};

export default vg;
