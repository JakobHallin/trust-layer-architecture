# Three-Lane Trust Architecture  
*A prototype for early separation of trusted automation from unknown traffic*

---

## Overview  
This project is a Docker-based prototype that explores whether separating known, legitimate automation at the earliest possible point using strong machine identity can reduce noise and false positives in downstream bot-detection systems.

It does not attempt to detect or block malicious bots on its own.
It provides a foundational trust layer that other detection and enforcement systems can build on.

---
## Frontend visualization

This repository includes a small UI that visualizes an earlier, broader
baseline trust model explored during design.

The current README and Nginx configuration describe the narrower, enforceable
scope implemented in this prototype.

## Problem statment

Modern web traffic includes:

- human users  
- AI agents  
- scrapers and crawlers  
- headless browsers  
- automation operating via DOM, scripts, or screenshots  

Most bot-mitigation systems attempt to distinguish these actors **after** they begin interacting with the application, using behavioral or ML-based analysis. Early behavior, however, is often ambiguous and noisy.

This prototype explores a different question:
>What if known, intentional automation could be removed from the detection problem entirely before any behavior analysis occurs?

## Core Idea

The system applies identity-first separation for automation:

- Verified automation authenticates using strong machine identity (mTLS) and is routed into a Trusted Lane
- All other traffic defaults to a Public Lane
- Failed or suspicious verification results in early rejection

Behavioral or ML-based bot detection is assumed to operate only on Public Lane traffic, with reduced noise and fewer false positives.

Identity is the first filter, not the final decision.



## What “Verified Automation” Means

In this prototype, verified automation refers to automation that is:
- intentionally operated
- explicitly enrolled
- cryptographically identifiable by the service owner

Verified automation may be operated by:

- Internal automation
Services, jobs, or agents owned and operated by the organization.

- Partner automation
Automation operated by trusted third parties with an explicit enrollment relationship.

- Vendor automation
Automation operated by external vendors providing integrated services.

All verified automation:
- authenticates via mTLS
- is routed into the Trusted Lane
- may carry policy metadata, but does not require separate trust lanes

This system does not attempt to authenticate arbitrary third-party bots on the open internet.


## Lane model
### 1. Trusted Lane: Verified Automation (explicit)

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

This includes:

- human users
- browsers
- unkown or unenrolled automation

 This is where: 
 - rate limit:
 - behavioral heuristics
 - ML-based bot detection

would be applied (conceptual only in this prototype).

## 3. Blocked Lane: Failed Verification (implicit)

Requests that fail verification or are explicitly classified as malicious are rejected early (HTTP 403).

This is a decision, not a separate backend destination.


## Why early seperations helps
By removing verified automation before behavioral analysis:

- detection systems receive cleaner signals
- false positives decrease
- enforcement decisions become safer
- trusted automation never competes with unknown traffic

If automation in the Public Lane exhibits bot-like behavior, it can be treated with significantly higher confidence as potentially harmful because verified automation is expected to authenticate.


## What This Prototype Does Not Do


- It does not identify humans
- It does not detect malicious bots
- It does not implement ML or swarm detection
- It does not provide production-grade PKI

These concerns are intentionally out of scope. (might me looked at later)


## Intended Scope

This approach is most effective in environments where:

- some automation can be explicitly enrolled
- machine identity is feasible
- downstream detection systems already exist

It is designed as a foundational trust layer, not a complete bot-mitigation solution.

## High-Level Architecture
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


## Summary
```
Verified automation is separated immediately.
Unknown traffic is isolated by default.
Detection operates only where uncertainty exists.

Identity is the first filter, not the final answer.
```

## Limitations
- PKI is simplified and not production-hardened

- No certificate rotation or revocation

- Verification logic is intentionally minimal

- Public Lane enforcement is conceptual

- Googlebot verification (if present) is demonstrative only










