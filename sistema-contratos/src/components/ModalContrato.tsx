import React, { useState } from 'react';
import './ModalContrato.css';

interface ModalContratoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (novoContrato: any) => void; 
}

const OPCOES_ITENS = [
  'Equipamento de Som',
  'Iluminação Básica',
  'Tenda',
  'Cadeiras Extras',
  'Palco',
  'Microfones Sem Fio'
];

export default function ModalContrato({ isOpen, onClose, onSave }: ModalContratoProps) {
  const [local, setLocal] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [contratante, setContratante] = useState(''); 
  const [empresa, setEmpresa] = useState('Digital Audio'); 
  const [valorTotal, setValorTotal] = useState('');
  
  const [itensMarcados, setItensMarcados] = useState<string[]>([]);

  if (!isOpen) return null;

  const lidarComCheckbox = (item: string) => {
    if (itensMarcados.includes(item)) {
      setItensMarcados(itensMarcados.filter(i => i !== item));
    } else {
      setItensMarcados([...itensMarcados, item]);
    }
  };

  const lidarComEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    
    const novoContrato = {
      id: `CTR-00${Math.floor(Math.random() * 100) + 10}`,
      contratante,
      empresa,
      local,
      data,
      horario,
      valorTotal: parseFloat(valorTotal) || 0,
      itensMarcados
    };

    onSave(novoContrato);
    
    setContratante('');
    setEmpresa('Digital Audio');
    setLocal('');
    setData('');
    setHorario('');
    setValorTotal('');
    setItensMarcados([]);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo">
        <h2>Adicionar Novo Contrato</h2>
        
        <form onSubmit={lidarComEnvio}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-grupo">
              <label>Nome do Contratante</label>
              <input type="text" required placeholder="Ex: João Silva" value={contratante} onChange={(e) => setContratante(e.target.value)} />
            </div>
            <div className="form-grupo">
              <label>Empresa Executante</label>
              <input type="text" required value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="form-grupo">
              <label>Local do Evento</label>
              <input type="text" required placeholder="Ex: Salão Principal" value={local} onChange={(e) => setLocal(e.target.value)} />
            </div>
            <div className="form-grupo">
              <label>Valor Total (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                placeholder="Ex: 1500.00" 
                value={valorTotal} 
                onChange={(e) => setValorTotal(e.target.value)} 
              />
            </div>
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
            <label>Itens Inclusos</label>
            <div className="checkbox-grupo">
              {OPCOES_ITENS.map(item => (
                <label key={item} className="checkbox-item">
                  <input type="checkbox" checked={itensMarcados.includes(item)} onChange={() => lidarComCheckbox(item)} />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="modal-acoes">
            <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-salvar">Salvar Contrato</button>
          </div>
        </form>
      </div>
    </div>
  );
}