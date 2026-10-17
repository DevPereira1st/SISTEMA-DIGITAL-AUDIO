import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase'; // Certifique-se que o firebase.ts está acessível

interface ModalPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (novoPagamento: any) => void;
  nomeFuncionario: string;
}

export default function ModalPagamento({ isOpen, onClose, onSave, nomeFuncionario }: ModalPagamentoProps) {
  const [data, setData] = useState('');
  const [valor, setValor] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [aFazerUpload, setAFazerUpload] = useState(false);

  if (!isOpen) return null;

  const lidarComEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setAFazerUpload(true);
    
    try {
      let urlComprovante = undefined;
      let nomeArquivo = undefined;

      // Se enviou um comprovativo, faz o upload para a nuvem
      if (arquivo) {
        const arquivoRef = ref(storage, `comprovantes/${Date.now()}_${arquivo.name}`);
        await uploadBytes(arquivoRef, arquivo);
        urlComprovante = await getDownloadURL(arquivoRef);
        nomeArquivo = arquivo.name;
      }

      onSave({
        id: `PAG-${Math.floor(Math.random() * 10000)}`,
        data,
        valor: parseFloat(valor),
        urlComprovante,
        nomeArquivo
      });

      setData('');
      setValor('');
      setArquivo(null);
    } catch (erro) {
      alert("Erro ao salvar comprovativo. Tente novamente.");
    } finally {
      setAFazerUpload(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo">
        <h2>Lançar Pagamento</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '-16px' }}>Para: {nomeFuncionario}</p>
        
        <form onSubmit={lidarComEnvio}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-grupo">
              <label>Data do Pagamento</label>
              <input type="date" required value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            
            <div className="form-grupo">
              <label>Valor Pago (R$)</label>
              <input 
                type="number" step="0.01" min="0" required 
                placeholder="Ex: 500.00"
                value={valor} onChange={(e) => setValor(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-grupo">
            <label>Anexar Comprovante (Opcional)</label>
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setArquivo(e.target.files ? e.target.files[0] : null)}
            />
          </div>

          <div className="modal-acoes">
            <button type="button" className="btn-cancelar" onClick={onClose} disabled={aFazerUpload}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar" disabled={aFazerUpload} style={{ backgroundColor: '#22c55e' }}>
              {aFazerUpload ? 'A anexar...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}