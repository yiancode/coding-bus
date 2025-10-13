<template>
  <div class="contact-modal-overlay" @click="handleOverlayClick">
    <div class="contact-modal" @click.stop>
      <div class="modal-header">
        <h3>联系客服开通服务</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg fill="none" height="24" stroke="currentColor" viewBox="0 0 24 24" width="24">
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
        </button>
      </div>

      <div class="modal-content">
        <div class="service-info">
          <div class="info-item">
            <div class="icon">🎯</div>
            <div class="text">
              <h4>专业 AI 中转服务</h4>
              <p>100+ 官方账户池，动态负载均衡，稳定可靠</p>
            </div>
          </div>

          <div class="info-item">
            <div class="icon">💎</div>
            <div class="text">
              <h4>Claude 4.0 Sonnet 支持</h4>
              <p>最新最强模型，企业级性能保障</p>
            </div>
          </div>

          <div class="info-item">
            <div class="icon">🚀</div>
            <div class="text">
              <h4>新用户专享优惠</h4>
              <p>免费 $10 体验额度，添加客服微信即可获取</p>
            </div>
          </div>
        </div>

        <div class="contact-section">
          <div class="wechat-info">
            <div class="wechat-id">
              <span class="label">客服微信号</span>
              <span class="id">20133213</span>
              <button class="copy-btn" @click="copyWechatId">复制</button>
            </div>

            <div class="qr-placeholder">
              <div class="qr-icon">📱</div>
              <p>扫码添加客服微信</p>
              <small>或手动搜索微信号: 20133213</small>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="primary-btn" @click="copyAndClose">复制微信号并关闭</button>
          <button class="secondary-btn" @click="$emit('close')">稍后联系</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close'])

const copyWechatId = async () => {
  try {
    await navigator.clipboard.writeText('20133213')
    // 这里可以添加复制成功的提示
    console.log('微信号已复制')
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = '20133213'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    console.log('微信号已复制（降级方案）')
  }
}

const copyAndClose = async () => {
  await copyWechatId()
  emit('close')
}

const handleOverlayClick = () => {
  emit('close')
}
</script>

<style scoped>
.contact-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.contact-modal {
  background: rgba(40, 40, 52, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.modal-content {
  padding: 24px;
}

.service-info {
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 10px;
  flex-shrink: 0;
}

.info-item .text h4 {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.info-item .text p {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.contact-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.wechat-id {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
}

.wechat-id .label {
  color: #9ca3af;
  font-size: 14px;
}

.wechat-id .id {
  color: #22c55e;
  font-size: 18px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  flex: 1;
}

.copy-btn {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: rgba(34, 197, 94, 0.3);
}

.qr-placeholder {
  text-align: center;
  padding: 20px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.qr-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.qr-placeholder p {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.qr-placeholder small {
  color: #9ca3af;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.primary-btn {
  flex: 1;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .contact-modal-overlay {
    padding: 16px;
  }

  .modal-header {
    padding: 20px 20px 16px;
  }

  .modal-content {
    padding: 20px;
  }

  .info-item .icon {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .wechat-id {
    flex-wrap: wrap;
    gap: 8px;
  }

  .wechat-id .id {
    font-size: 16px;
  }
}

/* 暗黑模式兼容 */
.dark .contact-modal {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(75, 85, 99, 0.3);
}

.dark .modal-header {
  border-bottom-color: rgba(75, 85, 99, 0.3);
}

.dark .contact-section {
  background: rgba(31, 41, 55, 0.5);
}
</style>
