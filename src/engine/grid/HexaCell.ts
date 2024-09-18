import * as BABYLON from 'babylonjs';
import { HexDirection, HexDirectionExtensions } from './HexDirection';

export class HexCell {
    private neighbors: (HexCell | null)[] = new Array(6).fill(null);

    constructor(
        public x: number,
        public z: number,
        public position: BABYLON.Vector3
    ) {}

    getNeighbor(direction: HexDirection): HexCell | null {
        return this.neighbors[direction];
    }

    setNeighbor(direction: HexDirection, cell: HexCell): void {
        this.neighbors[direction] = cell;
        cell.neighbors[HexDirectionExtensions.opposite(direction)] = this;
    }
}