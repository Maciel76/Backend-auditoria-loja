// routes/progress.js - Rotas para tracking de progresso via Server-Sent Events
import express from 'express';
import progressService from '../services/progressService.js';

const router = express.Router();

// Server-Sent Events endpoint para receber atualizações de progresso
router.get('/stream/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  console.log(`📡 Cliente conectado para progresso da sessão: ${sessionId}`);

  // Configurar SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Enviar progresso atual se existir
  const currentProgress = progressService.getProgress(sessionId);
  if (currentProgress) {
    res.write(`data: ${JSON.stringify(currentProgress)}\n\n`);
  } else {
    // Enviar estado inicial
    res.write(`data: ${JSON.stringify({
      sessionId,
      percentage: 0,
      status: 'aguardando',
      message: 'Aguardando início do upload...'
    })}\n\n`);
  }

  // Listener para atualizações desta sessão
  const onProgress = (sid, progressData) => {
    if (sid === sessionId) {
      res.write(`data: ${JSON.stringify(progressData)}\n\n`);
    }
  };

  // Listener para conclusão
  const onCompleted = (sid, progressData) => {
    if (sid === sessionId) {
      res.write(`data: ${JSON.stringify(progressData)}\n\n`);
      res.write(`event: completed\ndata: ${JSON.stringify(progressData)}\n\n`);
    }
  };

  // Listener para erro
  const onError = (sid, progressData) => {
    if (sid === sessionId) {
      res.write(`data: ${JSON.stringify(progressData)}\n\n`);
      res.write(`event: error\ndata: ${JSON.stringify(progressData)}\n\n`);
    }
  };

  // Registrar listeners
  progressService.on('progress', onProgress);
  progressService.on('completed', onCompleted);
  progressService.on('error', onError);

  // Heartbeat para manter conexão viva
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 30000);

  // Cleanup quando cliente desconecta
  req.on('close', () => {
    console.log(`📡 Cliente desconectado da sessão: ${sessionId}`);
    clearInterval(heartbeat);
    progressService.removeListener('progress', onProgress);
    progressService.removeListener('completed', onCompleted);
    progressService.removeListener('error', onError);
  });
});

// Endpoint para verificar progresso via HTTP (fallback)
router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const progress = progressService.getProgress(sessionId);

  if (!progress) {
    return res.status(404).json({
      erro: 'Sessão não encontrada',
      sessionId
    });
  }

  res.json(progress);
});

// Endpoint para listar uploads ativos
router.get('/active', (req, res) => {
  const activeUploads = progressService.getAllActiveUploads();

  res.json({
    total: Object.keys(activeUploads).length,
    uploads: activeUploads,
    timestamp: new Date()
  });
});

// Endpoint para gerar nova sessão de upload
router.post('/session', (req, res) => {
  const sessionId = progressService.generateSessionId();

  res.json({
    sessionId,
    message: 'Sessão de upload criada',
    endpoints: {
      stream: `/api/progress/stream/${sessionId}`,
      status: `/api/progress/status/${sessionId}`
    }
  });
});

export default router;