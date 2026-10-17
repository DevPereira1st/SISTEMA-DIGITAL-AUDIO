import { useState } from 'react';
import './ModalFuncionario.css'; // Reutiliza o estilo dos modais anteriores

interface ModalGastoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (novoGasto: any) => void;
}

const CATEGORIAS = [
  'Combustível',
  'Alimentação',
  'Manutenção de Equipamentos',
  'Transporte / Frete',
  'Outros'
];

export default function ModalGasto({ isOpen, onClose, onSave }: ModalGastoProps) {
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      id: `GASTO-${Math.floor(Math.random() * 10000)}`,
      descricao,
      categoria,
      valor: Number(valor) || 0,
      data
    });

    setDescricao('');
    setCategoria(CATEGORIAS[0]);
    setValor('');
    setData('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo">
        <h2>Adicionar Nova Despesa</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grupo">
            <label>Descrição do Gasto</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Gasolina para o evento da Casa Belle"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="form-grupo">
            <label>Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-grupo">
              <label>Valor (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                placeholder="Ex: 150.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="form-grupo">
              <label>Data</label>
              <input 
                type="date" 
                required 
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-acoes">
            <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-salvar" style={{ backgroundColor: '#ef4444' }}>Salvar Despesa</button>
          </div>
        </form>
      </div>
    </div>
  );
}