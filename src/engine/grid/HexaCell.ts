import * as BABYLON from 'babylonjs';

export class HexCell {
    constructor(
        public x: number,
        public z: number,
        public position: BABYLON.Vector3
    ) {}
}