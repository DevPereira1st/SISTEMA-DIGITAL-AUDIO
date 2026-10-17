import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [carregandoRecuperacao, setCarregandoRecuperacao] = useState(false);

  const lidarComLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setErro('Credenciais inválidas. Verifique o seu email e palavra-passe.');
    }
  };

  const recuperarSenha = async () => {
    setErro('');
    setMensagemSucesso('');

    if (!email) {
      setErro('Por favor, preencha o campo de e-mail primeiro para recuperar a palavra-passe.');
      return;
    }

    setCarregandoRecuperacao(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMensagemSucesso('E-mail de recuperação enviado! Verifique a sua caixa de entrada e/ou spam.');
    } catch (error: any) {
      console.error("Erro ao enviar email de recuperação:", error);
      if (error.code === 'auth/user-not-found') {
        setErro('Não existe nenhuma conta associada a este e-mail.');
      } else {
        setErro('Erro ao enviar o e-mail de recuperação. Tente novamente.');
      }
    } finally {
      setCarregandoRecuperacao(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-cartao">
        <h1>Acesso Administrativo</h1>
        
        {erro && <div className="erro-mensagem" style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{erro}</div>}
        {mensagemSucesso && <div style={{ color: '#22c55e', marginBottom: '16px', fontSize: '14px' }}>{mensagemSucesso}</div>}

        <form onSubmit={lidarComLogin}>
          <div className="login-grupo" style={{ marginBottom: '16px' }}>
            <label>Email</label>
            <input 
              type="email" 
              placeholder="admin@loja.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div className="login-grupo" style={{ marginBottom: '24px' }}>
            <label>Palavra-passe</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" className="btn-entrar" style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '6px' }}>
            Entrar no Sistema
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={recuperarSenha} 
            disabled={carregandoRecuperacao}
            style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
          >
            {carregandoRecuperacao ? 'A enviar...' : 'Esqueceu-se da palavra-passe?'}
          </button>
        </div>
      </div>
    </div>
  );
}