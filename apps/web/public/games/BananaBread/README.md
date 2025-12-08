# BananaBread FPS - Strike Arcade Integration

## Current Status

This directory contains a functional WebGL FPS game that works immediately. If you have the full BananaBread build files, you can replace the placeholder with the real game.

## File Structure

```
/games/bananabread/
  ├── index.html          # Main game entry point (currently placeholder FPS)
  └── README.md           # This file
```

## Integrating Real BananaBread Files

If you have the compiled BananaBread files (bb.js, bb.data, bb.mem, bb.wasm, etc.), place them in this directory:

```
/games/bananabread/
  ├── index.html          # Update to load bb.js
  ├── bb.js               # Compiled BananaBread JavaScript
  ├── bb.data             # Game data file
  ├── bb.mem              # Memory file (if needed)
  ├── bb.wasm             # WebAssembly file (if using WASM)
  └── cube2/              # Game assets directory
      ├── data/
      ├── packages/
      └── ...
```

Then update `index.html` to load the real BananaBread:

```html
<script src="bb.js"></script>
```

Or if using the cube2 structure:

```html
<script src="/games/BananaBread/cube2/js/main.js"></script>
```

## Current Implementation

The current `index.html` includes:

1. **Placeholder FPS Game**: A fully functional WebGL FPS that works immediately
   - WASD/Arrow keys to move
   - Mouse to aim and shoot
   - Enemies spawn and chase the player
   - Score system

2. **BananaBread Loader**: Attempts to load real BananaBread files if available
   - Falls back to placeholder if files not found
   - No errors if BananaBread files are missing

## Features

- ✅ Fullscreen support
- ✅ Pointer lock support
- ✅ Canvas-based rendering
- ✅ Responsive design
- ✅ Works in iframe
- ✅ Compatible with MediaRecorder for clip recording

## Testing

1. Visit `/arcade/bananabread` in Strike Arcade Mode
2. Game loads immediately (placeholder or real BananaBread)
3. Click to enable pointer lock
4. Use "Record Clip" button to record gameplay
5. Clips are saved and can be edited

## Notes

- The game is designed to work in an iframe
- All paths are relative to `/games/bananabread/`
- The placeholder game is fully functional and can be used as-is
- Real BananaBread files can be added without breaking existing functionality
