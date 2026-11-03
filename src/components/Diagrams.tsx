import type { ProjectId } from "../data/content";
import { DiagramBox } from "./DiagramBox";

const t0 = { tabIndex: 0 } as const;

function Arrow({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
        <path d="M0 0L8 4L0 8z" />
      </marker>
    </defs>
  );
}

function EthernetDiagram() {
  return (
    <DiagramBox legend={["process", "io", "hw"]}>
      <div className="diagram" role="group" aria-label="Transmit path into the Versal DCMAC">
        <div className="group">
          <span className="group-label">Python testbench</span>
          <div {...t0} className="node process" data-info="Generates Ethernet frames with preamble, interframe gap, and frame check sequence.">
            Scapy packet generator
          </div>
          <div {...t0} className="node process" data-info="64b/66b encoding, scrambling, virtual lane distribution, and alignment marker insertion for 100GBASE-R transmit.">
            Virtual PCS/PMA
          </div>
          <div {...t0} className="node io" data-info="Drives the encoded lanes into the DCMAC in simulation.">
            cocotb interface
          </div>
        </div>
        <div {...t0} className="node hw" data-info="The Versal Ethernet MAC subsystem under test.">
          Versal DCMAC
        </div>
      </div>
    </DiagramBox>
  );
}

function SerdesDiagram() {
  return (
    <DiagramBox legend={["rtl", "hw"]} legendOverrides={{ hw: "Transceiver (hard IP)" }}>
      <div className="diagram serdes" role="group" aria-label="GTM and GTYP transceivers cross-connected between custom protocol blocks">
        <div className="group">
          <span className="group-label">SystemVerilog simulation</span>
          <div {...t0} className="node rtl" data-name="Custom protocol (GTM side)" data-info="Proprietary chip-to-chip protocol logic driving the GTM transceiver.">
            Custom protocol
          </div>
          <span className="wire" aria-hidden="true" />
          <div {...t0} className="node hw xcvr gtm" data-name="GTM transceiver" data-info="Its TX drives the GTYP's RX, and its RX receives from the GTYP's TX.">
            GTM<span className="port tx">TX</span>
            <span className="port rx">RX</span>
          </div>
          <svg
            {...t0}
            className="cross"
            data-name="Serial links"
            data-info="Cross-connected lanes between the two transceiver families. The bug: a bit-order incompatibility in the protocol across this link."
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="100" x2="100" y2="0" vectorEffect="non-scaling-stroke" />
          </svg>
          <div {...t0} className="node hw xcvr gtyp" data-name="GTYP transceiver" data-info="Its TX drives the GTM's RX, and its RX receives from the GTM's TX.">
            GTYP<span className="port tx">TX</span>
            <span className="port rx">RX</span>
          </div>
          <span className="wire" aria-hidden="true" />
          <div {...t0} className="node rtl" data-name="Custom protocol (GTYP side)" data-info="The same protocol logic on the GTYP side of the link.">
            Custom protocol
          </div>
        </div>
      </div>
    </DiagramBox>
  );
}

function AxiDiagram() {
  return (
    <DiagramBox legend={["rtl", "io", "debug"]}>
      <div className="sdiagram-wrap">
        <svg className="sdiagram" viewBox="0 0 480 232" role="group" aria-label="Performance monitor on a snapshot interface, an AXI-Lite slave, probed by a Vivado ILA">
          <Arrow id="ax-arrow" />
          <path className="link" d="M132 52H310" markerStart="url(#ax-arrow)" markerEnd="url(#ax-arrow)" />
          <text className="label" x="221" y="40">AXI-Lite bus</text>
          <path className="link dashed" d="M290 52V158" markerEnd="url(#ax-arrow)" />
          <text className="label" x="284" y="108" style={{ textAnchor: "end" }}>snoop</text>
          <path className="link dashed" d="M132 188H238" markerEnd="url(#ax-arrow)" />
          <text className="label" x="185" y="178">probe</text>
          <g {...t0} className="snode" data-name="AXI-Lite master" data-info="Issues AXI-Lite reads to the snapshot interface.">
            <rect x="12" y="22" width="120" height="60" />
            <text x="72" y="52">AXI-Lite master</text>
          </g>
          <g {...t0} className="snode" data-name="Snapshot interface" data-info="The AXI-Lite slave used to read out the board's performance data.">
            <path d="M320 22H470L460 82H310Z" />
            <text x="390" y="44.5">Snapshot interface</text>
            <text x="390" y="59.5">(AXI-Lite slave)</text>
          </g>
          <g
            {...t0}
            className="snode"
            data-name="Performance monitor"
            data-info="Sits on the snapshot interface and measures AXI-Lite performance through it. An off-by-one error made it pass in simulation but fail in hardware; fixing it took measured bandwidth from 70% to 100% of expected."
          >
            <rect x="240" y="158" width="150" height="60" />
            <text x="315" y="180.5">Performance</text>
            <text x="315" y="195.5">monitor</text>
          </g>
          <g {...t0} className="snode" data-name="Vivado ILA" data-info="Probed the monitor on hardware to compare it against simulation and root-cause the error.">
            <rect className="dotted" x="12" y="158" width="120" height="60" />
            <text x="72" y="188">Vivado ILA</text>
          </g>
        </svg>
      </div>
    </DiagramBox>
  );
}

function SwiftGreeksDiagram() {
  return (
    <DiagramBox legend={["ext", "process", "rtl", "hw"]} legendOverrides={{ process: "Software", hw: "Board hardware" }}>
      <div className="sdiagram-wrap">
        <svg className="sdiagram" viewBox="0 0 490 350" role="group" aria-label="swiftGreeks data path from market data API to the FPGA CORDIC core and back">
          <Arrow id="sg-arrow" />
          <rect className="grp" x="4" y="74" width="142" height="160" />
          <rect className="grp-bg" x="12" y="66" width="64" height="16" />
          <text className="grp-label" x="16" y="74">main.py</text>
          <rect className="grp" x="384" y="74" width="102" height="262" />
          <rect className="grp-bg" x="392" y="66" width="92" height="16" />
          <text className="grp-label" x="396" y="74">cordic_top.sv</text>
          <path className="link" d="M75 50V94" markerEnd="url(#sg-arrow)" />
          <path className="link" d="M132 190H196V304H223" markerStart="url(#sg-arrow)" markerEnd="url(#sg-arrow)" />
          <text className="label" x="190" y="250" style={{ textAnchor: "end" }}>Ethernet</text>
          <text className="label" x="190" y="264" style={{ textAnchor: "end" }}>cable</text>
          <path className="link" d="M258 278V172" markerEnd="url(#sg-arrow)" />
          <path className="link" d="M290 172V278" markerEnd="url(#sg-arrow)" />
          <text className="label" x="298" y="226" style={{ textAnchor: "start" }}>RGMII</text>
          <path className="link" d="M327 126H392" markerEnd="url(#sg-arrow)" />
          <text className="label" x="330" y="114" style={{ textAnchor: "start", fontSize: 10 }}>AXI-Stream</text>
          <path className="link" d="M392 290H352V156H327" markerEnd="url(#sg-arrow)" />
          <path className="link" d="M434 146V172" markerEnd="url(#sg-arrow)" />
          <path className="link" d="M434 232V268" markerEnd="url(#sg-arrow)" />
          <g {...t0} className="snode" data-name="API" data-info="Live market data source.">
            <rect x="20" y="10" width="110" height="40" rx="12" />
            <text x="75" y="30">API</text>
          </g>
          <g {...t0} className="snode" data-name="Websocket" data-info="main.py subscribes to the market data feed over a WebSocket.">
            <rect x="18" y="94" width="114" height="44" />
            <line x1="24" y1="94" x2="24" y2="138" />
            <line x1="126" y1="94" x2="126" y2="138" />
            <text x="75" y="116">Websocket</text>
          </g>
          <g {...t0} className="snode" data-name="Serializer (main.py)" data-info="Packs quotes into packets and sends them to the board over Ethernet.">
            <rect x="18" y="168" width="114" height="44" />
            <line x1="24" y1="168" x2="24" y2="212" />
            <line x1="126" y1="168" x2="126" y2="212" />
            <text x="75" y="190">Serializer</text>
          </g>
          <g {...t0} className="snode" data-name="Zybo Z7 PHY" data-info="The board's Ethernet PHY.">
            <rect x="223" y="282" width="104" height="44" />
            <rect x="226" y="285" width="98" height="38" />
            <text x="275" y="304">Zybo Z7 PHY</text>
          </g>
          <g {...t0} className="snode" data-name="Gigabit Ethernet MAC" data-info="Bridges RGMII from the PHY and AXI-Stream inside the FPGA.">
            <rect x="223" y="108" width="104" height="64" />
            <text x="275" y="132.5">Gigabit</text>
            <text x="275" y="147.5">Ethernet MAC</text>
          </g>
          <g {...t0} className="snode" data-name="Parser" data-info="Extracts option parameters from incoming packets.">
            <rect x="392" y="106" width="84" height="40" />
            <text x="434" y="126">Parser</text>
          </g>
          <g
            {...t0}
            className="snode"
            data-name="CORDIC"
            data-info="Parameterized Q16.16 fixed-point CORDIC core (circular, hyperbolic and linear modes) that computes Black-Scholes Greeks. Delta has 210 ns deterministic latency (63 cycles at 300MHz)."
          >
            <rect x="392" y="172" width="84" height="60" />
            <text x="434" y="202">CORDIC</text>
          </g>
          <g {...t0} className="snode" data-name="Serializer (cordic_top.sv)" data-info="Packs computed Greeks into packets and sends them back through the MAC.">
            <rect x="392" y="268" width="84" height="44" />
            <text x="434" y="290">Serializer</text>
          </g>
        </svg>
      </div>
    </DiagramBox>
  );
}

export const diagrams: Record<ProjectId, () => React.JSX.Element> = {
  ethernet: EthernetDiagram,
  serdes: SerdesDiagram,
  axi: AxiDiagram,
  swiftgreeks: SwiftGreeksDiagram,
};
