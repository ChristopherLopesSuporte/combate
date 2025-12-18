/**
 * =============================================================================
 * GRAPPLE SYSTEM - SISTEMA DE AGARRAMENTO
 * =============================================================================
 *
 * Sistema de combate corpo-a-corpo especial para agarrar, derrubar e
 * imobilizar oponentes. Baseado em técnicas de luta greco-romana e MMA.
 *
 * TODO: Fase 5 - Implementar sistema completo de grappling
 */

import type { Entity, Position3D } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

/** Estados de grappling */
export type GrappleState =
  | 'none'              // Não está em grapple
  | 'initiating'        // Tentando agarrar
  | 'grappling'         // Em grapple ativo
  | 'mounted'           // Por cima do oponente
  | 'pinned'            // Imobilizado no chão
  | 'submission'        // Tentando finalização
  | 'escaping';         // Tentando escapar

/** Posições de grappling */
export type GrapplePosition =
  | 'standing'          // Em pé (clinch)
  | 'guard'             // Guarda (embaixo)
  | 'mount'             // Montada (por cima)
  | 'side_control'      // Cem quilos
  | 'back_control'      // Controle das costas
  | 'half_guard'        // Meia guarda
  | 'north_south';      // Norte-sul

/** Técnicas de grappling */
export type GrappleTechnique =
  | 'takedown'          // Queda
  | 'sweep'             // Raspagem
  | 'submission'        // Finalização
  | 'escape'            // Fuga
  | 'transition'        // Transição de posição
  | 'strike';           // Golpe no chão

/** Resultado de um grapple */
export interface GrappleResult {
  success: boolean;
  technique: GrappleTechnique;
  initiator: string;
  defender: string;
  newPosition?: GrapplePosition;
  damage?: number;
  timeMs: number;
  message: string;
}

/** Sessão de grapple ativa */
export interface GrappleSession {
  id: string;
  initiatorId: string;
  defenderId: string;
  initiatorState: GrappleState;
  defenderState: GrappleState;
  position: GrapplePosition;
  startTime: number;
  dominanceScore: number; // -100 a 100, positivo favorece iniciador
}

// =============================================================================
// CONSTANTES
// =============================================================================

/** Tempos base das técnicas em ms */
const TECHNIQUE_TIMES: Record<GrappleTechnique, number> = {
  takedown: 800,
  sweep: 600,
  submission: 1500,
  escape: 500,
  transition: 400,
  strike: 200,
};

/** Dano base das técnicas */
const TECHNIQUE_DAMAGE: Record<GrappleTechnique, number> = {
  takedown: 15,
  sweep: 5,
  submission: 30,
  escape: 0,
  transition: 0,
  strike: 10,
};

// =============================================================================
// CLASSE GRAPPLE SYSTEM
// =============================================================================

/**
 * Sistema de grappling singleton
 */
class GrappleSystem {
  private static instance: GrappleSystem;
  private activeSessions: Map<string, GrappleSession> = new Map();
  private sessionCounter: number = 0;

  private constructor() {}

  /**
   * Obtém instância única
   */
  public static getInstance(): GrappleSystem {
    if (!GrappleSystem.instance) {
      GrappleSystem.instance = new GrappleSystem();
    }
    return GrappleSystem.instance;
  }

  // ===========================================================================
  // GERENCIAMENTO DE SESSÕES
  // ===========================================================================

  /**
   * Inicia uma sessão de grapple
   */
  initiateGrapple(initiator: Entity, defender: Entity): GrappleSession | null {
    // Verifica se algum já está em grapple
    if (this.isInGrapple(initiator.id) || this.isInGrapple(defender.id)) {
      console.log('Um dos combatentes já está em grapple');
      return null;
    }

    // Calcula chance de sucesso do takedown
    const successChance = this.calculateTakedownChance(initiator, defender);
    const roll = Math.random() * 100;

    if (roll > successChance) {
      console.log('Takedown falhou');
      return null;
    }

    const session: GrappleSession = {
      id: `grapple_${++this.sessionCounter}`,
      initiatorId: initiator.id,
      defenderId: defender.id,
      initiatorState: 'grappling',
      defenderState: 'grappling',
      position: 'standing',
      startTime: Date.now(),
      dominanceScore: 20, // Iniciador começa com leve vantagem
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  /**
   * Finaliza uma sessão de grapple
   */
  endGrapple(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Verifica se uma entidade está em grapple
   */
  isInGrapple(entityId: string): boolean {
    for (const session of this.activeSessions.values()) {
      if (session.initiatorId === entityId || session.defenderId === entityId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtém sessão de grapple de uma entidade
   */
  getEntitySession(entityId: string): GrappleSession | null {
    for (const session of this.activeSessions.values()) {
      if (session.initiatorId === entityId || session.defenderId === entityId) {
        return session;
      }
    }
    return null;
  }

  // ===========================================================================
  // TÉCNICAS
  // ===========================================================================

  /**
   * Executa uma técnica de grappling
   */
  executeTechnique(
    executor: Entity,
    session: GrappleSession,
    technique: GrappleTechnique
  ): GrappleResult {
    const isInitiator = executor.id === session.initiatorId;
    const opponent = isInitiator ? session.defenderId : session.initiatorId;

    // Verifica se a técnica é válida para a posição atual
    if (!this.isTechniqueValid(technique, session.position, isInitiator)) {
      return {
        success: false,
        technique,
        initiator: executor.id,
        defender: opponent,
        timeMs: 100,
        message: 'Técnica inválida para a posição atual',
      };
    }

    // Calcula chance de sucesso
    const successChance = this.calculateTechniqueChance(executor, technique, session, isInitiator);
    const roll = Math.random() * 100;
    const success = roll <= successChance;

    // Aplica resultado
    let damage = 0;
    let newPosition: GrapplePosition | undefined;
    let message = '';

    if (success) {
      damage = TECHNIQUE_DAMAGE[technique];
      newPosition = this.getNewPosition(technique, session.position, isInitiator);
      session.dominanceScore += isInitiator ? 15 : -15;
      session.position = newPosition || session.position;

      message = `${technique} executado com sucesso!`;

      // Finalização bem sucedida encerra o grapple
      if (technique === 'submission' && success) {
        damage = 50; // Dano de finalização
        this.endGrapple(session.id);
        message = 'Finalização! O oponente desistiu!';
      }

      // Escape bem sucedido encerra o grapple
      if (technique === 'escape' && success) {
        this.endGrapple(session.id);
        message = 'Escapou do grapple!';
      }
    } else {
      session.dominanceScore += isInitiator ? -5 : 5;
      message = `${technique} falhou!`;
    }

    return {
      success,
      technique,
      initiator: executor.id,
      defender: opponent,
      newPosition,
      damage,
      timeMs: TECHNIQUE_TIMES[technique],
      message,
    };
  }

  // ===========================================================================
  // CÁLCULOS
  // ===========================================================================

  /**
   * Calcula chance de takedown
   */
  private calculateTakedownChance(initiator: Entity, defender: Entity): number {
    const baseChance = 50;

    // Bônus de força
    const forBonus = (initiator.stats.for - defender.stats.for) / 5;

    // Bônus de agilidade do defensor (defesa)
    const agiPenalty = (defender.stats.agi - initiator.stats.agi) / 10;

    // Bônus de habilidade
    const habBonus = (initiator.stats.hab - 50) / 10;

    return Math.max(10, Math.min(90, baseChance + forBonus - agiPenalty + habBonus));
  }

  /**
   * Calcula chance de sucesso de uma técnica
   */
  private calculateTechniqueChance(
    executor: Entity,
    technique: GrappleTechnique,
    session: GrappleSession,
    isInitiator: boolean
  ): number {
    const baseChance = 50;

    // Bônus/penalidade de dominância
    const dominanceBonus = (isInitiator ? session.dominanceScore : -session.dominanceScore) / 5;

    // Bônus de força para técnicas físicas
    const forBonus = (executor.stats.for - 50) / 10;

    // Bônus de habilidade
    const habBonus = (executor.stats.hab - 50) / 8;

    // Bônus de agilidade para escapes
    const agiBonus = technique === 'escape' ? (executor.stats.agi - 50) / 5 : 0;

    return Math.max(10, Math.min(90, baseChance + dominanceBonus + forBonus + habBonus + agiBonus));
  }

  /**
   * Verifica se uma técnica é válida para a posição
   */
  private isTechniqueValid(
    technique: GrappleTechnique,
    position: GrapplePosition,
    isOnTop: boolean
  ): boolean {
    // Simplificado: a maioria das técnicas é válida
    // TODO: Implementar matriz de técnicas válidas por posição

    // Takedown só em pé
    if (technique === 'takedown' && position !== 'standing') return false;

    // Sweep só embaixo
    if (technique === 'sweep' && isOnTop) return false;

    return true;
  }

  /**
   * Obtém nova posição após técnica
   */
  private getNewPosition(
    technique: GrappleTechnique,
    currentPosition: GrapplePosition,
    executorOnTop: boolean
  ): GrapplePosition | undefined {
    switch (technique) {
      case 'takedown':
        return executorOnTop ? 'side_control' : 'guard';

      case 'sweep':
        // Inverte a posição
        if (currentPosition === 'guard') return 'mount';
        if (currentPosition === 'half_guard') return 'side_control';
        break;

      case 'transition':
        // Avança posição
        if (currentPosition === 'side_control') return 'mount';
        if (currentPosition === 'mount') return 'back_control';
        break;
    }

    return currentPosition;
  }

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  /**
   * Obtém todas as sessões ativas
   */
  getActiveSessions(): GrappleSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Limpa todas as sessões
   */
  reset(): void {
    this.activeSessions.clear();
    this.sessionCounter = 0;
  }
}

// Exporta instância singleton
export const grappleSystem = GrappleSystem.getInstance();

export default GrappleSystem;

// =============================================================================
// TODO: Fase 5 - Implementar
// =============================================================================
// - Matriz completa de técnicas por posição
// - Sistema de stamina em grapple
// - Animações de transição
// - Golpes no chão (ground and pound)
// - Chokes e joint locks específicos
// - Defesa de submissões
