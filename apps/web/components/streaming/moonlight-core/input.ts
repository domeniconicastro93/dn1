
import { StreamControllerButton, StreamKeyModifiers, StreamKeys, StreamMouseButton, StreamControllerCapabilities } from "./api-bindings";
import { ByteBuffer, I16_MAX, U16_MAX, U8_MAX } from "./buffer";

// --- Keyboard Helpers ---

export function convertToModifiers(event: KeyboardEvent): number {
    let modifiers = 0;
    if (event.shiftKey) modifiers |= StreamKeyModifiers.MASK_SHIFT;
    if (event.ctrlKey) modifiers |= StreamKeyModifiers.MASK_CTRL;
    if (event.altKey) modifiers |= StreamKeyModifiers.MASK_ALT;
    if (event.metaKey) modifiers |= StreamKeyModifiers.MASK_META;
    return modifiers;
}

const VK_MAPPINGS: Record<string, number | null> = {
    Escape: StreamKeys.VK_ESCAPE,
    Digit1: StreamKeys.VK_KEY_1, Digit2: StreamKeys.VK_KEY_2, Digit3: StreamKeys.VK_KEY_3,
    Digit4: StreamKeys.VK_KEY_4, Digit5: StreamKeys.VK_KEY_5, Digit6: StreamKeys.VK_KEY_6,
    Digit7: StreamKeys.VK_KEY_7, Digit8: StreamKeys.VK_KEY_8, Digit9: StreamKeys.VK_KEY_9,
    Digit0: StreamKeys.VK_KEY_0,
    Minus: StreamKeys.VK_OEM_MINUS, Equal: StreamKeys.VK_OEM_PLUS, Backspace: StreamKeys.VK_BACK,
    Tab: StreamKeys.VK_TAB,
    KeyQ: StreamKeys.VK_KEY_Q, KeyW: StreamKeys.VK_KEY_W, KeyE: StreamKeys.VK_KEY_E, KeyR: StreamKeys.VK_KEY_R,
    KeyT: StreamKeys.VK_KEY_T, KeyY: StreamKeys.VK_KEY_Y, KeyU: StreamKeys.VK_KEY_U, KeyI: StreamKeys.VK_KEY_I,
    KeyO: StreamKeys.VK_KEY_O, KeyP: StreamKeys.VK_KEY_P,
    BracketLeft: StreamKeys.VK_OEM_4, BracketRight: StreamKeys.VK_OEM_6, Enter: StreamKeys.VK_RETURN,
    ControlLeft: StreamKeys.VK_LCONTROL,
    KeyA: StreamKeys.VK_KEY_A, KeyS: StreamKeys.VK_KEY_S, KeyD: StreamKeys.VK_KEY_D, KeyF: StreamKeys.VK_KEY_F,
    KeyG: StreamKeys.VK_KEY_G, KeyH: StreamKeys.VK_KEY_H, KeyJ: StreamKeys.VK_KEY_J, KeyK: StreamKeys.VK_KEY_K,
    KeyL: StreamKeys.VK_KEY_L,
    Semicolon: StreamKeys.VK_OEM_1, Quote: StreamKeys.VK_OEM_7, Backquote: StreamKeys.VK_OEM_3,
    ShiftLeft: StreamKeys.VK_LSHIFT, Backslash: StreamKeys.VK_OEM_5,
    KeyZ: StreamKeys.VK_KEY_Z, KeyX: StreamKeys.VK_KEY_X, KeyC: StreamKeys.VK_KEY_C, KeyV: StreamKeys.VK_KEY_V,
    KeyB: StreamKeys.VK_KEY_B, KeyN: StreamKeys.VK_KEY_N, KeyM: StreamKeys.VK_KEY_M,
    Comma: StreamKeys.VK_OEM_COMMA, Period: StreamKeys.VK_OEM_PERIOD, Slash: StreamKeys.VK_OEM_2,
    ShiftRight: StreamKeys.VK_RSHIFT,
    NumpadMultiply: StreamKeys.VK_MULTIPLY, AltLeft: StreamKeys.VK_LMENU, Space: StreamKeys.VK_SPACE,
    CapsLock: StreamKeys.VK_CAPITAL,
    F1: StreamKeys.VK_F1, F2: StreamKeys.VK_F2, F3: StreamKeys.VK_F3, F4: StreamKeys.VK_F4,
    F5: StreamKeys.VK_F5, F6: StreamKeys.VK_F6, F7: StreamKeys.VK_F7, F8: StreamKeys.VK_F8,
    F9: StreamKeys.VK_F9, F10: StreamKeys.VK_F10, F11: StreamKeys.VK_F11, F12: StreamKeys.VK_F12,
    ArrowUp: StreamKeys.VK_UP, ArrowDown: StreamKeys.VK_DOWN, ArrowLeft: StreamKeys.VK_LEFT, ArrowRight: StreamKeys.VK_RIGHT,
    Home: StreamKeys.VK_HOME, End: StreamKeys.VK_END, PageUp: StreamKeys.VK_PRIOR, PageDown: StreamKeys.VK_NEXT,
    Insert: StreamKeys.VK_INSERT, Delete: StreamKeys.VK_DELETE,
    MetaLeft: StreamKeys.VK_LWIN, MetaRight: StreamKeys.VK_RWIN,
    ContextMenu: StreamKeys.VK_APPS,
    NumLock: StreamKeys.VK_NUMLOCK, ScrollLock: StreamKeys.VK_SCROLL,
    Numpad0: StreamKeys.VK_NUMPAD0, Numpad1: StreamKeys.VK_NUMPAD1, Numpad2: StreamKeys.VK_NUMPAD2,
    Numpad3: StreamKeys.VK_NUMPAD3, Numpad4: StreamKeys.VK_NUMPAD4, Numpad5: StreamKeys.VK_NUMPAD5,
    Numpad6: StreamKeys.VK_NUMPAD6, Numpad7: StreamKeys.VK_NUMPAD7, Numpad8: StreamKeys.VK_NUMPAD8,
    Numpad9: StreamKeys.VK_NUMPAD9,
    NumpadAdd: StreamKeys.VK_ADD, NumpadSubtract: StreamKeys.VK_SUBTRACT, NumpadDecimal: StreamKeys.VK_DECIMAL,
    NumpadEnter: StreamKeys.VK_RETURN, NumpadDivide: StreamKeys.VK_DIVIDE,
    VolumeMute: StreamKeys.VK_VOLUME_MUTE, VolumeDown: StreamKeys.VK_VOLUME_DOWN, VolumeUp: StreamKeys.VK_VOLUME_UP,
    MediaTrackNext: StreamKeys.VK_MEDIA_NEXT_TRACK, MediaTrackPrevious: StreamKeys.VK_MEDIA_PREV_TRACK,
    MediaStop: StreamKeys.VK_MEDIA_STOP, MediaPlayPause: StreamKeys.VK_MEDIA_PLAY_PAUSE,
};

export function convertToKey(event: KeyboardEvent): number | null {
    let key = VK_MAPPINGS[event.code] ?? null;
    if (key == null) {
        key = VK_MAPPINGS[event.key] ?? null;
    }
    return key;
}

// --- Mouse Helpers ---

const BUTTON_MAPPINGS = [StreamMouseButton.LEFT, StreamMouseButton.MIDDLE, StreamMouseButton.RIGHT];

export function convertToButton(event: MouseEvent): number | null {
    return BUTTON_MAPPINGS[event.button] ?? null;
}

// --- Gamepad Helpers ---

const STANDARD_BUTTONS = [
    StreamControllerButton.BUTTON_B,
    StreamControllerButton.BUTTON_A,
    StreamControllerButton.BUTTON_Y,
    StreamControllerButton.BUTTON_X,
    StreamControllerButton.BUTTON_LB,
    StreamControllerButton.BUTTON_RB,
    null, // LT
    null, // RT
    StreamControllerButton.BUTTON_BACK,
    StreamControllerButton.BUTTON_PLAY,
    StreamControllerButton.BUTTON_LS_CLK,
    StreamControllerButton.BUTTON_RS_CLK,
    StreamControllerButton.BUTTON_UP,
    StreamControllerButton.BUTTON_DOWN,
    StreamControllerButton.BUTTON_LEFT,
    StreamControllerButton.BUTTON_RIGHT,
    StreamControllerButton.BUTTON_SPECIAL,
];

export const SUPPORTED_BUTTONS = StreamControllerButton.BUTTON_A | StreamControllerButton.BUTTON_B | StreamControllerButton.BUTTON_X | StreamControllerButton.BUTTON_Y | StreamControllerButton.BUTTON_UP | StreamControllerButton.BUTTON_DOWN | StreamControllerButton.BUTTON_LEFT | StreamControllerButton.BUTTON_RIGHT | StreamControllerButton.BUTTON_LB | StreamControllerButton.BUTTON_RB | StreamControllerButton.BUTTON_PLAY | StreamControllerButton.BUTTON_BACK | StreamControllerButton.BUTTON_LS_CLK | StreamControllerButton.BUTTON_RS_CLK | StreamControllerButton.BUTTON_SPECIAL;

function convertStandardButton(buttonIndex: number, config: any): number | null {
    let button = STANDARD_BUTTONS[buttonIndex] ?? null;
    if (config?.invertAB) {
        if (button === StreamControllerButton.BUTTON_A) button = StreamControllerButton.BUTTON_B;
        else if (button === StreamControllerButton.BUTTON_B) button = StreamControllerButton.BUTTON_A;
    }
    if (config?.invertXY) {
        if (button === StreamControllerButton.BUTTON_X) button = StreamControllerButton.BUTTON_Y;
        else if (button === StreamControllerButton.BUTTON_Y) button = StreamControllerButton.BUTTON_X;
    }
    return button;
}

export function extractGamepadState(gamepad: Gamepad, config: any) {
    let buttonFlags = 0;
    for (let buttonId = 0; buttonId < gamepad.buttons.length; buttonId++) {
        const button = gamepad.buttons[buttonId];
        const buttonFlag = convertStandardButton(buttonId, config);
        if (button.pressed && buttonFlag !== null) {
            buttonFlags |= buttonFlag;
        }
    }
    const leftTrigger = gamepad.buttons[6]?.value || 0;
    const rightTrigger = gamepad.buttons[7]?.value || 0;
    const leftStickX = gamepad.axes[0] || 0;
    const leftStickY = gamepad.axes[1] || 0;
    const rightStickX = gamepad.axes[2] || 0;
    const rightStickY = gamepad.axes[3] || 0;
    return {
        buttonFlags,
        leftTrigger,
        rightTrigger,
        leftStickX,
        leftStickY,
        rightStickX,
        rightStickY
    };
}

// --- StreamInput Class ---

function trySendChannel(channel: RTCDataChannel | null, buffer: ByteBuffer) {
    if (!channel || channel.readyState !== "open") {
        return;
    }
    buffer.flip();
    const readBuffer = buffer.getReadBuffer();
    if (readBuffer.length === 0) {
        throw new Error("illegal buffer size");
    }
    channel.send(readBuffer as any);
}

export function defaultStreamInputConfig() {
    return {
        mouseMode: "follow",
        mouseScrollMode: "highres",
        touchMode: "pointAndDrag",
        controllerConfig: {
            invertAB: false,
            invertXY: false
        }
    };
}

export class StreamInput {
    private eventTarget = new EventTarget();
    private peer: RTCPeerConnection | null = null;
    private buffer = new ByteBuffer(1024);
    private connected = false;
    private capabilities: any = { touch: true };
    private streamerSize = [0, 0];

    private keyboard: RTCDataChannel | null = null;
    private mouseClicks: RTCDataChannel | null = null;
    private mouseAbsolute: RTCDataChannel | null = null;
    private mouseRelative: RTCDataChannel | null = null;
    private touch: RTCDataChannel | null = null;
    private controllers: RTCDataChannel | null = null;
    private controllerInputs: (RTCDataChannel | null)[] = [];

    private config: any;
    private gamepads: (number | null)[] = [];
    private gamepadRumbleInterval: number | null = null;
    private gamepadRumbleCurrent: any[] = [];
    private bufferedControllers: number[] = [];

    constructor(config: any, peer?: RTCPeerConnection) {
        this.config = defaultStreamInputConfig();
        if (config) this.setConfig(config);
        if (peer) this.setPeer(peer);
    }

    setPeer(peer: RTCPeerConnection) {
        if (this.peer) {
            this.keyboard?.close();
            this.mouseClicks?.close();
            this.mouseAbsolute?.close();
            this.mouseRelative?.close();
            this.touch?.close();
            this.controllers?.close();
            this.controllerInputs.forEach(c => c?.close());
        }
        this.peer = peer;
        this.keyboard = peer.createDataChannel("keyboard");
        this.mouseClicks = peer.createDataChannel("mouseClicks", { ordered: false });
        this.mouseAbsolute = peer.createDataChannel("mouseAbsolute", { ordered: true, maxRetransmits: 0 });
        this.mouseRelative = peer.createDataChannel("mouseRelative", { ordered: false });
        this.touch = peer.createDataChannel("touch");
        this.controllers = peer.createDataChannel("controllers");
        this.controllers.addEventListener("message", this.onControllerMessage.bind(this));
    }

    setConfig(config: any) {
        Object.assign(this.config, config);
    }

    onStreamStart(capabilities: any, streamerSize: number[]) {
        this.connected = true;
        this.capabilities = capabilities;
        this.streamerSize = streamerSize;
        this.registerBufferedControllers();
    }

    // Keyboard
    onKeyDown(event: KeyboardEvent) {
        if (event.repeat) return;
        this.sendKeyEvent(true, event);
    }

    onKeyUp(event: KeyboardEvent) {
        this.sendKeyEvent(false, event);
    }

    sendKeyEvent(isDown: boolean, event: KeyboardEvent) {
        this.buffer.reset();
        const key = convertToKey(event);
        if (!key) return;
        const modifiers = convertToModifiers(event);
        this.sendKey(isDown, key, modifiers);
    }

    sendKey(isDown: boolean, key: number, modifiers: number) {
        this.buffer.putU8(0);
        this.buffer.putBool(isDown);
        this.buffer.putU8(modifiers);
        this.buffer.putU16(key);
        trySendChannel(this.keyboard, this.buffer);
    }

    // Mouse
    onMouseDown(event: MouseEvent, rect: DOMRect) {
        const button = convertToButton(event);
        if (button == null) return;

        if (this.config.mouseMode === "relative" || this.config.mouseMode === "follow") {
            this.sendMouseButton(true, button);
        } else if (this.config.mouseMode === "pointAndDrag") {
            this.sendMousePositionClientCoordinates(event.clientX, event.clientY, rect, button);
        }
    }

    onMouseUp(event: MouseEvent) {
        const button = convertToButton(event);
        if (button == null) return;
        this.sendMouseButton(false, button);
    }

    onMouseMove(event: MouseEvent, rect: DOMRect) {
        if (this.config.mouseMode === "relative") {
            this.sendMouseMoveClientCoordinates(event.movementX, event.movementY, rect);
        } else if (this.config.mouseMode === "follow") {
            this.sendMousePositionClientCoordinates(event.clientX, event.clientY, rect);
        }
    }

    onMouseWheel(event: WheelEvent) {
        if (this.config.mouseScrollMode === "highres") {
            this.sendMouseWheelHighRes(event.deltaX, -event.deltaY);
        } else {
            this.sendMouseWheel(event.deltaX, -event.deltaY);
        }
    }

    sendMouseMove(movementX: number, movementY: number) {
        this.buffer.reset();
        this.buffer.putU8(0);
        this.buffer.putI16(movementX);
        this.buffer.putI16(movementY);
        trySendChannel(this.mouseRelative, this.buffer);
    }

    sendMouseMoveClientCoordinates(movementX: number, movementY: number, rect: DOMRect) {
        const scaledMovementX = movementX / rect.width * this.streamerSize[0];
        const scaledMovementY = movementY / rect.height * this.streamerSize[1];
        this.sendMouseMove(scaledMovementX, scaledMovementY);
    }

    sendMousePosition(x: number, y: number, referenceWidth: number, referenceHeight: number) {
        this.buffer.reset();
        this.buffer.putU8(1);
        this.buffer.putI16(x);
        this.buffer.putI16(y);
        this.buffer.putI16(referenceWidth);
        this.buffer.putI16(referenceHeight);
        trySendChannel(this.mouseAbsolute, this.buffer);
    }

    calcNormalizedPosition(clientX: number, clientY: number, rect: DOMRect) {
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        if (x < 0 || x > 1.0 || y < 0 || y > 1.0) return null;
        return [x, y];
    }

    sendMousePositionClientCoordinates(clientX: number, clientY: number, rect: DOMRect, mouseButton?: number) {
        const position = this.calcNormalizedPosition(clientX, clientY, rect);
        if (position) {
            const [x, y] = position;
            this.sendMousePosition(x * 4096.0, y * 4096.0, 4096.0, 4096.0);
            if (mouseButton !== undefined) {
                this.sendMouseButton(true, mouseButton);
            }
        }
    }

    sendMouseButton(isDown: boolean, button: number) {
        this.buffer.reset();
        this.buffer.putU8(2);
        this.buffer.putBool(isDown);
        this.buffer.putU8(button);
        trySendChannel(this.mouseClicks, this.buffer);
    }

    sendMouseWheelHighRes(deltaX: number, deltaY: number) {
        this.buffer.reset();
        this.buffer.putU8(3);
        this.buffer.putI16(deltaX);
        this.buffer.putI16(deltaY);
        trySendChannel(this.mouseClicks, this.buffer);
    }

    sendMouseWheel(deltaX: number, deltaY: number) {
        this.buffer.reset();
        this.buffer.putU8(4);
        this.buffer.putI8(deltaX);
        this.buffer.putI8(deltaY);
        trySendChannel(this.mouseClicks, this.buffer);
    }

    // Gamepad
    registerBufferedControllers() {
        const gamepads = navigator.getGamepads();
        for (const index of this.bufferedControllers.splice(0)) {
            const gamepad = gamepads[index];
            if (gamepad) this.onGamepadConnect(gamepad);
        }
    }

    onGamepadConnect(gamepad: Gamepad) {
        if (!this.connected) {
            this.bufferedControllers.push(gamepad.index);
            return;
        }
        if (this.gamepads.indexOf(gamepad.index) !== -1) return;

        let id = -1;
        for (let i = 0; i < this.gamepads.length; i++) {
            if (this.gamepads[i] == null) {
                this.gamepads[i] = gamepad.index;
                id = i;
                break;
            }
        }
        if (id === -1) {
            id = this.gamepads.length;
            this.gamepads.push(gamepad.index);
        }

        if (this.gamepadRumbleInterval == null) {
            this.gamepadRumbleInterval = window.setInterval(this.onGamepadRumbleInterval.bind(this), 60 - 10);
        }
        this.gamepadRumbleCurrent[0] = { lowFrequencyMotor: 0, highFrequencyMotor: 0, leftTrigger: 0, rightTrigger: 0 };

        // Simplified capabilities check
        const capabilities = StreamControllerCapabilities.CAPABILITY_RUMBLE | StreamControllerCapabilities.CAPABILITY_TRIGGER_RUMBLE;

        this.sendControllerAdd(this.gamepads.length - 1, SUPPORTED_BUTTONS, capabilities);
    }

    onGamepadDisconnect(event: GamepadEvent) {
        const index = this.gamepads.indexOf(event.gamepad.index);
        if (index !== -1) {
            const id = this.gamepads[index];
            if (id != null) this.sendControllerRemove(id);
            this.gamepads[index] = null;
        }
    }

    onGamepadUpdate() {
        for (let gamepadId = 0; gamepadId < this.gamepads.length; gamepadId++) {
            const gamepadIndex = this.gamepads[gamepadId];
            if (gamepadIndex == null) continue;

            const gamepad = navigator.getGamepads()[gamepadIndex];
            if (!gamepad || gamepad.mapping !== "standard") continue;

            const state = extractGamepadState(gamepad, this.config.controllerConfig);
            this.sendController(gamepadId, state);
        }
    }

    onControllerMessage(event: MessageEvent) {
        if (!(event.data instanceof ArrayBuffer)) return;
        this.buffer.reset();
        this.buffer.putU8Array(new Uint8Array(event.data));
        this.buffer.flip();
        const ty = this.buffer.getU8();
        // Handle rumble messages... (simplified for brevity, can be expanded)
    }

    onGamepadRumbleInterval() {
        // Handle rumble interval...
    }

    sendControllerAdd(id: number, supportedButtons: number, capabilities: number) {
        this.buffer.reset();
        this.buffer.putU8(0);
        this.buffer.putU8(id);
        this.buffer.putU32(supportedButtons);
        this.buffer.putU16(capabilities);
        trySendChannel(this.controllers, this.buffer);
    }

    sendControllerRemove(id: number) {
        this.buffer.reset();
        this.buffer.putU8(1);
        this.buffer.putU8(id);
        trySendChannel(this.controllers, this.buffer);
    }

    sendController(id: number, state: any) {
        this.buffer.reset();
        this.buffer.putU8(0);
        this.buffer.putU32(state.buttonFlags);
        this.buffer.putU8(Math.max(0.0, Math.min(1.0, state.leftTrigger)) * U8_MAX);
        this.buffer.putU8(Math.max(0.0, Math.min(1.0, state.rightTrigger)) * U8_MAX);
        this.buffer.putI16(Math.max(-1.0, Math.min(1.0, state.leftStickX)) * I16_MAX);
        this.buffer.putI16(Math.max(-1.0, Math.min(1.0, -state.leftStickY)) * I16_MAX);
        this.buffer.putI16(Math.max(-1.0, Math.min(1.0, state.rightStickX)) * I16_MAX);
        this.buffer.putI16(Math.max(-1.0, Math.min(1.0, -state.rightStickY)) * I16_MAX);
        this.tryOpenControllerChannel(id);
        trySendChannel(this.controllerInputs[id], this.buffer);
    }

    tryOpenControllerChannel(id: number) {
        if (!this.controllerInputs[id]) {
            this.controllerInputs[id] = this.peer?.createDataChannel(`controller${id}`, {
                maxRetransmits: 0,
                ordered: true,
            }) ?? null;
        }
    }
}
