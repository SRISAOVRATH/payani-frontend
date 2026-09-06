import { BusFront, Lightbulb, Sparkles } from "lucide-react";

export default function BusVisual() {
  return (
    <div className="bus-visual" aria-label="PAYANI bus illustration">
      <div className="bus-glow" aria-hidden="true" />
      <div className="bus-art" aria-hidden="true">
        <div className="bus-destination">PAYANI</div>
        <div className="bus-roof" />
        <div className="bus-window-row">
          <div className="driver-window" />
          <div className="bus-window" />
          <div className="bus-window" />
          <div className="bus-window" />
          <div className="bus-window" />
        </div>
        <div className="bus-body-line" />
        <div className="bus-front">
          <div className="bus-windshield" />
          <div className="bus-grille" />
          <Lightbulb className="bus-light-left" size={14} />
          <Lightbulb className="bus-light-right" size={14} />
        </div>
        <div className="bus-wheel wheel-one" />
        <div className="bus-wheel wheel-two" />
      </div>
      <div className="bus-caption">
        <BusFront size={14} />
        LIVE CITY SERVICE
        <Sparkles size={12} />
      </div>
    </div>
  );
}
