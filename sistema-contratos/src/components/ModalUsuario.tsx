import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Certifique-se de que exporta o db e auth do seu firebase.ts
// Nota: Se precisar de manter a sessão do admin intacta ao criar outro utilizador, 
// o ideal é inicializar uma secondary app do Firebase, mas para simplificar, 
// vamos focar em registar no Firestore e Auth de forma direta.

interface ModalUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (novoUsuario: any) => void;
}

export default function ModalUsuario({ isOpen, onClose, onSave }: ModalUsuarioProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nivel, setNivel] = useState('Membro');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const lidarComEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      // 1. Cria a conta de autenticação no Firebase Auth
      const credenciais = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = credenciais.user.uid;

      const dadosUsuario = {
        id: uid,
        nome,
        email,
        nivel,
        dataCriacao: new Date().toISOString().split('T')[0]
      };

      // 2. Salva o nível de acesso e dados na coleção "usuarios" do Firestore usando o UID exato
      await setDoc(doc(db, 'usuarios', uid), dadosUsuario);

      // 3. Devolve para o componente pai atualizar a lista visual
      onSave(dadosUsuario);

      // Limpa os campos
      setNome(''); 
      setEmail(''); 
      setSenha(''); 
      setNivel('Membro');
      onClose();

    } catch (err: any) {
      console.error("Erro ao criar utilizador:", err);
      setErro(err.message || 'Erro ao criar utilizador. Verifique os dados.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo">
        <h2>Criar Novo Acesso (Firebase)</h2>
        
        {erro && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{erro}</div>}

        <form onSubmit={lidarComEnvio}>
          
          <div className="form-grupo">
            <label>Nome Completo</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Diego Pereira" />
          </div>

          <div className="form-grupo">
            <label>Email de Login</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex: membro@digitalaudio.com" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-grupo">
              <label>Palavra-passe</label>
              <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            
            <div className="form-grupo">
              <label>Nível de Acesso</label>
              <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
                <option value="Membro">Membro (Acesso Restrito)</option>
                <option value="Administrador">Administrador (Acesso Total)</option>
              </select>
            </div>
          </div>

          <div className="modal-acoes">
            <button type="button" className="btn-cancelar" onClick={onClose} disabled={carregando}>Cancelar</button>
            <button type="submit" className="btn-salvar" style={{ backgroundColor: '#8b5cf6' }} disabled={carregando}>
              {carregando ? 'A criar...' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}