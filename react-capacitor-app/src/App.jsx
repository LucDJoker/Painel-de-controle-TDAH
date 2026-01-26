import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle, Circle, Clock, Brain } from 'lucide-react'
import './App.css'

function App() {
  const [tarefas, setTarefas] = useState([])
  const [novaTarefa, setNovaTarefa] = useState('')
  const [textoIA, setTextoIA] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // Carregar tarefas do localStorage
  useEffect(() => {
    const tarefasSalvas = localStorage.getItem('tarefas')
    if (tarefasSalvas) {
      setTarefas(JSON.parse(tarefasSalvas))
    }
  }, [])

  // Salvar tarefas no localStorage
  useEffect(() => {
    localStorage.setItem('tarefas', JSON.stringify(tarefas))
  }, [tarefas])

  const adicionarTarefa = () => {
    if (novaTarefa.trim()) {
      const tarefa = {
        id: Date.now(),
        titulo: novaTarefa,
        concluida: false,
        data: new Date().toLocaleDateString('pt-BR')
      }
      setTarefas([...tarefas, tarefa])
      setNovaTarefa('')
    }
  }

  const toggleTarefa = (id) => {
    setTarefas(tarefas.map(tarefa =>
      tarefa.id === id ? { ...tarefa, concluida: !tarefa.concluida } : tarefa
    ))
  }

  const removerTarefa = (id) => {
    setTarefas(tarefas.filter(tarefa => tarefa.id !== id))
  }

  const processarTextoIA = async () => {
    if (!textoIA.trim()) return

    setCarregando(true)
    setErro('')

    try {
      const response = await fetch('https://painel-de-controle-tdah-6oo2.vercel.app/api/processar-texto-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texto: textoIA })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.tarefas && data.tarefas.length > 0) {
        const novasTarefas = data.tarefas.map((titulo, index) => ({
          id: Date.now() + index,
          titulo,
          concluida: false,
          data: new Date().toLocaleDateString('pt-BR')
        }))
        
        setTarefas([...tarefas, ...novasTarefas])
        setTextoIA('')
        setErro('')
      }
    } catch (error) {
      console.error('Erro na API:', error)
      setErro('Falha ao processar o texto com a IA. Verifique sua conexão.')
    } finally {
      setCarregando(false)
    }
  }

  const tarefasHoje = tarefas.filter(tarefa => 
    tarefa.data === new Date().toLocaleDateString('pt-BR')
  )

  const tarefasPendentes = tarefasHoje.filter(tarefa => !tarefa.concluida)
  const tarefasConcluidas = tarefasHoje.filter(tarefa => tarefa.concluida)

  return (
    <div className="app">
      <header className="header">
        <h1>Focus ERP</h1>
        <div className="stats">
          <div className="stat">
            <Clock size={20} />
            <span>{tarefasPendentes.length} pendentes</span>
          </div>
          <div className="stat">
            <CheckCircle size={20} />
            <span>{tarefasConcluidas.length} concluídas</span>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Adicionar tarefa manual */}
        <div className="input-group">
          <input
            type="text"
            value={novaTarefa}
            onChange={(e) => setNovaTarefa(e.target.value)}
            placeholder="Adicionar nova tarefa..."
            onKeyPress={(e) => e.key === 'Enter' && adicionarTarefa()}
          />
          <button onClick={adicionarTarefa} className="btn-primary">
            <Plus size={20} />
          </button>
        </div>

        {/* Processar texto com IA */}
        <div className="ia-section">
          <h3>Processar com IA</h3>
          <div className="input-group">
            <textarea
              value={textoIA}
              onChange={(e) => setTextoIA(e.target.value)}
              placeholder="Descreva suas tarefas para a IA processar..."
              rows={3}
            />
            <button 
              onClick={processarTextoIA} 
              className="btn-ia"
              disabled={carregando}
            >
              {carregando ? 'Processando...' : <Brain size={20} />}
            </button>
          </div>
          {erro && <p className="erro">{erro}</p>}
        </div>

        {/* Lista de tarefas */}
        <div className="tarefas-section">
          <h3>Tarefas de Hoje</h3>
          {tarefasHoje.length === 0 ? (
            <p className="sem-tarefas">Nenhuma tarefa para hoje</p>
          ) : (
            <div className="tarefas-lista">
              {tarefasHoje.map(tarefa => (
                <div key={tarefa.id} className={`tarefa ${tarefa.concluida ? 'concluida' : ''}`}>
                  <button
                    onClick={() => toggleTarefa(tarefa.id)}
                    className="btn-toggle"
                  >
                    {tarefa.concluida ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>
                  <span className="tarefa-titulo">{tarefa.titulo}</span>
                  <button
                    onClick={() => removerTarefa(tarefa.id)}
                    className="btn-remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
