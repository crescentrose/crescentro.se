+++
title = "Writing a basic Linux device driver when you know nothing about Linux drivers or USB"
description = "How difficult could it really be?"
date = 2025-06-21

[taxonomies]
categories = ["rust", "programming", "linux", "usb", "drivers", "nanoleaf-saga"]

[extra]
featured = true
+++

A couple of months ago I bought the [Nanoleaf Pegboard Desk Dock](https://nanoleaf.me/en-EU/products/pegboard-desk-dock/?size=1), the latest and greatest in USB-hub-with-RGB-LEDs-and-hooks-for-gadgets technology. This invention unfortunately only supports the *real gamer* operating systems of Windows and macOS, which necessitated the development of a Linux driver.

---

Over the past few posts I've set up a [Windows VM with USB passthrough](../windows-vm-nixos/), and attempted to [reverse-engineer the official drivers](../wireshark-usb/),  As I was doing that, I also thought I'd message the vendor and ask them if they could share any specifications or docs regarding their protocol. To my surprise, Nanoleaf tech support responded to me within 4 hours, with a full description of the protocol that’s used both by the Desk Dock as well as their RGB strips. The docs mostly confirmed what I had already discovered independently, but there were a couple of other minor features as well (like power and brightness management) that I did not know about, which was helpful.

Today, we're going to take a crack at writing a driver based on the (reverse-engineered) protocol, while also keeping [the official documentation](https://nanoleaf.atlassian.net/wiki/spaces/nlapid/pages/2615574530/Nanoleaf+USB+Lightstrip+Communication+Protocol) at hand. One small problem, though: I've never written a Linux device driver before, nor interacted with any USB device as anything else but a user.

{% admonition(title="Skip to the good part?") %}
Lots of yapping ahead. If you just want to see the code, [click here](#writing-a-basic-driver).
{% end %}

## Starting from scratch

Most Linux distros ship with [`lsusb`](https://www.man7.org/linux/man-pages/man8/lsusb.8.html), a simple utility that will enumerate all USB devices connected to the system. Since I had no clue where to start from, I figured I might as well run this to see if the device appears in the listing.

```
$ lsusb
<snip>
Bus 001 Device 062: ID 37fa:8201 JW25021301515 Nanoleaf Pegboard Desk Dock
```

Well, good news, it's definitely there. But, how can the kernel know that what I have plugged in is the "Nanoleaf Pegboard Desk Dock"? The kernel (presumably) has no knowledge of this device's existence, yet the second I plug it in to my computer it receives power, turns on and gets identified by the kernel.

As it turns out, we actually already have a driver! It's just a very stupid one. If we run `lsusb` in verbose mode and request the information just for this specific device, we will get a lot more details about it:

{{ longcode(file = "./listing-1") }}

This is a *lot* of information, so we need to take a quick USB class.

## A quick USB class

The USB spec is long, complicated and mainly aimed at low-level implementations (think kernel developers, device vendors, and so on). You can, of course, still read it if you enjoy being bored. But, thankfully, a kind soul collected the good parts into [USB in a NutShell](https://www.beyondlogic.org/usbnutshell/usb1.shtml).

To summarize the summary, a USB device can have multiple **configurations**, which usually explain the power requirements for the device. Most devices will have just one.

Each of those configurations can have multiple **interfaces**. So for example, a camera might serve as a file storage device as well as a webcam.

Finally, each interface can have multiple **endpoints**, whcih describe how the data is transferred. Perhaps the camera has an "isochronous" (continuous) transfer for a webcam feed, and a "bulk" transfer for moving image files over.

Going back to our device, we can see that it exposes one interface, which is a *Human Interface Device*. HIDs are a class of USB devices that covers things like keyboards, mice or gamepads, and each of those categories is a separate *sub-class*. The kernel contains a generic driver for USB HIDs - [here it is](https://github.com/torvalds/linux/blob/master/drivers/hid/usbhid/hid-core.c) in all of its C glory.

This is why the kernel developers do not need to write specific drivers for each individual keyboard and mouse on the market. Vendors will label their device with one of the well-known HID sub-classes, then use a common protocol to implement the functionality.

{% admonition(title="Trivia you can use to woo potential partners") %}
Here's [443 pages on generic HID implementations](https://usb.org/document-library/hid-usage-tables-16). Did you know that a USB keyboard minimally consists of *at least* 103 buttons according to the USB-IF, and everything else is a *keypad*? I promise I won't tell r/MechanicalKeyboards if you don't.
{% end %}

Unfortunately there's no HID specification for an RGB LED... thing (well, there's an "LED" specification, but it's mainly for things like status LEDs, not color LEDs) so our device is just a plain old generic HID with an interface sub-class of `0`. This means that the kernel recognizes it and powers it correctly, but it doesn't really know what to do with it, so it just lets it sit there.

There are two options that we have at this point:

1. We could write a kernel driver that follows the [kernel standard](https://docs.kernel.org/leds/leds-class.html) and exposes each individual LED as 3 devices (one per color) under `/sys/class/leds`. Interacting with the kernel devs sounds scary (yes I realize I'm a grown-ass adult man), but even if it wasn't, I question the utility of trying to merge drivers for a very niche product into the kernel. Also, `/sys/class/leds` feels like it's intended for status LEDs and not <mark class="funky">gamer colors</mark> anyway.
2. We could write a userspace driver through [libusb](https://github.com/libusb/libusb), thus defining our own way of controlling LEDs and reducing the quality bar from "Linus Torvalds might send you a strongly worded letter if you fuck up" to "fuck it, we ball".

Given that I have no idea what I am doing, I'm gonna go for option 2, but if one of you brave souls goes for option 1, please let me know and I will print out a photo of you and frame it on my wall.

### Side quest: udev rules

To do anything fun on Linux, you need to be `root`. This is also the case when talking to USB devices. You could always run your drivers as `root`, thus sidestepping the problem. But we all know that's bad form. And if I am to distribute this driver, most people would expect to run it without privilege escalation.

Linux generally relies on [`udev`](https://wiki.archlinux.org/title/Udev) to manage handlers for hardware events. I will spare you the long story this time and just give you the magic incantation: to make your device accessible to users, you need to create a file at  `/etc/udev/rules.d/70-pegboard.rules` with the following contents:

```
ACTION=="add", SUBSYSTEM=="usb", DRIVERS=="usb", ATTRS{idVendor}=="37fa", ATTRS{idProduct}=="8201", MODE="0770", TAG+="uaccess"
```

where `ATTRS{idVendor}` and `ATTRS{idProduct}` are the vendor and product IDs you got from `lsusb`, and `TAG+="uaccess"` is the spell that grants the currently active user permissions to manage the device. Then, unplug your device and plug it back in.

{% details(title="Keep reading if you're using NixOS, and feel free to skip if you go outside sometimes.") %}

You can name the `.rules` file whatever you want, but, obviously, it [needs to come before `73` alphabetically](https://github.com/systemd/systemd/issues/4288#issuecomment-348166161). This is because fuck you, that's why. This poses an interesting challenge on NixOS, which, in its eternal wisdom, [provide only one way of adding custom rules, which writes to `99-local.rules`](https://nixos.org/manual/nixos/stable/options#opt-services.udev.extraRules). The solution to that is to make a custom package that defines the rule at the desired location, and then extend `services.udev.packages` with your new package. Thankfully, this is easily doable with the `pkgs.writeTextFile` helper, like so:

```nix
services.udev.packages = [
    (pkgs.writeTextFile {
        name = "pegboard_udev";
        text = ''
          ACTION=="add", SUBSYSTEM=="usb", DRIVERS=="usb", ATTRS{idVendor}=="37fa", ATTRS{idProduct}=="8201", MODE="0770", TAG+="uaccess"
        '';
        destination = "/etc/udev/rules.d/70-pegboard.rules";
    })
  ];
```
{% end %}

## Writing a basic driver

Okay, enough yapping. Let's start with a basic Rust binary and immediately add the [`rusb`](https://crates.io/crates/rusb) crate, which will serve as a binding to `libusb`.

```bash
cargo new gamer-driver
cd gamer-driver
cargo add rusb
```

To get going, we can try to get a handle on the device and get basic information about it, just like `lsusb`. This is explained pretty well in the crate readme, so I will not dwell on it too much. We'll need a `Context`, which gives us a handy `open_device_with_vid_pid` method that we can use to get a handle to a device.

```rust
use rusb::{Context, UsbContext};

const VENDOR: u16 = 0x37fa;
const DEVICE: u16 = 0x8201;

fn main() {
    let context = Context::new().expect("cannot open libusb context");
    let device = context
        .open_device_with_vid_pid(VENDOR, DEVICE)
        .expect("cannot get device");
    let descriptor = device
        .device()
        .device_descriptor()
        .expect("cannot describe device");

    println!("{descriptor:#?}");
}
```

```
$ cargo run
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/gamer-driver`
DeviceDescriptor {
    bLength: 18,
    bDescriptorType: 1,
    bcdUSB: 272,
    bDeviceClass: 0,
    bDeviceSubClass: 0,
    bDeviceProtocol: 0,
    bMaxPacketSize: 64,
    idVendor: 14330,
    idProduct: 33281,
    bcdDevice: 265,
    iManufacturer: 1,
    iProduct: 2,
    iSerialNumber: 3,
    bNumConfigurations: 1,
}
```

## The joy of debugging

Now that we have access to the device, we want to write a simple payload to it. For that, we first need to claim an interface. Recall that interfaces are essentially capabilities of the device, and through `lsusb` we learned that we only have one interface with the ID (`bInterfaceNumber`) of `0`. Thankfully, there's an obvious `claim_interface` method on a `Device`.

```rust
// ...
const INTERFACE: u8 = 0x0;

fn main() {
    // ...
    device
        .claim_interface(INTERFACE)
        .expect("unable to claim interface");
}
```

```
$ cargo run
   Compiling gamer-driver v0.1.0 (/home/ivan/Code/gamer-driver)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.21s
     Running `target/debug/gamer-driver`

thread 'main' panicked at src/main.rs:15:10:
unable to claim interface: Busy
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

Ah.

So, what you just experienced is the joy of `libusb` error messages. This message, at 4 characters, is in fact pretty generous - you might be greeted with a message that only says `Io`, and good luck debugging that. In general, `Busy` means that something is already holding the device open, so you cannot do anything with it. However, you won't actually be told what is holding it open.

The secret is that the device is, of course, being held open by the kernel. This is the generic driver I talked about earlier. And the secret solution is to release the kernel driver, if it is currently active on the device.

This requires you to have write access to the device, so if you did not do the `udev` song and dance from earlier in this article, prepare to prefix all future invocations of your driver with `sudo`.

```rust
fn main() {
    // ...
    if device
        .kernel_driver_active(INTERFACE)
        .expect("cannot get kernel driver")
    {
        device
            .detach_kernel_driver(INTERFACE)
            .expect("cannot detach kernel driver");
    }

    device
        .claim_interface(INTERFACE)
        .expect("unable to claim interface");
}
```

Note that the kernel driver won't be reattached automatically, so you might want to call `device.attach_kernel_driver(INTERFACE)` if, for some reason, you need it back.

## Sending data to the device

Surely, *now* we are ready to write out some bytes to a device?

Well, almost! If we try to naively start typing out something like `device.write`, the IDE will helpfully suggest three options: [`write_bulk`](https://docs.rs/rusb/latest/rusb/struct.DeviceHandle.html#method.write_bulk), [`write_control`](https://docs.rs/rusb/latest/rusb/struct.DeviceHandle.html#method.write_control) and [`write_interrupt`](https://docs.rs/rusb/latest/rusb/struct.DeviceHandle.html#method.write_interrupt). This corresponds to three out of four possible types of endpoints that the USB standard supports. Once again, [USB in a NutShell](https://www.beyondlogic.org/usbnutshell/usb4.shtml) comes in clutch with an explanation of what each of the endpoint types mean. Thankfully, we can mostly skip over the implementation details, as we can once again refer to the `lsusb` readout from earlier:

```
      Endpoint Descriptor:
        bEndpointAddress     0x82  EP 2 IN
        bmAttributes            3
          Transfer Type            Interrupt
          Usage Type               Data
        wMaxPacketSize     0x0040  1x 64 bytes
        bInterval               1
      Endpoint Descriptor:
        bEndpointAddress     0x02  EP 2 OUT
        bmAttributes            3
          Transfer Type            Interrupt
          Usage Type               Data
        wMaxPacketSize     0x0040  1x 64 bytes
        bInterval               1
```

In USB parlance, `IN` is always something that the device sends to the host, and `OUT` is always something that the host sends to the device. Basically, since this interface has two endpoints, and only one of them is an `OUT` endpoint, it's safe to assume we're looking to `write_interrupt` on endpoint `0x02`. The peculiarities of Interrupt endpoints will absolutely come back to bite us in a couple of minutes, but for now we can keep them out of sight and out of mind.

For testing purposes, I want to make the pegboard show a solid red color. According to my earlier investigation, this means that I need to send `02 00 c0`, followed by 64 repeats of `0f ff 0f`, to an endpoint at `0x02`. In addition, `rusb` only exposes the blocking API of `libusb`, so we will also need to define a timeout after which `libusb` will give up and error out.

{% admonition(title="Don't mess up your stuff") %}
Presumably, if you are reading this, you are already aware that writing random data in patterns you
divined from inspecting packets is not exactly the safest thing in the world. But it bears repeating
that following along may **permanently damage your devices** or, worse, yourself if you're
interacting with something that can move in the real world. Remember to only experiment on things
you can afford to replace (both hardware and fleshware), and always remember **I warned you, don't
blame me.**
{% end %}

```rust
use std::time::Duration;

// ...
const ENDPOINT_OUT: u8 = 0x02;
const ENDPOINT_IN: u8 = 0x82;
const TIMEOUT: Duration = Duration::from_secs(1);

fn main() {
    // ...

    device
        .claim_interface(INTERFACE)
        .expect("unable to claim interface");

    let command: [u8; 3] = [0x02, 0x00, 0xc0];
    let color: [u8; 3] = [0x0f, 0xff, 0x0f];
    let body: Vec<u8> = command
        .into_iter()
        .chain(color.into_iter().cycle().take(192))
        .collect();

    device
        .write_interrupt(ENDPOINT_OUT, &body, TIMEOUT)
        .expect("unable to write to device");
}
```

```
$ cargo run
   Compiling gamer-driver v0.1.0 (/home/ivan/Code/gamer-driver)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.24s
     Running `target/debug/gamer-driver`
```

And... just like that, the pegboard now shows a solid red color! We didn't need to worry about manually splitting packets or any of the underlying implementation, just open up a pipe and write to it! It's that easy.

Let's run it again to make sure it was not a fluke!

## So, about those interrupts...

Yeah, so if you happen to be following along, and you ran the same binary twice, you'll notice that the firmware of the pegboard crashes unceremoniously, and shortly after reverts to its default animation. And if I go back to the original packet capture - or the official docs - it's pretty obvious why: the device sends us back a response, but we never read it.

It turns out that "interrupts" are named as such for a reason, and we should probably handle them as they come in. However, the USB spec defines that the **host** must poll for interrupts. A device cannot interrupt the host by itself.

For our simple "driver", this means we want to poll the device right after we write to it. Thankfully, `rusb` gives us a `read_interrupt` method, and we have already sneakily defined the `ENDPOINT_IN` constant. Let's do just that:

```rust
fn main() {
    // ...
    device
        .write_interrupt(ENDPOINT_OUT, &body, TIMEOUT)
        .expect("unable to write to device");

    let mut buf = [0_u8; 64];
    device
        .read_interrupt(ENDPOINT_IN, &mut buf, TIMEOUT)
        .expect("unable to read from device");

    dbg!(buf);
}
```

{% admonition(title="More useless USB spec trivia") %}
You might have noticed a pattern - the `OUT` endpoint with ID `0x02`, or `0b0000_0010`, has an `IN` counterpart with ID `0x82`, or `0b1000_0010`. This is actually a part of the spec!
{% end %}

Running this, we see that the contents of `buf` are `[130, 0, 1, 0...]`, which corresponds to `0x82 0x00 0x01` I got from the research. And since we clear the interrupt buffer every time now, we can run this binary many times to define a single solid color on the device. Neat!

## Making this better

Of course, this is... not really what you want. The device may issue more interrupts. For example, there's a single button on the desk dock, which can be clicked, double-clicked or long-clicked, and each of those will issue a different interrupt. So what we **really** want is a background task of sort that will actively poll the device for interrupts and process them as they come in.

This is where you can get wild with async Rust, `tokio`, channels, and other fun stuff. That would certainly be the _right way_ to do it in an actual, serious driver. But to avoid getting into complexities of async Rust, let's keep it vanilla and use [`std::thread::scope`](https://doc.rust-lang.org/std/thread/fn.scope.html).

We'll also adjust the timeout for reading interrupts to be 1 millisecond, as requested by the device (the `bInterval` value in the `lsusb` readout). This doesn't mean we will get an interrupt every millisecond, just that the device _can_ send one at that rate. If the device sends nothing (i.e., we get  `Err(Timeout)`), we will just continue with the loop. 

Put together, that might look something like this:

```rust
use std::thread;
// ...
const WRITE_TIMEOUT: Duration = Duration::from_secs(1);
const READ_TIMEOUT: Duration = Duration::from_millis(1);

fn main() {
	// ...
    thread::scope(|s| {
        s.spawn(|| {
            // Do this just once, then end the thread.
            device
                .write_interrupt(ENDPOINT_OUT, &body, WRITE_TIMEOUT)
                .expect("unable to write to device");
        });
        s.spawn(|| {
            // Read interrupts until we hit Ctrl-C.
            loop {
                let mut buf = [0_u8; 64];
                match device.read_interrupt(ENDPOINT_IN, &mut buf, READ_TIMEOUT) {
                    Ok(_) => println!("Interrupt: {}", buf[0]),
                    Err(rusb::Error::Timeout) => continue,
                    Err(e) => panic!("{e:?}"),
                }
            }
        });
    });
}
```

```
$ cargo run
   Compiling gamer-driver v0.1.0 (/home/ivan/Code/gamer-driver)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.23s
     Running `target/debug/gamer-driver`
Interrupt: 130
^C
```

This... works! Of course, we send no more color frames to the device, so we won't get any more interrupts, but we now have two threads, one which we can use to change the colors shown, and another which we can use to read the interrupts.

There are some quirks with this device: it seems to require a steady stream of color frames, otherwise it reverts to "offline mode" as it does not receive any new frames from the host, and the first frame's brightness is significantly lower than the brightness of future frames. Not to mention that, despite what the official protocol documentation would have you believe, the colors seem to be in GRB instead of RGB format, and if you make the device _too bright_, it will just hard-reset after a couple of seconds. That is, I suppose, a part of the joy of coding.

But this small proof of concept shows that writing simple device drivers is not all that hard, and that 50 lines of code can bring you quite far. Over the next few weeks I hope to polish up my proof of concept, make a small GUI for it, pack it up and share it with the two other Linux users who own this dumb thing. And I'm happy to have learned the basics of reverse-engineering a simple USB device driver, and using that as a foundation for writing my own. Even if I could have just asked for the spec earlier and not fussed with it.
