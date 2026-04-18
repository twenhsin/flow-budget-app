<template>
  <div class="page-wrapper">
    <div class="orb orb-1" aria-hidden="true" />
    <div class="orb orb-2" aria-hidden="true" />
    <div class="orb orb-3" aria-hidden="true" />
    <div class="layout-with-nav">
      <QuotaBanner />
      <div class="layout-content">
        <slot />
      </div>
      <BottomNav />
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  position: relative;
  min-height: 100dvh;
  background-image:
    radial-gradient(at 10% 20%, rgba(255,245,220,0.8) 0px, transparent 50%),
    radial-gradient(at 90% 10%, rgba(255,230,180,0.7) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(255,190,140,0.6) 0px, transparent 60%),
    radial-gradient(at 20% 80%, rgba(255,210,190,0.5) 0px, transparent 50%),
    radial-gradient(at 80% 90%, rgba(255,160,140,0.4) 0px, transparent 50%),
    linear-gradient(135deg, #fffcf5 0%, #ffe4cc 40%, #ffd1b3 70%, #ffc0a0 100%);
}

.layout-with-nav {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background: transparent;
}

.layout-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
  position: relative;
  z-index: 1;
}

/* Orbs */
@property --c1 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 230, 160, 0.6);
}
@property --c2 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 140, 90, 0.48);
}
@property --c3 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 190, 130, 0.48);
}

.orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform;
  z-index: 0;
}

.orb-1 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, var(--c1) 0%, transparent 70%);
  top: -120px;
  left: -80px;
  animation:
    orbFloat1 16s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite,
    orbColor1 11s ease-in-out infinite;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--c2) 0%, transparent 70%);
  top: 30%;
  right: -60px;
  animation:
    orbFloat2 20s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite,
    orbColor2 15s ease-in-out infinite;
}

.orb-3 {
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, var(--c3) 0%, transparent 70%);
  bottom: -80px;
  left: -40px;
  animation:
    orbFloat3 18s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite,
    orbColor3 13s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%   { transform: translate(0, 0)         scale(1); }
  18%  { transform: translate(80px, 160px)  scale(1.3); }
  35%  { transform: translate(30px, 340px)  scale(0.8); }
  52%  { transform: translate(140px, 500px) scale(1.4); }
  70%  { transform: translate(60px, 620px)  scale(0.75); }
  85%  { transform: translate(-20px, 420px) scale(1.15); }
  100% { transform: translate(0, 0)         scale(1); }
}
@keyframes orbFloat2 {
  0%   { transform: translate(0, 0)           scale(1); }
  15%  { transform: translate(-60px, -180px)  scale(0.7); }
  32%  { transform: translate(-130px, 80px)   scale(1.35); }
  50%  { transform: translate(-50px, 320px)   scale(0.85); }
  67%  { transform: translate(-160px, 180px)  scale(1.4); }
  82%  { transform: translate(-80px, -100px)  scale(0.9); }
  100% { transform: translate(0, 0)           scale(1); }
}
@keyframes orbFloat3 {
  0%   { transform: translate(0, 0)           scale(1); }
  20%  { transform: translate(100px, -200px)  scale(1.25); }
  38%  { transform: translate(60px, -420px)   scale(0.72); }
  55%  { transform: translate(180px, -560px)  scale(1.38); }
  72%  { transform: translate(90px, -320px)   scale(0.8); }
  88%  { transform: translate(40px, -140px)   scale(1.2); }
  100% { transform: translate(0, 0)           scale(1); }
}
@keyframes orbColor1 {
  0%   { --c1: rgba(255, 230, 160, 0.6); }
  28%  { --c1: rgba(255, 150, 100, 0.5); }
  55%  { --c1: rgba(255, 190, 150, 0.55); }
  78%  { --c1: rgba(255, 110, 80, 0.4); }
  100% { --c1: rgba(255, 230, 160, 0.6); }
}
@keyframes orbColor2 {
  0%   { --c2: rgba(255, 140, 90, 0.48); }
  25%  { --c2: rgba(255, 220, 140, 0.52); }
  52%  { --c2: rgba(255, 100, 75, 0.42); }
  75%  { --c2: rgba(255, 185, 120, 0.5); }
  100% { --c2: rgba(255, 140, 90, 0.48); }
}
@keyframes orbColor3 {
  0%   { --c3: rgba(255, 190, 130, 0.48); }
  30%  { --c3: rgba(255, 120, 85, 0.44); }
  58%  { --c3: rgba(255, 240, 170, 0.56); }
  82%  { --c3: rgba(255, 160, 110, 0.5); }
  100% { --c3: rgba(255, 190, 130, 0.48); }
}
</style>
