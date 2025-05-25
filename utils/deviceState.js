class DeviceStateManager {
  constructor() {
    this.deviceStates = new Map();
    this.emergencyAlerts = new Map();
  }

  triggerDevice(deviceId) {
    this.deviceStates.set(deviceId, {
      triggered: true,
      lastTriggered: new Date(),
      expiresAt: null // No expiration for manual triggers
    });
  }

  stopTrigger(deviceId) {
    this.deviceStates.delete(deviceId);
  }

  checkDeviceStatus(deviceId) {
    const state = this.deviceStates.get(deviceId);
    if (!state) {
      return {
        triggered: false,
        lastTriggered: null,
        isActive: false
      };
    }

    return {
      triggered: state.triggered,
      lastTriggered: state.lastTriggered,
      isActive: true
    };
  }

  // For emergency alerts (SOS signals)
  triggerEmergencyAlert(deviceId, contacts) {
    this.emergencyAlerts.set(deviceId, {
      triggeredAt: new Date(),
      contactsNotified: contacts,
      resolved: false
    });
  }

  resolveEmergencyAlert(deviceId) {
    const alert = this.emergencyAlerts.get(deviceId);
    if (alert) {
      alert.resolved = true;
      this.emergencyAlerts.set(deviceId, alert);
    }
  }

  getEmergencyAlertStatus(deviceId) {
    return this.emergencyAlerts.get(deviceId) || null;
  }
}

export const deviceStateManager = new DeviceStateManager();