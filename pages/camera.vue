<template>
  <div class="camera-screen">
    <div class="camera-header">拍照</div>
    <div class="camera-viewfinder">
      <div class="camera-placeholder">[ 相機畫面 ]</div>
    </div>
    <div class="camera-controls">
      <button class="cam-cancel-btn" @click="navigateTo('/')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <button class="shutter-btn" @click="takePhoto">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>
      <div style="width: 44px" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'bare' })

const { clearRecords, addRecord } = useRecords()

const takePhoto = () => {
  clearRecords()
  // Simulate AI receipt recognition
  addRecord({ name: '咖啡', amount: 120, category: '飲品' })
  addRecord({ name: '蛋糕', amount: 80, category: '點心' })
  navigateTo('/record?mode=camera')
}
</script>

<style scoped>
.camera-screen {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: #000;
}

.camera-header {
  padding: 52px 24px 16px;
  color: white;
  font-size: 16px;
  font-weight: 300;
}

.camera-viewfinder {
  flex: 1;
  margin: 0 20px;
  background: #1A1A1A;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.camera-placeholder {
  color: #444;
  font-size: 13px;
}

.camera-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 28px 0 calc(36px + env(safe-area-inset-bottom));
}

.cam-cancel-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.cam-cancel-btn:active {
  background: rgba(255, 255, 255, 0.15);
}

.cam-cancel-btn svg {
  width: 16px;
  height: 16px;
}

.shutter-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 0 4px rgba(224, 122, 79, 0.25);
  transition: all 0.18s;
  color: white;
}

.shutter-btn:active {
  transform: scale(0.9);
}

.shutter-btn svg {
  width: 22px;
  height: 22px;
}
</style>
