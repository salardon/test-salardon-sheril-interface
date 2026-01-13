export interface WeaponShot {
    weaponName: string;
    outcome: 'hit' | 'miss' | 'shielded' | 'destroyed' | 'exit';
    damage: number;
    targetPart: 'hull' | 'shield' | 'none';
    isFatal: boolean;
}

export interface FleetExchange {
    attacker: {
        id: string; // e.g., "0/3"
        type: string;
        pos: { x: number; y: number; z: number };
    };
    target: {
        instanceId: string; // Composite key: "Type_X_Y_Z"
        type: string;
        pos: { x: number; y: number; z: number };
    };
    distance: number;
    shots: WeaponShot[];
}

export interface TurnState {
    turnNumber: number;
    exchanges: FleetExchange[];
}

export interface CombatLogData {
    id: string;
    battleName: string;
    turns: TurnState[];
    // Pre-aggregated matrix for the Phase 1 Heatmap
    globalMatrix: {
        allShipTypes: string[];
        // Key format: "AttackerType|TargetType"
        data: Record<string, { dealt: number; received: number; kills: number }>;
    };
}
