type NetworkState = "online" | "offline";
type Listener = (state: NetworkState) => void;

class NetworkTracker {
  private state: NetworkState = navigator.onLine ? "online" : "offline";
  private listeners = new Set<Listener>();

  constructor() {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  private handleOnline = () => this.updateState("online");
  private handleOffline = () => this.updateState("offline");

  private updateState(newState: NetworkState) {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach((fn) => fn(newState));
    }
  }

  get currentState() {
    return this.state;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static instance: NetworkTracker;
  static getInstance() {
    if (!this.instance) this.instance = new NetworkTracker();
    return this.instance;
  }
}

export const networkTracker = NetworkTracker.getInstance();
