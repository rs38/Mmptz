// ============================================================================
// VECTR-8 // Keyboard Input State, Keybindings & Action Handlers
// ============================================================================

export const controls = {
  up: 0,
  down: 0,
  forward: 0,
  backward: 0,
  left: 0,
  right: 0,
  yawLeft: 0,
  yawRight: 0,
  rollLeft: 0,
  rollRight: 0,
};

export function initInput(actions = {}) {
  function handleKey(e, isDown) {
    if (e.target.tagName === 'INPUT' && e.code !== 'Space') return;

    const val = isDown ? 1 : 0;
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        controls.up = val;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        controls.down = val;
        break;
      case 'KeyW':
      case 'ArrowUp':
        controls.forward = val;
        break;
      case 'KeyS':
      case 'ArrowDown':
        controls.backward = val;
        break;
      case 'KeyA':
        controls.left = val;
        break;
      case 'KeyD':
        controls.right = val;
        break;
      case 'KeyQ':
        controls.yawLeft = val;
        break;
      case 'KeyE':
        controls.yawRight = val;
        break;
      case 'ArrowLeft':
      case 'KeyZ':
        controls.rollLeft = val;
        break;
      case 'ArrowRight':
      case 'KeyX':
        controls.rollRight = val;
        break;
      default:
        break;
    }

    if (isDown && !e.repeat) {
      if (e.code === 'KeyF' && actions.toggleFan) actions.toggleFan();
      if (e.code === 'KeyB' && actions.toggleRenderMode) actions.toggleRenderMode();
      if (e.code === 'KeyT' && actions.refuel) actions.refuel();
      if (e.code === 'KeyG' && actions.toggleStabilizer) actions.toggleStabilizer();
      if (e.code === 'KeyH' && actions.toggleAutoHover) actions.toggleAutoHover();
      if (e.code === 'KeyV' && actions.toggleVectors) actions.toggleVectors();
      if (e.code === 'KeyC' && actions.cycleCamera) actions.cycleCamera();
      if (e.code === 'KeyR' && actions.reset) actions.reset();
      if (e.code === 'KeyM' && actions.toggleAudio) actions.toggleAudio();
    }
  }

  window.addEventListener('keydown', (e) => handleKey(e, true));
  window.addEventListener('keyup', (e) => handleKey(e, false));
}
