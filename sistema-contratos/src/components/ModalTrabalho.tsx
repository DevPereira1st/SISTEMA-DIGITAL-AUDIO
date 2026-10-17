import React, { useState } from 'react';
import './ModalTrabalho.css';

interface ModalTrabalhoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trabalho: any) => void;
}

export default function ModalTrabalho({ isOpen, onClose, onSave }: ModalTrabalhoProps) {
  const [local, setLocal] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [valor, setValor] = useState('');
  const [funcao, setFuncao] = useState('');

  if (!isOpen) return null;

  const lidarComEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `TRAB-${Date.now()}`,
      local,
      data,
      horario,
      valor: parseFloat(valor) || 0,
      funcao,
      statusAprovacao: 'pendente' // Novo trabalho submetido pelo membro começa pendente
    });
    setLocal('');
    setData('');
    setHorario('');
    setValor('');
    setFuncao('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo">
        <h2>Adicionar Novo Trabalho</h2>
        <form onSubmit={lidarComEnvio}>
          <div className="form-grupo">
            <label>Local / Evento</label>
            <input type="text" required placeholder="Ex: Casamento Principal" value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>
          <div className="form-grupo">
            <label>Função / Cargo no Evento</label>
            <input type="text" required placeholder="Ex: Operador de Som" value={funcao} onChange={(e) => setFuncao(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-grupo">
              <label>Data</label>
              <input type="date" required value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="form-grupo">
              <label>Horário</label>
              <input type="time" required value={horario} onChange={(e) => setHorario(e.target.value)} />
            </div>
          </div>
          <div className="form-grupo">
            <label>Valor (R$)</label>
            <input type="number" step="0.01" min="0" required placeholder="Ex: 300.00" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div className="modal-acoes">
            <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-salvar">Solicitar Trabalho</button>
          </div>
        </form>
      </div>
    </div>
  );
}