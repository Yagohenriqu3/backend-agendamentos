import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import nodemailer from 'nodemailer'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Criar pool de conexão MySQL
const pool = mysql.createPool(process.env.DATABASE_URL)

// Configurar transporte de email
let transporter

if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'seu-email@gmail.com') {
  // Usar configuração do .env se disponível
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
} else {
  // Modo de teste - apenas loga no console
  transporter = null
  console.log('⚠️  Modo de teste de email ativado - emails serão apenas logados no console')
}

// Função para enviar email
async function enviarEmail(para, assunto, html) {
  try {
    // Se não houver transporter configurado, apenas loga
    if (!transporter) {
      console.log('\n📧 ============ EMAIL DE TESTE ============')
      console.log('Para:', para)
      console.log('Assunto:', assunto)
      console.log('==========================================\n')
      return
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: para,
      subject: assunto,
      html: html
    })
    
    console.log('✅ Email enviado com sucesso para:', para)
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message)
    console.log('📧 Email não enviado para:', para, '- Assunto:', assunto)
  }
}

// Templates de email
function emailAgendamentoConfirmado(nome, data, horario, servico) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6EC1E4, #EAF6F6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-left: 4px solid #6EC1E4; margin: 20px 0; }
        .info-box strong { color: #6EC1E4; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Agendamento Confirmado!</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${nome}</strong>!</p>
          <p>Seu agendamento foi confirmado com sucesso. Estamos ansiosos para atendê-lo(a)!</p>
          
          <div class="info-box">
            <p><strong>📅 Data:</strong> ${data}</p>
            <p><strong>🕐 Horário:</strong> ${horario}</p>
            <p><strong>💆 Serviço:</strong> ${servico}</p>
          </div>
          
          <p>Por favor, chegue com 10 minutos de antecedência.</p>
          <p>Em caso de imprevistos, entre em contato conosco o quanto antes.</p>
          
          <p>Até breve! 💙</p>
          <p><strong>Equipe Belleza Estética</strong></p>
        </div>
        <div class="footer">
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function emailAgendamentoCancelado(nome, data, horario, servico) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-left: 4px solid #e74c3c; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Agendamento Cancelado</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${nome}</strong>,</p>
          <p>Informamos que seu agendamento foi cancelado:</p>
          
          <div class="info-box">
            <p><strong>📅 Data:</strong> ${data}</p>
            <p><strong>🕐 Horário:</strong> ${horario}</p>
            <p><strong>💆 Serviço:</strong> ${servico}</p>
          </div>
          
          <p>Você pode fazer um novo agendamento a qualquer momento através do nosso site.</p>
          
          <p>Atenciosamente,</p>
          <p><strong>Equipe Belleza Estética</strong></p>
        </div>
        <div class="footer">
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function emailAgendamentoReagendado(nome, dataAntiga, horarioAntigo, dataNova, horarioNovo, servico) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f39c12, #e67e22); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .old { border-left: 4px solid #e74c3c; }
        .new { border-left: 4px solid #27ae60; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Agendamento Reagendado</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${nome}</strong>!</p>
          <p>Seu agendamento foi reagendado. Confira as informações atualizadas:</p>
          
          <div class="info-box old">
            <p><strong>❌ Agendamento Anterior:</strong></p>
            <p>📅 ${dataAntiga} às ${horarioAntigo}</p>
          </div>
          
          <div class="info-box new">
            <p><strong>✅ Novo Agendamento:</strong></p>
            <p><strong>📅 Data:</strong> ${dataNova}</p>
            <p><strong>🕐 Horário:</strong> ${horarioNovo}</p>
            <p><strong>💆 Serviço:</strong> ${servico}</p>
          </div>
          
          <p>Por favor, chegue com 10 minutos de antecedência.</p>
          <p>Em caso de dúvidas, entre em contato conosco.</p>
          
          <p>Até breve! 💙</p>
          <p><strong>Equipe Belleza Estética</strong></p>
        </div>
        <div class="footer">
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

app.use(cors())
app.use(express.json())

// ==================== ROTAS DE ADMIN ====================

// Login unificado (clientes e admin)
app.post('/api/cliente/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }

    const [clientes] = await pool.query(
      'SELECT * FROM Cliente WHERE email = ? AND password = ?',
      [email, password]
    )

    if (clientes.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    const cliente = clientes[0]

    // Verificar se o cliente está bloqueado
    if (cliente.bloqueado && !cliente.isAdmin) {
      return res.status(403).json({ error: 'Sua conta foi bloqueada. Entre em contato com o administrador.' })
    }

    res.json({
      token: `cliente_${cliente.id}_${Date.now()}`,
      nome: cliente.nome,
      email: cliente.email,
      isAdmin: Boolean(cliente.isAdmin)
    })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
})

// Buscar dados do cliente
app.get('/api/cliente/dados', async (req, res) => {
  try {
    const { email } = req.query

    const [clientes] = await pool.query(
      'SELECT id, nome, email, telefone, isAdmin, createdAt FROM Cliente WHERE email = ?',
      [email]
    )

    if (clientes.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    res.json(clientes[0])
  } catch (error) {
    console.error('Erro ao buscar dados:', error)
    res.status(500).json({ error: 'Erro ao buscar dados' })
  }
})

// Atualizar dados do cliente
app.put('/api/cliente/atualizar', async (req, res) => {
  try {
    const { email, nome, telefone, senhaAtual, novaSenha } = req.body

    // Se quiser alterar senha, validar senha atual
    if (novaSenha) {
      if (!senhaAtual) {
        return res.status(400).json({ error: 'Senha atual é obrigatória para alterar a senha' })
      }

      const [clientes] = await pool.query(
        'SELECT id FROM Cliente WHERE email = ? AND password = ?',
        [email, senhaAtual]
      )

      if (clientes.length === 0) {
        return res.status(401).json({ error: 'Senha atual incorreta' })
      }

      await pool.query(
        'UPDATE Cliente SET nome = ?, telefone = ?, password = ? WHERE email = ?',
        [nome, telefone, novaSenha, email]
      )
    } else {
      await pool.query(
        'UPDATE Cliente SET nome = ?, telefone = ? WHERE email = ?',
        [nome, telefone, email]
      )
    }

    res.json({ message: 'Dados atualizados com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar dados:', error)
    res.status(500).json({ error: 'Erro ao atualizar dados' })
  }
})

// Listar todos os clientes (só admin)
app.get('/api/admin/clientes', async (req, res) => {
  try {
    const [clientes] = await pool.query(
      'SELECT id, nome, email, telefone, isAdmin, bloqueado, createdAt FROM Cliente ORDER BY createdAt DESC'
    )
    res.json(clientes)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    res.status(500).json({ error: 'Erro ao buscar clientes' })
  }
})

// Editar dados do cliente (só admin)
app.put('/api/admin/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nome, email, telefone } = req.body

    if (!nome || !email || !telefone) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    await pool.query(
      'UPDATE Cliente SET nome = ?, email = ?, telefone = ? WHERE id = ?',
      [nome, email, telefone, id]
    )

    res.json({ message: 'Cliente atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    res.status(500).json({ error: 'Erro ao atualizar cliente' })
  }
})

// Bloquear/Desbloquear cliente (só admin)
app.patch('/api/admin/clientes/:id/bloquear', async (req, res) => {
  try {
    const { id } = req.params
    const { bloqueado } = req.body

    await pool.query(
      'UPDATE Cliente SET bloqueado = ? WHERE id = ?',
      [bloqueado, id]
    )

    res.json({ message: bloqueado ? 'Cliente bloqueado' : 'Cliente desbloqueado' })
  } catch (error) {
    console.error('Erro ao bloquear/desbloquear cliente:', error)
    res.status(500).json({ error: 'Erro ao bloquear/desbloquear cliente' })
  }
})

// Excluir cliente (só admin) - Remove também seus agendamentos
app.delete('/api/admin/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se é admin
    const [cliente] = await pool.query('SELECT isAdmin FROM Cliente WHERE id = ?', [id])
    if (cliente.length > 0 && cliente[0].isAdmin) {
      return res.status(400).json({ error: 'Não é possível excluir um administrador' })
    }

    // Excluir agendamentos primeiro (foreign key)
    await pool.query('DELETE FROM Agendamento WHERE clienteId = ?', [id])
    
    // Excluir cliente
    await pool.query('DELETE FROM Cliente WHERE id = ?', [id])

    res.json({ message: 'Cliente excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    res.status(500).json({ error: 'Erro ao excluir cliente' })
  }
})

// Buscar histórico de procedimentos do cliente (só admin)
app.get('/api/admin/clientes/:id/historico', async (req, res) => {
  try {
    const { id } = req.params
    
    const [historico] = await pool.query(
      `SELECT a.*, s.nome as servicoNome, COALESCE(a.valorCobrado, s.preco) as servicoPreco
       FROM Agendamento a
       JOIN Servico s ON a.servicoId = s.id
       WHERE a.clienteId = ?
       ORDER BY a.data DESC, a.horario DESC`,
      [id]
    )
    
    res.json(historico)
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    res.status(500).json({ error: 'Erro ao buscar histórico' })
  }
})

// Salvar/editar anotação do procedimento (só admin)
app.patch('/api/admin/agendamentos/:id/anotacao', async (req, res) => {
  try {
    const { id } = req.params
    const { anotacao } = req.body

    await pool.query(
      'UPDATE Agendamento SET anotacao = ?, updatedAt = NOW() WHERE id = ?',
      [anotacao || null, id]
    )

    res.json({ message: 'Anotação salva com sucesso' })
  } catch (error) {
    console.error('Erro ao salvar anotação:', error)
    res.status(500).json({ error: 'Erro ao salvar anotação' })
  }
})

// Editar valor cobrado no agendamento (só admin)
app.patch('/api/admin/agendamentos/:id/valor', async (req, res) => {
  try {
    const { id } = req.params
    const { valor } = req.body

    if (!valor || valor < 0) {
      return res.status(400).json({ error: 'Valor inválido' })
    }

    // Atualizar o valor cobrado específico deste agendamento
    await pool.query(
      'UPDATE Agendamento SET valorCobrado = ?, updatedAt = NOW() WHERE id = ?',
      [valor, id]
    )

    res.json({ message: 'Valor atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar valor:', error)
    res.status(500).json({ error: 'Erro ao atualizar valor' })
  }
})

// Buscar estatísticas de faturamento e métricas (só admin)
app.get('/api/admin/estatisticas', async (req, res) => {
  try {
    const { mes } = req.query // Formato: YYYY-MM
    
    if (!mes) {
      return res.status(400).json({ error: 'Mês é obrigatório' })
    }

    // Faturamento realizado (concluídos)
    const [faturamentoRealizado] = await pool.query(
      `SELECT COALESCE(SUM(COALESCE(a.valorCobrado, s.preco)), 0) as total, COUNT(*) as quantidade
       FROM Agendamento a
       JOIN Servico s ON a.servicoId = s.id
       WHERE DATE_FORMAT(a.data, '%Y-%m') = ? AND a.status = 'concluido'`,
      [mes]
    )

    // Faturamento futuro (confirmados)
    const [faturamentoFuturo] = await pool.query(
      `SELECT COALESCE(SUM(COALESCE(a.valorCobrado, s.preco)), 0) as total, COUNT(*) as quantidade
       FROM Agendamento a
       JOIN Servico s ON a.servicoId = s.id
       WHERE DATE_FORMAT(a.data, '%Y-%m') = ? AND a.status = 'confirmado'`,
      [mes]
    )

    // Total de clientes únicos no mês
    const [totalClientes] = await pool.query(
      `SELECT COUNT(DISTINCT a.clienteId) as total
       FROM Agendamento a
       WHERE DATE_FORMAT(a.data, '%Y-%m') = ? AND a.status IN ('confirmado', 'concluido')`,
      [mes]
    )

    // Cliente mais recorrente
    const [clienteMaisRecorrente] = await pool.query(
      `SELECT c.nome, c.email, COUNT(*) as total, SUM(COALESCE(a.valorCobrado, s.preco)) as faturamento
       FROM Agendamento a
       JOIN Cliente c ON a.clienteId = c.id
       JOIN Servico s ON a.servicoId = s.id
       WHERE DATE_FORMAT(a.data, '%Y-%m') = ? AND a.status IN ('confirmado', 'concluido')
       GROUP BY a.clienteId
       ORDER BY total DESC
       LIMIT 1`,
      [mes]
    )

    // Procedimento mais realizado
    const [procedimentoMaisRealizado] = await pool.query(
      `SELECT s.nome, s.preco, COUNT(*) as total, SUM(COALESCE(a.valorCobrado, s.preco)) as faturamento
       FROM Agendamento a
       JOIN Servico s ON a.servicoId = s.id
       WHERE DATE_FORMAT(a.data, '%Y-%m') = ? AND a.status IN ('confirmado', 'concluido')
       GROUP BY a.servicoId
       ORDER BY total DESC
       LIMIT 1`,
      [mes]
    )

    // Top 5 serviços
    const [topServicos] = await pool.query(
      `SELECT s.nome, COUNT(*) as quantidade, SUM(COALESCE(a.valorCobrado, s.preco)) as faturamento
       FROM Agendamento a
       JOIN Servico s ON a.servicoId = s.id
       WHERE DATE_FORMAT(a.data, '%Y-%m') = ? AND a.status IN ('confirmado', 'concluido')
       GROUP BY a.servicoId
       ORDER BY quantidade DESC
       LIMIT 5`,
      [mes]
    )

    // Top 5 clientes
    const [topClientes] = await pool.query(
      `SELECT c.nome, c.email, COUNT(*) as visitas, SUM(COALESCE(a.valorCobrado, s.preco)) as faturamento
       FROM Agendamento a
       JOIN Cliente c ON a.clienteId = c.id
       JOIN Servico s ON a.servicoId = s.id
       WHERE DATE_FORMAT(a.data, '%Y-%m') = ? AND a.status IN ('confirmado', 'concluido')
       GROUP BY a.clienteId
       ORDER BY faturamento DESC
       LIMIT 5`,
      [mes]
    )

    res.json({
      faturamentoRealizado: parseFloat(faturamentoRealizado[0].total),
      agendamentosConcluidos: faturamentoRealizado[0].quantidade,
      faturamentoFuturo: parseFloat(faturamentoFuturo[0].total),
      agendamentosConfirmados: faturamentoFuturo[0].quantidade,
      faturamentoTotal: parseFloat(faturamentoRealizado[0].total) + parseFloat(faturamentoFuturo[0].total),
      totalClientes: totalClientes[0].total,
      clienteMaisRecorrente: clienteMaisRecorrente[0] || null,
      procedimentoMaisRealizado: procedimentoMaisRealizado[0] || null,
      topServicos: topServicos,
      topClientes: topClientes
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
})

// Confirmar agendamento (só admin)
app.patch('/api/agendamentos/:id/confirmar', async (req, res) => {
  try {
    const { id } = req.params

    await pool.query(
      'UPDATE Agendamento SET status = ?, updatedAt = NOW() WHERE id = ?',
      ['concluido', id]
    )

    res.json({ message: 'Agendamento confirmado como concluído' })
  } catch (error) {
    console.error('Erro ao confirmar agendamento:', error)
    res.status(500).json({ error: 'Erro ao confirmar agendamento' })
  }
})

// Reagendar agendamento (só admin)
app.patch('/api/admin/agendamentos/:id/reagendar', async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    const { id } = req.params
    const { data, horario, observacoes } = req.body

    console.log('Reagendamento - ID:', id, 'Data:', data, 'Horário:', horario)

    if (!data || !horario) {
      return res.status(400).json({ error: 'Data e horário são obrigatórios' })
    }

    await connection.beginTransaction()

    // Buscar informações do agendamento atual
    const [agendamentoAtual] = await connection.query(
      `SELECT a.*, c.nome as clienteNome, c.email as clienteEmail, 
              s.nome as servicoNome
       FROM Agendamento a
       JOIN Cliente c ON a.clienteId = c.id
       JOIN Servico s ON a.servicoId = s.id
       WHERE a.id = ?`,
      [id]
    )

    if (agendamentoAtual.length === 0) {
      await connection.rollback()
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }

    const info = agendamentoAtual[0]
    const dataAntigaFormatada = new Date(info.data).toLocaleDateString('pt-BR')

    // Verificar se o novo horário já está ocupado (exceto o agendamento atual)
    const [existing] = await connection.query(
      'SELECT id FROM Agendamento WHERE DATE(data) = ? AND horario = ? AND id != ? AND status != ?',
      [data, horario, id, 'cancelado']
    )

    if (existing.length > 0) {
      await connection.rollback()
      return res.status(409).json({ error: 'Este horário já está ocupado' })
    }

    // Atualizar agendamento
    const [result] = await connection.query(
      'UPDATE Agendamento SET data = ?, horario = ?, observacoes = ?, updatedAt = NOW() WHERE id = ?',
      [data, horario, observacoes || null, id]
    )

    console.log('Linhas afetadas:', result.affectedRows)

    await connection.commit()

    // Enviar email de reagendamento
    const dataNovaFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
    enviarEmail(
      info.clienteEmail,
      '🔄 Agendamento Reagendado - Belleza Estética',
      emailAgendamentoReagendado(info.clienteNome, dataAntigaFormatada, info.horario, dataNovaFormatada, horario, info.servicoNome)
    )

    res.json({ message: 'Agendamento reagendado com sucesso' })
  } catch (error) {
    await connection.rollback()
    console.error('Erro ao reagendar agendamento:', error.message, error.stack)
    res.status(500).json({ error: 'Erro ao reagendar agendamento', details: error.message })
  } finally {
    connection.release()
  }
})

// ==================== ROTAS DE SERVIÇOS (ADMIN) ====================

// Adicionar novo serviço
app.post('/api/admin/servicos', async (req, res) => {
  try {
    const { nome, duracao, preco, descricao } = req.body

    if (!nome || !duracao || !preco) {
      return res.status(400).json({ error: 'Nome, duração e preço são obrigatórios' })
    }

    const [result] = await pool.query(
      'INSERT INTO Servico (nome, duracao, preco, descricao, ativo, createdAt) VALUES (?, ?, ?, ?, TRUE, NOW())',
      [nome, duracao, preco, descricao || '']
    )

    res.status(201).json({ 
      id: result.insertId,
      message: 'Serviço adicionado com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao adicionar serviço:', error)
    res.status(500).json({ error: 'Erro ao adicionar serviço' })
  }
})

// Atualizar serviço
app.put('/api/admin/servicos/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nome, duracao, preco, descricao } = req.body

    await pool.query(
      'UPDATE Servico SET nome = ?, duracao = ?, preco = ?, descricao = ? WHERE id = ?',
      [nome, duracao, preco, descricao || '', id]
    )

    res.json({ message: 'Serviço atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error)
    res.status(500).json({ error: 'Erro ao atualizar serviço' })
  }
})

// Ativar/desativar serviço
app.patch('/api/admin/servicos/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params
    const { ativo } = req.body

    await pool.query(
      'UPDATE Servico SET ativo = ? WHERE id = ?',
      [ativo, id]
    )

    res.json({ message: 'Status do serviço atualizado' })
  } catch (error) {
    console.error('Erro ao atualizar status do serviço:', error)
    res.status(500).json({ error: 'Erro ao atualizar status' })
  }
})

// ==================== ROTAS PÚBLICAS ====================

// Registro de cliente
app.post('/api/cliente/registro', async (req, res) => {
  try {
    const { nome, email, telefone, password } = req.body

    if (!nome || !email || !telefone || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' })
    }

    // Verificar se email já existe
    const [existente] = await pool.query(
      'SELECT id FROM Cliente WHERE email = ?',
      [email]
    )

    if (existente.length > 0) {
      return res.status(409).json({ error: 'Este email já está cadastrado' })
    }

    // Criar cliente
    const [result] = await pool.query(
      'INSERT INTO Cliente (nome, email, telefone, password, createdAt) VALUES (?, ?, ?, ?, NOW())',
      [nome, email, telefone, password]
    )

    res.status(201).json({
      token: `cliente_${result.insertId}_${Date.now()}`,
      nome,
      email
    })
  } catch (error) {
    console.error('Erro ao registrar cliente:', error)
    res.status(500).json({ error: 'Erro ao registrar cliente' })
  }
})

// Login de cliente
app.post('/api/cliente/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }

    const [clientes] = await pool.query(
      'SELECT * FROM Cliente WHERE email = ? AND password = ?',
      [email, password]
    )

    if (clientes.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    const cliente = clientes[0]

    res.json({
      token: `cliente_${cliente.id}_${Date.now()}`,
      nome: cliente.nome,
      email: cliente.email
    })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
})


// Rota para buscar horários disponíveis
app.get('/api/horarios-disponiveis', async (req, res) => {
  try {
    const { data, servicoId, excluirAgendamento } = req.query
    
    if (!data) {
      return res.status(400).json({ error: 'Data é obrigatória' })
    }

    // Buscar todos os agendamentos para a data específica (excluindo o agendamento sendo reagendado)
    let query = 'SELECT horario FROM Agendamento WHERE DATE(data) = ? AND status != ?'
    const params = [data, 'cancelado']
    
    if (excluirAgendamento) {
      query += ' AND id != ?'
      params.push(excluirAgendamento)
    }
    
    const [agendamentos] = await pool.query(query, params)

    const horariosOcupados = agendamentos.map(a => a.horario)

    // Horários disponíveis (8h às 18h, de hora em hora)
    const todosHorarios = []
    for (let hora = 8; hora < 18; hora++) {
      todosHorarios.push(`${hora.toString().padStart(2, '0')}:00`)
      todosHorarios.push(`${hora.toString().padStart(2, '0')}:30`)
    }

    const horariosDisponiveis = todosHorarios.filter(
      horario => !horariosOcupados.includes(horario)
    )

    res.json({ horariosDisponiveis })
  } catch (error) {
    console.error('Erro ao buscar horários:', error)
    res.status(500).json({ error: 'Erro ao buscar horários disponíveis' })
  }
})

// Rota para listar serviços
app.get('/api/servicos', async (req, res) => {
  try {
    const { todos } = req.query
    
    let query = 'SELECT * FROM Servico'
    
    // Se não for requisição admin (todos=true), mostrar apenas ativos
    if (todos !== 'true') {
      query += ' WHERE ativo = TRUE'
    }
    
    query += ' ORDER BY nome'
    
    const [servicos] = await pool.query(query)
    res.json(servicos)
  } catch (error) {
    console.error('Erro ao buscar serviços:', error)
    res.status(500).json({ error: 'Erro ao buscar serviços' })
  }
})

// Rota para criar agendamento
app.post('/api/agendamentos', async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    const { nome, email, telefone, servicoId, data, horario, observacoes } = req.body

    // Validações
    if (!nome || !email || !telefone || !servicoId || !data || !horario) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' })
    }

    await connection.beginTransaction()

    // Verificar se o horário já está ocupado
    const [existing] = await connection.query(
      'SELECT id FROM Agendamento WHERE DATE(data) = ? AND horario = ?',
      [data, horario]
    )

    if (existing.length > 0) {
      await connection.rollback()
      return res.status(409).json({ error: 'Este horário já está ocupado' })
    }

    // Buscar ou criar cliente
    let [cliente] = await connection.query(
      'SELECT id FROM Cliente WHERE email = ?',
      [email]
    )

    let clienteId
    if (cliente.length === 0) {
      const [result] = await connection.query(
        'INSERT INTO Cliente (nome, email, telefone, createdAt) VALUES (?, ?, ?, NOW())',
        [nome, email, telefone]
      )
      clienteId = result.insertId
    } else {
      clienteId = cliente[0].id
    }

    // Criar agendamento
    const [agendamento] = await connection.query(
      'INSERT INTO Agendamento (clienteId, servicoId, data, horario, observacoes, valorCobrado, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, (SELECT preco FROM Servico WHERE id = ?), ?, NOW(), NOW())',
      [clienteId, servicoId, data, horario, observacoes || null, servicoId, 'confirmado']
    )

    // Buscar informações do serviço para o email
    const [servico] = await connection.query(
      'SELECT nome FROM Servico WHERE id = ?',
      [servicoId]
    )

    await connection.commit()

    // Enviar email de confirmação
    const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
    enviarEmail(
      email,
      '✅ Agendamento Confirmado - Belleza Estética',
      emailAgendamentoConfirmado(nome, dataFormatada, horario, servico[0].nome)
    )

    res.status(201).json({ 
      id: agendamento.insertId,
      message: 'Agendamento criado com sucesso' 
    })
  } catch (error) {
    await connection.rollback()
    console.error('Erro ao criar agendamento:', error)
    res.status(500).json({ error: 'Erro ao criar agendamento' })
  } finally {
    connection.release()
  }
})

// Rota para listar agendamentos
app.get('/api/agendamentos', async (req, res) => {
  try {
    const { data, clienteEmail, clienteNome } = req.query
    
    let query = `
      SELECT a.*, c.nome as clienteNome, c.email as clienteEmail, c.telefone,
             s.nome as servicoNome, COALESCE(a.valorCobrado, s.preco) as servicoPreco
      FROM Agendamento a
      JOIN Cliente c ON a.clienteId = c.id
      JOIN Servico s ON a.servicoId = s.id
      WHERE 1=1
    `
    const params = []
    
    if (data) {
      query += ' AND DATE(a.data) = ?'
      params.push(data)
    }
    
    if (clienteEmail) {
      query += ' AND c.email = ?'
      params.push(clienteEmail)
    }

    if (clienteNome) {
      query += ' AND c.nome LIKE ?'
      params.push(`%${clienteNome}%`)
    }

    query += ' ORDER BY a.data ASC, a.horario ASC'

    const [agendamentos] = await pool.query(query, params)
    res.json(agendamentos)
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)
    res.status(500).json({ error: 'Erro ao buscar agendamentos' })
  }
})

// Rota para cancelar agendamento
app.patch('/api/agendamentos/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params

    // Buscar informações do agendamento antes de cancelar
    const [agendamento] = await pool.query(
      `SELECT a.*, c.nome as clienteNome, c.email as clienteEmail, 
              s.nome as servicoNome
       FROM Agendamento a
       JOIN Cliente c ON a.clienteId = c.id
       JOIN Servico s ON a.servicoId = s.id
       WHERE a.id = ?`,
      [id]
    )

    if (agendamento.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }

    const info = agendamento[0]

    // Cancelar agendamento
    await pool.query(
      'UPDATE Agendamento SET status = ?, updatedAt = NOW() WHERE id = ?',
      ['cancelado', id]
    )

    // Enviar email de cancelamento
    const dataFormatada = new Date(info.data).toLocaleDateString('pt-BR')
    enviarEmail(
      info.clienteEmail,
      '❌ Agendamento Cancelado - Belleza Estética',
      emailAgendamentoCancelado(info.clienteNome, dataFormatada, info.horario, info.servicoNome)
    )

    res.json({ message: 'Agendamento cancelado com sucesso' })
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error)
    res.status(500).json({ error: 'Erro ao cancelar agendamento' })
  }
})

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})

// Manter o processo ativo
process.stdin.resume()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM recebido, fechando servidor...')
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT recebido, fechando servidor...')
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
})
