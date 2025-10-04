// services/progressService.js - Serviço para tracking de progresso de upload
import EventEmitter from 'events';

class ProgressService extends EventEmitter {
  constructor() {
    super();
    this.activeUploads = new Map(); // sessionId -> progress data
  }

  // Iniciar novo processo de upload
  startUpload(sessionId, totalSteps = 100) {
    const progressData = {
      sessionId,
      totalSteps,
      currentStep: 0,
      percentage: 0,
      status: 'iniciando',
      message: 'Preparando upload...',
      startTime: new Date(),
      stages: {
        reading: { completed: false, percentage: 0 },
        processing: { completed: false, percentage: 0 },
        saving: { completed: false, percentage: 0 },
        metrics: { completed: false, percentage: 0 }
      }
    };

    this.activeUploads.set(sessionId, progressData);
    this.emit('progress', sessionId, progressData);

    console.log(`📊 Iniciando tracking de progresso para sessão: ${sessionId}`);
    return progressData;
  }

  // Atualizar progresso de uma etapa específica
  updateStage(sessionId, stageName, percentage, message = '') {
    const progressData = this.activeUploads.get(sessionId);
    if (!progressData) return;

    // Atualizar etapa específica
    if (progressData.stages[stageName]) {
      progressData.stages[stageName].percentage = percentage;
      progressData.stages[stageName].completed = percentage >= 100;
    }

    // Calcular progresso geral (cada etapa vale 25%)
    const stageWeights = {
      reading: 0.20,    // 20% - Lendo planilha
      processing: 0.40, // 40% - Processando dados
      saving: 0.30,     // 30% - Salvando no banco
      metrics: 0.10     // 10% - Calculando métricas
    };

    let totalPercentage = 0;
    Object.entries(progressData.stages).forEach(([stage, data]) => {
      totalPercentage += (data.percentage * stageWeights[stage]);
    });

    progressData.percentage = Math.min(Math.round(totalPercentage), 100);
    progressData.message = message || this.getStageMessage(stageName, percentage);
    progressData.status = this.getStatus(progressData.percentage);

    this.emit('progress', sessionId, progressData);
    console.log(`📈 Progresso ${sessionId}: ${progressData.percentage}% - ${progressData.message}`);
  }

  // Atualizar progresso detalhado de processamento
  updateProcessingProgress(sessionId, current, total, message = '') {
    if (total === 0) return;

    const percentage = Math.round((current / total) * 100);
    const detailedMessage = message || `Processando linha ${current} de ${total}`;

    this.updateStage(sessionId, 'processing', percentage, detailedMessage);
  }

  // Marcar upload como concluído
  completeUpload(sessionId, result) {
    const progressData = this.activeUploads.get(sessionId);
    if (!progressData) return;

    progressData.percentage = 100;
    progressData.status = 'concluido';
    progressData.message = 'Upload concluído com sucesso!';
    progressData.endTime = new Date();
    progressData.duration = progressData.endTime - progressData.startTime;
    progressData.result = result;

    // Marcar todas as etapas como concluídas
    Object.keys(progressData.stages).forEach(stage => {
      progressData.stages[stage].completed = true;
      progressData.stages[stage].percentage = 100;
    });

    this.emit('progress', sessionId, progressData);
    this.emit('completed', sessionId, progressData);

    console.log(`✅ Upload ${sessionId} concluído em ${progressData.duration}ms`);

    // Remover após 30 segundos
    setTimeout(() => {
      this.activeUploads.delete(sessionId);
      console.log(`🗑️ Dados de progresso removidos para sessão: ${sessionId}`);
    }, 30000);
  }

  // Marcar upload como erro
  errorUpload(sessionId, error) {
    const progressData = this.activeUploads.get(sessionId);
    if (!progressData) return;

    progressData.status = 'erro';
    progressData.message = `Erro: ${error.message}`;
    progressData.error = error;
    progressData.endTime = new Date();

    this.emit('progress', sessionId, progressData);
    this.emit('error', sessionId, progressData);

    console.log(`❌ Erro no upload ${sessionId}: ${error.message}`);

    // Remover após 30 segundos
    setTimeout(() => {
      this.activeUploads.delete(sessionId);
    }, 30000);
  }

  // Obter progresso atual
  getProgress(sessionId) {
    return this.activeUploads.get(sessionId) || null;
  }

  // Obter todos os uploads ativos
  getAllActiveUploads() {
    return Object.fromEntries(this.activeUploads);
  }

  // Mensagens padrão por etapa
  getStageMessage(stageName, percentage) {
    const messages = {
      reading: `Lendo planilha... ${percentage}%`,
      processing: `Processando dados... ${percentage}%`,
      saving: `Salvando no banco... ${percentage}%`,
      metrics: `Calculando métricas... ${percentage}%`
    };
    return messages[stageName] || `${stageName}: ${percentage}%`;
  }

  // Status baseado na porcentagem
  getStatus(percentage) {
    if (percentage === 0) return 'iniciando';
    if (percentage < 100) return 'processando';
    return 'concluido';
  }

  // Gerar ID único para sessão
  generateSessionId() {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Instância singleton
const progressService = new ProgressService();

export default progressService;