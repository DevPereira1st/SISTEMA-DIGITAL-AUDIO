import { useEffect, useState } from 'react';
import './Dashboard.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const [totalReceitas, setTotalReceitas] = useState(0);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [totalGastosFuncionarios, setTotalGastosFuncionarios] = useState(0);
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  
  // Estados para o Mês Vigente (Pizza)
  const [dadosPizzaMesAtual, setDadosPizzaMesAtual] = useState<any[]>([]);
  const [nomeMesAtual, setNomeMesAtual] = useState('');

  useEffect(() => {
    async function carregarDadosFinanceiros() {
      try {
        const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const mesesNomesCurto = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        const hoje = new Date();
        const mesAtualIdx = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        setNomeMesAtual(`${mesesNomes[mesAtualIdx]} de ${anoAtual}`);

        const dadosMensais: { [key: string]: { receita: number, despesa: number, funcionarios: number } } = {};

        for (let i = 5; i >= 0; i--) {
          const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
          const chave = `${mesesNomesCurto[d.getMonth()]} ${d.getFullYear()}`;
          dadosMensais[chave] = { receita: 0, despesa: 0, funcionarios: 0 };
        }

        // 1. Calcular Receitas (Contratos do Firestore)
        let receitaTotal = 0;
        let receitaMesAtual = 0;

        try {
          const contratosSnap = await getDocs(collection(db, 'contratos'));
          contratosSnap.forEach((docSnap) => {
            const c = docSnap.data();
            const valorContrato = Number(c.valorTotal) || 0;
            receitaTotal += valorContrato;

            if (c.data) {
              let dataContrato: Date;
              if (c.data.includes('-')) {
                const [ano, mes] = c.data.split('-');
                dataContrato = new Date(parseInt(ano), parseInt(mes) - 1, 1);
              } else {
                dataContrato = new Date(c.data);
              }
              
              if (!isNaN(dataContrato.getTime())) {
                const chave = `${mesesNomesCurto[dataContrato.getMonth()]} ${dataContrato.getFullYear()}`;
                if (dadosMensais[chave]) {
                  dadosMensais[chave].receita += valorContrato;
                }

                // Verifica se é o mês vigente
                if (dataContrato.getMonth() === mesAtualIdx && dataContrato.getFullYear() === anoAtual) {
                  receitaMesAtual += valorContrato;
                }
              }
            }
          });
        } catch (err) {
          console.error("Erro ao buscar contratos:", err);
        }
        setTotalReceitas(receitaTotal);

        // 2. Buscar Funcionários e Pagamentos
        let totalFuncionariosGeral = 0;
        let funcionariosMesAtual = 0;

        try {
          const funcionariosSnap = await getDocs(collection(db, 'funcionarios'));
          funcionariosSnap.forEach((docSnap) => {
            const dados = docSnap.data();
            const listaItens = [...(dados.pagamentos || []), ...(dados.trabalhos || [])];

            listaItens.forEach((item: any) => {
              const valorItem = Number(item.valor) || 0;
              totalFuncionariosGeral += valorItem;

              if (item.data) {
                let dataItem: Date;
                if (item.data.includes('-')) {
                  const [ano, mes] = item.data.split('-');
                  dataItem = new Date(parseInt(ano), parseInt(mes) - 1, 1);
                } else {
                  dataItem = new Date(item.data);
                }

                if (!isNaN(dataItem.getTime())) {
                  const chave = `${mesesNomesCurto[dataItem.getMonth()]} ${dataItem.getFullYear()}`;
                  if (dadosMensais[chave]) {
                    dadosMensais[chave].funcionarios += valorItem;
                  } else {
                    const primeiraChave = Object.keys(dadosMensais)[0];
                    if (primeiraChave) dadosMensais[primeiraChave].funcionarios += valorItem;
                  }

                  if (dataItem.getMonth() === mesAtualIdx && dataItem.getFullYear() === anoAtual) {
                    funcionariosMesAtual += valorItem;
                  }
                }
              } else {
                const primeiraChave = Object.keys(dadosMensais)[0];
                if (primeiraChave) dadosMensais[primeiraChave].funcionarios += valorItem;
              }
            });
          });
        } catch (err) {
          console.error("Erro ao buscar funcionários:", err);
        }
        setTotalGastosFuncionarios(totalFuncionariosGeral);

        // 3. Calcular Gastos Gerais
        let despesasGeraisTotal = 0;
        let despesasGeraisMesAtual = 0;

        try {
          const gastosSnap = await getDocs(collection(db, 'gastos'));
          gastosSnap.forEach((docSnap) => {
            const g = docSnap.data();
            const valorGasto = Number(g.valor) || 0;
            despesasGeraisTotal += valorGasto;

            if (g.data) {
              let dataGasto: Date;
              if (g.data.includes('-')) {
                const [ano, mes] = g.data.split('-');
                dataGasto = new Date(parseInt(ano), parseInt(mes) - 1, 1);
              } else {
                dataGasto = new Date(g.data);
              }

              if (!isNaN(dataGasto.getTime())) {
                const chave = `${mesesNomesCurto[dataGasto.getMonth()]} ${dataGasto.getFullYear()}`;
                if (dadosMensais[chave]) {
                  dadosMensais[chave].despesa += valorGasto;
                }

                if (dataGasto.getMonth() === mesAtualIdx && dataGasto.getFullYear() === anoAtual) {
                  despesasGeraisMesAtual += valorGasto;
                }
              }
            }
          });
        } catch (err) {
          console.error("Erro ao buscar gastos:", err);
        }

        setTotalDespesas(despesasGeraisTotal + totalFuncionariosGeral);

        // 4. Formatar dados para o Gráfico de Barras (6 Meses)
        const formatoGrafico = Object.keys(dadosMensais).map(chave => ({
          name: chave,
          Faturamento: dadosMensais[chave].receita,
          Funcionarios: dadosMensais[chave].funcionarios,
          DespesasGerais: dadosMensais[chave].despesa,
          Lucro: dadosMensais[chave].receita - (dadosMensais[chave].despesa + dadosMensais[chave].funcionarios)
        }));
        setDadosGrafico(formatoGrafico);

        // 5. Formatar dados para o Gráfico de Pizza (Mês Vigente)
        const lucroLiquidoMesAtual = receitaMesAtual - (despesasGeraisMesAtual + funcionariosMesAtual);
        
        setDadosPizzaMesAtual([
          { name: 'Faturamento Bruto', value: receitaMesAtual, color: '#3b82f6' },
          { name: 'Funcionários', value: funcionariosMesAtual, color: '#8b5cf6' },
          { name: 'Despesas Gerais', value: despesasGeraisMesAtual, color: '#ef4444' },
          { name: 'Lucro Líquido', value: lucroLiquidoMesAtual > 0 ? lucroLiquidoMesAtual : 0, color: '#22c55e' }
        ]);

      } catch (e) {
        console.error("Erro ao carregar dados financeiros:", e);
      }
    }

    carregarDadosFinanceiros();
  }, []);
  
  const lucroLiquido = totalReceitas - totalDespesas;

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const formatarTooltip = (value: any) => {
    return [formatarMoeda(Number(value) || 0), ""];
  };

  return (
    <div className="dashboard-container">
      
      <div className="logo-container">
        <span className="logo-texto">Digital Audio</span>
      </div>

      <div className="cabecalho" style={{ marginBottom: '0' }}>
        <h1>Visão Geral do Negócio</h1>
      </div>

      {/* Cartões de Resumo */}
      <div className="cards-resumo">
        <div className="card-financeiro">
          <p>Faturamento Bruto Total</p>
          <h2 className="valor-receita">{formatarMoeda(totalReceitas)}</h2>
        </div>

        <div className="card-financeiro" style={{ borderColor: '#8b5cf6' }}>
          <p>Gastos com Funcionários</p>
          <h2 style={{ color: '#8b5cf6' }}>{formatarMoeda(totalGastosFuncionarios)}</h2>
        </div>

        <div className="card-financeiro" style={{ borderColor: lucroLiquido >= 0 ? '#22c55e' : '#ef4444' }}>
          <p>Lucro Líquido Geral</p>
          <h2 className={lucroLiquido >= 0 ? "valor-lucro" : "valor-despesa"}>
            {formatarMoeda(lucroLiquido)}
          </h2>
        </div>
      </div>

      {/* SEÇÃO DOS GRÁFICOS (Lado a lado ou empilhados responsivos) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
        
        {/* GRÁFICO DE BARRAS (Últimos 6 Meses) */}
        <div style={{ backgroundColor: '#0a1645', padding: '24px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '24px', marginTop: 0 }}>Desempenho Financeiro (Últimos 6 Meses)</h3>
          
          <div className="grafico-responsivo-wrapper">
            <div className="grafico-min-width" style={{ width: '100%', height: 330 }}>
            <ResponsiveContainer>
              <BarChart
                data={dadosGrafico}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={formatarTooltip} 
                  contentStyle={{ backgroundColor: '#0f1c4e', borderColor: '#1e293b', color: '#fff' }} 
                />
                <Legend />
                <ReferenceLine y={0} stroke="#475569" />
                
                <Bar dataKey="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Funcionarios" fill="#8b5cf6" name="Funcionários" radius={[4, 4, 0, 0]} />
                <Bar dataKey="DespesasGerais" fill="#ef4444" name="Despesas Gerais" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GRÁFICO DE PIZA (Mês Vigente) */}
        <div style={{ backgroundColor: '#c483006e', padding: '24px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '8px', marginTop: 0 }}>Balanço do Mês Vigente</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: 0, marginBottom: '16px' }}>{nomeMesAtual}</p>
          
          <div style={{ width: '100%', height: 310, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Tooltip 
                  formatter={formatarTooltip} 
                  contentStyle={{ backgroundColor: '#0f1c4e', borderColor: '#1e293b', color: '#fff' }} 
                />
                <Legend />
              <Pie
                  data={dadosPizzaMesAtual}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                >
                  {dadosPizzaMesAtual.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}