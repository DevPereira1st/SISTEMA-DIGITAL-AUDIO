import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard'; 
import GerenciadorContratos from './components/GerenciadorContratos';
import GerenciadorFuncionarios from './components/GerenciadorFuncionarios';
import GerenciadorGastos from './components/GerenciadorGastos';
import GerenciadorUsuarios from './components/GerenciadorUsuarios';
import Login from './components/Login'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from './firebase'; 
import './App.css';


function App() {
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);
  const [nivelAcesso, setNivelAcesso] = useState<string>('Membro'); // Começa como Membro por segurança
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'contratos' | 'funcionarios' | 'gastos' | 'usuarios'>('dashboard');
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  // Monitoriza o login e busca o cargo exato (Admin/Membro) gravado na coleção "usuarios" do Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuarioLogado(user);
        
        try {
          // Vai buscar o documento do utilizador na coleção "usuarios" usando o UID do Firebase Auth
          const docRef = doc(db, 'usuarios', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const dados = docSnap.data();
            // Define o nível exatamente como foi configurado no painel ('Administrador' ou 'Membro')
            setNivelAcesso(dados.nivel || 'Membro');
          } else {
            // Se o utilizador logou mas não tem documento na coleção, assume Membro por segurança
            setNivelAcesso('Membro');
          }
        } catch (error) {
          console.error("Erro ao buscar permissões do utilizador:", error);
          setNivelAcesso('Membro');
        }

      } else {
        setUsuarioLogado(null);
        setNivelAcesso('Membro');
      }
      setCarregandoAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Proteção: Se o nível mudar para Membro e ele estiver numa aba restrita, joga para a agenda
  useEffect(() => {
    if (nivelAcesso === 'Membro' && abaAtiva !== 'funcionarios') {
      setAbaAtiva('funcionarios');
    }
  }, [nivelAcesso, abaAtiva]);

  const mudarAba = (aba: 'dashboard' | 'contratos' | 'funcionarios' | 'gastos' | 'usuarios') => {
    setAbaAtiva(aba);
    setMenuMobileAberto(false);
  };

  const fazerLogout = async () => {
    try {
      await signOut(auth);
      setUsuarioLogado(null);
      setNivelAcesso('Membro');
      setAbaAtiva('dashboard');
    } catch (error) {
      console.error("Erro ao terminar sessão:", error);
    }
  };

  if (carregandoAuth) {
    return <div style={{ backgroundColor: '#020b30', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>A carregar sistema...</div>;
  }

  if (!usuarioLogado) {
    return <Login />;
  }

  return (
    <div className="layout-principal">
      <button className="btn-hamburguer" onClick={() => setMenuMobileAberto(true)}>☰</button>

      {menuMobileAberto && <div className="overlay-menu" onClick={() => setMenuMobileAberto(false)}></div>}

      <aside className={`menu-lateral ${menuMobileAberto ? 'aberto' : ''}`}>
        <div className="menu-container">
          <div className="cabecalho-menu-mobile">
            <h2 className="menu-titulo">Digital Audio</h2>
            <button className="btn-fechar-menu" onClick={() => setMenuMobileAberto(false)}>✖</button>
          </div>
          
          <div style={{ padding: '0 8px 16px 8px', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #1e293b', marginBottom: '16px', wordBreak: 'break-all' }}>
            Logado como:<br/>
            <strong style={{ color: '#fff' }}>{usuarioLogado.email}</strong><br/>
            <span style={{ fontSize: '11px', color: nivelAcesso === 'Administrador' ? '#60a5fa' : '#94a3b8' }}>
              Cargo: {nivelAcesso}
            </span>
          </div>

          {nivelAcesso === 'Administrador' && (
            <>
              <button className={`aba-btn ${abaAtiva === 'dashboard' ? 'ativa' : ''}`} onClick={() => mudarAba('dashboard')}>📊 Visão Geral</button>
              <button className={`aba-btn ${abaAtiva === 'contratos' ? 'ativa' : ''}`} onClick={() => mudarAba('contratos')}>📋 Contratos</button>
            </>
          )}

          <button className={`aba-btn ${abaAtiva === 'funcionarios' ? 'ativa' : ''}`} onClick={() => mudarAba('funcionarios')}>
            {nivelAcesso === 'Administrador' ? '👥 Funcionários' : '📅 Agenda de Trabalhos'}
          </button>

          {nivelAcesso === 'Administrador' && (
            <>
              <button className={`aba-btn ${abaAtiva === 'gastos' ? 'ativa' : ''}`} onClick={() => mudarAba('gastos')}>💸 Gastos e Custos</button>
              <button className={`aba-btn ${abaAtiva === 'usuarios' ? 'ativa' : ''}`} onClick={() => mudarAba('usuarios')}>🛡️ Acessos e Logins</button>
            </>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
            <button onClick={fazerLogout} className="aba-btn" style={{ color: '#ef4444', borderLeft: 'none' }}>
              🚪 Sair do Sistema
            </button>
          </div>

        </div>
      </aside>

      <main className="conteudo-principal animacao-fade" key={abaAtiva}>
        {abaAtiva === 'dashboard' && nivelAcesso === 'Administrador' && <Dashboard />}
        {abaAtiva === 'contratos' && nivelAcesso === 'Administrador' && <GerenciadorContratos />}
        {abaAtiva === 'funcionarios' && <GerenciadorFuncionarios nivelAcesso={nivelAcesso} usuarioEmail={usuarioLogado?.email} />}
        {abaAtiva === 'gastos' && nivelAcesso === 'Administrador' && <GerenciadorGastos />}
        {abaAtiva === 'usuarios' && nivelAcesso === 'Administrador' && <GerenciadorUsuarios />}
      </main>
    </div>
  );
}

export default App;