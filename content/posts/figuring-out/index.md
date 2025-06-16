+++
title = "Figuring things out when you don't know what you don't know"
description = "Taking a step back to evaluate how did I find myself in this situation and try to describe how I know what to look for next."
date = 2025-06-20
draft = true

[taxonomies]
categories = ["rant", "knowledge", "usb", "nanoleaf-saga"]
+++

A couple of months ago I bought the [Nanoleaf Pegboard Desk Dock](https://nanoleaf.me/en-EU/products/pegboard-desk-dock/?size=1), the latest and greatest in USB-hub-with-RGB-LEDs-and-hooks-for-gadgets technology. This invention unfortunately only supports the *real gamer* operating systems of Windows and macOS, which necessitated the development of a Linux driver.

Over the past few posts I've set up a [Windows VM with USB passthrough](../windows-vm-nixos), and attempted to [reverse-engineer the official drivers](../wireshark-usb). I've also written a basic device driver, which is going to be the subject of the next post. Today, however, I'm going to take a step back and try to look back at how I got here and how did I even know what to do next at each step of the way.

---

## Ask someone!

I actually did not do this until I already had a working prototype, but: email the vendor and ask them for help! Request technical documentation, schematics, specs, or anything else that might be useful. You literally have nothing to lose by messaging them. Had I done this in advance, I’d have saved a lot of time.

In my case, Nanoleaf tech support responded to me within 4 hours with the [full description of the protocol](https://nanoleaf.atlassian.net/wiki/spaces/nlapid/pages/2615574530/Nanoleaf+USB+Lightstrip+Communication+Protocol) that’s used both by the Desk Dock as well as their RGB strips (shoutout Manuela!), so my little driver could theoretically be used for both. The docs mostly confirmed what I had already discovered independently, but there were a couple of other minor features as well (like power and brightness management) that I did not know about, which was helpful.

## Remember that it was made by people like you

## Scope down the work

## Set up experiments

## Remember that it's logical (even if the logic is not known to you)

