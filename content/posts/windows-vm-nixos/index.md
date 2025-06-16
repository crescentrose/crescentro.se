+++
title = "The least painful way to set up a Windows VM on NixOS"
description = "Setting up a Windows VM sounds like one of more straightforward tasks. Unfortunately, Microsoft's recent enshittification made it far more difficult than it needs to be."
date = 2025-06-17
draft = true

[taxonomies]
categories = ["nixos", "windows", "virtual machine", "gnome boxes", "qemu", "kvm", "nanoleaf-saga"]
+++

A couple of months ago I bought the [Nanoleaf Pegboard Desk Dock](https://nanoleaf.me/en-EU/products/pegboard-desk-dock/?size=1), the latest and greatest in USB-hub-with-RGB-LEDs-and-hooks-for-gadgets technology. This invention unfortunately only supports the *real gamer* operating systems of Windows and macOS, which necessitated the development of a Linux driver.

The first step on this journey is to set up a Windows VM, on which I can install drivers and pass the device through to it for reverse-engineering. Sounds simple! But there are plenty of things that can and will go wrong in the process.

---

There are plenty of ways you could approach this problem. You could rawdog [`qemu` commands](https://wiki.archlinux.org/title/QEMU#Creating_a_new_virtualized_system). You could go one layer above, and rawdog [`libvirt` commands](https://wiki.archlinux.org/title/Libvirt). However, we will soon have our hands full with Windows, so my honest suggestion is to just use [GNOME Boxes](https://apps.gnome.org/Boxes/), a lightweight wrapper around `libvirt`. Boxes comes with built-in support for USB forwarding, so you can just plug in a USB device into your computer and forward it directly to the guest OS. It's not as fancy and full-featured as [`virt-manager`](https://virt-manager.org/), but the less it gets in my way, the better.

## Setting up GNOME Boxes on NixOS

Add the following to your `configuration.nix` and rebuild:

```nix
# Set up virtualisation
virtualisation.libvirtd = {
    enable = true;

    # Enable TPM emulation (for Windows 11)
    qemu = {
      swtpm.enable = true;
      ovmf.packages = [ pkgs.OVMFFull.fd ];
    };
  };

  # Enable USB redirection
  virtualisation.spiceUSBRedirection.enable = true;
}

# Allow VM management
users.groups.libvirtd.members = [ "your-account-here" ];
users.groups.kvm.members = [ "your-account-here" ];

# Enable VM networking and file sharing
environment.systemPackages = with pkgs; [
    # ... your other packages ...
    gnome-boxes # VM management
    dnsmasq # VM networking
    phodav # (optional) Share files with guest VMs
];
```

You might need to log out and log back in to your system for the group changes to take effect. You can also install `gnome-boxes` using `home-manager`, and it will work fine, but the rest of the setup needs to be global.

## Acquire the ISO

In the current year, you do not need to purchase Windows to legally acquire a copy of the OS. You can grab an ISO [directly from Microsoft](https://www.microsoft.com/en-us/software-download/windows11).

... Allegedly. This link did not work for me in Firefox. Your mileage my vary.

## Defining the VM

GNOME Boxes is very down-to-earth about this: click the little "plus" icon in the top left corner, "Install from File", point it to the ISO and select "Microsoft Windows 11" as the operating system, define the memory and the disk space you want to give it, and that's it!


{{ lightdark(img="setup.png", alt="A screenshot of GNOME Boxes showing the New Virtual Machine dialog box") }}

**Remember to give Windows a LOT of resources!** I originally started with a 20 GB virtual disk but had to bump this up all the way to 50 GB because I kept running out of space despite only ever installing two apps that were under 1 GB in size. This is probably because as soon as I completed the setup the OS started showing me a bunch of news from US politics, Copilot chat boxes, MS Teams and ads. It is also **very difficult** to grow the partition once you've defined it for reasons I'll get to later. Just give it at least 40 GB, and more if you want to do anything remotely productive with it.

## Setting up a Windows VM without Microsoft account requirement

Setting up a Windows VM unfortunately means setting up Windows, which is an experience about as enjoyable as your visit to the dentist in five years.

Because you are setting up a VM, you probably don’t want to be bothered with a Microsoft account, which Windows will try to force upon you. This is where you need to rely on folk wisdom:

1. **Before you click on anything** after the first boot, hit `Shift + F10`, which will bring up the command prompt. Type `reg add HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OOBE /v BypassNRO /t REG_DWORD /d 1 /f`, which does what the now-defunct `OOBE\BYPASSNRO` command did. Restart the machine with `shutdown /r /t 0`.
2. Again **before you click on anything after the next reboot**, hit `Shift+F10` and run `ipconfig /release` to force the network adapter to drop its IP address, thus disconnecting you from the internet.
3. Proceed with the set-up, and there will be an "I don't have internet" option, which you will have to confirm a couple of times through increasingly pushy prompts because [the tech industry does not understand consent](https://soatok.blog/2024/02/27/the-tech-industry-doesnt-understand-consent/).

After you completed the initial setup, you can run `ipconfig /renew` to get internet access back. Microsoft is constantly working hard to make the Windows experience as shitty as they possibly can, so this might or might not work in the future.

If you look around, you can find “debloat scripts” and dozens of commands that you could run in the Windows terminal to manually delete some of these things. Debloat scripts, weird undocumented registry hacks ran through exploits at the setup screen, and obscure terminal commands are routinely evangelized by Windows fanatics who claim that Linux is too complicated because the Bash shell exists. Oh well.

## Grow the Windows primary partition in spite of the recovery partition

Growing the Windows primary partition is impossible without hacks because Microsoft places a "Recovery" partition at the **end** of the disk instead of at the start, thus preventing the primary partition (`C:`) from growing.

If you are here because you somehow found this on Google: this is about setting up a VM, and you should **not delete your Recovery partition if you're not using a VM**.

Shut down the VM, increase the size of its disk through the "Preferences" panel, then start it again. Then, do the following:

1. Make a snapshot of the VM. You can do this from the "three-dot" menu, go to "Preferences", then "Snapshots" and create a new one. This is now your recovery partition!
2. Open a Command Prompt with admin permissions. Run `bcdedit /enum all` to get a list of all boot entries. Find the `Windows Boot Loader` entry that has a description of `Windows Recovery Environment` and copy its `identifier` (it looks like a UUID).
3. Delete it! `bcdedit /delete {the-identifier-from-previous-step} /cleanup`.
4. This should automatically turn off the recovery agent, but you can verify that with `reagentc /disable`.
5. Now you can use `diskpart` to delete the partition itself:
    1. run `diskpart`
    2. in the diskpart prompt, run `sel disk 0` to select the first (and, hopefully, only disk. You're not doing this on your real machine, right?)
    3. run `list part` to find the ID of the `Recovery` partition - for me it was `4`. Select it with `select partition <id>`.
    4. drop it with `delete partition override`

Finally, you can use the visual partition manager (search for "create and format hard disk partitions" in the Start menu), or stay in `diskpart` if you're a badass, to grow the primary partition.

## Setting up "guest tools" on the Windows VM

This is a minor thing that will make your Windows VM experience marginally less painful. In the VM, you will want to download the [SPICE guest tools](https://www.spice-space.org/download.html#windows-binaries) - click on the first link (`spice-guest-tools`) to get the .exe, then set it up and reboot the machine. You'll then be able to easily resize the VM, share the clipboard, and a couple of other minor quality-of-life improvements.

This step is completely optional, but the more you use the VM, the more you'll appreciate it.

## The NixOS Special: Un-fucking your VM after running garbage collection

When you set up the VM for the first time, it will reference an `edk2` image, which is an UEFI implementation by Intel. Unfortunately, this file lives in `/nix/store`, which means it will get deleted the next time you upgrade `qemu` and run garbage collection. This is [Fun](https://dwarffortresswiki.org/index.php/DF2014:Losing).

The easiest workaround for this is to get the current path to `qemu`:

```
$ nix eval nixpkgs#qemu.outPath
"/nix/store/c62kwi025305f0azsmh7v08qwvibw3bv-qemu-9.2.3"
```

then find the name of the VM with `virsh`:

```
$ virsh list --all
 Id   Name    State
-----------------------
 -    win11   shut off
```

then edit the definition with `virsh edit <name>`, locate the `<os firmware='efi'>` block, and replace the outdated references with the new path you discovered by running `nix eval`.

I am sure there is a better, more permanent way to do this, but it probably involves writing a custom derivation for your VM's config file and, like... okay. Sure. Do that if you really want to.

## Stop the VM from auto-starting at boot

At least on my machine, the Windows VM would start up automatically every time I rebooted my computer. The way I discovered this was by the VM suddenly eating up half of my system's resources while I was in the middle of a competitive Overwatch 2 game.

Make sure to stop it from doing that by right clicking on it in Boxes, going to "Preferences" and disabling the "run in background" option.
