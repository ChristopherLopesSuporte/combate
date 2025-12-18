/**
 * =============================================================================
 * SAVE SYSTEM - SISTEMA DE SALVAMENTO
 * =============================================================================
 *
 * Gerencia salvamento e carregamento do estado do jogo.
 * Suporta localStorage e exportação para arquivo.
 */

import type { GameState, Entity } from '../types';
import { useGameStore } from '../store/gameStore';

// =============================================================================
// TIPOS
// =============================================================================

/** Estrutura de um save */
export interface SaveData {
  version: string;
  timestamp: number;
  name: string;
  gameState: Partial<GameState>;
  metadata: SaveMetadata;
}

/** Metadados do save */
export interface SaveMetadata {
  playTime: number;         // Tempo de jogo em ms
  turnCount: number;        // Número de turnos jogados
  entitiesCount: number;    // Número de entidades
  createdAt: string;        // ISO date string
  lastModified: string;     // ISO date string
}

/** Slot de save */
export interface SaveSlot {
  id: string;
  name: string;
  data: SaveData;
  isEmpty: boolean;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const SAVE_VERSION = '1.0.0';
const STORAGE_KEY_PREFIX = 'rpg_game_save_';
const MAX_SAVE_SLOTS = 10;
const AUTO_SAVE_SLOT = 'autosave';

// =============================================================================
// CLASSE SAVE SYSTEM
// =============================================================================

/**
 * Sistema de salvamento singleton
 */
class SaveSystem {
  private static instance: SaveSystem;
  private playTimeStart: number = Date.now();

  private constructor() {}

  /**
   * Obtém instância única
   */
  public static getInstance(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  // ===========================================================================
  // SALVAMENTO
  // ===========================================================================

  /**
   * Salva o estado atual do jogo
   */
  save(slotId: string, name?: string): boolean {
    try {
      const state = useGameStore.getState();

      const saveData: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        name: name || `Save ${new Date().toLocaleString()}`,
        gameState: {
          entities: state.entities,
          currentTurn: state.currentTurn,
          gamePhase: state.gamePhase,
          gridSize: state.gridSize,
          showGrid: state.showGrid,
          gridMode: state.gridMode,
        },
        metadata: {
          playTime: Date.now() - this.playTimeStart,
          turnCount: state.currentTurn,
          entitiesCount: state.entities.length,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      };

      const key = STORAGE_KEY_PREFIX + slotId;
      localStorage.setItem(key, JSON.stringify(saveData));

      console.log(`Game saved to slot ${slotId}`);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Auto-save
   */
  autoSave(): boolean {
    return this.save(AUTO_SAVE_SLOT, 'Auto Save');
  }

  // ===========================================================================
  // CARREGAMENTO
  // ===========================================================================

  /**
   * Carrega um save
   */
  load(slotId: string): boolean {
    try {
      const key = STORAGE_KEY_PREFIX + slotId;
      const data = localStorage.getItem(key);

      if (!data) {
        console.log(`No save found in slot ${slotId}`);
        return false;
      }

      const saveData: SaveData = JSON.parse(data);

      // Verifica versão
      if (!this.isCompatibleVersion(saveData.version)) {
        console.error(`Incompatible save version: ${saveData.version}`);
        return false;
      }

      // Restaura estado
      const store = useGameStore.getState();

      if (saveData.gameState.entities) {
        // Limpa entidades atuais e adiciona as do save
        store.resetGame();
        saveData.gameState.entities.forEach((entity) => {
          store.addEntity(entity);
        });
      }

      if (saveData.gameState.gridSize) {
        store.setGridSize(saveData.gameState.gridSize);
      }

      if (saveData.gameState.gridMode) {
        store.setGridMode(saveData.gameState.gridMode);
      }

      console.log(`Game loaded from slot ${slotId}`);
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  /**
   * Carrega auto-save
   */
  loadAutoSave(): boolean {
    return this.load(AUTO_SAVE_SLOT);
  }

  // ===========================================================================
  // GERENCIAMENTO DE SLOTS
  // ===========================================================================

  /**
   * Lista todos os slots de save
   */
  listSaveSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];

    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const slotId = `slot_${i}`;
      const key = STORAGE_KEY_PREFIX + slotId;
      const data = localStorage.getItem(key);

      if (data) {
        try {
          const saveData: SaveData = JSON.parse(data);
          slots.push({
            id: slotId,
            name: saveData.name,
            data: saveData,
            isEmpty: false,
          });
        } catch {
          slots.push({
            id: slotId,
            name: `Slot ${i + 1}`,
            data: {} as SaveData,
            isEmpty: true,
          });
        }
      } else {
        slots.push({
          id: slotId,
          name: `Slot ${i + 1}`,
          data: {} as SaveData,
          isEmpty: true,
        });
      }
    }

    // Adiciona auto-save se existir
    const autoSaveKey = STORAGE_KEY_PREFIX + AUTO_SAVE_SLOT;
    const autoSaveData = localStorage.getItem(autoSaveKey);
    if (autoSaveData) {
      try {
        const saveData: SaveData = JSON.parse(autoSaveData);
        slots.unshift({
          id: AUTO_SAVE_SLOT,
          name: 'Auto Save',
          data: saveData,
          isEmpty: false,
        });
      } catch {
        // Ignora auto-save corrompido
      }
    }

    return slots;
  }

  /**
   * Deleta um save
   */
  deleteSave(slotId: string): boolean {
    try {
      const key = STORAGE_KEY_PREFIX + slotId;
      localStorage.removeItem(key);
      console.log(`Save deleted from slot ${slotId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Verifica se um slot tem save
   */
  hasSave(slotId: string): boolean {
    const key = STORAGE_KEY_PREFIX + slotId;
    return localStorage.getItem(key) !== null;
  }

  // ===========================================================================
  // EXPORTAÇÃO/IMPORTAÇÃO
  // ===========================================================================

  /**
   * Exporta save para arquivo
   */
  exportToFile(slotId: string): void {
    const key = STORAGE_KEY_PREFIX + slotId;
    const data = localStorage.getItem(key);

    if (!data) {
      console.error('No save to export');
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpg_save_${slotId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Importa save de arquivo
   */
  async importFromFile(file: File, slotId: string): Promise<boolean> {
    try {
      const text = await file.text();
      const saveData: SaveData = JSON.parse(text);

      // Valida estrutura básica
      if (!saveData.version || !saveData.gameState) {
        throw new Error('Invalid save file structure');
      }

      // Verifica versão
      if (!this.isCompatibleVersion(saveData.version)) {
        throw new Error(`Incompatible save version: ${saveData.version}`);
      }

      // Salva no slot
      const key = STORAGE_KEY_PREFIX + slotId;
      saveData.metadata.lastModified = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(saveData));

      console.log(`Save imported to slot ${slotId}`);
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  /**
   * Verifica compatibilidade de versão
   */
  private isCompatibleVersion(version: string): boolean {
    // Por enquanto aceita qualquer versão 1.x.x
    return version.startsWith('1.');
  }

  /**
   * Obtém informações de um save
   */
  getSaveInfo(slotId: string): SaveData | null {
    try {
      const key = STORAGE_KEY_PREFIX + slotId;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Limpa todos os saves
   */
  clearAllSaves(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    console.log('All saves cleared');
  }

  /**
   * Reseta o contador de tempo de jogo
   */
  resetPlayTime(): void {
    this.playTimeStart = Date.now();
  }
}

// Exporta instância singleton
export const saveSystem = SaveSystem.getInstance();

export default SaveSystem;

// =============================================================================
// TODO: Fase 2 - Implementar
// =============================================================================
// - Compressão de saves
// - Múltiplos perfis de jogador
// - Cloud saves
// - Checkpoints automáticos
// - Sistema de conquistas/achievements vinculado
