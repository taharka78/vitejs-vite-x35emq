import * as BABYLON from 'babylonjs';
import { HexDirection, HexDirectionExtensions } from './HexDirection';

export enum HexEdgeType {
    Flat,
    Slope,
    Cliff
}

export class HexCell {

    private neighbors: (HexCell | null)[] = new Array(6).fill(null);
    private _elevation: number = 0;

    constructor(
        public x: number,
        public z: number,
        public position: BABYLON.Vector3,
        public color: BABYLON.Color4
    ) {}
    
    get elevation(): number {
        return this._elevation;
    }

    set elevation(value: number) {
        this._elevation = value;
        this.position.y = value * HexMetrics.elevationStep;
    }

    getNeighbor(direction: HexDirection): HexCell | null {
        return this.neighbors[direction];
    }

    setNeighbor(direction: HexDirection, cell: HexCell): void {
        this.neighbors[direction] = cell;
        cell.neighbors[HexDirectionExtensions.opposite(direction)] = this;
    }

    getEdgeType(direction: HexDirection): HexEdgeType {
        return HexMetrics.getEdgeType(this.elevation, this.neighbors[direction]?.elevation ?? this.elevation);
    }

    getEdgeTypeWithCell(otherCell: HexCell): HexEdgeType {
        return HexMetrics.getEdgeType(this.elevation, otherCell.elevation);
    }
}