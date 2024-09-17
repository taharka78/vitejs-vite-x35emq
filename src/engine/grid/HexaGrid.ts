// src/HexGrid.ts
import * as BABYLON from 'babylonjs';
import { HexMetrics } from './HexaMetrics';
import { HexCell } from './HexaCell';

export class HexGrid {
    private cells: HexCell[] = [];
    private mesh!: BABYLON.Mesh;

    constructor(
        private scene: BABYLON.Scene,
        private width: number,
        private height: number
    ) {
        this.createGrid();
    }

    private createGrid(): void {
        for (let z = 0; z < this.height; z++) {
            for (let x = 0; x < this.width; x++) {
                const position = this.hexToPixel(x, z);
                const cell = new HexCell(x, z, position);
                this.cells.push(cell);
            }
        }
        this.createMesh();
    }

    private hexToPixel(x: number, z: number): BABYLON.Vector3 {
        const xPos = (x + z * 0.5 - Math.floor(z / 2)) * (HexMetrics.innerRadius * 2);
        const zPos = z * (HexMetrics.outerRadius * 1.5);
        return new BABYLON.Vector3(xPos, 0, zPos);
    }

    private createMesh(): void {
        const positions: number[] = [];
        const indices: number[] = [];
        const colors: number[] = [];

        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            const center = cell.position;

            for (let j = 0; j < 6; j++) {
                positions.push(
                    center.x + HexMetrics.corners[j].x,
                    center.y + HexMetrics.corners[j].y,
                    center.z + HexMetrics.corners[j].z
                );
                colors.push(1, 1, 1, 1);
            }

            const vertexIndex = i * 6;
            for (let j = 0; j < 6; j++) {
                indices.push(vertexIndex, vertexIndex + (j + 1) % 6, vertexIndex + j);
            }
        }

        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.colors = colors;

        this.mesh = new BABYLON.Mesh("hexGrid", this.scene);
        vertexData.applyToMesh(this.mesh);

        const material = new BABYLON.StandardMaterial("hexMaterial", this.scene);
        material.specularColor = BABYLON.Color3.Black();
        material.emissiveColor = BABYLON.Color3.White();
        material.backFaceCulling = false;
        this.mesh.material = material;
    }

    public colorCell(position: BABYLON.Vector3, color: BABYLON.Color3): void {
        const pick = this.scene.pick(position.x, position.y);
        if (pick.hit && pick.pickedMesh === this.mesh) {
            const pickedPoint = pick.pickedPoint;
            if (pickedPoint) {
                const cellIndex = this.getCellIndexFromPosition(pickedPoint);
                if (cellIndex !== -1) {
                    const startIndex = cellIndex * 24; // 6 vertices per cell, 4 color components per vertex
                    for (let i = 0; i < 24; i += 4) {
                        this.mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, [color.r, color.g, color.b, 1], false, startIndex + i);
                    }
                }
            }
        }
    }

    private getCellIndexFromPosition(position: BABYLON.Vector3): number {
        const x = Math.round((position.x / (HexMetrics.innerRadius * 2) - position.z / (HexMetrics.outerRadius * 3)));
        const z = Math.round((position.z / (HexMetrics.outerRadius * 1.5)));
        return this.cells.findIndex(cell => cell.x === x && cell.z === z);
    }

    public getMesh(): BABYLON.Mesh {
        return this.mesh;
    }
}