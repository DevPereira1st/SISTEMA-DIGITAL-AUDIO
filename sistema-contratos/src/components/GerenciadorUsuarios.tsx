import { useState, useEffect } from 'react';
import ModalUsuario from './ModalUsuario';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db } from '../firebase';
import './GerenciadorUsuarios.css';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  nivel: string;
  dataCriacao: string;
}

export default function GerenciadorUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  // Estados para o modal de confirmação de senha do admin
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<Usuario | null>(null);
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  const auth = getAuth();

  const buscarUsuarios = async () => {
    setCarregando(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const lista: Usuario[] = [];
      querySnapshot.forEach((docSnap) => {
        const dados = docSnap.data();
        lista.push({
          id: docSnap.id,
          nome: dados.nome || 'Sem Nome',
          email: dados.email,
          nivel: dados.nivel || 'Membro',
          dataCriacao: dados.dataCriacao || ''
        });
      });
      setUsuarios(lista);
    } catch (error) {
      console.error("Erro ao carregar utilizadores do Firestore:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const handleUsuarioSalvo = () => {
    setModalAberto(false);
    buscarUsuarios();
  };

// 1. Abre a janela de confirmação de senha com validação de segurança do último Admin
  const solicitarSenhaExclusao = (user: Usuario) => {
    // Verifica se o usuário que está a ser excluído é Administrador
    if (user.nivel === 'Administrador') {
      // Conta quantos administradores existem no total na lista
      const totalAdministradores = usuarios.filter(u => u.nivel === 'Administrador').length;
      
      if (totalAdministradores <= 1) {
        alert("Ação bloqueada de segurança: Não é permitido excluir o único Administrador restante no sistema.");
        return;
      }
    }

    setUsuarioParaExcluir(user);
    setSenhaAdmin('');
    setErroSenha('');
    setModalSenhaAberto(true);
  };

  // 2. Confirma a senha do admin no Firebase e executa a exclusão
  const confirmarExclusaoComSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaExcluir || !auth.currentUser?.email) return;

    setExcluindo(true);
    setErroSenha('');

    try {
      // Reautentica o administrador atual usando a palavra-passe introduzida
      await signInWithEmailAndPassword(auth, auth.currentUser.email, senhaAdmin);

      // Se a senha estiver correta, apaga o documento do Firestore
      await deleteDoc(doc(db, 'usuarios', usuarioParaExcluir.id));

      setUsuarios(usuarios.filter(u => u.id !== usuarioParaExcluir.id));
      setModalSenhaAberto(false);
      setUsuarioParaExcluir(null);
    } catch (error) {
      console.error("Erro ao autenticar ou apagar utilizador:", error);
      setErroSenha('Palavra-passe incorreta ou erro ao processar a exclusão.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="container container-usuarios">
      <div className="cabecalho-usuarios">
        <div>
          <h1>Gestão de Acessos (Firebase)</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Gerencie quem pode entrar e modificar os dados do sistema em tempo real.</p>
        </div>
        <button className="btn-novo" style={{ backgroundColor: '#8b5cf6' }} onClick={() => setModalAberto(true)}>
          + Novo Usuário
        </button>
      </div>

      <div className="lista-usuarios">
        {carregando ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>A carregar utilizadores...</div>
        ) : usuarios.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Nenhum utilizador encontrado no banco de dados.</div>
        ) : (
          usuarios.map((user) => (
            <div key={user.id} className="item-usuario">
              
              <div className="info-usuario">
                <div 
                  className="avatar-usuario" 
                  style={{ backgroundColor: user.nivel === 'Administrador' ? '#3b82f6' : '#475569' }}
                >
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div className="texto-usuario">
                  <h3>{user.nome}</h3>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="acoes-usuario">
                <span style={{ 
                  padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                  backgroundColor: user.nivel === 'Administrador' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                  color: user.nivel === 'Administrador' ? '#60a5fa' : '#94a3b8'
                }}>
                  {user.nivel}
                </span>
                
                <button 
                  onClick={() => solicitarSenhaExclusao(user)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer' }}
                  title="Remover acesso"
                >
                  ✖
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL PARA CONFIRMAÇÃO DE SENHA DO ADMINISTRADOR */}
      {modalSenhaAberto && (
        <div className="modal-overlay">
          <div className="modal-conteudo">
            <h2>Confirmação de Segurança</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
              Para remover o acesso de <strong>{usuarioParaExcluir?.nome}</strong>, introduza a sua palavra-passe de Administrador.
            </p>

            {erroSenha && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{erroSenha}</div>}

            <form onSubmit={confirmarExclusaoComSenha}>
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

      <ModalUsuario isOpen={modalAberto} onClose={() => setModalAberto(false)} onSave={handleUsuarioSalvo} />
    </div>
  );
}