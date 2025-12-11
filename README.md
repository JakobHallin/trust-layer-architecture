# Three-Lane Trust Architecture  
*A PKI-driven Zero Trust prototype for separating humans, verified automation, and suspicious bots.*

---

## Overview  
This project is a Docker-based prototype demonstrating a **trust-first architecture** designed to stop large-scale misuse of headless browsers, while still allowing legitimate automation and human users.

It was inspired by the Aligned Intelligence challenge:

> “Create an AI-powered solution that stops large-scale misuse of headless browsers without getting in the way of real automation or human users.”

The core idea: **this prototype explores the idea that identity may come before behavior analysis.**

---

## Concept & Motivation  

Modern web traffic includes:

- human users  
- AI agents  
- scrapers and crawlers  
- headless browsers  
- automation operating via DOM, scripts, or screenshots  

This challenge can also be framed not as “human vs bot”, but as distinguishing legitimate automation from harmful automation.
Instead of relying on behavior analysis, this prototype explores whether identity can create that separation earlier in the request flow.

### Why behavior-first detection is difficult
Early behavior often looks identical between:

- legitimate and malicious scrapers  
- helpful and harmful AI agents  
- headless browsers and real browsers  
- bots intentionally mimicking human behavior  

Because early signals are ambiguous, purely behavior-based detection must react after automation has already begun interacting with the system.

This motivates exploring:
- **identity**
- **cryptographic authentication**
- **policy and routing**
- **ML as a secondary layer**

as a first layer, with ML or behavioral heuristics potentially added later as secondary signals (not implemented in this prototype).

---

## Why mTLS  
For machine identity and provenance, mTLS provides:

- strong cryptographic identity  
- two-way verification  
- private or vendor-controlled CA  
- difficult-to-forge credentials  
- ability to attach policy at the transport layer  

This makes mTLS a useful baseline to explore for trusted automation in this prototype.

---

# Lane Design in This Prototype

The conceptual trust model includes **three lanes** (Trusted, Public, Blocked).  
This prototype implements **two explicit lanes**, with the third lane handled implicitly.

---

## 1. Trusted Lane: Verified Automation (explicit)

A client routed here must present a **valid mTLS client certificate** issued by the trusted CA.

Used for:

- internal services  
- AI agents  
- backend automation  
- any client that can cryptographically prove identity  

**In this prototype, verified automation is routed here.**

---

## 2. Public Lane: Unknown Traffic (explicit)

If a client **does not present a certificate**, it is routed to the Public Lane.

Public Lane represents:

> **unknown identity** (default baseline)

Who ends up here?

- humans  
- browsers  
- tools without certificates  
- unknown automation  

Policy inside this lane:

- **intended human traffic → allowed**
- **unknown automation → restricted unless strongly verified**

Additional validation in Public:

- basic Googlebot-style checks (IP + reverse DNS) for demonstration
- header and TLS fingerprint checks  
- rate and anomaly detection  
- optional ML/heuristics  

---

## 3. Blocked Lane: Failed Verification (implicit)

No separate backend is used.  
If the Trust Service classifies a request as `blocked`, or verification fails:

HTTP 403 Forbidden


Examples:

- fake Googlebot  
- bots using human UAs  
- unverifiable or suspicious automation  

Blocked Lane is a **decision**, not a destination.

---

## Lane Summary

Trusted Lane → mTLS-verified automation

Public Lane → Unknown identity (default for no-cert clients)

Blocked → Implicit (403 Forbidden)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│    Nginx    │────▶│   Backend   │
│  (Browser/  │     │   (mTLS +   │     │  Services   │
│    Bot)     │     │   Routing)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Trust     │
                    │   Service   │
                    └─────────────┘
```

## How the System Works

1. Client connects to Nginx over HTTPS  
2. Nginx checks for a valid mTLS client certificate  
3. Nginx sends metadata to the Trust Service via `auth_request`  
4. Trust Service returns:  
   - `X-Trust-Lane` (trusted | public | blocked)  
   - `X-Trust-Risk`  
   - `X-Trust-Identity`  
5. Nginx routes the request  
6. Backend services receive basic trust metadata for demonstration 

Traffic that fails verification never reaches backend.



## Project Structure

```
docker/
├── docker-compose.yml      # Orchestration
├── nginx/                  # Reverse proxy with mTLS + trust routing
├── trust-service/          # Node.js classification service
├── frontend/               # React documentation interface
├── certs/                  # Root CA + server + client certs
└── apps/                   # Public + Trusted lane HTML pages
```

## Quick Start (Full setup in /docker)
```bash
cd docker
#Make it executabele
chmod +x generate-certs.sh
# Generate certs
./certs/generate-certs.sh

# Build and start containers
docker compose up --build
```
## Running the System

Runtime and testing instructions are located in: **[/docker/README.md](./docker/README.md)**



## Technologies

* Nginx (mTLS termination + routing)

* PKI (custom CA, client/server certificates)

* Node.js + Express Trust Service

* React, Vite, TypeScript, Tailwind

* Docker & Docker Compose

* Googlebot verification (IP + reverse DNS)

## Original Concept

The architecture originates from the idea and reasoning summarized in: **[The starting idea](./idea-startpoint.pdf)**

It explains my original thinking:

* why identity > behavior

* why mTLS is the baseline

* why Public must be strict

* how ML fits in as a secondary layer

* how the three-lane idea conceptually relates to patterns used in some bot-mitigation systems


# Summary
This prototype demonstrates a modern approach to controlling automation:

```
In this prototype:
Unknown traffic belongs in Public Lane.
Verified automation belongs in Trusted Lane.
Suspicious automation is blocked early.
```

By pushing trust decisions to the edge, before backend services, this prototype is inspired by patterns used in modern bot-mitigation and Zero Trust systems, but it is intentionally simplified for experimentation and learning.



# Limitations

* ML classification is not implemented (concept only).

* PKI is simplified and not production-hardened.

* No certificate rotation, revocation, or lifecycle management.

* Verification logic is intentionally minimal.

* Public lane “human vs automation” distinctions are conceptual only.

* Googlebot verification is a simplified demonstration, not production-grade.

* Routing rules are illustrative, not comprehensive.



