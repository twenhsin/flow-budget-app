<template>
  <div class="camera-screen">
    <!-- Live video fullscreen -->
    <video ref="videoRef" class="camera-video" autoplay playsinline muted />
    <canvas ref="canvasRef" class="camera-canvas" />

    <!-- Overlay: dark surround + scan frame -->
    <div class="scan-overlay">
      <div class="overlay-top" />
      <div class="overlay-middle">
        <div class="overlay-side" />
        <div class="scan-frame">
          <div class="corner corner-tl" />
          <div class="corner corner-tr" />
          <div class="corner corner-bl" />
          <div class="corner corner-br" />
        </div>
        <div class="overlay-side" />
      </div>
      <div class="overlay-bottom" />
    </div>

    <!-- Floating header -->
    <div class="camera-header">拍照</div>

    <!-- Floating controls -->
    <div class="camera-controls">
      <button class="cam-cancel-btn" @click="cancel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <button class="shutter-btn" :disabled="!streamReady" @click="takePhoto">
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

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const streamReady = ref(false)
let stream: MediaStream | null = null

const startCamera = async () => {
  if (import.meta.server) return
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.onloadedmetadata = () => { streamReady.value = true }
    }
  }
  catch (e) {
    console.warn('相機開啟失敗', e)
  }
}

const stopCamera = () => {
  stream?.getTracks().forEach(t => t.stop())
  stream = null
  streamReady.value = false
}

const takePhoto = () => {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) return

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')?.drawImage(video, 0, 0)

  stopCamera()
  clearRecords()
  // TODO: send canvas.toDataURL('image/jpeg') to AI for receipt parsing
  addRecord({ name: '咖啡', amount: 120, category: '飲料' })
  addRecord({ name: '蛋糕', amount: 80, category: '點心' })
  navigateTo('/record?mode=camera')
}

const cancel = () => {
  stopCamera()
  navigateTo('/')
}

onMounted(() => startCamera())
onUnmounted(() => stopCamera())
</script>

<style scoped>
.camera-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  background: #000;
  overflow: hidden;
}

/* Fullscreen video */
.camera-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-canvas {
  display: none;
}

/* Overlay: 4-side dark surround with transparent centre */
.scan-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.overlay-top {
  flex: 1.8;
  background: rgba(0, 0, 0, 0.5);
}

.overlay-middle {
  display: flex;
  height: 240px;
}

.overlay-side {
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
}

.scan-frame {
  width: 280px;
  position: relative;
  /* transparent — no background */
}

.overlay-bottom {
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
}

/* L-shaped corner markers */
.corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border-color: white;
  border-style: solid;
}

.corner-tl { top: 0; left: 0; border-width: 3px 0 0 3px; }
.corner-tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
.corner-bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
.corner-br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }

/* Floating header */
.camera-header {
  position: absolute;
  top: calc(52px + env(safe-area-inset-top));
  left: 24px;
  color: white;
  font-size: 16px;
  font-weight: 300;
  letter-spacing: 0.04em;
}

/* Floating controls */
.camera-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 28px 0 calc(40px + env(safe-area-inset-bottom));
}

.cam-cancel-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.cam-cancel-btn:active {
  background: rgba(255, 255, 255, 0.15);
}

.cam-cancel-btn svg {
  width: 16px;
  height: 16px;
}

.shutter-btn {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.3);
  transition: all 0.18s;
  color: #333;
}

.shutter-btn:active {
  transform: scale(0.9);
}

.shutter-btn:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.shutter-btn svg {
  width: 24px;
  height: 24px;
}
</style>
