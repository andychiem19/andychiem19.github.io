---
layout: writeup
title: 100G Ethernet Verification
subtitle: Open-source verification environment for 100G Ethernet, built in Python and cocotb
project: project-1
organization: Woodward McCoach Inc.
role: FPGA Development Engineer Co-op, sole contributor
timeline: Mar 2026 – Aug 2026
stack: [Python, cocotb, Ethernet]
---

<!-- DRAFT: written from your resume and project blurb. Check every technical claim before publishing. -->

## Overview

At Woodward McCoach I owned development of a 100G Ethernet verification suite, written in Python and cocotb and intended for open-source release. The suite builds a CAUI-4 transmit stream from scratch by implementing the IEEE 802.3 transmit path, and it was tested against the Versal DCMAC subsystem.

<!-- DRAFT: add the "why". What problem did the team have before this existed? -->
The goal was a reusable, standards-driven source of 100G traffic that could exercise the MAC end-to-end in simulation.

## Transmit path

Each stage below is its own model, so it can be checked in isolation and chained into the full path.

1. Packet generation
2. Virtual MAC
3. 64b/66b encode
4. Scrambler
5. Lane distribution
6. AM insertion
7. DCMAC interface
{: .path}

### Virtual MAC

An IEEE 802.3-compliant MAC layer built in Scapy adds the preamble, enforces the interframe gap and computes the frame check sequence, so every frame entering the PCS models is valid Ethernet.

### PCS: encoding, scrambling, distribution

<!-- DRAFT: check clause numbers and constants against your notes. -->
Frames are split into 64-bit blocks and given a 2-bit sync header (64b/66b). The payload is scrambled with the self-synchronizing polynomial `1 + x^39 + x^58`, then blocks are distributed round-robin across the PCS virtual lanes. Alignment markers are inserted periodically on each lane so the receiver can deskew and reorder lanes.

```python
# Illustrative sketch of the scrambler model, not the suite's source
def scramble(block: int, state: int) -> tuple[int, int]:
    out = 0
    for i in range(64):
        bit = ((block >> i) ^ (state >> 38) ^ (state >> 57)) & 1
        state = ((state << 1) | bit) & ((1 << 58) - 1)
        out |= bit << i
    return out, state
```

## Verification approach

<!-- DRAFT: fill in how the testbench was structured. -->
- How cocotb drove the DCMAC interface and what was checked on the other side
- How each stage model was validated on its own (reference vectors, spec examples)
- Which test scenarios were covered

{% include figure.html caption="Figure 1. Testbench structure." placeholder="Add a testbench block diagram" %}

## Results

<!-- DRAFT: add concrete outcomes (tests passing, bugs found, coverage). -->
Results coming soon.
{: .pending}

{% include figure.html caption="Figure 2. Simulation waveform." placeholder="Add a waveform or results plot" %}

## Takeaways

Beyond the code, I documented the project's standards and progress so future developers can extend the suite after my co-op.

<!-- DRAFT: add what you learned or would do differently. -->
