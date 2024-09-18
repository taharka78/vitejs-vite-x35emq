// src/HexGrid.ts
import * as BABYLON from 'babylonjs';
import { HexMetrics } from './HexaMetrics';
import { HexCell } from './HexaCell';
import { HexDirection } from './HexDirection';

export class HexGrid {
    private cells: HexCell[] = [];
    private mesh!: BABYLON.Mesh;

    constructor(
        private scene: BABYLON.Scene,
        private width: number,
        private height: number,
        private defaultColor: BABYLON.Color3
    ) {
        this.createGrid();
    }

    private createGrid(): void {
        let i = 0;
        for (let z = 0; z < this.height; z++) {
            for (let x = 0; x < this.width; x++) {
                this.createCell(x, z, i++);
            }
        }
        this.createMesh();
    }

    private createCell(x: number, z: number, i: number): void {
        const position = this.hexToPixel(x, z);
        const cell = new HexCell(x, z, position, this.defaultColor);
        this.cells[i] = cell;

        if (x > 0) {
            cell.setNeighbor(HexDirection.W, this.cells[i - 1]);
        }
        if (z > 0) {
            if ((z & 1) === 0) {
                cell.setNeighbor(HexDirection.SE, this.cells[i - this.width]);
                if (x > 0) {
                    cell.setNeighbor(HexDirection.SW, this.cells[i - this.width - 1]);
                }
            } else {
                cell.setNeighbor(HexDirection.SW, this.cells[i - this.width]);
                if (x < this.width - 1) {
                    cell.setNeighbor(HexDirection.SE, this.cells[i - this.width + 1]);
                }
            }
        }
    }

    private triangulate(): void {
        const positions: number[] = [];
        const indices: number[] = [];
        const colors: number[] = [];

        for (const cell of this.cells) {
            this.triangulateCell(cell, positions, indices, colors);
        }

        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.colors = colors;

        vertexData.applyToMesh(this.mesh);
    }

    private triangulateCell(cell: HexCell, positions: number[], indices: number[], colors: number[]): void {
        const center = cell.position;

        for (let d = HexDirection.NE; d <= HexDirection.NW; d++) {
            this.triangulateDirection(d, cell, center, positions, indices, colors);
        }
    }

    private triangulateDirection(direction: HexDirection, cell: HexCell, center: BABYLON.Vector3, positions: number[], indices: number[], colors: number[]): void {
        const v1 = center.add(HexMetrics.getFirstSolidCorner(direction));
        const v2 = center.add(HexMetrics.getSecondSolidCorner(direction));

        this.addTriangle(center, v1, v2, positions, indices);
        this.addTriangleColor(cell.color, colors);

        if (direction <= HexDirection.SE) {
            this.triangulateConnection(direction, cell, v1, v2, positions, indices, colors);
        }
    }

    private triangulateConnection(direction: HexDirection, cell: HexCell, v1: BABYLON.Vector3, v2: BABYLON.Vector3, positions: number[], indices: number[], colors: number[]): void {
        const neighbor = cell.getNeighbor(direction);
        if (!neighbor) {
            return;
        }

        const bridge = HexMetrics.getBridge(direction);
        const v3 = v1.add(bridge);
        const v4 = v2.add(bridge);

        this.addQuad(v1, v2, v3, v4, positions, indices);
        this.addQuadColor(cell.color, neighbor.color, colors);

        const nextNeighbor = cell.getNeighbor(HexDirection.next(direction));
        if (direction <= HexDirection.E && nextNeighbor) {
            const v5 = v2.add(HexMetrics.getBridge(HexDirection.next(direction)));
            this.addTriangle(v2, v4, v5, positions, indices);
            this.addTriangleColor(cell.color, neighbor.color, nextNeighbor.color, colors);
        }
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

    public colorCell(x: number, z: number, color: BABYLON.Color3): void {
        const index = x + z * this.width;
        const cell = this.cells[index];
        if (cell) {
            cell.color = color;
            this.triangulate();
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