/**
 * =============================================================================
 * SAVE/LOAD MENU - MENU DE SALVAMENTO E CARREGAMENTO
 * =============================================================================
 *
 * Interface para salvar, carregar, exportar e importar saves do jogo.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { saveSystem, type SaveSlot } from '../utils/SaveSystem';

// =============================================================================
// TIPOS
// =============================================================================

interface SaveLoadMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// COMPONENTE DE ITEM DE SAVE
// =============================================================================

interface SaveItemProps {
  slot: SaveSlot;
  onLoad: (slotId: string) => void;
  onDelete: (slotId: string) => void;
}

const SaveItem: React.FC<SaveItemProps> = ({ slot, onLoad, onDelete }) => {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAutoSave = slot.id === 'autosave';

  if (slot.isEmpty) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg opacity-50">
        <div className="flex-1">
          <span className="text-gray-500">{slot.name} (vazio)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">
            {slot.data.name || slot.name}
          </span>
          {isAutoSave && (
            <span className="text-xs bg-blue-600 px-1 rounded">AUTO</span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {formatDate(slot.data.timestamp)} | Turno {slot.data.metadata?.turnCount || 0} |{' '}
          {slot.data.metadata?.entitiesCount || 0} entidades
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onLoad(slot.id)}
          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors"
        >
          Carregar
        </button>
        <button
          onClick={() => onDelete(slot.id)}
          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
        >
          X
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const SaveLoadMenu: React.FC<SaveLoadMenuProps> = ({ isOpen, onClose }) => {
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [newSaveName, setNewSaveName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>('slot_0');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega lista de saves
  const refreshSaves = useCallback(() => {
    setSaveSlots(saveSystem.listSaveSlots());
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshSaves();
    }
  }, [isOpen, refreshSaves]);

  // Mostra mensagem temporaria
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Handler para salvar
  const handleSave = useCallback(() => {
    const slotId = selectedSlot || 'slot_0';
    const name = newSaveName.trim() || `Save ${new Date().toLocaleString()}`;

    const success = saveSystem.save(slotId, name);

    if (success) {
      showMessage('Jogo salvo com sucesso!', 'success');
      setNewSaveName('');
      refreshSaves();
    } else {
      showMessage('Erro ao salvar jogo', 'error');
    }
  }, [selectedSlot, newSaveName, refreshSaves]);

  // Handler para carregar
  const handleLoad = useCallback((slotId: string) => {
    const success = saveSystem.load(slotId);
    if (success) {
      showMessage('Jogo carregado com sucesso!', 'success');
      onClose();
    } else {
      showMessage('Erro ao carregar save', 'error');
    }
  }, [onClose]);

  // Handler para deletar
  const handleDelete = useCallback((slotId: string) => {
    const slot = saveSlots.find(s => s.id === slotId);
    const displayName = slot?.data?.name || slotId;
    if (window.confirm(`Deletar save "${displayName}"?`)) {
      saveSystem.deleteSave(slotId);
      refreshSaves();
      showMessage('Save deletado', 'success');
    }
  }, [saveSlots, refreshSaves]);

  // Handler para exportar
  const handleExport = useCallback(() => {
    // Primeiro salva no slot temporario, depois exporta
    const slotId = selectedSlot || 'slot_0';
    if (saveSystem.hasSave(slotId)) {
      saveSystem.exportToFile(slotId);
      showMessage('Save exportado!', 'success');
    } else {
      // Salva primeiro, depois exporta
      const name = newSaveName.trim() || `Export ${new Date().toLocaleString()}`;
      saveSystem.save(slotId, name);
      saveSystem.exportToFile(slotId);
      showMessage('Save exportado!', 'success');
      refreshSaves();
    }
  }, [selectedSlot, newSaveName, refreshSaves]);

  // Handler para importar
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const slotId = selectedSlot || 'slot_0';
    const success = await saveSystem.importFromFile(file, slotId);
    if (success) {
      // Carrega o save importado
      saveSystem.load(slotId);
      showMessage('Save importado com sucesso!', 'success');
      refreshSaves();
    } else {
      showMessage('Erro ao importar arquivo', 'error');
    }

    // Limpa input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedSlot, refreshSaves]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Salvar / Carregar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            X
          </button>
        </div>

        {/* Mensagem */}
        {message && (
          <div
            className={`mx-4 mt-4 p-2 rounded text-center text-sm ${
              message.type === 'success'
                ? 'bg-green-900 text-green-300'
                : 'bg-red-900 text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Lista de saves */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-bold text-gray-400 mb-2">
            Saves Disponiveis ({saveSlots.filter(s => !s.isEmpty).length})
          </h3>

          {saveSlots.filter(s => !s.isEmpty).length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              Nenhum save encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {saveSlots.filter(s => !s.isEmpty).map((slot) => (
                <SaveItem
                  key={slot.id}
                  slot={slot}
                  onLoad={handleLoad}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Novo Save */}
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-sm font-bold text-gray-400 mb-2">Novo Save</h3>
          <div className="flex gap-2 mb-2">
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            >
              {saveSlots.filter(s => s.id !== 'autosave').map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.name} {!slot.isEmpty ? '(ocupado)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSaveName}
              onChange={(e) => setNewSaveName(e.target.value)}
              placeholder="Nome do save..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>

        {/* Export/Import */}
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-sm font-bold text-gray-400 mb-2">
            Exportar / Importar
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Exportar JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Importar JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveLoadMenu;
