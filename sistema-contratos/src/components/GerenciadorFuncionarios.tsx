import './GerenciadorFuncionarios.css';
import React, { useState, useEffect } from 'react';
import ModalFuncionario from './ModalFuncionario';
import ModalTrabalho from './ModalTrabalho';
import ModalPagamento from './ModalPagamento';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db } from '../firebase';

interface Trabalho {
  id: string;
  local: string;
  data: string;
  horario: string;
  valor: number;
  funcao?: string;
  statusExclusao?: 'pendente';
  statusAprovacao?: 'pendente' | 'aprovado';
}

interface Pagamento {
  id: string;
  data: string;
  valor: number;
  urlComprovante?: string | null;
  nomeArquivo?: string | null;
}

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  emailAcesso?: string;
  trabalhos: Trabalho[];
  pagamentos: Pagamento[];
}

interface GerenciadorFuncionariosProps {
  nivelAcesso?: string;
  usuarioEmail?: string | null;
}

export default function GerenciadorFuncionarios({ nivelAcesso, usuarioEmail }: GerenciadorFuncionariosProps) {
  const ehAdmin = nivelAcesso === 'Administrador';

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalFuncAberto, setModalFuncAberto] = useState(false);
  const [modalTrabAberto, setModalTrabAberto] = useState(false);
  const [modalPagAberto, setModalPagAberto] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);
  
  const [avisoFeedback, setAvisoFeedback] = useState<string | null>(null);

  // Estados para a modal de confirmação de senha do admin na exclusão de funcionário
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] = useState<Funcionario | null>(null);
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  const auth = getAuth();

  const buscarFuncionarios = async () => {
    setCarregando(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'funcionarios'));
      const lista: Funcionario[] = [];
      querySnapshot.forEach((docSnap) => {
        const dados = docSnap.data();
        lista.push({
          id: docSnap.id,
          nome: dados.nome || 'Sem Nome',
          cargo: dados.cargo || '',
          emailAcesso: dados.emailAcesso || '',
          trabalhos: dados.trabalhos || [],
          pagamentos: dados.pagamentos || []
        });
      });

      if (!ehAdmin && usuarioEmail) {
        const emailLimpo = usuarioEmail.trim().toLowerCase();
        const funcLogado = lista.find(f => f.emailAcesso && f.emailAcesso.trim().toLowerCase() === emailLimpo);
        if (funcLogado) {
          setFuncionarioSelecionado(funcLogado);
        }
      }

      setFuncionarios(lista);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarFuncionarios();
  }, [usuarioEmail]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const adicionarFuncionario = async (novo: any) => {
    if (!ehAdmin) return;
    try {
      const idDoc = `FUNC-${Date.now()}`;
      const funcionarioCompleto: Funcionario = { 
        ...novo, 
        id: idDoc, 
        emailAcesso: novo.emailAcesso || '',
        trabalhos: [],
        pagamentos: [] 
      };

      await setDoc(doc(db, 'funcionarios', idDoc), funcionarioCompleto);
      setFuncionarios(prev => [...prev, funcionarioCompleto]);
      setModalFuncAberto(false);
      setAvisoFeedback("Funcionário criado com sucesso!");
      setTimeout(() => setAvisoFeedback(null), 4000);
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error);
      setAvisoFeedback("Erro ao salvar funcionário na base de dados.");
    }
  };

  // Abre a modal de senha para exclusão segura
  const solicitarSenhaExclusaoFuncionario = (funcionario: Funcionario, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ehAdmin) return;
    setFuncionarioParaExcluir(funcionario);
    setSenhaAdmin('');
    setErroSenha('');
    setModalSenhaAberto(true);
  };

  // Confirma a palavra-passe do admin e executa a exclusão no Firebase
  const confirmarExclusaoFuncionarioComSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionarioParaExcluir || !auth.currentUser?.email) return;

    setExcluindo(true);
    setErroSenha('');

    try {
      await signInWithEmailAndPassword(auth, auth.currentUser.email, senhaAdmin);
      await deleteDoc(doc(db, 'funcionarios', funcionarioParaExcluir.id));
      
      setFuncionarios(prev => prev.filter(f => f.id !== funcionarioParaExcluir.id));
      if (funcionarioSelecionado?.id === funcionarioParaExcluir.id) setFuncionarioSelecionado(null);
      
      setModalSenhaAberto(false);
      setFuncionarioParaExcluir(null);
      setAvisoFeedback("Funcionário excluído com sucesso.");
      setTimeout(() => setAvisoFeedback(null), 4000);
    } catch (error) {
      console.error("Erro ao autenticar ou apagar funcionário:", error);
      setErroSenha('Palavra-passe incorreta ou erro ao processar a exclusão.');
    } finally {
      setExcluindo(false);
    }
  };

  const adicionarTrabalho = async (novoTrabalho: any) => {
    if (!funcionarioSelecionado) return;
    try {
      const trabalhoSanitizado: Trabalho = {
        ...novoTrabalho,
        statusAprovacao: ehAdmin ? 'aprovado' : 'pendente'
      };

      const novosTrabalhos = [...funcionarioSelecionado.trabalhos, trabalhoSanitizado];
      await updateDoc(doc(db, 'funcionarios', funcionarioSelecionado.id), {
        trabalhos: novosTrabalhos
      });

      const funcionarioAtualizado: Funcionario = { ...funcionarioSelecionado, trabalhos: novosTrabalhos };
      setFuncionarioSelecionado(funcionarioAtualizado);
      setFuncionarios(prev => prev.map(f => f.id === funcionarioAtualizado.id ? funcionarioAtualizado : f));
      setModalTrabAberto(false);
      
      setAvisoFeedback(ehAdmin ? "Trabalho adicionado com sucesso!" : "Trabalho solicitado! Aguardando aprovação do Administrador.");
      setTimeout(() => setAvisoFeedback(null), 4000);
    } catch (error) {
      console.error("Erro ao adicionar trabalho:", error);
      setAvisoFeedback("Erro ao guardar o trabalho.");
    }
  };

  const aprovarTrabalho = async (idItem: string) => {
    if (!ehAdmin || !funcionarioSelecionado) return;
    try {
      const trabalhosAtualizados = funcionarioSelecionado.trabalhos.map(t => 
        t.id === idItem ? { ...t, statusAprovacao: 'aprovado' as const } : t
      );
      
      await updateDoc(doc(db, 'funcionarios', funcionarioSelecionado.id), { trabalhos: trabalhosAtualizados });
      
      const funcionarioAtualizado: Funcionario = { ...funcionarioSelecionado, trabalhos: trabalhosAtualizados };
      setFuncionarioSelecionado(funcionarioAtualizado);
      setFuncionarios(prev => prev.map(f => f.id === funcionarioAtualizado.id ? funcionarioAtualizado : f));
      
      setAvisoFeedback("Trabalho aprovado com sucesso!");
      setTimeout(() => setAvisoFeedback(null), 4000);
    } catch (error) {
      console.error("Erro ao aprovar trabalho:", error);
      setAvisoFeedback("Erro ao aprovar trabalho.");
    }
  };

  const adicionarPagamento = async (novoPagamento: any) => {
    if (!ehAdmin || !funcionarioSelecionado) return;
    try {
      if (!novoPagamento.urlComprovante) {
        setAvisoFeedback("Aviso: Este pagamento foi lançado sem comprovante anexado.");
      } else {
        setAvisoFeedback("Pagamento lançado com sucesso!");
      }

      const pagamentoSanitizado: Pagamento = {
        id: novoPagamento.id || `PAG-${Date.now()}`,
        data: novoPagamento.data || new Date().toISOString().split('T')[0],
        valor: Number(novoPagamento.valor) || 0,
        urlComprovante: novoPagamento.urlComprovante || null,
        nomeArquivo: novoPagamento.nomeArquivo || null
      };

      const novosPagamentos = [...funcionarioSelecionado.pagamentos, pagamentoSanitizado];
      
      await updateDoc(doc(db, 'funcionarios', funcionarioSelecionado.id), {
        pagamentos: novosPagamentos
      });

      const funcionarioAtualizado: Funcionario = { ...funcionarioSelecionado, pagamentos: novosPagamentos };
      setFuncionarioSelecionado(funcionarioAtualizado);
      setFuncionarios(prev => prev.map(f => f.id === funcionarioAtualizado.id ? funcionarioAtualizado : f));
      setModalPagAberto(false);

      setTimeout(() => setAvisoFeedback(null), 5000);
    } catch (error) {
      console.error("Erro ao adicionar pagamento:", error);
      setAvisoFeedback("Erro ao guardar o pagamento.");
    }
  };

  const solicitarExclusaoTrabalho = async (idItem: string) => {
    if (!ehAdmin || !funcionarioSelecionado) return;
    if (window.confirm("Deseja solicitar a exclusão deste trabalho? O funcionário precisará aceitar no painel dele.")) {
      try {
        const trabalhosAtualizados = funcionarioSelecionado.trabalhos.map(t => 
          t.id === idItem ? { ...t, statusExclusao: 'pendente' as const } : t
        );
        
        await updateDoc(doc(db, 'funcionarios', funcionarioSelecionado.id), { trabalhos: trabalhosAtualizados });
        
        const funcionarioAtualizado: Funcionario = { ...funcionarioSelecionado, trabalhos: trabalhosAtualizados };
        setFuncionarioSelecionado(funcionarioAtualizado);
        setFuncionarios(prev => prev.map(f => f.id === funcionarioAtualizado.id ? funcionarioAtualizado : f));
        
        setAvisoFeedback("Solicitação de exclusão enviada. Aguardando aceite do funcionário.");
        setTimeout(() => setAvisoFeedback(null), 4000);
      } catch (error) {
        console.error("Erro ao solicitar exclusão:", error);
        setAvisoFeedback("Erro ao processar solicitação.");
      }
    }
  };

  const aceitarExclusaoTrabalho = async (idItem: string) => {
    if (!funcionarioSelecionado) return;
    if (window.confirm("Tem certeza que deseja aceitar a exclusão deste trabalho? Ele será removido permanentemente.")) {
      try {
        const novosTrabalhos = funcionarioSelecionado.trabalhos.filter(t => t.id !== idItem);
        
        await updateDoc(doc(db, 'funcionarios', funcionarioSelecionado.id), { 
          trabalhos: novosTrabalhos 
        });

        const funcionarioAtualizado: Funcionario = { ...funcionarioSelecionado, trabalhos: novosTrabalhos };
        setFuncionarioSelecionado(funcionarioAtualizado);
        setFuncionarios(prev => prev.map(f => f.id === funcionarioAtualizado.id ? funcionarioAtualizado : f));
        
        setAvisoFeedback("Exclusão aceita e trabalho removido com sucesso.");
        setTimeout(() => setAvisoFeedback(null), 4000);
      } catch (error) {
        console.error("Erro ao aceitar exclusão:", error);
        setAvisoFeedback("Erro ao remover o trabalho.");
      }
    }
  };

  const excluirPagamento = async (idItem: string) => {
    if (!ehAdmin || !funcionarioSelecionado) return;
    if (window.confirm("Deseja realmente excluir este pagamento?")) {
      try {
        const pagamentosAtualizados = funcionarioSelecionado.pagamentos.filter(p => p.id !== idItem);
        await updateDoc(doc(db, 'funcionarios', funcionarioSelecionado.id), { pagamentos: pagamentosAtualizados });
        
        const funcionarioAtualizado: Funcionario = { ...funcionarioSelecionado, pagamentos: pagamentosAtualizados };
        setFuncionarioSelecionado(funcionarioAtualizado);
        setFuncionarios(prev => prev.map(f => f.id === funcionarioAtualizado.id ? funcionarioAtualizado : f));
        
        setAvisoFeedback("Pagamento excluído com sucesso.");
        setTimeout(() => setAvisoFeedback(null), 4000);
      } catch (error) {
        console.error("Erro ao excluir pagamento:", error);
        setAvisoFeedback("Erro ao apagar pagamento.");
      }
    }
  };

  if (funcionarioSelecionado) {
    const totalTrabalhado = funcionarioSelecionado.trabalhos
      .filter(t => t.statusAprovacao !== 'pendente')
      .reduce((soma, t) => soma + t.valor, 0);

    const totalPago = funcionarioSelecionado.pagamentos.reduce((soma, p) => soma + p.valor, 0);
    const saldoPendente = totalTrabalhado - totalPago;

    return (
      <div className="container">
        <div className="cabecalho">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {ehAdmin && (
              <button className="btn-cancelar" onClick={() => setFuncionarioSelecionado(null)}>← Voltar</button>
            )}
            <h1>Extrato de {funcionarioSelecionado.nome}</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-novo" onClick={() => setModalTrabAberto(true)}>
              {ehAdmin ? '+ Trabalho' : '+ Solicitar Trabalho'}
            </button>
            {ehAdmin && (
              <button className="btn-novo" style={{ backgroundColor: '#22c55e' }} onClick={() => setModalPagAberto(true)}>+ Lançar Pagamento</button>
            )}
          </div>
        </div>

        {avisoFeedback && (
          <div style={{ 
            backgroundColor: avisoFeedback.includes('Aviso') || avisoFeedback.includes('Aguardando') ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)', 
            border: `1px solid ${avisoFeedback.includes('Aviso') || avisoFeedback.includes('Aguardando') ? '#eab308' : '#22c55e'}`, 
            color: avisoFeedback.includes('Aviso') || avisoFeedback.includes('Aguardando') ? '#facc15' : '#4ade80', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <span>{avisoFeedback.includes('Aviso') || avisoFeedback.includes('Aguardando') ? '⚠️ ' : '✅ '} {avisoFeedback}</span>
            <button onClick={() => setAvisoFeedback(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, backgroundColor: '#0a1645', padding: '20px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 8px 0' }}>Total Trabalhado</p>
            <h2 style={{ color: '#60a5fa', margin: 0 }}>{formatarMoeda(totalTrabalhado)}</h2>
          </div>
          <div style={{ flex: 1, backgroundColor: '#0a1645', padding: '20px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 8px 0' }}>Já Pago</p>
            <h2 style={{ color: '#22c55e', margin: 0 }}>{formatarMoeda(totalPago)}</h2>
          </div>
          <div style={{ flex: 1, backgroundColor: '#0a1645', padding: '20px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 8px 0' }}>Saldo a Pagar</p>
            <h2 style={{ color: saldoPendente > 0 ? '#ef4444' : '#e2e8f0', margin: 0 }}>
              {formatarMoeda(saldoPendente)}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#e2e8f0', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>Histórico de Trabalhos</h3>
            <div className="grade-funcionarios" style={{ gridTemplateColumns: '1fr' }}>
              {funcionarioSelecionado.trabalhos.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px' }}>Nenhum trabalho registado.</p>
              ) : (
                funcionarioSelecionado.trabalhos.map(t => {
                  const pendenteExclusao = t.statusExclusao === 'pendente';
                  const pendenteAprovacao = t.statusAprovacao === 'pendente';

                  let corBorda = '#60a5fa';
                  let fundoCartao = '#0a1645';

                  if (pendenteAprovacao) {
                    corBorda = '#8a735c';
                    fundoCartao = 'rgba(138, 115, 92, 0.08)';
                  } else if (pendenteExclusao) {
                    corBorda = '#f97316';
                    fundoCartao = 'rgba(249, 115, 22, 0.05)';
                  }

                  return (
                    <div 
                      key={t.id} 
                      className="cartao-funcionario" 
                      style={{ 
                        cursor: 'default', 
                        borderLeft: `4px solid ${corBorda}`,
                        backgroundColor: fundoCartao
                      }}
                    >
                      <div className="cartao-cabecalho">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h2 style={{ fontSize: '16px', lineHeight: '1.4' }}>{t.local}</h2>
                          {pendenteAprovacao && (
                            <span style={{ backgroundColor: '#8a735c', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              Aguardando Aprovação do Admin
                            </span>
                          )}
                          {pendenteExclusao && (
                            <span style={{ backgroundColor: '#f97316', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              Pendente de Exclusão
                            </span>
                          )}
                        </div>

                        {ehAdmin && !pendenteExclusao && !pendenteAprovacao && (
                          <button className="btn-excluir" onClick={() => solicitarExclusaoTrabalho(t.id)} title="Solicitar exclusão">✖</button>
                        )}
                      </div>

                      <div style={{ marginTop: '12px', color: '#cbd5e1', fontSize: '14px' }}>
                        <strong>Função:</strong> {t.funcao || 'Não especificada'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #1e293b', fontSize: '14px', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>
                          {t.data ? t.data.split('-').reverse().join('/') : ''} às {t.horario}
                        </span>
                        <span style={{ color: pendenteAprovacao ? '#a38f7d' : '#60a5fa', fontWeight: 'bold' }}>
                          + {formatarMoeda(t.valor)} {pendenteAprovacao && '(Pendente)'}
                        </span>
                      </div>

                      {ehAdmin && pendenteAprovacao && (
                        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #8a735c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#c2a891', fontSize: '12px', fontStyle: 'italic' }}>
                            Trabalho solicitado pelo funcionário.
                          </span>
                          <button 
                            onClick={() => aprovarTrabalho(t.id)}
                            style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            Aprovar Trabalho ✓
                          </button>
                        </div>
                      )}

                      {!ehAdmin && pendenteAprovacao && (
                        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #8a735c' }}>
                          <span style={{ color: '#c2a891', fontSize: '12px', fontStyle: 'italic' }}>
                            Aguardando a aprovação do Administrador.
                          </span>
                        </div>
                      )}

                      {pendenteExclusao && (
                        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f97316', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#f97316', fontSize: '12px', fontStyle: 'italic' }}>
                            {ehAdmin ? 'Aguardando o funcionário aceitar a exclusão.' : 'O admin solicitou a exclusão deste trabalho.'}
                          </span>
                          {!ehAdmin && (
                            <button 
                              onClick={() => aceitarExclusaoTrabalho(t.id)}
                              style={{ backgroundColor: '#f97316', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              Aceitar Exclusão ✓
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#e2e8f0', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>Pagamentos Efetuados</h3>
            <div className="grade-funcionarios" style={{ gridTemplateColumns: '1fr' }}>
              {funcionarioSelecionado.pagamentos.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px' }}>Nenhum pagamento efetuado.</p>
              ) : (
                funcionarioSelecionado.pagamentos.map(p => (
                  <div key={p.id} className="cartao-funcionario" style={{ cursor: 'default', borderLeft: '4px solid #22c55e' }}>
                    <div className="cartao-cabecalho">
                      <h2 style={{ fontSize: '16px', color: '#22c55e' }}>Pagamento Realizado</h2>
                      {ehAdmin && (
                        <button className="btn-excluir" onClick={() => excluirPagamento(p.id)}>✖</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '14px' }}>
                      <span style={{ color: '#94a3b8' }}>{p.data}</span>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{formatarMoeda(p.valor)}</span>
                    </div>
                    {p.urlComprovante && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
                        <button 
                          onClick={() => window.open(p.urlComprovante!, '_blank')}
                          style={{ background: 'transparent', border: '1px solid #22c55e', color: '#22c55e', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Ver Comprovante 📄
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <ModalTrabalho isOpen={modalTrabAberto} onClose={() => setModalTrabAberto(false)} onSave={adicionarTrabalho} />
        {ehAdmin && (
          <ModalPagamento isOpen={modalPagAberto} onClose={() => setModalPagAberto(false)} onSave={adicionarPagamento} nomeFuncionario={funcionarioSelecionado.nome} />
        )}
      </div>
    );
  }

  if (!ehAdmin) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ color: '#ef4444' }}>Acesso Restrito</h2>
        <p style={{ color: '#94a3b8' }}>Nenhum perfil de funcionário foi associado ao email <strong>{usuarioEmail}</strong>.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="cabecalho">
        <h1>Agenda de Trabalhos e Membros</h1>
        {ehAdmin && (
          <button className="btn-novo" onClick={() => setModalFuncAberto(true)}>+ Novo Funcionário</button>
        )}
      </div>

      {avisoFeedback && (
        <div style={{ 
          backgroundColor: 'rgba(34, 197, 94, 0.15)', 
          border: '1px solid #22c55e', 
          color: '#4ade80', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px'
        }}>
          <span>✅ {avisoFeedback}</span>
          <button onClick={() => setAvisoFeedback(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}

      <div className="grade-funcionarios">
        {carregando ? (
          <div style={{ color: '#94a3b8', padding: '24px', textAlign: 'center', gridColumn: '1 / -1' }}>A carregar funcionários do Firebase...</div>
        ) : funcionarios.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '24px', textAlign: 'center', gridColumn: '1 / -1' }}>Nenhum funcionário registado na base de dados.</div>
        ) : (
          funcionarios.map((funcionario) => {
            const trabalhado = funcionario.trabalhos
              .filter(t => t.statusAprovacao !== 'pendente')
              .reduce((s, t) => s + (t.valor || 0), 0);
            const pago = funcionario.pagamentos.reduce((s, p) => s + (p.valor || 0), 0);
            const saldo = trabalhado - pago;

            return (
              <div key={funcionario.id} className="cartao-funcionario cartao-clicavel" onClick={() => setFuncionarioSelecionado(funcionario)}>
                <div className="cartao-cabecalho">
                  <div className="info-funcionario">
                    <h2 className="nome-funcionario">{funcionario.nome}</h2>
                    <p className="cargo-funcionario">{funcionario.cargo}</p>
                    {funcionario.emailAcesso && (
                      <p style={{ color: '#38bdf8', fontSize: '12px', marginTop: '4px' }}>📧 {funcionario.emailAcesso}</p>
                    )}
                  </div>
                  {ehAdmin && (
                    <button className="btn-excluir" onClick={(e) => solicitarSenhaExclusaoFuncionario(funcionario, e)}>✖</button>
                  )}
                </div>
                
                <div style={{ marginTop: '16px', backgroundColor: '#0f1c4e', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Saldo a Pagar:</span>
                    <span style={{ color: saldo > 0 ? '#ef4444' : '#22c55e', fontWeight: 'bold', fontSize: '16px' }}>
                      {formatarMoeda(saldo)}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '16px', color: '#60a5fa', fontSize: '14px', fontWeight: 'bold', textAlign: 'right' }}>
                  Ver Extrato ➔
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL PARA CONFIRMAÇÃO DE SENHA NA EXCLUSÃO DE FUNCIONÁRIO */}
      {modalSenhaAberto && (
        <div className="modal-overlay">
          <div className="modal-conteudo">
            <h2>Confirmação de Segurança</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
              Para excluir o funcionário <strong>{funcionarioParaExcluir?.nome}</strong> e todos os seus registos, introduza a sua palavra-passe de Administrador.
            </p>

            {erroSenha && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{erroSenha}</div>}

            <form onSubmit={confirmarExclusaoFuncionarioComSenha}>
              <div className="form-grupo" style={{ marginBottom: '20px' }}>
                <label>Palavra-passe de Administrador</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={senhaAdmin} 
                  onChange={(e) => setSenhaAdmin(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div className="modal-acoes">
                <button 
                  type="button" 
                  className="btn-cancelar" 
                  onClick={() => setModalSenhaAberto(false)}
                  disabled={excluindo}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-salvar" 
                  style={{ backgroundColor: '#ef4444' }}
                  disabled={excluindo}
                >
                  {excluindo ? 'A verificar...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ModalFuncionario isOpen={modalFuncAberto} onClose={() => setModalFuncAberto(false)} onSave={adicionarFuncionario} />
    </div>
  );
}