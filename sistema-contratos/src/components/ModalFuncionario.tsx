import React, { useState } from 'react';
import './ModalFuncionario.css';

interface ModalFuncionarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (novoFuncionario: any) => void;
}

export default function ModalFuncionario({ isOpen, onClose, onSave }: ModalFuncionarioProps) {
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [emailAcesso, setEmailAcesso] = useState('');

  if (!isOpen) return null;

  const lidarComEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nome,
      cargo,
      emailAcesso: emailAcesso.trim().toLowerCase()
    });
    setNome('');
    setCargo('');
    setEmailAcesso('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conteudo">
        <h2>Adicionar Novo Funcionário / Membro</h2>
        <form onSubmit={lidarComEnvio}>
          <div className="form-grupo">
            <label>Nome Completo</label>
            <input type="text" required placeholder="Ex: Carlos Silva" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="form-grupo">
            <label>Cargo / Função</label>
            <input type="text" required placeholder="Ex: Operador de Som" value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </div>
          <div className="form-grupo">
            <label>E-mail de Acesso (Conta Membro)</label>
            <input type="email" placeholder="funcionario@digitalaudio.com" value={emailAcesso} onChange={(e) => setEmailAcesso(e.target.value)} />
            <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              Associe aqui o e-mail que este funcionário usará para fazer login e ver apenas o seu extrato.
            </small>
          </div>
          <div className="modal-acoes">
            <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-salvar">Salvar Funcionário</button>
          </div>
        </form>
      </div>
    </div>
  );
}