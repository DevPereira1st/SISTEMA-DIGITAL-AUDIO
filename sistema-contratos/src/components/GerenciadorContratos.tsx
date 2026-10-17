import './GerenciadorContratos.css';
import { useState, useEffect } from 'react';
import ModalContrato from './ModalContrato';
import { jsPDF } from 'jspdf';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Contrato {
  id: string;
  contratante?: string;
  empresa?: string;
  local: string;
  data: string;
  horario: string;
  valorTotal: number;
  itensMarcados: string[];
}

interface GerenciadorContratosProps {
  nivelAcesso?: string;
}

export default function GerenciadorContratos({ nivelAcesso }: GerenciadorContratosProps) {
  const ehAdmin = nivelAcesso ? nivelAcesso === 'Administrador' : true;

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [avisoFeedback, setAvisoFeedback] = useState<string | null>(null);

  // Buscar contratos diretamente do Firestore
  const buscarContratos = async () => {
    setCarregando(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'contratos'));
      const lista: Contrato[] = [];
      querySnapshot.forEach((docSnap) => {
        const dados = docSnap.data();
        lista.push({
          id: docSnap.id,
          contratante: dados.contratante || '',
          empresa: dados.empresa || '',
          local: dados.local || 'Local não informado',
          data: dados.data || new Date().toISOString().split('T')[0],
          horario: dados.horario || '00:00',
          valorTotal: Number(dados.valorTotal) || 0,
          itensMarcados: dados.itensMarcados || []
        });
      });
      setContratos(lista);
    } catch (error) {
      console.error("Erro ao carregar contratos do Firestore:", error);
      setAvisoFeedback("Erro ao carregar contratos da base de dados.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarContratos();
  }, []);

  // Função Auxiliar para formatar em Reais
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  // Adicionar contrato no Firestore
  const adicionarContrato = async (novoContrato: Contrato) => {
    try {
      const idDoc = novoContrato.id || `CTR-${Date.now()}`;
      const contratoSanitizado = {
        id: idDoc,
        contratante: novoContrato.contratante || '',
        empresa: novoContrato.empresa || '',
        local: novoContrato.local || 'Local não informado',
        data: novoContrato.data || new Date().toISOString().split('T')[0],
        horario: novoContrato.horario || '00:00',
        valorTotal: Number(novoContrato.valorTotal) || 0,
        itensMarcados: novoContrato.itensMarcados || []
      };

      await setDoc(doc(db, 'contratos', idDoc), contratoSanitizado);
      setContratos([...contratos, contratoSanitizado]);
      setModalAberto(false);
      setAvisoFeedback("Contrato registado com sucesso!");
      setTimeout(() => setAvisoFeedback(null), 4000);
    } catch (error) {
      console.error("Erro ao salvar contrato:", error);
      setAvisoFeedback("Erro ao guardar o contrato na base de dados.");
    }
  };

  // Excluir contrato do Firestore
  const excluirContrato = async (idParaExcluir: string) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir este contrato?");
    if (confirmar) {
      try {
        await deleteDoc(doc(db, 'contratos', idParaExcluir));
        setContratos(contratos.filter(contrato => contrato.id !== idParaExcluir));
        setAvisoFeedback("Contrato excluído com sucesso.");
        setTimeout(() => setAvisoFeedback(null), 4000);
      } catch (error) {
        console.error("Erro ao excluir contrato:", error);
        setAvisoFeedback("Não foi possível excluir o contrato.");
      }
    }
  };

  const gerarPDF = (contrato: Contrato) => {
    const docPdf = new jsPDF();
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(22);
    docPdf.text('Resumo do Contrato de Prestação de Serviço', 20, 30);
    
    docPdf.setFontSize(14);
    docPdf.setFont('helvetica', 'normal');
    const nomeEmpresa = contrato.empresa || 'Digital Audio'; 
    const nomeContratante = contrato.contratante || 'Não informado'; 

    docPdf.text(`Empresa Executante: ${nomeEmpresa}`, 20, 50);
    docPdf.text(`Contratante: ${nomeContratante}`, 20, 60);

    docPdf.setFont('helvetica', 'bold');
    docPdf.text('Detalhes do Evento', 20, 80);
    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(12);
    docPdf.text(`ID do Contrato: #${contrato.id}`, 20, 90);
    docPdf.text(`Local: ${contrato.local}`, 20, 100);
    docPdf.text(`Data: ${contrato.data}`, 20, 110);
    docPdf.text(`Horário de Início: ${contrato.horario}`, 20, 120);

    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`Valor Fechado: R$ ${contrato.valorTotal.toFixed(2)}`, 20, 135);

    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(14);
    docPdf.text('Equipamentos e Serviços Inclusos:', 20, 155);
    
    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(12);
    let yPos = 165;
    
    if (contrato.itensMarcados.length === 0) {
      docPdf.text('Nenhum item adicional selecionado.', 20, yPos);
    } else {
      contrato.itensMarcados.forEach((item) => {
        docPdf.text(`- ${item}`, 20, yPos);
        yPos += 8;
      });
    }

    docPdf.setFont('helvetica', 'italic');
    docPdf.setFontSize(10);
    docPdf.text(`Documento gerado pelo sistema de gestão da ${nomeEmpresa}.`, 20, 280);
    docPdf.save(`Resumo_Contrato_${contrato.id}.pdf`);
  };

  const obterDataDoContrato = (dataStr: string, horarioStr: string) => {
    if (!dataStr) return new Date(0); 
    const [ano, mes, dia] = dataStr.split('-');
    let hora = 0, minuto = 0;
    if (horarioStr) {
      const [h, m] = horarioStr.split(':');
      hora = parseInt(h, 10);
      minuto = parseInt(m, 10);
    }
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), hora, minuto);
  };

  const agora = new Date();

  const contratosOrdenados = [...contratos].sort((a, b) => {
    const dataA = obterDataDoContrato(a.data, a.horario);
    const dataB = obterDataDoContrato(b.data, b.horario);
    const passouA = dataA < agora;
    const passouB = dataB < agora;

    if (!passouA && passouB) return -1; 
    if (passouA && !passouB) return 1;  
    if (!passouA && !passouB) return dataA.getTime() - dataB.getTime();
    return dataB.getTime() - dataA.getTime();
  });

  return (
    <div className="container">
      <div className="cabecalho">
        <h1>Gerenciamento de Contratos</h1>
        {ehAdmin && (
          <button className="btn-novo" onClick={() => setModalAberto(true)}>
            + Novo Contrato
          </button>
        )}
      </div>

      {/* CAIXA DE AVISO / FEEDBACK */}
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

      <div className="grade-contratos">
        {carregando ? (
          <div style={{ color: '#94a3b8', padding: '24px', textAlign: 'center', gridColumn: '1 / -1' }}>A carregar contratos do Firebase...</div>
        ) : contratosOrdenados.length === 0 ? (
          <div style={{ color: '#94a3b8', fontStyle: 'italic', gridColumn: '1 / -1' }}>
            Nenhum contrato registado na base de dados. Clique em "+ Novo Contrato" para começar.
          </div>
        ) : (
          contratosOrdenados.map((contrato) => {
            const dataContrato = obterDataDoContrato(contrato.data, contrato.horario);
            const jaPassou = dataContrato < agora;

            return (
              <div key={contrato.id} className={`cartao ${jaPassou ? 'contrato-passado' : ''}`}>
                
                <div className="cartao-cabecalho">
                  <h2>
                    {contrato.local} 
                    {jaPassou && <span className="etiqueta-concluido">Concluído</span>}
                  </h2>
                  <div className="acoes-cabecalho">
                    <span className="id-contrato">#{contrato.id}</span>
                    {ehAdmin && (
                      <button className="btn-excluir" onClick={() => excluirContrato(contrato.id)}>✖</button>
                    )}
                  </div>
                </div>

                <div className="info-basica">
                  <p><strong>Contratante:</strong> {contrato.contratante || 'Não informado'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span><strong>Data:</strong> {contrato.data ? contrato.data.split('-').reverse().join('/') : ''}</span>
                    <span><strong>Hora:</strong> {contrato.horario}</span>
                  </div>
                  {/* EXIBIÇÃO DO VALOR DO CONTRATO NO CARTÃO */}
                  <div style={{ marginTop: '12px', padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', border: '1px dashed #3b82f6' }}>
                    <p style={{ margin: 0, color: '#60a5fa', fontWeight: 'bold' }}>Valor: {formatarMoeda(contrato.valorTotal)}</p>
                  </div>
                </div>

                <div className="sessao-itens">
                  <p className="titulo-itens">Itens Inclusos:</p>
                  <div className="etiquetas">
                    {contrato.itensMarcados.map((item, index) => (
                      <span key={index} className="etiqueta">✓ {item}</span>
                    ))}
                  </div>
                </div>

                <div className="rodape-cartao" style={{ justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => gerarPDF(contrato)}
                    className="btn-download ativo"
                  >
                    Gerar PDF 📄
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ModalContrato isOpen={modalAberto} onClose={() => setModalAberto(false)} onSave={adicionarContrato} />
    </div>
  );
}