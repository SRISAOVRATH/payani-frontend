import { BusFront, Lightbulb, Sparkles } from "lucide-react";

export default function BusVisual() {
  return (
    <div className="bus-visual" aria-label="PAYANI bus illustration">
      <div className="bus-glow" />
      <div className="bus-art">
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
          <Lightbulb className="bus-light-left" size={15} />
          <Lightbulb className="bus-light-right" size={15} />
        </div>
        <div className="bus-wheel wheel-one" />
        <div className="bus-wheel wheel-two" />
      </div>
      <div className="bus-caption"><BusFront size={15} /> LIVE CITY SERVICE <Sparkles size={13} /></div>
    </div>
  );
}
