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
        for (let d = HexDirection.NE; d <= HexDirection.NW; d++) {
            this.triangulateDirection(d, cell, positions, indices, colors);
        }
    }

    private triangulateDirection(direction: HexDirection, cell: HexCell, positions: number[], indices: number[], colors: number[]): void {
        const center = cell.position;
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
        v3.y = v4.y = neighbor.elevation * HexMetrics.elevationStep;

        if (cell.getEdgeType(direction) === HexEdgeType.Slope) {
            this.triangulateEdgeTerraces(v1, v2, cell, v3, v4, neighbor, positions, indices, colors);
        } else {
            this.addQuad(v1, v2, v3, v4, positions, indices);
            this.addQuadColor(cell.color, neighbor.color, colors);
        }

        const nextNeighbor = cell.getNeighbor(HexDirectionExtensions.next(direction));
        if (direction <= HexDirection.E && nextNeighbor) {
            const v5 = v2.add(HexMetrics.getBridge(HexDirectionExtensions.next(direction)));
            v5.y = nextNeighbor.elevation * HexMetrics.elevationStep;
            this.triangulateCorner(v2, cell, v4, neighbor, v5, nextNeighbor, positions, indices, colors);
        }
    }

    private triangulateEdgeTerraces(
        beginLeft: BABYLON.Vector3, beginRight: BABYLON.Vector3, beginCell: HexCell,
        endLeft: BABYLON.Vector3, endRight: BABYLON.Vector3, endCell: HexCell,
        positions: number[], indices: number[], colors: number[]
    ): void {
        for (let step = 1; step < HexMetrics.terraceSteps; step++) {
            const v1 = HexMetrics.terraceLerp(beginLeft, endLeft, step);
            const v2 = HexMetrics.terraceLerp(beginRight, endRight, step);
            const c1 = HexMetrics.colorLerp(beginCell.color, endCell.color, step);

            this.addQuad(HexMetrics.terraceLerp(beginLeft, endLeft, step - 1), HexMetrics.terraceLerp(beginRight, endRight, step - 1), v1, v2, positions, indices);
            this.addQuadColor(HexMetrics.colorLerp(beginCell.color, endCell.color, step - 1), c1, colors);
        }
    }

    private triangulateCorner(
        bottom: BABYLON.Vector3, bottomCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell,
        positions: number[], indices: number[], colors: number[]
    ): void {
        const leftEdgeType = bottomCell.getEdgeTypeWithCell(leftCell);
        const rightEdgeType = bottomCell.getEdgeTypeWithCell(rightCell);

        if (leftEdgeType === HexEdgeType.Slope) {
            if (rightEdgeType === HexEdgeType.Slope) {
                this.triangulateCornerTerraces(bottom, bottomCell, left, leftCell, right, rightCell, positions, indices, colors);
            } else if (rightEdgeType === HexEdgeType.Flat) {
                this.triangulateCornerTerraces(left, leftCell, right, rightCell, bottom, bottomCell, positions, indices, colors);
            } else {
                this.triangulateCornerTerracesCliff(bottom, bottomCell, left, leftCell, right, rightCell, positions, indices, colors);
            }
        } else if (rightEdgeType === HexEdgeType.Slope) {
            if (leftEdgeType === HexEdgeType.Flat) {
                this.triangulateCornerTerraces(right, rightCell, bottom, bottomCell, left, leftCell, positions, indices, colors);
            } else {
                this.triangulateCornerCliffTerraces(bottom, bottomCell, left, leftCell, right, rightCell, positions, indices, colors);
            }
        } else if (leftCell.getEdgeTypeWithCell(rightCell) === HexEdgeType.Slope) {
            if (leftCell.elevation < rightCell.elevation) {
                this.triangulateCornerCliffTerraces(right, rightCell, bottom, bottomCell, left, leftCell, positions, indices, colors);
            } else {
                this.triangulateCornerTerracesCliff(left, leftCell, right, rightCell, bottom, bottomCell, positions, indices, colors);
            }
        } else {
            this.addTriangle(bottom, left, right, positions, indices);
            this.addTriangleColor(bottomCell.color, leftCell.color, rightCell.color, colors);
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

    public editCell(x: number, z: number, elevation: number, color: BABYLON.Color4): void {
        const index = x + z * this.width;
        const cell = this.cells[index];
        if (cell) {
            cell.elevation = elevation;
            cell.color = color;
            this.triangulate();
        }
    }

    public getMesh(): BABYLON.Mesh {
        return this.mesh;
    }
}