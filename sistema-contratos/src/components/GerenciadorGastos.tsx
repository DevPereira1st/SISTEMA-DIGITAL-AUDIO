import { useState, useEffect } from 'react';
import ModalGasto from './ModalGasto';
import './GerenciadorGastos.css';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Gasto {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
}

interface GerenciadorGastosProps {
  nivelAcesso?: string;
}

export default function GerenciadorGastos({ nivelAcesso: _nivelAcesso }: GerenciadorGastosProps) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [avisoFeedback, setAvisoFeedback] = useState<string | null>(null);

  // Buscar gastos diretamente do Firestore
  const buscarGastos = async () => {
    setCarregando(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'gastos'));
      const lista: Gasto[] = [];
      querySnapshot.forEach((docSnap) => {
        const dados = docSnap.data();
        lista.push({
          id: docSnap.id,
          descricao: dados.descricao || 'Sem descrição',
          categoria: dados.categoria || 'Geral',
          valor: Number(dados.valor) || 0,
          data: dados.data || new Date().toISOString().split('T')[0]
        });
      });
      // Ordena por data mais recente
      lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setGastos(lista);
    } catch (error) {
      console.error("Erro ao carregar gastos do Firestore:", error);
      setAvisoFeedback("Erro ao carregar despesas da base de dados.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarGastos();
  }, []);

  // Adicionar novo gasto no Firestore
  const adicionarGasto = async (novo: Gasto) => {
    try {
      const idDoc = `GASTO-${Date.now()}`;
      const gastoSanitizado = {
        id: idDoc,
        descricao: novo.descricao || 'Nova Despesa',
        categoria: novo.categoria || 'Geral',
        valor: Number(novo.valor) || 0,
        data: novo.data || new Date().toISOString().split('T')[0]
      };

      await setDoc(doc(db, 'gastos', idDoc), gastoSanitizado);
      setGastos([gastoSanitizado, ...gastos]);
      setModalAberto(false);
      setAvisoFeedback("Despesa registada com sucesso!");
      setTimeout(() => setAvisoFeedback(null), 4000);
    } catch (error) {
      console.error("Erro ao salvar gasto:", error);
      setAvisoFeedback("Erro ao guardar a despesa na base de dados.");
    }
  };

  // Excluir gasto do Firestore
  const excluirGasto = async (id: string) => {
    if (window.confirm("Deseja apagar este registo de gasto?")) {
      try {
        await deleteDoc(doc(db, 'gastos', id));
        setGastos(gastos.filter(g => g.id !== id));
        setAvisoFeedback("Despesa excluída com sucesso.");
        setTimeout(() => setAvisoFeedback(null), 4000);
      } catch (error) {
        console.error("Erro ao excluir gasto:", error);
        setAvisoFeedback("Não foi possível excluir a despesa.");
      }
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  return (
    <div className="container container-gastos">
      <div className="cabecalho">
        <h1>Controle de Gastos e Despesas</h1>
        
        {/* Botão visível para garantir o acesso à adição de despesas */}
        <button className="btn-novo" style={{ backgroundColor: '#ef4444' }} onClick={() => setModalAberto(true)}>
          + Nova Despesa
        </button>
      </div>

      {/* CAIXA DE AVISO / FEEDBACK ELEGANTE */}
      {avisoFeedback && (
        <div style={{ 
          backgroundColor: avisoFeedback.includes('Erro') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', 
          border: `1px solid ${avisoFeedback.includes('Erro') ? '#ef4444' : '#22c55e'}`, 
          color: avisoFeedback.includes('Erro') ? '#f87171' : '#4ade80', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px'
        }}>
          <span>{avisoFeedback.includes('Erro') ? '⚠️ ' : '✅ '} {avisoFeedback}</span>
          <button onClick={() => setAvisoFeedback(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}

      <div className="tabela-gastos">
        {carregando ? (
          <div style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>A carregar despesas do Firebase...</div>
        ) : gastos.length === 0 ? (
          <div style={{ padding: '32px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
            Nenhum gasto registado na base de dados.
          </div>
        ) : (
          gastos.map((gasto) => (
            <div key={gasto.id} className="gasto-item">
              <div className="gasto-info">
                <h3>{gasto.descricao}</h3>
                <p><strong>Categoria:</strong> {gasto.categoria} | <strong>Data:</strong> {gasto.data ? gasto.data.split('-').reverse().join('/') : ''}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span className="gasto-valor">{formatarMoeda(gasto.valor)}</span>
                <button className="btn-excluir" onClick={() => excluirGasto(gasto.id)}>✖</button>
              </div>
            </div>
          ))
        )}
      </div>

      <ModalGasto isOpen={modalAberto} onClose={() => setModalAberto(false)} onSave={adicionarGasto} />
    </div>
  );
}