import {
  Bell,
  Check,
  Eye,
  Monitor,
  Moon,
  RefreshCw,
  RotateCcw,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sun,
  Type,
} from "lucide-react";

import { useSettings } from "../context/SettingsContext";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${
        checked ? "is-on" : ""
      }`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}

function OptionButton({
  active,
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`settings-option ${
        active ? "is-selected" : ""
      }`}
      onClick={onClick}
    >
      {active && <Check size={14} />}
      <span>{children}</span>
    </button>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  children,
}) {
  return (
    <div className="settings-row">
      <div className="settings-row-icon">
        {icon}
      </div>

      <div className="settings-row-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <div className="settings-row-control">
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const {
    settings,
    updateSetting,
    resetSettings,
  } = useSettings();

  return (
    <main className="settings-page">
      <div className="page-intro">
        <div className="settings-eyebrow">
          APP CONTROL CENTER
        </div>

        <h1>Settings</h1>

        <p>
          Personalize your PAYANI experience and
          control how the app behaves.
        </p>
      </div>

      <div className="settings-layout">
        {/* Appearance */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <SlidersHorizontal size={18} />
            </div>

            <div>
              <h2>Theme & Appearance</h2>
              <p>
                Choose how PAYANI looks and feels.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <SettingsRow
              icon={<Sun size={16} />}
              title="Theme"
              description="Choose light, dark, or follow your device."
            >
              <div className="settings-options">
                <OptionButton
                  active={settings.theme === "light"}
                  onClick={() =>
                    updateSetting("theme", "light")
                  }
                >
                  <Sun size={13} />
                  Light
                </OptionButton>

                <OptionButton
                  active={settings.theme === "dark"}
                  onClick={() =>
                    updateSetting("theme", "dark")
                  }
                >
                  <Moon size={13} />
                  Dark
                </OptionButton>

                <OptionButton
                  active={settings.theme === "system"}
                  onClick={() =>
                    updateSetting("theme", "system")
                  }
                >
                  <Monitor size={13} />
                  System
                </OptionButton>
              </div>
            </SettingsRow>

            <SettingsRow
              icon={<SettingsIcon size={16} />}
              title="Accent color"
              description="Change the highlight color used across PAYANI."
            >
              <div className="accent-options">
                <button
                  type="button"
                  className={`accent-dot accent-blue ${
                    settings.accent === "blue"
                      ? "is-selected"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting("accent", "blue")
                  }
                  aria-label="Blue accent"
                />

                <button
                  type="button"
                  className={`accent-dot accent-teal ${
                    settings.accent === "teal"
                      ? "is-selected"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting("accent", "teal")
                  }
                  aria-label="Teal accent"
                />

                <button
                  type="button"
                  className={`accent-dot accent-violet ${
                    settings.accent === "violet"
                      ? "is-selected"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting("accent", "violet")
                  }
                  aria-label="Violet accent"
                />

                <button
                  type="button"
                  className={`accent-dot accent-amber ${
                    settings.accent === "amber"
                      ? "is-selected"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting("accent", "amber")
                  }
                  aria-label="Amber accent"
                />
              </div>
            </SettingsRow>

            <SettingsRow
              icon={<Type size={16} />}
              title="Text size"
              description="Adjust text size across the application."
            >
              <div className="settings-options">
                <OptionButton
                  active={
                    settings.fontSize === "small"
                  }
                  onClick={() =>
                    updateSetting(
                      "fontSize",
                      "small"
                    )
                  }
                >
                  Small
                </OptionButton>

                <OptionButton
                  active={
                    settings.fontSize === "medium"
                  }
                  onClick={() =>
                    updateSetting(
                      "fontSize",
                      "medium"
                    )
                  }
                >
                  Medium
                </OptionButton>

                <OptionButton
                  active={
                    settings.fontSize === "large"
                  }
                  onClick={() =>
                    updateSetting(
                      "fontSize",
                      "large"
                    )
                  }
                >
                  Large
                </OptionButton>
              </div>
            </SettingsRow>

            <SettingsRow
              icon={<Eye size={16} />}
              title="High contrast"
              description="Increase contrast for important interface elements."
            >
              <Toggle
                checked={settings.highContrast}
                onChange={(value) =>
                  updateSetting(
                    "highContrast",
                    value
                  )
                }
              />
            </SettingsRow>

            <SettingsRow
              icon={<SlidersHorizontal size={16} />}
              title="Compact interface"
              description="Reduce spacing to show more information on screen."
            >
              <Toggle
                checked={settings.compactMode}
                onChange={(value) =>
                  updateSetting(
                    "compactMode",
                    value
                  )
                }
              />
            </SettingsRow>

            <SettingsRow
              icon={<RefreshCw size={16} />}
              title="Smooth animations"
              description="Enable small transitions throughout PAYANI."
            >
              <Toggle
                checked={settings.animations}
                onChange={(value) =>
                  updateSetting(
                    "animations",
                    value
                  )
                }
              />
            </SettingsRow>
          </div>
        </section>

        {/* Live Data */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <RefreshCw size={18} />
            </div>

            <div>
              <h2>Live Data</h2>
              <p>
                Control how frequently PAYANI refreshes fleet data.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <SettingsRow
              icon={<RefreshCw size={16} />}
              title="Automatic refresh"
              description="Keep live bus information updated automatically."
            >
              <Toggle
                checked={settings.liveRefresh}
                onChange={(value) =>
                  updateSetting(
                    "liveRefresh",
                    value
                  )
                }
              />
            </SettingsRow>

            <SettingsRow
              icon={<RefreshCw size={16} />}
              title="Refresh interval"
              description="Choose how often live data should update."
            >
              <select
                className="settings-select"
                value={settings.refreshInterval}
                onChange={(event) =>
                  updateSetting(
                    "refreshInterval",
                    Number(event.target.value)
                  )
                }
                disabled={!settings.liveRefresh}
              >
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </SettingsRow>

            <SettingsRow
              icon={<Eye size={16} />}
              title="Show vehicle number"
              description="Display the physical vehicle ID below the bus name."
            >
              <Toggle
                checked={
                  settings.showVehicleNumber
                }
                onChange={(value) =>
                  updateSetting(
                    "showVehicleNumber",
                    value
                  )
                }
              />
            </SettingsRow>
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Bell size={18} />
            </div>

            <div>
              <h2>Notifications & Alerts</h2>
              <p>
                Control future PAYANI passenger alerts.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <SettingsRow
              icon={<Bell size={16} />}
              title="Bus notifications"
              description="Allow PAYANI to prepare saved-bus alerts."
            >
              <Toggle
                checked={
                  settings.busNotifications
                }
                onChange={(value) =>
                  updateSetting(
                    "busNotifications",
                    value
                  )
                }
              />
            </SettingsRow>

            <div className="settings-info-box">
              <Bell size={15} />

              <div>
                <strong>
                  Smart bus alerts are coming later.
                </strong>

                <span>
                  Your notification preference is
                  already stored and will be used when
                  live bus alerts are enabled.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Eye size={18} />
            </div>

            <div>
              <h2>Data & Privacy</h2>
              <p>
                Manage the preferences stored on this device.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-privacy-note">
              <strong>
                Your settings are stored locally.
              </strong>

              <span>
                PAYANI currently stores appearance and
                application preferences in your browser.
              </span>
            </div>

            <button
              type="button"
              className="settings-reset-button"
              onClick={resetSettings}
            >
              <RotateCcw size={15} />
              Reset all settings
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}